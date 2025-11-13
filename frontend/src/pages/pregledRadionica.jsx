import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listWorkshops } from "../api/workshops";
import useAuth from "../hooks/useAuth";
import "../styles/pregledRadionica.css";

function formatPrice(price) {
  if (price === "" || price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  return `${n.toFixed(2)}€`;
}

function formatDuration(mins) {
  const m = Number(mins || 0);
  if (!m) return "—";
  if (m % 60 === 0) return `${m / 60}h`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toTimeString().slice(0, 5);
  return `${date} u ${time}`;
}

export default function PregledRadionica() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Dohvati radionice s API-ja
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    listWorkshops()
      .then((data) => {
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e.message || "Greška pri dohvaćanju radionica");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const empty = useMemo(() => !items || items.length === 0, [items]);

  return (
    <div className="list-page">
      <main className="list-wrap">
        <div className="list-header">
          <h1>Pregled naših radionica</h1>

          {user?.userType === "organizator" && (
            <button
              className="new-workshop-btn"
              onClick={() => navigate("/organizacijaRadionica")}
            >
              + Nova radionica
            </button>
          )}
        </div>

        {loading && <div className="info">Učitavanje…</div>}
        {!!err && <div className="error">{err}</div>}

        {!loading && empty && !err && (
          <div className="empty">
            <p>Još nema organiziranih radionica.</p>
          </div>
        )}

        {!loading && !empty && (
          <ul className="workshop-list">
            {items.map((w) => (
              <li key={w.id} className="workshop-item">
                <div className="thumb" aria-hidden>
                  {/* Placeholder slika – zamijeni kad dodaš slike iz baze */}
                  <div className="thumb-circle" />
                </div>

                <div className="content">
                  <h3 className="title">{w.title || "Bez naziva"}</h3>

                  <div className="meta">
                    <span>{formatPrice(w.price)} po osobi</span>
                    <span>•</span>
                    <span>{formatDuration(w.durationMinutes)}</span>
                  </div>

                  <div className="submeta">
                    <span>Kapacitet: {w.capacity ?? "—"}</span>
                    <span>Datum: {formatDateTime(w.startDateTime)}</span>
                    {w.location ? <span>Lokacija: {w.location}</span> : null}
                  </div>

                  {w.description ? (
                    <p className="desc">{w.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="list-footer">© {new Date().getFullYear()} ClayPlay</footer>
    </div>
  );
}
