import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/header";
import LoginPage from "./pages/loginPage";
import LandingPage from "./pages/landingPage";
import RegisterOrganizator from "./pages/register-organizator.jsx";
import RegisterPolaznik from "./pages/register-polaznik.jsx";
import Profil from "./pages/profil.jsx";


export default function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LandingPage />} />
        <Route path="/register-organizator" element={<RegisterOrganizator />} />
        <Route path="/register-polaznik" element={<RegisterPolaznik />} />
        <Route path="/profile" element={<Profil />} />
      </Routes>
    </Router>
  );
}
