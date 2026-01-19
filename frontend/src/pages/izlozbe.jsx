import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/izlozbe.css";
import {
  listExhibitions,
  createExhibition,
  getReservedExhibitionIds,
} from "../api/exhibitions";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}.`;
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
    .map((v) =>
      typeof v === "string" ? v : v?.url ?? v?.imageUrl ?? v?.path ?? null
    )
    .filter(Boolean);
}

// ✅ placeholder (da vidiš CSS i bez backend-a)
const PLACEHOLDER_EXHIBITIONS = [
  {
    id: 9001,
    title: "Plodovi Jeseni",
    description: "Izložba keramičkih radova inspiriranih bojama i teksturama jeseni.",
    location: "Zagreb, Studio ClayPlay",
    startDateTime: "2026-02-11T18:00:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1524594154908-edd6659d1f42?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: 9002,
    title: "Mediterranski valovi",
    description: "Radovi inspirirani morem, solju i svjetlom mediteranskog podneblja.",
    location: "Rijeka, Galerija Mare",
    startDateTime: "2026-02-29T17:30:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: 9003,
    title: "Tiha jutra",
    description: "Minimalistički pristup, fokus na oblike i glazure u pastelnim tonovima.",
    location: "Split, Galerija Kamen",
    startDateTime: "2025-10-05T19:00:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: 9004,
    title: "Glina i svjetlo",
    description: "Igra refleksija i sjena kroz prozirne glazure i tanke stijenke.",
    location: "Osijek, Umjetnički paviljon",
    startDateTime: "2025-06-12T18:00:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

export default function Izlozbe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrganizer = user?.userType === "organizator";
  const isPolaznik = user?.userType === "polaznik";

  const [tab, setTab] = useState("upcoming"); // upcoming | past
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [reservedIds, setReservedIds] = useState(() => new Set());

  // create form state
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");

  // ✅ NEW: opis izložbe
  const [description, setDescription] = useState("");

  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const fileRef = useRef(null);

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listExhibitions();
      const arr = Array.isArray(data) ? data : [];
      setItems(arr.length ? arr : PLACEHOLDER_EXHIBITIONS);
    } catch {
      setErr("Backend nije dostupan — prikazujem demo izložbe.");
      setItems(PLACEHOLDER_EXHIBITIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isPolaznik || !user) {
        setReservedIds(new Set());
        return;
      }
      try {
        const userId = user.id ?? user.idKorisnik ?? user.userId;
        const ids = await getReservedExhibitionIds(userId);
        if (!alive) return;
        setReservedIds(new Set(Array.isArray(ids) ? ids : []));
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [isPolaznik, user]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const up = [];
    const pa = [];
    (items || []).forEach((x) => {
      const iso = getISO(x);
      const d = iso ? new Date(iso) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      if (d >= now) up.push(x);
      else pa.push(x);
    });

    up.sort((a, b) => new Date(getISO(a)) - new Date(getISO(b)));
    pa.sort((a, b) => new Date(getISO(b)) - new Date(getISO(a)));
    return { upcoming: up, past: pa };
  }, [items]);

  const shown = tab === "upcoming" ? upcoming : past;

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      setCreateErr("");
      if (!title.trim()) throw new Error("Unesi naziv izložbe.");
      if (!location.trim()) throw new Error("Unesi lokaciju.");
      if (!dateTime) throw new Error("Odaberi datum i vrijeme.");
      if (!description.trim()) throw new Error("Unesi opis izložbe.");

      const files = fileRef.current?.files ? Array.from(fileRef.current.files) : [];

      // ✅ više slika: dozvoli 1+ (već radi), samo tekst promijenjen
      if (!files.length) throw new Error("Dodaj barem jednu sliku radova (može i više).");

      const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
      const bad = files.find((f) => !allowed.has(f.type));
      if (bad) throw new Error("Podržani formati: JPG, PNG, WEBP, GIF.");

      setCreating(true);
      const organizerId = user?.id ?? user?.idKorisnik ?? user?.userId ?? null;
      if (!organizerId) throw new Error("Niste prijavljeni kao organizator.");

      await createExhibition(
        {
          title: title.trim(),
          location: location.trim(),
          startDateTime: new Date(dateTime).toISOString(),
          organizerId,

          // ✅ NEW: opis (više naziva ključa za kompatibilnost)
          description: description.trim(),
          opis: description.trim(),
          opisIzlozbe: description.trim(),
        },
        files // ✅ array datoteka (1 ili više)
      );

      setTitle("");
      setLocation("");
      setDateTime("");
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      setFormOpen(false);

      await refresh();
    } catch (e2) {
      setCreateErr(e2.message || "Neuspješno kreiranje izložbe.");
    } finally {
      setCreating(false);
    }
  };

  const openDetails = (id) => {
    navigate(`/izlozbe/${id}`);
  };

  return (
    <div className="exh-page">
      <main className="exh-wrap">
        <div className="exh-header">
          <div>
            <h1 className="exh-title">Izložbe</h1>
            <p className="exh-sub">Pogledajte koje su izložbe dostupne i prijavite se već danas!</p>
          </div>

          {isOrganizer && (
            <button className="exh-newBtn" onClick={() => setFormOpen((p) => !p)} type="button">
              {formOpen ? "Zatvori" : "+ Nova izložba"}
            </button>
          )}
        </div>

        {!!err && !loading && <div className="exh-error">{err}</div>}

        {isOrganizer && formOpen && (
          <section className="exh-card">
            <div className="exh-cardTop">
              <h2>Kreiranje izložbe</h2>
              <span className="exh-hint">Unesi podatke i dodaj slike radova</span>
            </div>

            <form className="exh-form" onSubmit={onCreate}>
              <div className="exh-grid">
                <div className="exh-field">
                  <label>Naziv</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="exh-field">
                  <label>Lokacija</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

                <div className="exh-field">
                  <label>Datum i vrijeme</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                  />
                </div>

                {/* ✅ NEW: opis */}
                <div className="exh-field">
                  <label>Opis izložbe</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Npr. tema izložbe, inspiracija, broj radova, info za posjetitelje…"
                    rows={4}
                  />
                </div>

                <div className="exh-field">
                  <label>Slike radova (može više)</label>
                  <input ref={fileRef} type="file" accept="image/*" multiple />
                </div>
              </div>

              {createErr && <div className="exh-error">{createErr}</div>}

              <div className="exh-formActions">
                <button className="exh-primary" disabled={creating} type="submit">
                  {creating ? "Spremam..." : "Kreiraj izložbu"}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="exh-tabs">
          <button
            className={`exh-tab ${tab === "past" ? "active" : ""}`}
            onClick={() => setTab("past")}
            type="button"
          >
            Prošle <span className="exh-pill">{past.length}</span>
          </button>

          <button
            className={`exh-tab ${tab === "upcoming" ? "active" : ""}`}
            onClick={() => setTab("upcoming")}
            type="button"
          >
            Nadolazeće <span className="exh-pill">{upcoming.length}</span>
          </button>
        </div>

        {loading && <div className="exh-info">Učitavanje…</div>}

        {!loading && shown.length === 0 && (
          <div className="exh-empty">Trenutno nema izložbi za ovaj tab.</div>
        )}

        {!loading && shown.length > 0 && (
          <section className="exh-gridCards">
            {shown.map((exh) => {
              const imgs = getImages(exh);
              const cover = imgs[0] || null;
              const isReserved = reservedIds.has(exh.id);

              return (
                <article className="exh-item" key={exhId ?? exh.id}>
                  <button
                    type="button"
                    className="exh-coverOnly"
                    onClick={() => openDetails(exh.id)}
                    title="Otvori detalje"
                  >
                    {cover ? (
                      <img src={cover} alt={exh.title || "Izložba"} loading="lazy" />
                    ) : (
                      <div className="exh-coverOnlyEmpty">Nema slike</div>
                    )}
                  </button>

                  <div className="exh-body">
                    <h3 className="exh-name">
                      {exh.title || "Bez naziva"}
                      {(() => {
                        const ownerId2 =
                          exh?.organizerId ?? exh?.organizatorId ?? exh?.idKorisnik ?? null;
                        const currentUserId2 =
                          user?.id ?? user?.userId ?? user?.korisnikId ?? null;
                        const isOwner2 =
                          currentUserId2 != null &&
                          ownerId2 != null &&
                          Number(currentUserId2) === Number(ownerId2);
                        return isOwner2 ? <span className="exh-owner">[Vaša izložba]</span> : null;
                      })()}
                    </h3>

                    <div className="exh-meta">
                      <span>{formatDate(getISO(exh))}</span>
                      <span className="dot">•</span>
                      <span>{exh.location || "—"}</span>
                    </div>

                    {isPolaznik && (
                      <button
                        className="exh-apply"
                        type="button"
                        disabled={tab === "past"}
                        onClick={() => openDetails(exh.id)}
                        title={tab === "past" ? "Ne možeš se prijaviti na prošlu izložbu." : ""}
                      >
                        {tab === "past"
                          ? "Izložba završena"
                          : isReserved
                          ? "Detalji (već prijavljen/a)"
                          : "Prijava"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
