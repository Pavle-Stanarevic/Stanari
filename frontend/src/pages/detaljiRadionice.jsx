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
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toTimeString().slice(0, 5);
  return `${day}/${month}/${year} - ${time}h`;
}

function getWorkshopISO(w) {
  return w?.startDateTime ?? w?.dateISO ?? w?.date ?? null;
}

// ✅ početne slike iz "workshop" objekta (pri kreiranju radionice)
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

// za dedupe (ako backend slučajno vrati i iste linkove)
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

/* ---------- api (extra photos after workshop) ---------- */
/**
 * Očekivani backend (preporuka):
 *  - GET  /api/workshops/:id/photos   -> dodatne slike (naknadno dodane) kao [ "url", ... ] ili [ {url}, ... ]
 *  - POST /api/workshops/:id/photos   -> multipart/form-data field "images" (dodaje nove)
 */
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

  // ✅ dodatne (after) slike
  const [extraPhotos, setExtraPhotos] = useState([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraErr, setExtraErr] = useState("");

  // upload
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

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
  const isFinished = useMemo(() => {
    if (!endAt) return false;
    return Date.now() > endAt.getTime();
  }, [endAt]);

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

  // ✅ početne slike: uvijek dostupne
  const initialPhotos = useMemo(() => {
    if (!workshop) return [];
    return getInitialImages(workshop);
  }, [workshop]);

  // ✅ nakon završetka dohvaćamo dodatne slike (only when finished)
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

  // ✅ ukupna galerija: prije završetka = initial, nakon završetka = initial + extra
  const allPhotos = useMemo(() => {
    if (!isFinished) return initialPhotos;
    return uniqByString([...(initialPhotos || []), ...(extraPhotos || [])]);
  }, [initialPhotos, extraPhotos, isFinished]);

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
      if (user?.userType !== "polaznik")
        throw new Error("Samo polaznici mogu dodati radionicu u košaricu.");
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
        // backend vrati listu dodatnih slika (idealno)
        setExtraPhotos(maybeNew);
      } else {
        // ako ne vrati listu, re-fetch
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
                        (workshop.capacity || 0) <= 0
                      }
                      onClick={onAddToCart}
                      title={(workshop.capacity || 0) <= 0 ? "Radionica je popunjena" : ""}
                    >
                      {adding
                        ? "Dodajem..."
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

            {/* ✅ GALERIJA: prije završetka initial, nakon završetka initial+extra + upload */}
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
                <div className="wd-emptyPhotos">
                  Još nema slika za ovu radionicu.
                </div>
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
          </>
        )}
      </main>
    </div>
  );
}
