
import React, { useState } from "react";
import RegisterFormBase from "../components/registerFormBase.jsx";
import UserTypeSelect from "../components/userTypeSelect.jsx";
import { register } from "../api/auth.js";
import useAuth from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

export default function RegisterPolaznik() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (values, { image }) => {
    try {
      const payload = { ...values, userType: "polaznik" };
      await register(payload, image || null);
      signIn({
        ...payload,
        username: payload.email
      });
      navigate("/");
    } catch (e) {
      console.error("Registration error:", e);
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
