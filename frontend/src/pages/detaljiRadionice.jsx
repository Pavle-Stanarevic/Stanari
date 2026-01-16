import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listWorkshops } from "../api/workshops";
import { addWorkshopToCart } from "../api/cart";
import useAuth from "../hooks/useAuth";
import "../styles/detaljiRadionice.css";

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

function getWorkshopISO(w) {
  return w?.startDateTime ?? w?.dateISO ?? w?.date ?? null;
}

function getWorkshopImages(w) {
  const raw =
    w?.images ?? w?.imageUrls ?? w?.photos ?? w?.slike ?? w?.gallery ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x : x?.url ?? x?.imageUrl ?? x?.path ?? null))
    .filter(Boolean);
}

export default function DetaljiRadionice() {
  const { id } = useParams();
  const workshopId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [workshop, setWorkshop] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    listWorkshops()
      .then((data) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        const found = arr.find((w) => Number(w.id) === workshopId);
        setWorkshop(found || null);
        if (!found) setErr("Radionica nije pronađena.");
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e.message || "Greška pri dohvaćanju radionice.");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [workshopId]);

  const images = useMemo(() => (workshop ? getWorkshopImages(workshop) : []), [workshop]);

  const onAddToCart = async () => {
    try {
      if (!user) throw new Error("Prijavite se da biste se mogli prijaviti na radionicu.");
      if (user?.userType !== "polaznik")
        throw new Error("Samo polaznici mogu dodati radionicu u košaricu.");
      if (!workshop) return;

      setAdding(true);
      await addWorkshopToCart(workshop.id, 1);
      navigate("/kosarica");
    } catch (e) {
      alert(e.message || "Nije moguće dodati u košaricu.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="wd-page">
      {/* ✅ Natrag izvan bijelog card-a (kao u shopu) */}
      <div className="wd-topbar">
        <button className="wd-back" onClick={() => navigate(-1)}>
          ← Natrag
        </button>
      </div>

      <main className="wd-wrap">
        {loading && <div className="wd-info">Učitavanje…</div>}
        {!!err && !loading && <div className="wd-error">{err}</div>}

        {!loading && workshop && (
          <>
            <header className="wd-header">
              <div className="wd-titleRow">
                <h1 className="wd-title">{workshop.title || "Bez naziva"}</h1>

                <div className="wd-actions">
                  <button
                    className="wd-primary"
                    disabled={adding || (workshop.capacity || 0) <= 0}
                    onClick={onAddToCart}
                    title={(workshop.capacity || 0) <= 0 ? "Radionica je popunjena" : ""}
                  >
                    {adding ? "Dodajem..." : "Prijavi se (u košaricu)"}
                  </button>
                </div>
              </div>

              <p className="wd-sub">
                Datum: <strong>{formatDateTime(getWorkshopISO(workshop))}</strong>
              </p>

              <div className="wd-stats">
                <div className="wd-stat">
                  <div className="k">Cijena</div>
                  <div className="v">{formatPrice(workshop.price)} / osoba</div>
                </div>
                <div className="wd-stat">
                  <div className="k">Trajanje</div>
                  <div className="v">{formatDuration(workshop.durationMinutes)}</div>
                </div>
                <div className="wd-stat">
                  <div className="k">Lokacija</div>
                  <div className="v">{workshop.location || "—"}</div>
                </div>
                <div className="wd-stat">
                  <div className="k">Kapacitet</div>
                  <div className="v">{workshop.capacity ?? "—"}</div>
                </div>
              </div>
            </header>

            <section className="wd-section">
              <h2>Opis radionice</h2>
              <p className="wd-desc">
                {workshop.description || workshop.opis || workshop.desc || "Nema opisa."}
              </p>
            </section>

            <section className="wd-section">
              <h2>Slike radionice</h2>
              {images.length === 0 ? (
                <div className="wd-emptyPhotos">Još nema dodanih slika za ovu radionicu.</div>
              ) : (
                <div className="wd-gallery">
                  {images.map((src, i) => (
                    <div className="wd-photo" key={`${src}-${i}`}>
                      <img src={src} alt={`Radionica slika ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
