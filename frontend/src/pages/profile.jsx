import React, { useState } from "react";
import useAuth from "../hooks/useAuth.js";
import "../styles/profile.css";
import { Edit, Check, X } from "lucide-react";

export default function Profile() {
  const { user, signIn } = useAuth();              

  const [editingField, setEditingField] = useState(null); 
  const [tempValue, setTempValue] = useState("");

  const startEditing = (field, value) => {
    setEditingField(field);
    setTempValue(value ?? "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleSave = () => {
    if (!editingField) return;

    const updatedUser = {
      ...user,
      [editingField]: tempValue, 
    };

    signIn(updatedUser); 
    setTempValue("");
  };

  return (
    <div>
      <h1 className="naslov">Vaš profil</h1>

      <div className="container-profile">
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
            <p className="value">{user.studyName}</p>
            <Edit
              className="edit-icon"
              onClick={() => startEditing("studyName", user.studyName)}
            />
          </>
        )}
      </div>
    </div>
  );
}
