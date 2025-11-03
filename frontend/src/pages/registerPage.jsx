import React, { useState } from "react";
import { Link } from "react-router-dom";
import RegisterForm from "../components/registerForm.jsx";
// import { register } from "../api/auth"; // uključi kad spojiš backend
// import useAuth from "../hooks/useAuth";

export default function RegisterPage() {
  // const { signIn } = useAuth(); // ako želiš auto-login nakon registracije
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (values) => {
    // values: { firstName, lastName, email, password }
    setErr("");
    setLoading(true);
    try {
      // const data = await register(values);
      // signIn(data); // opcionalno
      // navigate("/", { replace: true });
      console.log("submit:", values); // za sada samo provjera
    } catch (e) {
      setErr("Neuspješna registracija. Provjeri podatke.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">

        {err && <div className="error-banner">{err}</div>}

        <RegisterForm onSubmit={handleSubmit} loading={loading} />

      </div>
    </div>
  );
}
