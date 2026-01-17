import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listWorkshops, getReservedWorkshopIds } from "../api/workshops";
import { addWorkshopToCart, getCart } from "../api/cart";
import useAuth from "../hooks/useAuth";
import "../styles/detaljiRadionice.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* ---------- helpers ---------- */
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
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toTimeString().slice(0, 5);
  return `${day}/${month}/${year} - ${time}h`;
}

function getWorkshopISO(w) {
  return w?.startDateTime ?? w?.dateISO ?? w?.date ?? null;
}

function getInitialImages(workshop) {
  const raw =
    workshop?.images ??
    workshop?.imageUrls ??
    workshop?.photos ??
    workshop?.slike ??
    workshop?.gallery ??
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) =>
      typeof x === "string" ? x : x?.url ?? x?.imageUrl ?? x?.path ?? null
    )
    .filter(Boolean);
}

function calcEndDate(workshop) {
  const startIso = getWorkshopISO(workshop);
  if (!startIso) return null;

  const start = new Date(startIso);
  const dur = Number(workshop?.durationMinutes ?? 0);

  if (!Number.isFinite(start.getTime())) return null;
  if (!dur) return start;

  return new Date(start.getTime() + dur * 60 * 1000);
}

function uniqByString(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = String(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

/* --- organizer helpers --- */
function getOrganizerIdFromWorkshop(w) {
  const v =
    w?.organizerId ??
    w?.organizatorId ??
    w?.creatorId ??
    w?.ownerId ??
    w?.userId ??
    w?.idOrganizator ??
    null;

  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : n;
}

function getOrganizerDisplayNameFromWorkshop(w) {
  const first = w?.organizerFirstName ?? w?.organizatorIme ?? w?.firstName ?? "";
  const last = w?.organizerLastName ?? w?.organizatorPrezime ?? w?.lastName ?? "";
  const full = `${first} ${last}`.trim();

  const studyName =
    w?.organizerStudyName ??
    w?.organizatorNazivStudija ??
    w?.studyName ??
    w?.organizerName ??
    w?.organizatorNaziv ??
    "";

  return full || studyName || "Organizator";
}

/* ---------- extra photos API ---------- */
async function fetchExtraPhotos(workshopId) {
  const res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/photos`, {
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const data = await res.json().catch(() => []);
  const arr = Array.isArray(data) ? data : [];
  return arr
    .map((x) => (typeof x === "string" ? x : x?.url ?? x?.imageUrl ?? null))
    .filter(Boolean);
}

async function uploadExtraPhotos(workshopId, files) {
  const fd = new FormData();
  for (const f of files) fd.append("images", f);

  const res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/photos`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json().catch(() => null);
    if (Array.isArray(data)) {
      return data
        .map((x) => (typeof x === "string" ? x : x?.url ?? x?.imageUrl ?? null))
        .filter(Boolean);
    }
  }
  return null;
}

/* ---------- reviews API (final + fallback) ---------- */
// Placeholder dok nema backenda
const FALLBACK_REVIEWS = [
  {
    id: "r1",
    author: "Ana",
    rating: 5,
    comment: "Odlična radionica, super atmosfera i jasne upute!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    _fallback: true,
  },
  {
    id: "r2",
    author: "Marko",
    rating: 4,
    comment: "Jako zabavno, možda bih dodao malo više vremena za glazuru.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    _fallback: true,
  },
];

// Normalizacija da UI uvijek dobije isti shape
function normalizeReviews(data) {
  const arr = Array.isArray(data) ? data : [];
  return arr.map((r) => {
    const fullName = `${r?.user?.firstName || ""} ${r?.user?.lastName || ""}`.trim();

    const author =
      (r?.author ??
        r?.authorName ??
        r?.userName ??
        (fullName || "")) || "Korisnik";

    const ratingNum = Number(r?.rating ?? r?.ocjena ?? 0);
    const rating = Number.isFinite(ratingNum) ? ratingNum : 0;

    return {
      id: r?.id ?? r?._id ?? `r-${Math.random().toString(16).slice(2)}`,
      author,
      rating,
      comment: r?.comment ?? r?.komentar ?? r?.text ?? "",
      createdAt: r?.createdAt ?? r?.created_at ?? r?.date ?? new Date().toISOString(),
    };
  });
}


async function fetchReviews(workshopId) {
  const res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/reviews`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    // ako endpoint ne postoji (npr. 404) ili backend još nije gotov -> fallback
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json().catch(() => []);
  return normalizeReviews(data);
}

async function postReview(workshopId, payload) {
  const res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/reviews`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json().catch(() => null);
    // backend može vratiti cijelu recenziju ili listu
    if (Array.isArray(data)) return normalizeReviews(data);
    if (data) return normalizeReviews([data])[0];
  }

  return null;
}

