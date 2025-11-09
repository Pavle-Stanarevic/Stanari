/*
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
  */

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
        // stari model: backend je vratio JSON (npr. { token, user })
        const u = res.data?.user ?? { email };
        signIn(u);
        navigate("/");
        return;
      }

      // session model: probaj /me; ako ga nema, setaj minimalnog usera
      const u = await me();
      signIn(u ?? { username: email });
      navigate("/");
    } catch (e) {
      console.error(e);
      setErr("Neuspješna prijava. Provjeri podatke.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="login-page">
      <div className="login-wrapper">
        <LoginForm onSubmit={handleLogin} loading={loading} />
        <div className="error-space">{err && <p className="error">{err}</p>}</div>
      </div>
    </div>
  );
}

export async function registerOrganizator(data) {
  return postJsonWithCsrf(`/api/auth/register-organizator`, data);
}

export async function registerPolaznik(data) {
  return postJsonWithCsrf(`/api/auth/register-polaznik`, data);
}

