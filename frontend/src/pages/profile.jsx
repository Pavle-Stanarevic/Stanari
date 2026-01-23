import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import "../styles/profile.css";
import { Edit, Check, X } from "lucide-react";
import { updateProfile, me } from "../api/auth.js";

import { listWorkshops, getReservedWorkshopIds } from "../api/workshops.js";
import { listExhibitions, getReservedExhibitionIds } from "../api/exhibitions.js";

import { setNotificationsPreference } from "../api/notifications.js";

// ✅ NOVO (dodaješ fajlove ispod)
import { listProductsBySeller, listSoldItemsBySeller, createProductReview } from "../api/products.js";
import { listMyPurchasedItems } from "../api/orders.js";

const API = import.meta.env.VITE_API_URL || "";

function resolvePhotoUrl(u) {
  const raw =
    u?.imageUrl ||
    u?.photoUrl ||
    u?.fotoUrl ||
    u?.avatarUrl ||
    u?.imagePath ||
    "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${API}${raw}`;
  return `${API}/${raw}`;
}

function getCookie(name = "XSRF-TOKEN") {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

const ALLOWED_FIELDS = new Set(["firstName", "lastName", "contact", "studyName", "address"]);

function isStrongEnoughPassword(pw) {
  const v = String(pw || "");
  return v.length >= 8;
}

/** -------- helpers -------- */
function parseDateAny(x) {
  if (!x) return null;
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function getISO_Workshop(w) {
  return w?.startDateTime ?? w?.dateISO ?? w?.date ?? null;
}

function getISO_Exh(x) {
  return x?.startDateTime ?? x?.dateTime ?? x?.date ?? x?.start ?? null;
}

function pickId(obj) {
  return obj?.id ?? obj?.workshopId ?? obj?._id ?? obj?.exhibitionId ?? obj?.idIzlozba ?? obj?.productId;
}

function pickProductId(obj) {
  return (
    obj?.productId ??
    obj?.product?.id ??
    obj?.product?.productId ??
    obj?.id ??
    obj?._id ??
    obj?.product?.idProizvod ??
    obj?.idProizvod ??
    null
  );
}

function pickProductTitle(obj, fallback = "Proizvod") {
  return (
    obj?.title ||
    obj?.productTitle ||
    obj?.productName ||
    obj?.product?.title ||
    obj?.product?.name ||
    obj?.product?.naziv ||
    obj?.naziv ||
    fallback
  );
}

function pickProductPrice(obj) {
  return obj?.price ?? obj?.unitPrice ?? obj?.product?.price ?? obj?.product?.cijena ?? null;
}

function pickProductQty(obj) {
  const raw = obj?.qty ?? obj?.quantity ?? obj?.kolicina ?? obj?.productQty ?? 1;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 1;
}

function pickTitle(obj, fallback = "Stavka") {
  return obj?.title || obj?.name || obj?.naziv || obj?.productTitle || obj?.productName || fallback;
}

function pickSubWorkshop(w) {
  const d = parseDateAny(getISO_Workshop(w));
  const dateLabel = d ? d.toLocaleDateString("hr-HR") : "";
  const loc = w?.location || "";
  const parts = [dateLabel, loc].filter(Boolean);
  return parts.length ? parts.join(" • ") : "—";
}

function pickSubExh(x) {
  const d = parseDateAny(getISO_Exh(x));
  const dateLabel = d ? d.toLocaleDateString("hr-HR") : "";
  const loc = x?.location || "";
  const parts = [dateLabel, loc].filter(Boolean);
  return parts.length ? parts.join(" • ") : "—";
}

function formatMoneyEUR(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return `${n.toFixed(2)}€`;
}

/** -------- rute iz tvog projekta -------- */
const ROUTES = {
  workshopDetails: (id) => `/radionica/${id}`,
  exhibitionDetails: (id) => `/izlozbe/${id}`,
  productDetails: (id) => `/shop/${id}`, // ako ti je drugačije, promijeni samo ovu liniju
};

export default function Profile() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [localUser, setLocalUser] = useState(user || null);

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // slika profila
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  // ✅ obavijesti (polaznik)
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");

  // ✅ MOJE (radionice + izložbe)
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState("");

  const [myUpcomingWorkshops, setMyUpcomingWorkshops] = useState([]);
  const [myPastWorkshops, setMyPastWorkshops] = useState([]);

  const [myUpcomingExhibitions, setMyUpcomingExhibitions] = useState([]);
  const [myPastExhibitions, setMyPastExhibitions] = useState([]);

  // ✅ PROIZVODI (organizator: aktivni/prodani, polaznik: kupljeni)
  const [prodTab, setProdTab] = useState("active"); // active | sold | bought
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState("");
  const [activeProducts, setActiveProducts] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [boughtItems, setBoughtItems] = useState([]);

  // ✅ RECENZIJE ZA KUPLJENE PROIZVODE
  const [reviewOpenId, setReviewOpenId] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPosting, setReviewPosting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewDoneId, setReviewDoneId] = useState(null);

  useEffect(() => setLocalUser(user || null), [user]);

  const safeUser = useMemo(() => localUser || user, [localUser, user]);
  const userType = String(safeUser?.userType || safeUser?.role || "").toLowerCase();
  const isOrganizator = userType === "organizator";
  const isPolaznik = userType === "polaznik";
  const isAdmin = userType === "admin";
  const isSubscribed = !!safeUser?.isSubscribed;
  const zeliObavijesti = !!safeUser?.zeliObavijesti;

  // admin redirect
  useEffect(() => {
    if (!safeUser) return;
    if (isAdmin) navigate("/admin", { replace: true });
  }, [safeUser, isAdmin, navigate]);

  // preview slike
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // ✅ Učitavanje radionica + izložbi (polaznik/organizator)
  useEffect(() => {
    if (!safeUser?.id) return;
    let alive = true;

    const uid = safeUser.id;

    const load = async () => {
      setMyLoading(true);
      setMyError("");

      try {
        // radionice
        const wsAll = await listWorkshops();
        const wsArr = Array.isArray(wsAll) ? wsAll : [];

        let wsMine = [];
        if (isPolaznik) {
          const ids = await getReservedWorkshopIds(uid);
          const set = new Set((Array.isArray(ids) ? ids : []).map((x) => Number(x)));
          wsMine = wsArr.filter((w) => set.has(Number(w?.id)));
        } else if (isOrganizator) {
          wsMine = wsArr.filter((w) => Number(w?.organizerId) === Number(uid));
        }

        // izložbe
        const exAll = await listExhibitions();
        const exArr = Array.isArray(exAll) ? exAll : [];

        let exMine = [];
        if (isPolaznik) {
          const ids = await getReservedExhibitionIds(uid);
          const set = new Set((Array.isArray(ids) ? ids : []).map((x) => Number(x)));
          exMine = exArr.filter((e) => set.has(Number(e?.id)));
        } else if (isOrganizator) {
          exMine = exArr.filter((e) => Number(e?.organizerId) === Number(uid));
        }

        const now = new Date();

        const wsUpcoming = wsMine
          .filter((w) => {
            const d = parseDateAny(getISO_Workshop(w));
            return d ? d >= now : false;
          })
          .sort((a, b) => new Date(getISO_Workshop(a)) - new Date(getISO_Workshop(b)));

        const wsPast = wsMine
          .filter((w) => {
            const d = parseDateAny(getISO_Workshop(w));
            return d ? d < now : false;
          })
          .sort((a, b) => new Date(getISO_Workshop(b)) - new Date(getISO_Workshop(a)));

        const exUpcoming = exMine
          .filter((e) => {
            const d = parseDateAny(getISO_Exh(e));
            return d ? d >= now : false;
          })
          .sort((a, b) => new Date(getISO_Exh(a)) - new Date(getISO_Exh(b)));

        const exPast = exMine
          .filter((e) => {
            const d = parseDateAny(getISO_Exh(e));
            return d ? d < now : false;
          })
          .sort((a, b) => new Date(getISO_Exh(b)) - new Date(getISO_Exh(a)));

        if (!alive) return;
        setMyUpcomingWorkshops(wsUpcoming);
        setMyPastWorkshops(wsPast);
        setMyUpcomingExhibitions(exUpcoming);
        setMyPastExhibitions(exPast);
      } catch (e) {
        if (!alive) return;
        setMyError(e?.message || "Ne mogu dohvatiti vaše aktivnosti.");
        setMyUpcomingWorkshops([]);
        setMyPastWorkshops([]);
        setMyUpcomingExhibitions([]);
        setMyPastExhibitions([]);
      } finally {
        if (!alive) return;
        setMyLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [safeUser?.id, isPolaznik, isOrganizator]);

  // ✅ Učitavanje proizvoda (organizator: aktivni/prodani, polaznik: kupljeni)
  useEffect(() => {
    if (!safeUser?.id) return;
    let alive = true;

    const uid = safeUser.id;

    // default tab po userType
    if (isOrganizator) setProdTab("active");
    if (isPolaznik) setProdTab("bought");

    const loadProducts = async () => {
      setProdLoading(true);
      setProdError("");

      try {
        if (isOrganizator) {
          // aktivni + prodani
          const act = await listProductsBySeller(uid);
          const sold = await listSoldItemsBySeller(uid);

          if (!alive) return;
          const actArr = Array.isArray(act) ? act : [];
          const activeOnly = actArr.filter((p) => !Boolean(p?.kupljen));

          setActiveProducts(activeOnly);
          setSoldItems(Array.isArray(sold) ? sold : []);
          setBoughtItems([]);
        } else if (isPolaznik) {
          // kupljeni
          const bought = await listMyPurchasedItems(uid);
          if (!alive) return;
          setBoughtItems(Array.isArray(bought) ? bought : []);
          setActiveProducts([]);
          setSoldItems([]);
        } else {
          if (!alive) return;
          setActiveProducts([]);
          setSoldItems([]);
          setBoughtItems([]);
        }
      } catch (e) {
        if (!alive) return;
        // kad backend još nema endpoint -> poruka, ali UI ostaje
        setProdError(
          e?.message ||
            "Proizvodi trenutno nisu dostupni (backend endpoint još nije spojen)."
        );
        setActiveProducts([]);
        setSoldItems([]);
        setBoughtItems([]);
      } finally {
        if (!alive) return;
        setProdLoading(false);
      }
    };

    loadProducts();
    return () => {
      alive = false;
    };
  }, [safeUser?.id, isOrganizator, isPolaznik]);

  const toggleReview = (pid) => {
    if (!pid) return;
    setReviewError("");
    if (reviewOpenId === pid) {
      setReviewOpenId(null);
      return;
    }
    setReviewOpenId(pid);
    setReviewText("");
    setReviewRating(5);
    setReviewDoneId(null);
  };

  const onSubmitProductReview = async (e, pid) => {
    e.preventDefault();
    e.stopPropagation();

    if (!pid) return;
    if (!safeUser?.id) {
      setReviewError("Niste prijavljeni.");
      return;
    }

    const text = String(reviewText || "").trim();
    if (!text) {
      setReviewError("Unesite tekst recenzije.");
      return;
    }

    const ratingNum = Number(reviewRating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      setReviewError("Ocjena mora biti između 1 i 5.");
      return;
    }

    setReviewPosting(true);
    setReviewError("");
    try {
      await createProductReview(pid, { userId: safeUser.id, rating: ratingNum, text });
      setBoughtItems((prev) =>
        prev.map((it) => (pickProductId(it) === pid ? { ...it, reviewed: true } : it))
      );
      setReviewDoneId(pid);
      setReviewOpenId(null);
      setReviewText("");
      setReviewRating(5);
    } catch (err) {
      setReviewError(err?.message || "Ne mogu spremiti recenziju.");
    } finally {
      setReviewPosting(false);
    }
  };

  const startEditing = (field, value) => {
    setError("");
    setEditingField(field);
    setTempValue(value ?? "");
  };

  const cancelEditing = () => {
    setError("");
    setEditingField(null);
    setTempValue("");
  };

  const handleSave = async () => {
    if (!editingField) return;

    if (!safeUser?.id) {
      setError("Niste prijavljeni ili nedostaje ID korisnika.");
      return;
    }

    if (!ALLOWED_FIELDS.has(editingField)) {
      setError("Ne možete uređivati ovo polje.");
      return;
    }

    const valueTrimmed = typeof tempValue === "string" ? tempValue.trim() : tempValue;

    if (
      (editingField === "firstName" || editingField === "lastName") &&
      String(valueTrimmed).length < 2
    ) {
      setError("Unesite barem 2 znaka.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const patch = { [editingField]: valueTrimmed };
      const saved = await updateProfile(safeUser.id, patch);

      if (saved && Object.keys(saved).length > 0) {
        signIn(saved);
        setLocalUser(saved);
      } else {
        const refreshed = await me();
        if (refreshed) {
          signIn(refreshed);
          setLocalUser(refreshed);
        }
      }

      setEditingField(null);
      setTempValue("");
    } catch (e) {
      setError(e?.message || "Neuspješno spremanje profila.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async () => {
    if (!safeUser?.id) {
      setError("Niste prijavljeni ili nedostaje ID korisnika.");
      return;
    }
    if (!imageFile) {
      setError("Odaberite sliku prije spremanja.");
      return;
    }

    setError("");
    setUploadingImage(true);

    try {
      const fd = new FormData();
      fd.append("image", imageFile);

      const csrf = getCookie();
      const res = await fetch(`${API}/api/users/${safeUser.id}/image`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
        },
        body: fd,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }

      const updated = await res.json().catch(() => ({}));
      let resolvedUrl = "";

      if (updated && Object.keys(updated).length > 0) {
        signIn(updated);
        setLocalUser(updated);
        resolvedUrl = resolvePhotoUrl(updated);
      } else {
        const refreshed = await me();
        if (refreshed) {
          signIn(refreshed);
          setLocalUser(refreshed);
          resolvedUrl = resolvePhotoUrl(refreshed);
        }
      }

      if (resolvedUrl) {
        const busted = `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
        setUploadedImageUrl(busted);
        setImagePreview("");
      }

      setImageFile(null);
    } catch (e) {
      setError(e?.message || "Neuspješno spremanje slike.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!safeUser?.id) return;
    setNotifSaving(true);
    setNotifMsg("");
    try {
      const updatedUser = await setNotificationsPreference(safeUser.id, !zeliObavijesti);
      setLocalUser(updatedUser);
      signIn(updatedUser);
      setNotifMsg(!zeliObavijesti ? "Pretplaćeni ste na obavijesti." : "Više ne dobivate obavijesti.");
    } catch (e) {
      setNotifMsg(e?.message || "Neuspješno - pokušajte ponovno.");
    } finally {
      setNotifSaving(false);
    }
  };

  if (!safeUser) {
    return (
      <div>
        <h1 className="naslov">Vaš profil</h1>
        <div className="container-profile">
          <p className="error">Nema podataka o korisniku. Prijavite se ponovno.</p>
        </div>
      </div>
    );
  }

  const headerTitle = isOrganizator
    ? "Moje radionice, izložbe i proizvodi"
    : "Moje prijave i kupnje";

  return (
    <div className="profile-page">
      <h1 className="naslov">Vaš profil</h1>

      <div className="container-profile">
        {error && (
          <p className="error" style={{ marginBottom: 12, gridColumn: "1 / -1" }}>
            {error}
          </p>
        )}

        {/* ===== PROFILNA SLIKA ===== */}
        <div className="profile-avatar">
          <div className="avatar-img">
            <img
              src={
                imagePreview ||
                uploadedImageUrl ||
                resolvePhotoUrl(safeUser) ||
                "https://via.placeholder.com/140x140.png?text=Profil"
              }
              alt="Profilna slika"
            />
          </div>

          <div className="avatar-actions">
            <p className="section-title">Fotografija</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] || null);
                setUploadedImageUrl("");
              }}
              disabled={uploadingImage}
            />
            <button
              className="btn-primary"
              onClick={handleUploadImage}
              disabled={uploadingImage || !imageFile}
              type="button"
            >
              {uploadingImage ? "Spremanje..." : "Spremi sliku"}
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* ===== PODACI ===== */}
        <p className="label">Ime:</p>
        {editingField === "firstName" ? (
          <>
            <p className="value">
              <input className="edit-input" value={tempValue} onChange={(e) => setTempValue(e.target.value)} disabled={saving} />
            </p>
            <div className="actions">
              <Check className="icon save" onClick={saving ? undefined : handleSave} />
              <X className="icon cancel" onClick={saving ? undefined : cancelEditing} />
            </div>
          </>
        ) : (
          <>
            <p className="value">{safeUser.firstName}</p>
            <Edit className="edit-icon" onClick={() => startEditing("firstName", safeUser.firstName)} />
          </>
        )}

        <p className="label">Prezime:</p>
        {editingField === "lastName" ? (
          <>
            <p className="value">
              <input className="edit-input" value={tempValue} onChange={(e) => setTempValue(e.target.value)} disabled={saving} />
            </p>
            <div className="actions">
              <Check className="icon save" onClick={saving ? undefined : handleSave} />
              <X className="icon cancel" onClick={saving ? undefined : cancelEditing} />
            </div>
          </>
        ) : (
          <>
            <p className="value">{safeUser.lastName}</p>
            <Edit className="edit-icon" onClick={() => startEditing("lastName", safeUser.lastName)} />
          </>
        )}

        <p className="label">Email:</p>
        <>
          <p className="value">{safeUser.email}</p>
          <span className="muted">(ne može se mijenjati)</span>
        </>

        <p className="label">Kontakt telefon:</p>
        {editingField === "contact" ? (
          <>
            <p className="value">
              <input className="edit-input" value={tempValue} onChange={(e) => setTempValue(e.target.value)} disabled={saving} />
            </p>
            <div className="actions">
              <Check className="icon save" onClick={saving ? undefined : handleSave} />
              <X className="icon cancel" onClick={saving ? undefined : cancelEditing} />
            </div>
          </>
        ) : (
          <>
            <p className="value">{safeUser.contact}</p>
            <Edit className="edit-icon" onClick={() => startEditing("contact", safeUser.contact)} />
          </>
        )}

        {isOrganizator && (
          <>
            <p className="label">Adresa:</p>
            {editingField === "address" ? (
              <>
                <p className="value">
                  <input className="edit-input" value={tempValue} onChange={(e) => setTempValue(e.target.value)} disabled={saving} placeholder="Unesite adresu" />
                </p>
                <div className="actions">
                  <Check className="icon save" onClick={saving ? undefined : handleSave} />
                  <X className="icon cancel" onClick={saving ? undefined : cancelEditing} />
                </div>
              </>
            ) : (
              <>
                <p className="value">{safeUser.address || "-"}</p>
                <Edit className="edit-icon" onClick={() => startEditing("address", safeUser.address)} />
              </>
            )}

            <p className="label">Naziv studija:</p>
            {editingField === "studyName" ? (
              <>
                <p className="value">
                  <input className="edit-input" value={tempValue} onChange={(e) => setTempValue(e.target.value)} disabled={saving} />
                </p>
                <div className="actions">
                  <Check className="icon save" onClick={saving ? undefined : handleSave} />
                  <X className="icon cancel" onClick={saving ? undefined : cancelEditing} />
                </div>
              </>
            ) : (
              <>
                <p className="value">{safeUser.studyName}</p>
                <Edit className="edit-icon" onClick={() => startEditing("studyName", safeUser.studyName)} />
              </>
            )}
          </>
        )}

        <div className="divider" />

        {/* ===== OBAVIJESTI (samo za polaznike) ===== */}
        {!isOrganizator && isPolaznik && (
          <section
            className="profile-card"
            style={{ gridColumn: "1 / -1", maxWidth: "100%" }}
          >
            <h3>Obavijesti</h3>
            <p style={{ marginTop: 0, color: "#666" }}>
              Pretplati se na obavijesti o novim radionicama i proizvodima.
            </p>

            <button
              className="primary"
              onClick={handleToggleNotifications}
              disabled={notifSaving}
              type="button"
              style={
                zeliObavijesti
                  ? {
                      background: "#fff",
                      color: "#000",
                      border: "1px solid #000",
                      padding: "8px 14px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                    }
                  : {
                      padding: "8px 14px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                    }
              }
            >
              {zeliObavijesti ? "Prestani dobivati obavijesti" : "Pretplati me na obavijesti"}
            </button>

            {!!notifMsg && <div className="helper-text">{notifMsg}</div>}
          </section>
        )}

        {/* ===== MOJE (isti UI, drugačiji naslov + data) ===== */}
        {(isPolaznik || isOrganizator) && (
          <>
            <div className="divider" />

            <div className="my-activity">
              <div className="my-activity-header">
                <p className="section-title">{headerTitle}</p>
                <p className="muted" style={{ margin: 0, padding: 0, border: "none" }}>
                  Klikni na stavku za odlazak na detalje.
                </p>
              </div>

              {myLoading && <div className="my-state">Učitavanje…</div>}
              {!myLoading && myError && <div className="my-state error">⚠ {myError}</div>}

              {!myLoading && !myError && (
                <div className="my-grid">
                  {/* RADIONICE */}
                  <div className="my-col">
                    <div className="my-col-title">Radionice</div>

                    <div className="my-subtitle">Nadolazeće</div>
                    <ul className="my-list">
                      {myUpcomingWorkshops.length === 0 ? (
                        <li className="my-empty">Nema nadolazećih radionica.</li>
                      ) : (
                        myUpcomingWorkshops.map((w) => {
                          const id = pickId(w);
                          return (
                            <li
                              key={`up-ws-${id}`}
                              className="my-item my-itemClickable"
                              role="button"
                              tabIndex={0}
                              onClick={() => id && navigate(ROUTES.workshopDetails(id))}
                              onKeyDown={(e) => {
                                if ((e.key === "Enter" || e.key === " ") && id) {
                                  e.preventDefault();
                                  navigate(ROUTES.workshopDetails(id));
                                }
                              }}
                            >
                              <div className="my-dot" />
                              <div className="my-info">
                                <div className="my-name">{pickTitle(w, "Radionica")}</div>
                                <div className="my-sub">{pickSubWorkshop(w)}</div>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>

                    <div className="my-subtitle">Prošle</div>
                    <ul className="my-list">
                      {myPastWorkshops.length === 0 ? (
                        <li className="my-empty">Nema prošlih radionica.</li>
                      ) : (
                        myPastWorkshops.map((w) => {
                          const id = pickId(w);
                          return (
                            <li
                              key={`past-ws-${id}`}
                              className="my-item my-itemClickable"
                              role="button"
                              tabIndex={0}
                              onClick={() => id && navigate(ROUTES.workshopDetails(id))}
                              onKeyDown={(e) => {
                                if ((e.key === "Enter" || e.key === " ") && id) {
                                  e.preventDefault();
                                  navigate(ROUTES.workshopDetails(id));
                                }
                              }}
                            >
                              <div className="my-dot my-dotPast" />
                              <div className="my-info">
                                <div className="my-name">{pickTitle(w, "Radionica")}</div>
                                <div className="my-sub">{pickSubWorkshop(w)}</div>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>

                  {/* IZLOŽBE */}
                  <div className="my-col">
                    <div className="my-col-title">Izložbe</div>

                    <div className="my-subtitle">Nadolazeće</div>
                    <ul className="my-list">
                      {myUpcomingExhibitions.length === 0 ? (
                        <li className="my-empty">Nema nadolazećih izložbi.</li>
                      ) : (
                        myUpcomingExhibitions.map((x) => {
                          const id = pickId(x);
                          return (
                            <li
                              key={`up-ex-${id}`}
                              className="my-item my-itemClickable"
                              role="button"
                              tabIndex={0}
                              onClick={() => id && navigate(ROUTES.exhibitionDetails(id))}
                              onKeyDown={(e) => {
                                if ((e.key === "Enter" || e.key === " ") && id) {
                                  e.preventDefault();
                                  navigate(ROUTES.exhibitionDetails(id));
                                }
                              }}
                            >
                              <div className="my-dot" />
                              <div className="my-info">
                                <div className="my-name">{pickTitle(x, "Izložba")}</div>
                                <div className="my-sub">{pickSubExh(x)}</div>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>

                    <div className="my-subtitle">Prošle</div>
                    <ul className="my-list">
                      {myPastExhibitions.length === 0 ? (
                        <li className="my-empty">Nema prošlih izložbi.</li>
                      ) : (
                        myPastExhibitions.map((x) => {
                          const id = pickId(x);
                          return (
                            <li
                              key={`past-ex-${id}`}
                              className="my-item my-itemClickable"
                              role="button"
                              tabIndex={0}
                              onClick={() => id && navigate(ROUTES.exhibitionDetails(id))}
                              onKeyDown={(e) => {
                                if ((e.key === "Enter" || e.key === " ") && id) {
                                  e.preventDefault();
                                  navigate(ROUTES.exhibitionDetails(id));
                                }
                              }}
                            >
                              <div className="my-dot my-dotPast" />
                              <div className="my-info">
                                <div className="my-name">{pickTitle(x, "Izložba")}</div>
                                <div className="my-sub">{pickSubExh(x)}</div>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>

                  {/* PROIZVODI */}
                  <div className="my-col">
                    <div className="my-col-title">Proizvodi</div>

                    {/* tabs samo kad ima smisla */}
                    <div className="my-tabs">
                      {isOrganizator ? (
                        <>
                          <button
                            type="button"
                            className={`my-tabBtn ${prodTab === "active" ? "active" : ""}`}
                            onClick={() => setProdTab("active")}
                          >
                            Aktivni
                          </button>
                          <button
                            type="button"
                            className={`my-tabBtn ${prodTab === "sold" ? "active" : ""}`}
                            onClick={() => setProdTab("sold")}
                          >
                            Prodani
                          </button>
                        </>
                      ) : isPolaznik ? (
                        <button type="button" className={`my-tabBtn active`} onClick={() => setProdTab("bought")}>
                          Kupljeni
                        </button>
                      ) : null}
                    </div>

                    {prodLoading && <div className="my-state" style={{ marginTop: 10 }}>Učitavanje proizvoda…</div>}
                    {!prodLoading && prodError && (
                      <div className="my-state error" style={{ marginTop: 10 }}>
                        ⚠ {prodError}
                      </div>
                    )}

                    {!prodLoading && !prodError && (
                      <>
                        {/* ORGANIZATOR: aktivni */}
                        {isOrganizator && prodTab === "active" && (
                          <ul className="my-list" style={{ marginTop: 10 }}>
                            {activeProducts.length === 0 ? (
                              <li className="my-empty">Nema aktivnih proizvoda.</li>
                            ) : (
                              activeProducts.map((p) => {
                                const id = pickId(p);
                                return (
                                  <li
                                    key={`act-p-${id}`}
                                    className="my-item my-itemClickable"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => id && navigate(ROUTES.productDetails(id))}
                                    onKeyDown={(e) => {
                                      if ((e.key === "Enter" || e.key === " ") && id) {
                                        e.preventDefault();
                                        navigate(ROUTES.productDetails(id));
                                      }
                                    }}
                                  >
                                    <div className="my-dot my-dotBuy" />
                                    <div className="my-info">
                                      <div className="my-name">{pickTitle(p, "Proizvod")}</div>
                                      <div className="my-sub">
                                        {p?.price != null ? formatMoneyEUR(p.price) : "—"}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        )}

                        {/* ORGANIZATOR: prodani */}
                        {isOrganizator && prodTab === "sold" && (
                          <ul className="my-list" style={{ marginTop: 10 }}>
                            {soldItems.length === 0 ? (
                              <li className="my-empty">Nema prodanih proizvoda.</li>
                            ) : (
                              soldItems.map((it, idx) => {
                                const pid = pickProductId(it);
                                const title = pickProductTitle(it);
                                const qty = pickProductQty(it);
                                const price = pickProductPrice(it);
                                return (
                                  <li
                                    key={`sold-${pid ?? idx}`}
                                    className="my-item my-itemClickable"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => pid && navigate(ROUTES.productDetails(pid))}
                                    onKeyDown={(e) => {
                                      if ((e.key === "Enter" || e.key === " ") && pid) {
                                        e.preventDefault();
                                        navigate(ROUTES.productDetails(pid));
                                      }
                                    }}
                                  >
                                    <div className="my-dot my-dotPast" />
                                    <div className="my-info">
                                      <div className="my-name">{title}</div>
                                      <div className="my-sub">
                                        {qty ? `Količina: ${qty}` : ""}
                                        {price != null ? ` • ${formatMoneyEUR(price)}` : ""}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        )}

                        {/* POLAZNIK: kupljeni */}
                        {isPolaznik && (
                          <ul className="my-list" style={{ marginTop: 10 }}>
                            {boughtItems.length === 0 ? (
                              <li className="my-empty">Nema kupljenih proizvoda.</li>
                            ) : (
                              boughtItems.map((it, idx) => {
                                const pid = pickProductId(it);
                                const title = pickProductTitle(it);
                                const qty = pickProductQty(it);
                                const price = pickProductPrice(it);
                                const reviewed = Boolean(it?.reviewed) || reviewDoneId === pid;
                                return (
                                  <li
                                    key={`buy-${pid ?? idx}`}
                                    className="my-item my-itemClickable"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => pid && navigate(ROUTES.productDetails(pid))}
                                    onKeyDown={(e) => {
                                      if ((e.key === "Enter" || e.key === " ") && pid) {
                                        e.preventDefault();
                                        navigate(ROUTES.productDetails(pid));
                                      }
                                    }}
                                  >
                                    <div className="my-dot my-dotBuy" />
                                    <div className="my-info">
                                      <div className="my-name">{title}</div>
                                      <div className="my-sub">
                                        {qty ? `Količina: ${qty}` : ""}
                                        {price != null ? ` • ${formatMoneyEUR(price)}` : ""}
                                      </div>
                                      <div
                                        style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                      >
                                        {!reviewed ? (
                                          <button
                                            type="button"
                                            className="my-tabBtn"
                                            style={{ padding: "6px 10px" }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleReview(pid);
                                            }}
                                          >
                                            {reviewOpenId === pid ? "Zatvori" : "Ostavi recenziju"}
                                          </button>
                                        ) : (
                                          <div className="my-sub" style={{ color: "#15803d", fontWeight: 600 }}>
                                            Recenzija je već ostavljena.
                                          </div>
                                        )}
                                      </div>

                                      {reviewOpenId === pid && !reviewed && (
                                        <form
                                          style={{ marginTop: 10 }}
                                          onClick={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => e.stopPropagation()}
                                          onSubmit={(e) => onSubmitProductReview(e, pid)}
                                        >
                                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <label className="my-sub" htmlFor={`rating-${pid}`}>Ocjena:</label>
                                            <select
                                              id={`rating-${pid}`}
                                              value={reviewRating}
                                              onChange={(e) => setReviewRating(Number(e.target.value))}
                                              onKeyDown={(e) => e.stopPropagation()}
                                            >
                                              {[5, 4, 3, 2, 1].map((v) => (
                                                <option key={v} value={v}>
                                                  {v}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <textarea
                                            className="edit-input"
                                            style={{ marginTop: 8 }}
                                            rows={3}
                                            placeholder="Napišite recenziju..."
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                          />

                                          {reviewError ? (
                                            <div className="my-sub" style={{ color: "#b91c1c", fontWeight: 600 }}>
                                              {reviewError}
                                            </div>
                                          ) : null}

                                          <div style={{ marginTop: 8 }}>
                                            <button
                                              type="submit"
                                              className="my-tabBtn active"
                                              disabled={reviewPosting}
                                            >
                                              {reviewPosting ? "Spremam..." : "Spremi recenziju"}
                                            </button>
                                          </div>
                                        </form>
                                      )}
                                    </div>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