/* ---------- page ---------- */
export default function DetaljiRadionice() {
  const { id } = useParams();
  const workshopId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [workshop, setWorkshop] = useState(null);

  const [adding, setAdding] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [reservedIds, setReservedIds] = useState([]);

  // photos
  const [extraPhotos, setExtraPhotos] = useState([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraErr, setExtraErr] = useState("");

  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  // reserved
  const [reservedIds, setReservedIds] = useState(() => new Set());
  const [reservedLoading, setReservedLoading] = useState(false);

  // reviews (final)
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsNote, setReviewsNote] = useState(""); // npr. "placeholder"
  const [reviewsErr, setReviewsErr] = useState("");

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [reviewErr, setReviewErr] = useState("");
  const [postingReview, setPostingReview] = useState(false);

  // load workshop
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

  useEffect(() => {
    if (!user) {
      setReservedIds([]);
      return;
    }

    const userId = user?.id ?? user?.userId ?? user?.korisnikId ?? null;
    if (!userId) {
      setReservedIds([]);
      return;
    }

    getReservedWorkshopIds(userId)
      .then((ids) => setReservedIds(Array.isArray(ids) ? ids : []))
      .catch(() => setReservedIds([]));
  }, [user]);

  useEffect(() => {
    let alive = true;

    const refresh = async () => {
      try {
        const data = await getCart();
        const items = Array.isArray(data) ? data : data?.items || [];
        if (alive) setCartItems(Array.isArray(items) ? items : []);
      } catch {
        if (alive) setCartItems([]);
      }
    };

    refresh();
    const onCartUpdated = (e) => {
      const items = e?.detail?.items;
      if (Array.isArray(items)) setCartItems(items);
      else refresh();
    };
    const onStorage = (e) => {
      if (e.key && e.key.startsWith("stanari_cart_v1:")) refresh();
    };

    window.addEventListener("cart:updated", onCartUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener("cart:updated", onCartUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  const endAt = useMemo(() => (workshop ? calcEndDate(workshop) : null), [workshop]);
  const isFinished = useMemo(() => (endAt ? Date.now() > endAt.getTime() : false), [endAt]);

  const polaznik = user?.userType === "polaznik";

  const isOwnerOrganizer = useMemo(() => {
    const uid = user?.id ?? user?.userId ?? user?.korisnikId ?? null;
    const orgId = workshop?.organizerId ?? workshop?.organizatorId ?? null;
    return (
      user?.userType === "organizator" &&
      uid != null &&
      orgId != null &&
      Number(uid) === Number(orgId)
    );
  }, [user, workshop]);

  // organizer info
  const organizerId = useMemo(
    () => (workshop ? getOrganizerIdFromWorkshop(workshop) : null),
    [workshop]
  );
  const organizerName = useMemo(
    () => (workshop ? getOrganizerDisplayNameFromWorkshop(workshop) : "Organizator"),
    [workshop]
  );

  const goToOrganizerProfile = () => {
    if (!organizerId) return;
    navigate(`/tim/${organizerId}`);
  };

  // initial photos
  const initialPhotos = useMemo(() => (workshop ? getInitialImages(workshop) : []), [workshop]);

  // load extra photos after finish
  useEffect(() => {
    let alive = true;
    setExtraErr("");

    if (!workshop || !isFinished) {
      setExtraPhotos([]);
      return;
    }

    setExtraLoading(true);
    fetchExtraPhotos(workshopId)
      .then((arr) => {
        if (!alive) return;
        setExtraPhotos(Array.isArray(arr) ? arr : []);
      })
      .catch((e) => {
        if (!alive) return;
        setExtraErr(e.message || "Greška pri dohvaćanju dodatnih slika.");
      })
      .finally(() => alive && setExtraLoading(false));

    return () => {
      alive = false;
    };
  }, [workshop, isFinished, workshopId]);

  const allPhotos = useMemo(() => {
    if (!isFinished) return initialPhotos;
    return uniqByString([...(initialPhotos || []), ...(extraPhotos || [])]);
  }, [initialPhotos, extraPhotos, isFinished]);

  // reserved ids (to decide canReview)
  useEffect(() => {
    let alive = true;

    if (!user || user?.userType !== "polaznik") {
      setReservedIds(new Set());
      return () => {
        alive = false;
      };
    }

    const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
    if (userId == null) {
      setReservedIds(new Set());
      return () => {
        alive = false;
      };
    }

    setReservedLoading(true);
    getReservedWorkshopIds(userId)
      .then((ids) => {
        if (!alive) return;
        setReservedIds(new Set(Array.isArray(ids) ? ids : []));
      })
      .catch(() => {})
      .finally(() => alive && setReservedLoading(false));

    return () => {
      alive = false;
    };
  }, [user]);

  const canReview = useMemo(() => {
    if (!isFinished) return false;
    if (!polaznik) return false;
    return reservedIds.has(workshopId);
  }, [isFinished, polaznik, reservedIds, workshopId]);

  // ✅ load reviews from backend when finished (fallback if not available)
  useEffect(() => {
    let alive = true;
    if (!isFinished) {
      setReviews([]);
      setReviewsErr("");
      setReviewsNote("");
      return () => {
        alive = false;
      };
    }

    setReviewsLoading(true);
    setReviewsErr("");
    setReviewsNote("");

    fetchReviews(workshopId)
      .then((arr) => {
        if (!alive) return;
        setReviews(arr);
        setReviewsNote("");
      })
      .catch(() => {
        if (!alive) return;
        // fallback mode
        setReviews(normalizeReviews(FALLBACK_REVIEWS));
        setReviewsNote("Recenzije su trenutno placeholder (backend još nije spojen).");
      })
      .finally(() => alive && setReviewsLoading(false));

    return () => {
      alive = false;
    };
  }, [isFinished, workshopId]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);
  const isReserved = useMemo(() => {
    return Array.isArray(reservedIds) && reservedIds.some((rid) => Number(rid) === Number(workshopId));
  }, [reservedIds, workshopId]);

  const isInCart = useMemo(() => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    return items.some((item) => {
      if (item?.type && item.type !== "workshop") return false;
      if (item?.workshopId != null) return Number(item.workshopId) === Number(workshopId);
      if (item?.meta?.workshopId != null) return Number(item.meta.workshopId) === Number(workshopId);
      if (typeof item?.id === "string" && item.id.startsWith("workshop:")) {
        return Number(item.id.split(":")[1]) === Number(workshopId);
      }
      return false;
    });
  }, [cartItems, workshopId]);

  const onAddToCart = async () => {
    try {
      if (!user) throw new Error("Prijavite se da biste se mogli prijaviti na radionicu.");
      const isOrg = user?.userType === "organizator";
      const isPolaznik = user?.userType === "polaznik";
      if (!isPolaznik && !isOrg)
        throw new Error("Samo polaznici ili organizatori mogu dodati radionicu u košaricu.");
      if (isOrg && isOwnerOrganizer) return;
      if (!workshop) return;
      if (isFinished) throw new Error("Radionica je završila — više se nije moguće prijaviti.");
      if (isReserved) throw new Error("Već ste prijavljeni na radionicu.");
      if (isInCart) throw new Error("Radionica je već u košarici.");

      setAdding(true);
      await addWorkshopToCart(workshop.id, 1, {
        title: workshop.title || workshop.nazivRadionica,
        price: workshop.price ?? workshop.cijenaRadionica,
        meta: {
          dateISO: getWorkshopISO(workshop),
          location: workshop.location || workshop.lokacijaRadionica,
        },
      });
    } catch (e) {
      alert(e.message || "Nije moguće dodati u košaricu.");
    } finally {
      setAdding(false);
    }
  };

  const onUploadExtra = async () => {
    try {
      setUploadErr("");
      if (!isFinished) throw new Error("Dodatne slike možeš dodavati tek nakon završetka radionice.");
      if (!isOwnerOrganizer) throw new Error("Samo organizator radionice može dodavati slike.");

      const input = fileRef.current;
      const files = input?.files ? Array.from(input.files) : [];
      if (!files.length) throw new Error("Odaberite barem jednu sliku.");

      const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
      const bad = files.find((f) => !allowed.has(f.type));
      if (bad) throw new Error("Podržani formati: JPG, PNG, WEBP, GIF.");

      setUploading(true);
      const maybeNew = await uploadExtraPhotos(workshopId, files);

      if (Array.isArray(maybeNew)) {
        setExtraPhotos(maybeNew);
      } else {
        const fresh = await fetchExtraPhotos(workshopId);
        setExtraPhotos(Array.isArray(fresh) ? fresh : []);
      }

      if (input) input.value = "";
    } catch (e) {
      setUploadErr(e.message || "Upload nije uspio.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ submit review to backend (fallback to local add if backend missing)
  const onSubmitReview = async (e) => {
    e.preventDefault();
    setReviewErr("");

    if (!canReview) {
      setReviewErr("Samo polaznici koji su bili na radionici mogu ostaviti recenziju.");
      return;
    }

    const comment = String(myComment || "").trim();
    if (!comment) {
      setReviewErr("Unesite komentar.");
      return;
    }

    const ratingNum = Number(myRating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      setReviewErr("Ocjena mora biti između 1 i 5.");
      return;
    }

    setPostingReview(true);
    try {
      // pokušaj backend
      const created = await postReview(workshopId, { rating: ratingNum, comment });

      if (created) {
        // backend vratio jednu recenziju
        setReviews((prev) => [created, ...prev]);
        setReviewsNote("");
      } else {
        // backend nije vratio JSON -> refresh list
        const fresh = await fetchReviews(workshopId);
        setReviews(fresh);
        setReviewsNote("");
      }

      setMyComment("");
      setMyRating(5);
    } catch (e2) {
      // fallback: lokalno dodaj (dok backend nije spojen)
      const author =
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.email ||
        "Polaznik";

      const local = {
        id: `local-${Date.now()}`,
        author,
        rating: ratingNum,
        comment,
        createdAt: new Date().toISOString(),
      };

      setReviews((prev) => [local, ...prev]);
      setMyComment("");
      setMyRating(5);

      setReviewsNote(
        "Recenzije su trenutno placeholder (backend još nije spojen) — spremljeno lokalno."
      );
      // ako želiš: možeš i pokazati warning, ali bez da blokira
      // setReviewErr(e2?.message || "Backend nije dostupan - spremljeno lokalno.");
    } finally {
      setPostingReview(false);
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-topbar">
        <button className="wd-back" onClick={() => navigate(-1)}>
          ← Natrag
        </button>

        {!loading && workshop && (
          <span className={`wd-badge ${isFinished ? "is-finished" : "is-upcoming"}`}>
            {isFinished ? "Završena" : "Nadolazeća"}
          </span>
        )}
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
                  {!isFinished ? (
                    <button
                      className="wd-primary"
                      disabled={
                        adding ||
                        isFinished ||
                        isReserved ||
                        isInCart ||
                        isOwnerOrganizer ||
                        (workshop.capacity || 0) <= 0
                      }
                      onClick={onAddToCart}
                      title={(workshop.capacity || 0) <= 0 ? "Radionica je popunjena" : ""}
                    >
                      {adding
                        ? "Dodajem..."
                        : isOwnerOrganizer
                        ? "Vaša radionica"
                        : isReserved
                        ? "Prijavljen"
                        : isInCart
                        ? "U košarici"
                        : "Prijavi se (u košaricu)"}
                    </button>
                  ) : (
                    <div className="wd-finishedNote">Radionica je završila.</div>
                  )}
                </div>
              </div>

              <div className="wd-orgRow">
                <span className="wd-orgLabel">Organizator:</span>{" "}
                {organizerId ? (
                  <button
                    type="button"
                    className="wd-orgLink"
                    onClick={goToOrganizerProfile}
                    title="Otvori profil organizatora"
                  >
                    {organizerName}
                  </button>
                ) : (
                  <span className="wd-orgName">{organizerName}</span>
                )}
              </div>

              <p className="wd-sub">
                Datum: <strong>{formatDateTime(getWorkshopISO(workshop))}</strong>
                {endAt && (
                  <>
                    {" "}
                    · Kraj: <strong>{formatDateTime(endAt.toISOString())}</strong>
                  </>
                )}
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
              <div className="wd-sectionTop">
                <div className="wd-galleryTitle">
                  <h2>Galerija</h2>
                  {!isFinished ? (
                    <div className="wd-chip">slike prošlih radionica</div>
                  ) : (
                    <div className="wd-chip">prošle + dodatne slike</div>
                  )}
                </div>

                {isFinished && isOwnerOrganizer && (
                  <div className="wd-upload">
                    <input ref={fileRef} className="wd-file" type="file" accept="image/*" multiple />
                    <button className="wd-secondary" onClick={onUploadExtra} disabled={uploading}>
                      {uploading ? "Dodajem..." : "Dodaj dodatne slike"}
                    </button>
                  </div>
                )}
              </div>

              {isFinished && (
                <>
                  {!!uploadErr && <div className="wd-errorSmall">{uploadErr}</div>}
                  {!!extraErr && <div className="wd-muted">{extraErr}</div>}
                  {extraLoading && <div className="wd-muted">Učitavam dodatne slike…</div>}
                </>
              )}

              {allPhotos.length === 0 ? (
                <div className="wd-emptyPhotos">Još nema slika za ovu radionicu.</div>
              ) : (
                <div className="wd-gallery">
                  {allPhotos.map((src, i) => (
                    <div className="wd-photo" key={`${src}-${i}`}>
                      <img src={src} alt={`Radionica slika ${i + 1}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              )}

              {isFinished && !isOwnerOrganizer && (
                <div className="wd-hint">Samo organizator ove radionice može dodavati dodatne slike.</div>
              )}
            </section>

            {/* ✅ REVIEWS (only finished) */}
            {isFinished && (
              <section className="wd-section">
                <div className="wd-revTop">
                  <h2>Ocjene i recenzije</h2>

                  <div className="wd-revSummary">
                    <span className="wd-revAvg">{avgRating ? avgRating.toFixed(1) : "0.0"}</span>
                    <span className="wd-revStars" aria-label="Prosječna ocjena">
                      {"★".repeat(Math.round(avgRating || 0))}
                      {"☆".repeat(5 - Math.round(avgRating || 0))}
                    </span>
                    <span className="wd-revCount">({reviews.length})</span>
                  </div>
                </div>

                {reviewsLoading ? <div className="wd-muted">Učitavam recenzije…</div> : null}
                {!!reviewsErr ? <div className="wd-errorSmall">{reviewsErr}</div> : null}
                {!!reviewsNote ? <div className="wd-muted">{reviewsNote}</div> : null}

                {/* Forma: samo polaznik koji je bio prijavljen */}
                <div className="wd-reviewBox">
                  {polaznik && reservedLoading ? (
                    <div className="wd-muted">Provjeravam prijavu na radionicu…</div>
                  ) : canReview ? (
                    <form className="wd-reviewForm" onSubmit={onSubmitReview}>
                      <div className="wd-formRow">
                        <label className="wd-formLabel">Ocjena</label>
                        <select
                          className="wd-select"
                          value={myRating}
                          onChange={(e) => setMyRating(Number(e.target.value))}
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="wd-formRow">
                        <label className="wd-formLabel">Komentar</label>
                        <textarea
                          className="wd-textarea"
                          rows={4}
                          placeholder="Napiši svoje iskustvo…"
                          value={myComment}
                          onChange={(e) => setMyComment(e.target.value)}
                        />
                      </div>

                      {!!reviewErr && <div className="wd-errorSmall">{reviewErr}</div>}

                      <button className="wd-secondary" type="submit" disabled={postingReview}>
                        {postingReview ? "Objavljujem..." : "Objavi recenziju"}
                      </button>
                    </form>
                  ) : (
                    <div className="wd-muted">
                      {user?.userType !== "polaznik"
                        ? "Samo polaznici mogu ostaviti recenziju."
                        : "Recenziju mogu ostaviti samo polaznici koji su bili prijavljeni na ovu radionicu."}
                    </div>
                  )}
                </div>

                {/* Lista: svi mogu čitati */}
                {(!reviewsLoading && reviews.length === 0) ? (
                  <div className="wd-emptyPhotos">Još nema recenzija.</div>
                ) : (
                  <ul className="wd-revList">
                    {reviews.map((r) => (
                      <li key={r.id} className="wd-revItem">
                        <div className="wd-revHead">
                          <div className="wd-revAuthor">{r.author}</div>
                          <div className="wd-revMeta">
                            <span className="wd-revStarsSmall">
                              {"★".repeat(Number(r.rating || 0))}
                              {"☆".repeat(5 - Number(r.rating || 0))}
                            </span>
                            <span className="wd-dot">•</span>
                            <span>{formatDateTime(r.createdAt)}</span>
                          </div>
                        </div>
                        <div className="wd-revComment">{r.comment}</div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="wd-muted" style={{ marginTop: 10 }}>
                  Backend očekivanje: <code>GET /api/workshops/:id/reviews</code> i{" "}
                  <code>POST /api/workshops/:id/reviews</code> s {"{ rating, comment }"}.
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
