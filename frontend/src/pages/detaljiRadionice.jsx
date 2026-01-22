import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { applyToWorkshop, cancelWorkshop, getReservedWorkshopIds, listWorkshops } from "../api/workshops";
import { addCartItem, getCart } from "../api/cart";
import { getOrganizator } from "../api/organisers";
import useAuth from "../hooks/useAuth";
import "../styles/detaljiRadionice.css";

const BASE_URL = import.meta.env.VITE_API_URL || "";

/* ---------- calendar helpers ---------- */
function toGoogleCalDateUtc(date) {
  // Google expects UTC format: YYYYMMDDTHHMMSSZ
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function buildGoogleCalendarUrl({ title, details, location, start, end }) {
  if (!start || !end) return null;

  const dates = `${toGoogleCalDateUtc(start)}/${toGoogleCalDateUtc(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Radionica",
    details: details || "",
    location: location || "",
    dates,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ---------- helpers ---------- */
function resolvePhotoUrl(raw) {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${BASE_URL}${raw}`;
  return raw;
}

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
  return `${day}/${month}/${year} | ${time}h`;
}

function getWorkshopISO(w) {
  return w?.startDateTime ?? null;
}

function getInitialImages(workshop) {
  const raw = workshop?.images ?? workshop?.imageUrls ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x : x?.url ?? x?.imageUrl ?? x?.path ?? null))
    .map(resolvePhotoUrl)
    .filter(Boolean);
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

function calcEndDate(workshop) {
  const startIso = getWorkshopISO(workshop);
  if (!startIso) return null;
  const start = new Date(startIso);
  if (!Number.isFinite(start.getTime())) return null;

  const dur = Number(workshop?.durationMinutes ?? 0);
  if (!dur) return start;

  return new Date(start.getTime() + dur * 60 * 1000);
}

