import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listWorkshops,
  applyToWorkshop,
  cancelWorkshop,
  getReservedWorkshopIds,
} from "../api/workshops";
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

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const time = d.toTimeString().slice(0, 5);

  return `${day}/${month}/${year} - ${time}h`;
}

export default function PregledRadionica() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reservedIds, setReservedIds] = useState(() => new Set());

  // dohvacanje radionica s API
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

  useEffect(() => {
    let alive = true;
    if (!user || user?.userType !== "polaznik") {
      setReservedIds(new Set());
      return () => {
        alive = false;
      };
    }
    const userId = user.id ?? user.idKorisnik;
    getReservedWorkshopIds(userId)
      .then((ids) => {
        if (!alive) return;
        const set = new Set(Array.isArray(ids) ? ids : []);
        setReservedIds(set);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user]);

  const upcomingItems = useMemo(() => {
    const now = new Date();
    return (items || []).filter((w) => {
      const iso = w?.startDateTime ?? w?.dateISO ?? w?.date ?? null;
      if (!iso) return false;
      const d = new Date(iso);
      return !Number.isNaN(d.getTime()) && d >= now;
    });
  }, [items]);

  const empty = useMemo(
    () => !upcomingItems || upcomingItems.length === 0,
    [upcomingItems]
  );

  const organizer = user?.userType === "organizator";
  const polaznik = user?.userType === "polaznik";

  const onApply = async (w) => {
    try {
      if (!user)
        throw new Error("Prijavite se da biste se mogli prijaviti na radionicu.");
      if (!polaznik) throw new Error("Samo polaznici se mogu prijaviti.");
      const userId = user.id ?? user.idKorisnik;
      await applyToWorkshop(w.id, userId);
      setReservedIds((prev) => new Set(prev).add(w.id));
      setItems((xs) =>
        xs.map((it) =>
          it.id === w.id
            ? { ...it, capacity: Math.max(0, (it.capacity || 0) - 1) }
            : it
        )
      );
    } catch (e) {
      alert(e.message || "Nije moguće prijaviti se.");
    }
  };

  const onCancel = async (w) => {
    try {
      if (!user) throw new Error("Prijavite se da biste otkazali prijavu.");
      const userId = user.id ?? user.idKorisnik;
      await cancelWorkshop(w.id, userId);
      setReservedIds((prev) => {
        const next = new Set(prev);
        next.delete(w.id);
        return next;
      });
      setItems((xs) =>
        xs.map((it) =>
          it.id === w.id ? { ...it, capacity: (it.capacity || 0) + 1 } : it
        )
      );
    } catch (e) {
      alert(e.message || "Nije moguće otkazati prijavu.");
    }
  };

  return (
    <div className="list-page">
      <main className="list-wrap">
        <div className="list-header">
          <h1>Pregled naših radionica</h1>

          {organizer && (
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
            {upcomingItems.map((w) => (
              <li key={w.id} className="workshop-item">
                <div className="thumb" aria-hidden>
                  <div className="thumb-circle" />
                </div>

                <div className="content">
                  <h3 className="title">
                    {w.title || "Bez naziva"}
                    {reservedIds.has(w.id) ? (
                      <span className="reserved-badge">[Prijavljen]</span>
                    ) : Number(w.capacity) <= 0 ? (
                      <span className="full-badge">[Popunjeno]</span>
                    ) : null}
                  </h3>

                  <div className="meta">
                    <span>{formatPrice(w.price)} po osobi</span>
                    <span>•</span>
                    <span>{formatDuration(w.durationMinutes)}</span>
                  </div>

                  <div className="submeta">
                    <span>Datum: {formatDateTime(w.startDateTime)}</span>
                    {w.location ? <span>Lokacija: {w.location}</span> : null}
                    <span>Kapacitet: {w.capacity ?? "—"}</span>
                  </div>

                  {polaznik && (
                    <div className="actions-row">
                      {!reservedIds.has(w.id) ? (
                        <button
                          className="new-workshop-btn"
                          disabled={(w.capacity || 0) <= 0}
                          onClick={() => onApply(w)}
                        >
                          Prijavi se
                        </button>
                      ) : (
                        <button
                          className="new-workshop-btn"
                          onClick={() => onCancel(w)}
                        >
                          Otkaži prijavu
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
