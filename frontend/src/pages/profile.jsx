import React, { useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth.js";
import "../styles/profile.css";
import { Edit, Check, X } from "lucide-react";
import { updateProfile, me } from "../api/auth.js";

const ALLOWED_FIELDS = new Set([
  "firstName",
  "lastName",
  "email",
  "contact",
  "studyName",
]);

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default function Profile() {
  const { user, signIn } = useAuth();

  // lokalna kopija samo za prikaz (UI ostaje isti, ali spremanje ide na backend)
  const [localUser, setLocalUser] = useState(user || null);

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalUser(user || null);
  }, [user]);

  const safeUser = useMemo(() => localUser || user, [localUser, user]);

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

    // FE validacije (backend neka bude glavni sudac)
    if (editingField === "email" && !isValidEmail(valueTrimmed)) {
      setError("Unesite ispravan email.");
      return;
    }
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
      // šaljemo samo polje koje se mijenja
      const patch = { [editingField]: valueTrimmed };

      // ✅ backend PUT /api/users/:id (preko tvog putJsonWithCsrf)
      const saved = await updateProfile(safeUser.id, patch);

      // Ako backend vraća updated user -> ovo je dovoljno
      if (saved && Object.keys(saved).length > 0) {
        signIn(saved);
        setLocalUser(saved);
      } else {
        // fallback: ako backend ne vrati user, refreshaj preko /api/auth/me
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

  return (
    <div>
      <h1 className="naslov">Vaš profil</h1>

      <div className="container-profile">
        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

        {/* Ime */}
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

        {/* Prezime */}
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

        {/* Email */}
        <p className="label">Email:</p>
        {editingField === "email" ? (
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
            <p className="value">{safeUser.email}</p>
            <Edit className="edit-icon" onClick={() => startEditing("email", safeUser.email)} />
          </>
        )}

        {/* Kontakt */}
        <p className="label">Kontakt:</p>
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

        {/* Naziv studija samo za organizatora */}
        {safeUser.userType === "organizator" && (
          <>
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
      </div>
    </div>
  );
}
