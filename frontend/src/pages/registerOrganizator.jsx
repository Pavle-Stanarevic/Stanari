
import React, { useState } from "react";
import RegisterFormBase from "../components/registerFormBase.jsx";
import UserTypeSelect from "../components/userTypeSelect.jsx";
import { register, me } from "../api/auth.js";
import useAuth from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";



export default function RegisterOrganizator() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values, { image }) => {
    setLoading(true);
    try {
      const payload = { ...values, userType: "organizator" };
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
