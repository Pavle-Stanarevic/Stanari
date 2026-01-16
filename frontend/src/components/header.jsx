import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/header.css";
import logo from "../images/logo.png";

const NAV_ITEMS = [
  { label: "Rezervacije termina", to: "/pregledRadionica" },
  { label: "Shop", to: "/shop" },
  { label: "Izložbe", to: "/izlozbe" },
  { label: "Naš tim", to: "/tim" }
];

export default function Header() {
  const { isAuthenticated, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const isOrganizer =
    isAuthenticated && user?.userType === "organizator";

  const navItems = isOrganizer
    ? [...NAV_ITEMS, { label: "Pretplata", to: "/plan" }]
    : NAV_ITEMS;

  return (
    <header className="header">
      <div className="logo">
        <Link to="/" aria-label="Clay Play - Početna">
          <img src={logo} alt="Clay Play" className="logo-img" />
        </Link>
      </div>

      <div className="nav-container">
        <nav className="nav-links" aria-label="Main">
          {navItems.map(({ label, to }, i) => {
            const chars = label.split("");
            const totalDuration = 0.5;
            const perLetterDelay = 0.015;

            return (
              <Link to={to} key={i} className="nav-link">
                {chars.map((char, j) => (
                  <span
                    key={j}
                    style={{
                      animationDelay: `${j * perLetterDelay}s`,
                      animationDuration: `${totalDuration}s`,
                    }}
                    className="nav-char"
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </Link>
            );
          })}
        </nav>

        {/* DESNI DIO HEADERA */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* 🛒 KOŠARICA */}
          <Link to="/kosarica" className="sign-btn">
            Košarica
          </Link>

          {isAuthenticated && user ? (
            <>
              <Link to="/profile" className="sign-btn">
                {user.firstName}
              </Link>
              <button className="sign-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="sign-btn">
              Prijavi se
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
