// src/pages/register-polaznik.jsx
import React, { useState } from "react";
import RegisterFormBase from "../components/registerFormBase.jsx";
import UserTypeSelect from "../components/userTypeSelect.jsx";
import { register } from "../api/auth.js";

export default function RegisterPolaznik() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await register(values);
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <UserTypeSelect value="polaznik" onChange={() => {}} />
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
