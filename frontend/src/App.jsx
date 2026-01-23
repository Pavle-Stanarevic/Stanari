import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

import Header from "./components/header";
import Footer from "./components/footer.jsx";

import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/loginPage";
import RegisterOrganizator from "./pages/registerOrganizator.jsx";
import RegisterPolaznik from "./pages/registerPolaznik.jsx";
import Profile from "./pages/profile.jsx";
import OrganizacijaRadionica from "./pages/organizacijaRadionica.jsx";
import PregledRadionica from "./pages/pregledRadionica.jsx";
import Plan from "./pages/plan.jsx";
import Placanje from "./pages/placanje.jsx";
import Shop from "./pages/shop.jsx";
import ProductPage from "./pages/detaljiProizvoda.jsx";
import TimOrganizatora from "./pages/timOrganizatora.jsx";
import ProfilOrganizator from "./pages/profilOrganizator.jsx";
import PlacanjeKartica from "./pages/placanjeKartica.jsx";
import PlacanjePayPal from "./pages/placanjePayPal.jsx";
import PlacanjeStripeRedirect from "./pages/placanjeStripeRedirect.jsx";
import PlacanjeUspjeh from "./pages/placanjeUspjeh.jsx";
import DetaljiRadionice from "./pages/detaljiRadionice";
import Kosarica from "./pages/kosarica";
import Izlozbe from "./pages/izlozbe.jsx";
import DetaljiIzlozbe from "./pages/detaljiIzlozbe.jsx";
import AdminDashboard from "./pages/adminDashboard.jsx";

function AdminRoute({ children }) {
  const { user } = useAuth();
  const role = user?.role ?? user?.user?.role ?? null;
  if (role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  console.log("[DEBUG_LOG] App component mounting. Version: 2026-01-21-19:40");
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
        <Route path="/radionica/:id" element={<DetaljiRadionice />} />

        <Route path="/plan" element={<Plan />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:proizvodId" element={<ProductPage />} />
        <Route path="/kosarica" element={<Kosarica />} />

        <Route path="/tim" element={<TimOrganizatora />} />
        <Route path="/tim/:organizatorId" element={<ProfilOrganizator />} />

        <Route path="/izlozbe" element={<Izlozbe />} />
        <Route path="/izlozbe/:id" element={<DetaljiIzlozbe />} />
        
        <Route path="*" element={<LandingPage />} />

        <Route path="/placanje" element={<Placanje />} />
        <Route path="/placanje/kartica" element={<PlacanjeKartica />} />
        <Route path="/placanje/paypal" element={<PlacanjePayPal />} />
        <Route path="/placanje/stripe-redirect" element={<PlacanjeStripeRedirect />} />
        <Route path="/placanje-uspjeh" element={<PlacanjeUspjeh />} />
        <Route path="/placanje/uspjeh" element={<PlacanjeUspjeh />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/adimn" element={<Navigate to="/" replace />} />

      </Routes>

      <Footer />
    </Router>
  );
}
