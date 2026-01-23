import React, { useState } from "react";
import LoginForm from "../components/loginForm.jsx";
import "../styles/login.css";
import { login, me } from "../api/auth";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async ({ email, password }) => {
    setErr("");
    setLoading(true);

    try {
      // ✅ očisti stari session user (da ne ostane cache)
      sessionStorage.removeItem("user");

      // ✅ stvarno napravi login poziv
      const res = await login(email, password);

      // ✅ JWT login: backend vraća { user, token }
      if (res?.mode === "jwt") {
        const u = res?.data?.user;
        if (!u?.id) throw new Error("Login je uspio, ali backend nije vratio user objekt.");
        signIn(u);
        navigate("/");
        return;
      }

      // ✅ Session login (Spring / /login): dohvatimo trenutnog usera preko /api/auth/me
      const u = await me();
      if (!u) throw new Error("Ne mogu dohvatiti korisnika nakon prijave (me).");

      // Ako backend nekad vrati {user, token} i na /me, normaliziraj:
      signIn(u.user ?? u);

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
      <div className="login-wrapper" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LoginForm onSubmit={handleLogin} loading={loading} />

        <div style={{ alignSelf: "center" }}>
          <GoogleAuthButton
            mode="login"
            text="Prijavi se Google računom"
            onSuccess={(payload) => {
              // Google callback može vratiti user ili wrapper; normaliziraj
              const u = payload?.user ?? payload;
              if (u?.id) {
                sessionStorage.removeItem("user");
                signIn(u);
                navigate("/");
              } else {
                setErr("Google prijava nije vratila korisnika.");
              }
            }}
          />
        </div>

        <div className="error-space">{err && <p className="error">{err}</p>}</div>
      </div>
    </div>
  );
}
