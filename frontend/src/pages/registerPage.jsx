import React, { useState } from "react";
import RegisterForm from "../components/registerForm.jsx";
// import { register } from "../api/auth";
// import useAuth from "../hooks/useAuth";
// import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  // const { signIn } = useAuth();
  // const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (values) => {
    setErr("");
    setLoading(true);

    // ✅ VALIDACIJA OVDJE (isti pattern kao login)
    if (!values.userType) {
      setLoading(false);
      setErr("Odaberi vrstu korisnika.");
      return;
    }
    if (!values.email || !values.password) {
      setLoading(false);
      setErr("Molimo unesite e-mail i lozinku.");
      return;
    }
    if (values.password !== values.confirmPassword) {
      setLoading(false);
      setErr("Lozinke se ne podudaraju.");
      return;
    }

    try {
      // const data = await register(values);
      // signIn?.(data);
      // navigate("/", { replace: true });
      console.log("submit:", values);
    } catch (e) {
      setErr("Neuspješna registracija. Provjeri podatke.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <RegisterForm onSubmit={handleSubmit} loading={loading} />
        <div className="error-space">{err && <p className="error">{err}</p>}</div>
      </div>
    </div>
  );
}
