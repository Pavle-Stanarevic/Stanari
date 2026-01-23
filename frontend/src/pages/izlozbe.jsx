import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ShopProductAdd from "../components/shopProductAdd.jsx";
import "../styles/izlozbe.css";
import {
  listExhibitions,
  createExhibition,
  getReservedExhibitionIds,
  getExhibitionApplications,
} from "../api/exhibitions";

const API = import.meta.env.VITE_API_URL || "";

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
    .map((v) => {
      if (!v) return null;
      if (v.startsWith("http://") || v.startsWith("https://")) return v;
      if (v.startsWith("/")) return `${API}${v}`;
      return `${API}/${v}`;
    })
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
  const organizerStatus = String(user?.organizerStatus || "").toUpperCase();
  const isApprovedOrganizer = isOrganizer && organizerStatus === "APPROVED";
  const isPendingOrganizer = isOrganizer && organizerStatus === "PENDING";
  const isRejectedOrganizer = isOrganizer && organizerStatus === "REJECTED";
  const isSubscribed = !!user?.isSubscribed;
  const canCreateExhibition = isOrganizer && isApprovedOrganizer && isSubscribed;
  const canAddProductsToShop = canCreateExhibition; // ista pravila kao i u Shop-u

  const MAX_IMAGE_MB = 5;

  const [tab, setTab] = useState("upcoming"); // upcoming | past
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [reservedIds, setReservedIds] = useState(() => new Set());
  const [appStatuses, setAppStatuses] = useState({});

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

  // ✅ dodavanje proizvoda direktno iz kreiranja izložbe
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listExhibitions();
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
    } catch {
      setErr("Backend nije dostupan — pokušajte ponovno.");
      setItems([]);
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
        setAppStatuses({});
        return;
      }
      try {
        const userId = user.id ?? user.idKorisnik ?? user.userId;
        const ids = await getReservedExhibitionIds(userId);
        if (!alive) return;
        setReservedIds(new Set(Array.isArray(ids) ? ids : []));
        const apps = await getExhibitionApplications(userId);
        if (!alive) return;
        const map = {};
        (Array.isArray(apps) ? apps : []).forEach((a) => {
          if (a?.exhibitionId != null) map[a.exhibitionId] = a.status;
        });
        setAppStatuses(map);
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
      if (!canCreateExhibition) {
        if (isPendingOrganizer) throw new Error("Čeka se odobrenje admina.");
        if (isRejectedOrganizer) throw new Error("Profil je odbijen.");
        if (!isSubscribed) throw new Error("Za objavu izložbi potrebna je aktivna pretplata.");
        throw new Error("Nemate dozvolu za objavu izložbe.");
      }
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

      const tooLarge = files.find((f) => f.size > MAX_IMAGE_MB * 1024 * 1024);
      if (tooLarge) throw new Error(`Maksimalna veličina po slici je ${MAX_IMAGE_MB}MB.`);

      setCreating(true);
      const organizerId = user?.id ?? user?.idKorisnik ?? user?.userId ?? null;
      if (!organizerId) throw new Error("Niste prijavljeni kao organizator.");
      await createExhibition(
        {
          title: title.trim(),
          location: location.trim(),
          description: description.trim(),
          startDateTime: new Date(dateTime).toISOString(),
          organizerId,
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
    if (id == null) return;
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
            <div style={{ display: "grid", gap: 6 }}>
              <button
                className="exh-btn"
                onClick={() => setFormOpen((p) => !p)}
                type="button"
                disabled={!canCreateExhibition}
                title={
                  isPendingOrganizer
                    ? "Čeka se odobrenje admina"
                    : isRejectedOrganizer
                    ? "Profil je odbijen"
                    : !isSubscribed
                    ? "Potrebna je aktivna pretplata"
                    : ""
                }
              >
                {formOpen ? "Zatvori" : "+ Nova izložba"}
              </button>
              {!canCreateExhibition ? (
                <div className="hint" style={{ margin: 0 }}>
                  {isPendingOrganizer
                    ? "Čeka se odobrenje admina."
                    : isRejectedOrganizer
                    ? "Profil je odbijen."
                    : !isSubscribed
                    ? "Za objavu izložbi potrebna je aktivna pretplata."
                    : ""}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!!err && !loading && <div className="exh-error">{err}</div>}

        {isOrganizer && formOpen && (
          <section className="exh-card">
            <div className="exh-cardTop">
              <h2>Kreiranje izložbe</h2>
              <span className="exh-hint">Unesi podatke i dodaj slike radova</span>
            </div>

            <button
              type="button"
              className="exh-btn"
              style={{ background: "#fff", color: "#111", border: "1px solid rgba(0,0,0,0.12)" }}
              onClick={() => setIsAddProductOpen(true)}
              disabled={!canAddProductsToShop}
              title={
                isPendingOrganizer
                  ? "Čeka se odobrenje admina"
                  : isRejectedOrganizer
                  ? "Profil je odbijen"
                  : !isSubscribed
                  ? "Potrebna je aktivna pretplata"
                  : ""
              }
            >
              + Dodaj proizvod u Shop (Izložbe)
            </button>

            {!canAddProductsToShop ? (
              <div className="hint" style={{ margin: 0, alignSelf: "center" }}>
                {isPendingOrganizer
                  ? "Čeka se odobrenje admina."
                  : isRejectedOrganizer
                  ? "Profil je odbijen."
                  : !isSubscribed
                  ? "Za objavu proizvoda potrebna je aktivna pretplata."
                  : ""}
              </div>
            ) : null}

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
                <button className="exh-primary" disabled={creating || !canCreateExhibition} type="submit">
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
              const exhId = exh?.id ?? exh?.idIzlozba ?? exh?.exhibitionId;
              const imgs = getImages(exh);
              const cover = imgs[0] || null;
              const isReserved = reservedIds.has(exhId);
              const status = appStatuses?.[exhId];
              const ownerId = exh?.organizerId ?? exh?.organizatorId ?? exh?.idKorisnik ?? null;
              const currentUserId = user?.id ?? user?.userId ?? user?.korisnikId ?? null;
              const isOwner =
                currentUserId != null && ownerId != null && Number(currentUserId) === Number(ownerId);

              return (
                <article className="exh-item" key={exhId ?? exh.id}>
                  <button
                    type="button"
                    className="exh-coverOnly"
                    onClick={() => openDetails(exhId)}
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
                        const ownerId = exh?.organizerId ?? exh?.organizatorId ?? exh?.idKorisnik ?? null;
                        const currentUserId = user?.id ?? user?.userId ?? user?.korisnikId ?? null;
                        const isOwner =
                          currentUserId != null && ownerId != null && Number(currentUserId) === Number(ownerId);
                        return isOwner ? <span className="exh-owner">[Vaša izložba]</span> : null;
                      })()}
                    </h3>

                    <div className="exh-meta">
                      <span>{formatDate(getISO(exh))}</span>
                      <span className="dot">•</span>
                      <span>{exh.location || "—"}</span>
                    </div>

                    {(isPolaznik || !user) && (
                      <button
                        className={`exh-apply ${!isOwner && status === "pending" ? "is-pending" : ""}`}
                        type="button"
                        disabled={tab === "past" || isOwner || !user}
                        onClick={() => !isOwner && openDetails(exhId)}
                        title={
                          !user
                            ? "Odjavljeni ste"
                            : tab === "past"
                            ? "Ne možeš se prijaviti na prošlu izložbu."
                            : ""
                        }
                      >
                        {!user
                          ? "Detalji"
                          : "Detalji"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* MODAL: kategorija je obavezno Izlozbe */}
      <ShopProductAdd
        open={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onCreated={() => setIsAddProductOpen(false)}
        forcedCategory="Izložbe"
      />
    </div>
  );
}
