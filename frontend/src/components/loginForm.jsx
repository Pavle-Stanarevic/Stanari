import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";

export default function LoginForm({ onSubmit, loading = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form className="login-form" onSubmit={submit}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="Lozinka"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Prijava..." : "Prijavi se"}
      </button>
      <p>
        Nemaš račun?{" "}
        <Link to="/register-polaznik" className = "register-link">
          Registriraj se
        </Link>
      </p>
    </form>
  );
}
