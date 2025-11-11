import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
<<<<<<< Updated upstream
import Header from "./components/header";
import LoginPage from "./pages/loginPage";
import LandingPage from "./pages/landingPage";
import RegisterOrganizator from "./pages/register-organizator.jsx";
import RegisterPolaznik from "./pages/register-polaznik.jsx";
=======
>>>>>>> Stashed changes

import Header from "./components/header";
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/loginPage";
import RegisterOrganizator from "./pages/registerOrganizator.jsx";
import RegisterPolaznik from "./pages/registerPolaznik.jsx";
import Profil from "./pages/profil.jsx";
import OrganizacijaRadionica from "./pages/organizacijaRadionica.jsx";
import PregledRadionica from "./pages/pregledRadionica.jsx";

export default function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
<<<<<<< Updated upstream
        <Route path="*" element={<LandingPage />} />
        <Route path="/register-organizator" element={<RegisterOrganizator />} />
        <Route path="/register-polaznik" element={<RegisterPolaznik />} />
=======
        <Route path="/registerOrganizator" element={<RegisterOrganizator />} />
        <Route path="/registerPolaznik" element={<RegisterPolaznik />} />
        <Route path="/profile" element={<Profil />} />
        <Route path="/organizacijaRadionica" element={<OrganizacijaRadionica />} />
        <Route path="/pregledRadionica" element={<PregledRadionica />} />

        <Route path="*" element={<LandingPage />} />
>>>>>>> Stashed changes
      </Routes>
    </Router>
  );
}
