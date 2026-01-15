import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/header";
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/loginPage";
import RegisterOrganizator from "./pages/registerOrganizator.jsx";
import RegisterPolaznik from "./pages/registerPolaznik.jsx";
import Profile from "./pages/profile.jsx";
import OrganizacijaRadionica from "./pages/organizacijaRadionica.jsx";
import PregledRadionica from "./pages/pregledRadionica.jsx";
import Footer from "./components/footer.jsx";
import Plan from "./pages/plan.jsx";
import Placanje from "./pages/placanje.jsx";
import Shop from "./pages/shop.jsx";
import ProductPage from "./pages/productPage.jsx";

export default function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registerOrganizator" element={<RegisterOrganizator />} />
        <Route path="/registerPolaznik" element={<RegisterPolaznik />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/organizacijaRadionica" element={<OrganizacijaRadionica />} />
        <Route path="/pregledRadionica" element={<PregledRadionica />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:proizvodId" element={<ProductPage />} />
        

        <Route path="*" element={<LandingPage />} />
        <Route path="/placanje" element={<Placanje />} />
      </Routes>

      <Footer/>
    </Router>
  );
}