function formatTimeOnly(d) {
  if (!d) return "—";
  return `${d.toTimeString().slice(0, 5)}h`;
}

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
    .map(resolvePhotoUrl)
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
        .map(resolvePhotoUrl)
        .filter(Boolean);
    }
  }
  return null;
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

  const [organizer, setOrganizer] = useState(null);
  const [organizerErr, setOrganizerErr] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [reservedSet, setReservedSet] = useState(() => new Set());
  const [reservedLoading, setReservedLoading] = useState(false);

  const [extraPhotos, setExtraPhotos] = useState([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraErr, setExtraErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  const [canceling, setCanceling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");


  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    setWorkshop(null);

    listWorkshops()
      .then((data) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        const found = arr.find((w) => Number(w?.id) === Number(workshopId)) || null;
        setWorkshop(found);
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
    let alive = true;
    setOrganizer(null);
    setOrganizerErr("");

    const organizerId = workshop?.organizerId;
    if (!organizerId) return () => (alive = false);

    (async () => {
      try {
        const data = await getOrganizator(organizerId);
        if (!alive) return;
        setOrganizer(data || null);
      } catch (e) {
        if (!alive) return;
        setOrganizer(null);
        setOrganizerErr(e?.message || "Ne mogu dohvatiti organizatora.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [workshop?.organizerId]);

  useEffect(() => {
    let alive = true;

    if (!user || user.userType !== "polaznik") {
      setReservedSet(new Set());
      return () => {
        alive = false;
      };
    }

    const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
    if (userId == null) {
      setReservedSet(new Set());
      return () => {
        alive = false;
      };
    }

    setReservedLoading(true);
    getReservedWorkshopIds(userId)
      .then((ids) => {
        if (!alive) return;
        setReservedSet(new Set(Array.isArray(ids) ? ids.map((x) => Number(x)) : []));
      })
      .catch(() => {
        if (!alive) return;
        setReservedSet(new Set());
      })
      .finally(() => alive && setReservedLoading(false));

    return () => {
      alive = false;
    };
  }, [user]);

  // cart
  useEffect(() => {
    let alive = true;

    const refresh = async () => {
      try {
        const data = await getCart();
        const arr = Array.isArray(data) ? data : data?.items || [];
        if (alive) setCartItems(Array.isArray(arr) ? arr : []);
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
  const organizerId = workshop?.organizerId ?? null;

  const organizerName = useMemo(() => {
    if (!organizerId) return "Organizator";
    if (!organizer && !organizerErr) return "Učitavam...";
    if (!organizer) return "Organizator";

    const full = `${organizer?.firstName || ""} ${organizer?.lastName || ""}`.trim();
    return full || organizer?.studyName || organizer?.email || "Organizator";
  }, [organizer, organizerErr, organizerId]);

  const goToOrganizerProfile = () => {
    if (!organizerId) return;
    navigate(`/tim/${organizerId}`);
  };

  const isOwnerOrganizer = useMemo(() => {
    const uid = user?.id ?? user?.userId ?? user?.korisnikId ?? null;
    return user?.userType === "organizator" && uid != null && organizerId != null
      ? Number(uid) === Number(organizerId)
      : false;
  }, [user, organizerId]);

  const initialPhotos = useMemo(() => (workshop ? getInitialImages(workshop) : []), [workshop]);

  // dodatne slike nakon zavrsetka radionice
  useEffect(() => {
    let alive = true;
    setExtraErr("");

    if (!workshop || !isFinished) {
      setExtraPhotos([]);
      return () => {
        alive = false;
      };
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


  const isReserved = useMemo(() => reservedSet.has(Number(workshopId)), [reservedSet, workshopId]);

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
      if (!user) throw new Error("Prijavite se da biste mogli dodati u košaricu.");
      if (user?.userType !== "polaznik") throw new Error("Samo polaznici mogu kupiti radionice.");
      if (!workshop) return;

      const id = workshopId;
      if (isReserved) throw new Error("Već ste prijavljeni na radionicu.");
      if (isInCart) return;

      setAdding(true);

      const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
      if (!userId) throw new Error("Nedostaje ID korisnika.");

      const payload = {
        type: "workshop",
        workshopId: id,
        title: workshop.title || workshop.naslov || `Radionica #${id}`,
        price: Number(workshop.price || workshop.cijena || 0),
        qty: 1,
        meta: { workshopId: id, dateISO: workshop.startDateTime ?? workshop.dateISO }
      };

      await addCartItem(payload);

      try {
        const data = await getCart();
        const arr = Array.isArray(data) ? data : data?.items || [];
        setCartItems(Array.isArray(arr) ? arr : []);
        try { window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: Array.isArray(arr) ? arr : [] } })); } catch (e) {}
      } catch (e) { }
    } catch (e) {
      alert(e.message || "Ne mogu dodati radionicu u košaricu.");
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

  /* ---------- calendar url (only useful when reserved + upcoming) ---------- */
  const calendarUrl = useMemo(() => {
    if (!workshop) return null;

    const startIso = getWorkshopISO(workshop);
    if (!startIso) return null;

    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return null;

    const end = calcEndDate(workshop) || start;
    const title = workshop.title || "Radionica";
    const location = workshop.location || "";
    const details =
      `Radionica: ${title}\n` +
      `Vrijeme: ${formatDateTime(startIso)}${end ? ` - ${formatTimeOnly(end)}` : ""}\n` +
      (location ? `Lokacija: ${location}\n` : "") +
      (workshop.description ? `\n${workshop.description}` : "");

    return buildGoogleCalendarUrl({ title, details, location, start, end });
  }, [workshop]);

  const workshopStart = useMemo(() => {
    const iso = getWorkshopISO(workshop);
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [workshop]);

  const canCancel48h = useMemo(() => {
    if (!polaznik) return false;
    if (!workshopStart) return false;
    const diffMs = workshopStart.getTime() - Date.now();
    return diffMs >= 48 * 60 * 60 * 1000;
  }, [polaznik, workshopStart]);

  const refreshReserved = async () => {
    if (!user || user?.userType !== "polaznik") return;
    const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
    if (userId == null) return;
    try {
      const ids = await getReservedWorkshopIds(userId);
      setReservedSet(new Set(Array.isArray(ids) ? ids.map((x) => Number(x)) : []));
    } catch {
      setReservedSet(new Set());
    }
  };

  const refreshWorkshop = async () => {
    try {
      const data = await listWorkshops();
      const arr = Array.isArray(data) ? data : [];
      const found = arr.find((w) => Number(w?.id) === Number(workshopId)) || null;
      if (found) setWorkshop(found);
    } catch { }
  };

  const onCancelReservation = async () => {
    try {
      if (!user) throw new Error("Za odjavu morate biti prijavljeni.");
      if (user?.userType !== "polaznik") throw new Error("Samo polaznici se mogu odjaviti.");
      if (!isReserved) throw new Error("Niste prijavljeni na ovu radionicu.");
      if (!canCancel48h) {
        throw new Error("Odjava je moguća najkasnije 48h prije početka radionice.");
      }

      const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
      if (userId == null) throw new Error("Nedostaje userId.");

      setCanceling(true);
      setCancelMsg("");

      await cancelWorkshop(workshopId, userId);

      await refreshReserved();
      await refreshWorkshop();

      setCancelMsg("Uspješno ste odjavljeni. Refundacija će stići na vaš račun unutar 48h.");
    } catch (e) {
      alert(e?.message || "Ne mogu odjaviti s radionice.");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-topbar">
        <button className="wd-back" onClick={() => navigate(-1)}>
          ← Natrag
        </button>

        {!loading && workshop ? (
          <span className={`wd-badge ${isFinished ? "is-finished" : "is-upcoming"}`}>
            {isFinished ? "Završena" : "Nadolazeća"}
          </span>
        ) : null}
      </div>

      <main className="wd-wrap">
        {loading ? <div className="wd-info">Učitavanje…</div> : null}
        {!loading && err ? <div className="wd-error">{err}</div> : null}

        {!loading && workshop ? (
          <>
            <header className="wd-header">
              <div className="wd-titleRow">
                <h1 className="wd-title">{workshop.title || "Bez naziva"}</h1>

                <div className="wd-actions">
                  {!isFinished ? (
                    <>
                      <button
                        className="wd-primary"
                        disabled={
                          adding ||
                          !user ||
                          isFinished ||
                          isReserved ||
                          isInCart ||
                          isOwnerOrganizer ||
                          (workshop.capacity || 0) <= 0
                        }
                        onClick={onAddToCart}
                        title={
                          !user
                            ? "Odjavljeni ste"
                            : (workshop.capacity || 0) <= 0
                            ? "Radionica je popunjena"
                            : ""
                        }
                      >
                        {adding
                          ? "Dodajem..."
                          : !user
                          ? "Odjavljeni ste"
                          : isOwnerOrganizer
                          ? "Vaša radionica"
                          : isReserved
                          ? "Prijavljen"
                          : isInCart
                          ? "U košarici"
                          : "Dodaj u košaricu"}
                      </button>

                      {/* Odjava */}
                      {polaznik && isReserved ? (
                        <button
                          className="wd-primary"
                          style={{ background: "#fff", color: "#111", border: "1px solid rgba(0,0,0,0.2)" }}
                          disabled={canceling || !canCancel48h}
                          onClick={onCancelReservation}
                          title={!canCancel48h ? "Odjava je moguća najkasnije 48h prije početka." : ""}
                        >
                          {canceling ? "Odjavljujem..." : "Odjavi"}
                        </button>
                      ) : null}

                      {polaznik && isReserved && calendarUrl ? (
                        <a
                          className="wd-calendarBtn"
                          href={calendarUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Otvori Google Kalendar i dodaj događaj"
                        >
                          + Dodaj u kalendar
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <div className="wd-finishedNote">Radionica je završila.</div>
                  )}
                </div>
              </div>

              {cancelMsg ? (
                <div
                  className="wd-muted"
                  style={{
                    marginTop: 10,
                    textAlign: "right",
                    fontSize: 12,
                    lineHeight: 1.25,
                    opacity: 0.85,
                  }}
                >
                  {cancelMsg}
                </div>
              ) : null}

              <div className="wd-orgRow">
                <span className="wd-orgLabel">Organizator:</span>{" "}
                {organizerId ? (
                  <button type="button" className="wd-orgLink" onClick={goToOrganizerProfile}>
                    {organizerName}
                  </button>
                ) : (
                  <span className="wd-orgName">{organizerName}</span>
                )}
              </div>

              {organizerErr ? <div className="wd-muted">{organizerErr}</div> : null}

              <p className="wd-sub">
                Datum: <strong>{formatDateTime(getWorkshopISO(workshop))}</strong>
                {endAt ? (
                  <>
                    {" "}
                    – <strong>{formatTimeOnly(endAt)}</strong>
                  </>
                ) : null}
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
              <p className="wd-desc">{workshop.description || "Nema opisa."}</p>
            </section>

            <section className="wd-section">
              <div className="wd-sectionTop">
                <div className="wd-galleryTitle">
                  <h2>Galerija</h2>
                  <div className="wd-chip">{isFinished ? "prošle + dodatne slike" : "slike radionice"}</div>
                </div>

                {isFinished && isOwnerOrganizer ? (
                  <div className="wd-upload">
                    <input ref={fileRef} className="wd-file" type="file" accept="image/*" multiple />
                    <button className="wd-secondary" onClick={onUploadExtra} disabled={uploading}>
                      {uploading ? "Dodajem..." : "Dodaj dodatne slike"}
                    </button>
                  </div>
                ) : null}
              </div>

              {isFinished ? (
                <>
                  {uploadErr ? <div className="wd-errorSmall">{uploadErr}</div> : null}
                  {extraErr ? <div className="wd-muted">{extraErr}</div> : null}
                  {extraLoading ? <div className="wd-muted">Učitavam dodatne slike…</div> : null}
                </>
              ) : null}

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
            </section>

          </>
        ) : null}
      </main>
    </div>
  );
}
