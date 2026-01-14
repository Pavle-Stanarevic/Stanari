import React, { useState } from "react";
import useAuth from "../hooks/useAuth.js";
import "../styles/profile.css";
import { Edit, Check, X } from "lucide-react";
import { updateProfile } from "../api/auth.js";

export default function Profile() {
  const { user, signIn } = useAuth();
        

  const [editingField, setEditingField] = useState(null); 
  const [tempValue, setTempValue] = useState("");
  const [error, setError] = useState("");

  const startEditing = (field, value) => {
    setEditingField(field);
    setTempValue(value ?? "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleSave = async () => {
    if (!editingField) return;
    setError("");

    const updatedUser = {
      ...user,
      [editingField]: tempValue, 
    };
    try {
      const saved = await updateProfile(user.id, { [editingField]: tempValue });
      signIn(saved);
      setEditingField(null);
    } catch (e) {
      setError(e?.message || "Neuspješno spremanje profila.");
    }
  };

  return (
    <div>
      <h1 className="naslov">Vaš profil</h1>

      <div className="container-profile">
        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
        <p className="label">Ime:</p>
        {editingField === "firstName" ? (
          <>
            <p className="value">
              <input
                className="edit-input"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            </p>
            <div className="actions">
              <Check className="icon save" onClick={handleSave} />
              <X className="icon cancel" onClick={cancelEditing} />
            </div>
          </>
        ) : (
          <>
            <p className="value">{user.firstName}</p>
            <Edit
              className="edit-icon"
              onClick={() => startEditing("firstName", user.firstName)}
            />
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
              />
            </p>
            <div className="actions">
              <Check className="icon save" onClick={handleSave} />
              <X className="icon cancel" onClick={cancelEditing} />
            </div>
          </>
        ) : (
          <>
            <p className="value">{user.lastName}</p>
            <Edit
              className="edit-icon"
              onClick={() => startEditing("lastName", user.lastName)}
            />
          </>
        )}
        <p className="label">Email:</p>
        {editingField === "email" ? (
          <>
            <p className="value">
              <input
                className="edit-input"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            </p>
            <div className="actions">
              <Check className="icon save" onClick={handleSave} />
              <X className="icon cancel" onClick={cancelEditing} />
            </div>
          </>
        ) : (
          <>
            <p className="value">{user.email}</p>
            <Edit
              className="edit-icon"
              onClick={() => startEditing("email", user.email)}
            />
          </>
        )}

        <p className="label">Kontakt:</p>
        {editingField === "contact" ? (
          <>
            <p className="value">
              <input
                className="edit-input"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            </p>
            <div className="actions">
              <Check className="icon save" onClick={handleSave} />
              <X className="icon cancel" onClick={cancelEditing} />
            </div>
          </>
        ) : (
          <>
            <p className="value">{user.contact}</p>
            <Edit
              className="edit-icon"
              onClick={() => startEditing("contact", user.contact)}
            />
          </>
        )}

        {user.userType === "organizator" && (
          <>
            <p className="label">Naziv studija:</p>
            {editingField === "studyName" ? (
              <>
                <p className="value">
                  <input
                    className="edit-input"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                  />
                </p>
                <div className="actions">
                  <Check className="icon save" onClick={handleSave} />
                  <X className="icon cancel" onClick={cancelEditing} />
                </div>
              </>
            ) : (
              <>
                <p className="value">{user.studyName}</p>
                <Edit
                  className="edit-icon"
                  onClick={() => startEditing("studyName", user.studyName)}
                />
              </>
            )}
            </>
        )}
      </div>
    </div>
  );
}
