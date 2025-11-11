import React, { useState } from "react";
import LoginForm from "../components/loginForm.jsx";
import { login, me } from "../api/auth";
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
    try {
      console.log("Prijava - uneseni podaci:", { email, password });
      const res = await login(email, password);

      if (res.mode === "jwt") {
        const u = res.data?.user ?? { email };
        signIn(u);
        navigate("/");
        return;
      }

      const u = await me();
      signIn(u ?? { username: email });
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
        <div className="error-space">{err && <p className="error">{err}</p>}</div>
      </div>
    </div>
  );
}

