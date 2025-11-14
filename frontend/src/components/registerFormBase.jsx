import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";
import { Upload, X } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton.jsx";

const MAX_SIZE_MB = 5;

export default function RegisterFormBase({
  title = "Kreiraj račun",
  loading = false,
  defaultUserType = "",
  onSubmit,
  renderExtra = null,
}) {
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    address: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: defaultUserType,
    studyName: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imgError, setImgError] = useState("");

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgError("");
    if (!file.type.startsWith("image/")) {
      setImgError("Dozvoljene su samo slike (JPG, PNG, WEBP...).");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setImgError(`Maksimalna veličina slike je ${MAX_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeImage = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setImgError("");
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(values, { image });
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>

      <div style={{ marginBottom: 12 }}>
        <GoogleAuthButton
          mode="prefill"
          text="Popuni iz Google računa"
          size="large"
          onPrefill={({ firstName, lastName, email }) => {
            setValues(v => ({
              ...v,
              firstName: firstName || v.firstName,
              lastName: lastName || v.lastName,
              email: email || v.email,
            }));
          }}
        />
      </div>

      <div className="register-form">
        <input
          placeholder="Ime"
          name="firstName"
          type="text"
          value={values.firstName}
          onChange={handleChange}
          required
        />
        <input
          placeholder="Prezime"
          name="lastName"
          type="text"
          value={values.lastName}
          onChange={handleChange}
          required
        />
        <input
          placeholder="Adresa"
          name="address"
          type="text"
          value={values.address}
          onChange={handleChange}
          required
        />
        <input
          placeholder="Kontakt"
          name="contact"
          type="tel"
          value={values.contact}
          onChange={handleChange}
          required
        />
      </div>

      {typeof renderExtra === "function" ? renderExtra({ values, handleChange }) : null}

      <div>
        <input
          placeholder="E-mail"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="register-form">
        <input
          placeholder="Lozinka"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          required
        />
        <input
          placeholder="Ponovite lozinku"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-right">
        <label>Priložite fotografiju ili logo</label>

        <input
          id="singleImageInput"
          type="file"
          accept="image/*"
          onChange={handleImage}
          style={{ display: "none" }}
        />

        <label htmlFor="singleImageInput" className="file-upload">
          <div className="file-upload-area">
            <Upload size={20} />
            {!image ? (
              <>
                <span>Povuci i ispusti ili klikni za odabir</span>
                <small>Podržano: JPG, PNG, WEBP (max {MAX_SIZE_MB} MB)</small>
              </>
            ) : (
              <span>{image.name}</span>
            )}
          </div>
        </label>

        {imgError && <div className="upload-error">{imgError}</div>}

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Pregled slike" />
            <button type="button" onClick={removeImage}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Kreiram..." : "Registriraj se"}
      </button>

      <p className="login-redirect">
        Već imaš račun? <Link to="/login">Prijava</Link>
      </p>
    </form>
  );
}
