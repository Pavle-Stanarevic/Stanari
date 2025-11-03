import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";
import UserTypeSelect from "./userTypeSelect.jsx";

export default function RegisterForm({ onSubmit, loading = false }) {
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  return (
    <>
      <div>
        <UserTypeSelect value={values.userType} onChange={handleChange} />
      </div>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>Kreiraj račun</h2>

        <label>
          <input
            placeholder="Ime"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          <input
            placeholder="Prezime"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          <input
            placeholder="E-mail"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          <input
            placeholder="Zaporka"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Kreiram..." : "Registriraj se"}
        </button>

        <p className="login-redirect">
          Već imaš račun? <Link to="/login">Prijava</Link>
        </p>
      </form>
    </>
  );
}
