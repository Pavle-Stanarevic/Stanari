import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/header";
import LoginPage from "./pages/loginPage";
import RegisterPage from "./pages/registerPage";
import LandingPage from "./pages/landingPage";

export default function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-polaznik" element={<RegisterPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
