import React, { useMemo, useState } from "react";
import RegisterFormBase from "../components/registerFormBase.jsx";
import UserTypeSelect from "../components/userTypeSelect.jsx";
import "../styles/login.css";
import { register, me } from "../api/auth.js";
import useAuth from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

function isEmpty(v) {
  return v == null || String(v).trim() === "";
}

function buildMissingMessage(missingKeys, labels) {
  if (!missingKeys.length) return "";
  const names = missingKeys.map((k) => labels[k] || k);
  return `Nedostaju obavezna polja: ${names.join(", ")}.`;
}

export default function RegisterPolaznik() {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // obavezna polja za polaznika (usklađuj ako ti se key-evi razlikuju u RegisterFormBase)
  const requiredKeys = useMemo(() => ["firstName", "lastName", "contact", "email", "password"], []);

  const labels = useMemo(
    () => ({
      firstName: "ime",
      lastName: "prezime",
      contact: "kontakt",
      email: "e-mail",
      password: "lozinka",
    }),
    []
  );

  const handleSubmit = async (values, { image }) => {
    setFormError("");

    const missing = requiredKeys.filter((k) => isEmpty(values?.[k]));
    if (missing.length) {
      setFormError(buildMissingMessage(missing, labels));
      return;
    }

    setLoading(true);
    try {
      const payload = { ...values, userType: "polaznik" };

      const resp = await register(payload, image || null);
      const user = resp?.user || resp?.data?.user || null;

      if (user) {
        signIn(user);
      } else {
        const u = await me();
        if (u) signIn(u);
      }

      navigate("/");
    } catch (e) {
      console.error("Registration error:", e);
      setFormError(e?.message || "Registracija nije uspjela. Pokušajte ponovno.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <UserTypeSelect value="polaznik" onChange={() => {}} />

        {!!formError && <div className="error">{formError}</div>}

        <RegisterFormBase
          title="Kreiraj račun"
          defaultUserType="polaznik"
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
