import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/header.css";
import logo from "../images/logo.png";

const NAV_ITEMS = [
  { label: "Rezervacije Termina", to: "/rezervacije" },
  { label: "Shop", to: "/shop" },
  { label: "Izložbe", to: "/izlozbe" },
  { label: "Naš Tim", to: "/tim" },
];

export default function Header() {
  const { isAuthenticated, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();       // frontend-only call -> poziva /logout i čisti state
    window.location.href = "/";
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/" aria-label="Clay Play - Početna">
          <img src={logo} alt="Clay Play" className="logo-img" />
        </Link>
      </div>

      <div className="nav-container">
        <nav className="nav-links" aria-label="Main">
          {NAV_ITEMS.map(({ label, to }, i) => {
            const chars = label.split("");
            const totalDuration = 0.5;
            const perLetterDelay = totalDuration / chars.length;

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

        {isAuthenticated && user ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link to="/profile" className="sign-btn">
              {user.firstName || user.username || user.email || "Profile"}
            </Link>
            <button className="sign-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="sign-btn">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
