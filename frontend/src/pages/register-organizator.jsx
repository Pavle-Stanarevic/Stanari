// src/pages/register-organizator.jsx
import React, { useState } from "react";
import RegisterFormBase from "../components/registerFormBase.jsx";
import UserTypeSelect from "../components/userTypeSelect.jsx";
import { register } from "../api/auth.js";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";



export default function RegisterOrganizator() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = await register(values);
      signIn(data);
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <UserTypeSelect value="organizator" onChange={() => {}} />
        <RegisterFormBase
          title="Kreiraj račun (Organizator)"
          defaultUserType="organizator"
          loading={loading}
          onSubmit={handleSubmit}
          renderExtra={({ values, handleChange }) => (
            <div>
              <input
                placeholder="Naziv studija"
                name="studyName"
                type="text"
                value={values.studyName}
                onChange={handleChange}
                required
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}
