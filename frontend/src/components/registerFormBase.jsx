
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";
import { Upload } from "lucide-react";

export default function RegisterFormBase({
  title = "Kreiraj račun",
  loading = false,
  defaultUserType = "",
  onSubmit,
  renderExtra = null, // npr. dodatni input za organizatora
}) {
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    address: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: defaultUserType, // "polaznik" ili "organizator"
    studyName: "",             // koristi samo organizator
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Registracija - uneseni podaci:", values);
    onSubmit?.(values);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>

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

      <div className="upload">
        <p>**Priložite fotografiju ili logo</p>
        <Upload className="upload-icon" size={18} />
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
