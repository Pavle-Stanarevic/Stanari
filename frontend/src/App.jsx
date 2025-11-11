import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/header";
import LoginPage from "./pages/loginPage";
import LandingPage from "./pages/landingPage";
import RegisterOrganizator from "./pages/registerOrganizator.jsx";
import RegisterPolaznik from "./pages/registerPolaznik.jsx";
import Profile from "./pages/profile.jsx";


export default function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LandingPage />} />
        <Route path="/registerOrganizator" element={<RegisterOrganizator />} />
        <Route path="/register-polaznik" element={<RegisterPolaznik />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
