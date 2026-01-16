import React, { useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth.js";
import "../styles/profile.css";
import { Edit, Check, X } from "lucide-react";
import { updateProfile, me } from "../api/auth.js";
import { listWorkshops } from "../api/workshops.js";

const API = import.meta.env.VITE_API_URL;

function getCookie(name = "XSRF-TOKEN") {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

const ALLOWED_FIELDS = new Set([
  "firstName",
  "lastName",
  "contact",
  "studyName",
  "address",
]);

function isStrongEnoughPassword(pw) {
  const v = String(pw || "");
  return v.length >= 8;
}

export default function Profile() {
  const { user, signIn } = useAuth();

  const [localUser, setLocalUser] = useState(user || null);

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // slika profila
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // promjena lozinke
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwRepeat, setPwRepeat] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  // radionice
  const [workshops, setWorkshops] = useState([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsError, setWsError] = useState("");

  useEffect(() => {
    setLocalUser(user || null);
  }, [user]);

  const safeUser = useMemo(() => localUser || user, [localUser, user]);
  const isOrganizator = safeUser?.userType === "organizator";

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

  // ✅ dohvat radionica: uzmi SVE pa filtriraj po organizerId (radi i ako backend ignorira query)
  useEffect(() => {
    const load = async () => {
      if (!safeUser?.id || !isOrganizator) return;

      setWsError("");
      setWsLoading(true);

      try {
        const data = await listWorkshops(); // GET /api/workshops

        const all = Array.isArray(data) ? data : data?.items || [];

        const mine = all.filter(
          (w) => String(w?.organizerId) === String(safeUser.id)
        );

        setWorkshops(mine);
      } catch (e) {
        setWsError(e?.message || "Ne mogu dohvatiti radionice.");
      } finally {
        setWsLoading(false);
      }
    };

    load();
  }, [safeUser?.id, isOrganizator]);

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

    const valueTrimmed =
      typeof tempValue === "string" ? tempValue.trim() : tempValue;

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

      if (updated && Object.keys(updated).length > 0) {
        signIn(updated);
        setLocalUser(updated);
      } else {
        const refreshed = await me();
        if (refreshed) {
          signIn(refreshed);
          setLocalUser(refreshed);
        }
      }

      setImageFile(null);
      setImagePreview("");
    } catch (e) {
      setError(e?.message || "Neuspješno spremanje slike.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async () => {
    if (!safeUser?.id) {
      setPwMsg("Niste prijavljeni ili nedostaje ID korisnika.");
      return;
    }

    setPwMsg("");

    if (!pwCurrent || !pwNew || !pwRepeat) {
      setPwMsg("Popunite sva polja za lozinku.");
      return;
    }
    if (pwNew !== pwRepeat) {
      setPwMsg("Nova lozinka i potvrda se ne podudaraju.");
      return;
    }
    if (!isStrongEnoughPassword(pwNew)) {
      setPwMsg("Nova lozinka mora imati barem 8 znakova.");
      return;
    }

    setPwSaving(true);

    try {
      const csrf = getCookie();
      const res = await fetch(`${API}/api/users/${safeUser.id}/password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
        },
        body: JSON.stringify({
          currentPassword: pwCurrent,
          newPassword: pwNew,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }

      setPwMsg("Lozinka je uspješno promijenjena.");
      setPwCurrent("");
      setPwNew("");
      setPwRepeat("");
    } catch (e) {
      setPwMsg(e?.message || "Neuspješna promjena lozinke.");
    } finally {
      setPwSaving(false);
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

  const displayName = `${safeUser.firstName || ""} ${safeUser.lastName || ""}`.trim();

  return (
    <div>
      <h1 className="naslov">Vaš profil</h1>

      <div className="container-profile">
        {error && (
          <p className="error" style={{ marginBottom: 12, gridColumn: "1 / -1" }}>
            {error}
          </p>
        )}

        <div className="profile-avatar">
          <div className="avatar-img">
            <img
              src={
                imagePreview ||
                safeUser.imageUrl ||
                safeUser.photoUrl ||
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
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
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

        <p className="label">Ime:</p>
        {editingField === "firstName" ? (
          <>
            <p className="value">
              <input
                className="edit-input"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                disabled={saving}
              />
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
              <input
                className="edit-input"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                disabled={saving}
              />
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
              <input
                className="edit-input"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                disabled={saving}
              />
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
                  <input
                    className="edit-input"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={saving}
                    placeholder="Unesite adresu"
                  />
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
                  <input
                    className="edit-input"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    disabled={saving}
                  />
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

        <div className="password-box">
          <p className="section-title">Promjena lozinke</p>

          <label className="pw-label">Trenutna lozinka</label>
          <input
            className="edit-input"
            type="password"
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
            disabled={pwSaving}
          />

          <label className="pw-label">Nova lozinka</label>
          <input
            className="edit-input"
            type="password"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            disabled={pwSaving}
          />

          <label className="pw-label">Ponovi novu lozinku</label>
          <input
            className="edit-input"
            type="password"
            value={pwRepeat}
            onChange={(e) => setPwRepeat(e.target.value)}
            disabled={pwSaving}
          />

          <button className="btn-primary" type="button" onClick={handleChangePassword} disabled={pwSaving}>
            {pwSaving ? "Spremanje..." : "Promijeni lozinku"}
          </button>

          {pwMsg && <p className={pwMsg.includes("uspješno") ? "success" : "error"}>{pwMsg}</p>}
        </div>

        {isOrganizator && (
          <>
            <div className="divider" />
            <div className="workshops-box">
              <p className="section-title">Radionice organizatora: {displayName || "Organizator"}</p>

              {wsLoading && <p className="muted">Učitavanje radionica...</p>}
              {wsError && <p className="error">{wsError}</p>}

              {!wsLoading && !wsError && (
                <ul className="workshops-list">
                  {workshops.length === 0 ? (
                    <li className="muted">Nema radionica za prikaz.</li>
                  ) : (
                    workshops.map((w) => (
                      <li key={w.id || w.workshopId || w._id} className="workshop-item">
                        <div className="workshop-title">{w.title || w.name || "Radionica"}</div>
                        <div className="workshop-meta">
                          {w.startDateTime ? (
                            <span>{String(w.startDateTime).slice(0, 10)}</span>
                          ) : (
                            <span className="muted">Bez datuma</span>
                          )}
                          {w.location ? <span> • {w.location}</span> : null}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}

              <p className="hint">
                (Frontend filtrira po <code>organizerId === user.id</code>)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
