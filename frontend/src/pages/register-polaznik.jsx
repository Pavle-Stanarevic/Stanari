// src/pages/register-polaznik.jsx
import React from "react";
import RegisterFormBase from "../components/registerFormBase.jsx";
import UserTypeSelect from "../components/userTypeSelect.jsx";

export default function RegisterPolaznik({ onSubmit, loading = false }) {
  return (
    <div className="register-page">
      <div className="register-box">
        <UserTypeSelect value="polaznik" onChange={() => {}} />
        <RegisterFormBase
          title="Kreiraj račun"
          defaultUserType="polaznik"
          loading={loading}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
