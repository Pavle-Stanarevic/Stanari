import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/detaljiIzlozbe.css";
import {
  listExhibitions,
  applyToExhibition,
  getReservedExhibitionIds,
} from "../api/exhibitions";

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toTimeString().slice(0, 5);
  return `${day}.${month}.${year}. - ${time}h`;
}

function getISO(x) {
  return x?.startDateTime ?? x?.dateTime ?? x?.date ?? x?.start ?? null;
}

function getImages(x) {
  const raw =
    x?.images ??
    x?.imageUrls ??
    x?.photos ??
    x?.slike ??
    x?.gallery ??
    x?.artworks ??
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === "string" ? v : v?.url ?? v?.imageUrl ?? v?.path ?? null))
    .filter(Boolean);
}

export default function DetaljiIzlozbe() {
  const { id } = useParams();
  const exhId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPolaznik = user?.userType === "polaznik";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [exh, setExh] = useState(null);

  const [reserved, setReserved] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await listExhibitions();
        const arr = Array.isArray(data) ? data : [];
        const found = arr.find((x) => Number(x.id) === exhId) || null;
        if (!alive) return;
        setExh(found);
        if (!found) setErr("Izložba nije pronađena.");
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Greška pri dohvaćanju izložbe.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [exhId]);

  const isPast = useMemo(() => {
    const iso = getISO(exh);
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    return d < new Date();
  }, [exh]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isPolaznik || !user) return;
      try {
        const userId = user.id ?? user.idKorisnik ?? user.userId;
        const ids = await getReservedExhibitionIds(userId);
        if (!alive) return;
        setReserved(Array.isArray(ids) ? ids.includes(exhId) : false);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [isPolaznik, user, exhId]);

  const onApply = async () => {
    try {
      if (!user) throw new Error("Prijavi se za prijavu na izložbu.");
      if (!isPolaznik) throw new Error("Samo polaznici se mogu prijaviti na izložbu.");
      if (isPast) throw new Error("Ne možeš se prijaviti na prošlu izložbu.");
      if (!exh) return;

      // demo blok
      if (String(exh.id).startsWith("900")) {
        throw new Error("Ovo je demo izložba (placeholder) — prijava nije dostupna.");
      }

      const userId = user.id ?? user.idKorisnik ?? user.userId;
      setApplying(true);
      await applyToExhibition(exh.id, userId);
      setReserved(true);
    } catch (e) {
      alert(e.message || "Neuspješna prijava.");
    } finally {
      setApplying(false);
    }
  };

  const imgs = getImages(exh);
  const cover = imgs[0] || null;
  const rest = imgs.slice(1);

  return (
    <div className="ed-page">
      <div className="ed-topbar">
        <button className="ed-back" onClick={() => navigate(-1)}>
          ← Natrag
        </button>

        {exh && (
          <span className={`ed-badge ${isPast ? "past" : "upcoming"}`}>
            {isPast ? "Prošla" : "Nadolazeća"}
          </span>
        )}
      </div>

      <main className="ed-wrap">
        {loading && <div className="ed-info">Učitavanje…</div>}
        {!!err && !loading && <div className="ed-error">{err}</div>}

        {!loading && exh && (
          <>
            <header className="ed-header">
              <div className="ed-titleRow">
                <h1 className="ed-title">{exh.title || "Bez naziva"}</h1>

                {isPolaznik && (
                  <button
                    className="ed-primary"
                    disabled={reserved || isPast || applying}
                    onClick={onApply}
                    title={isPast ? "Izložba je prošla." : ""}
                  >
                    {isPast ? "Izložba završena" : reserved ? "Već prijavljen/a" : applying ? "Prijavljujem..." : "Prijava"}
                  </button>
                )}
              </div>

              <div className="ed-meta">
                <span><strong>Datum:</strong> {formatDateTime(getISO(exh))}</span>
                <span className="dot">•</span>
                <span><strong>Lokacija:</strong> {exh.location || "—"}</span>
              </div>
            </header>

            <section className="ed-gallery">
              <h2>Radovi na izložbi</h2>

              {!cover && imgs.length === 0 ? (
                <div className="ed-empty">Nema slika.</div>
              ) : (
                <>
                  {cover && (
                    <div className="ed-cover">
                      <img src={cover} alt={exh.title || "Izložba"} />
                    </div>
                  )}

                  {rest.length > 0 && (
                    <div className="ed-grid">
                      {rest.map((src, i) => (
                        <div className="ed-thumb" key={`${src}-${i}`}>
                          <img src={src} alt={`Rad ${i + 1}`} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
