import React, { useState } from "react";
import LoginForm from "../components/LoginForm";
import { login } from "../api/auth";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async ({ email, password }) => {
    setErr("");
    setLoading(true);
    try{
      const data = await login(email, password);
      signIn(data);
    } catch (e) {
      setErr("Neuspješna prijava. Provjeri podatke.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="login-page">
    <div className="login-wrapper">
      <LoginForm onSubmit={handleLogin} loading={loading} />
      <div className="error-space">
        {err && <p className="error">{err}</p>}
      </div>
    </div>
  </div>
);

}
