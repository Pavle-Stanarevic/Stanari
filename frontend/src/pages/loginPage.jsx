import React, { useState } from "react";
import LoginForm from "../components/loginForm.jsx";
import { login } from "../api/auth";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async ({ email, password }) => {
    setErr("");
    setLoading(true);
    try{
  const data = await login(email, password);
  signIn(data);
  navigate("/");
    } catch (e) {
      console.error(e);
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
