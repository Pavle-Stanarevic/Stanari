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
  const auth = useAuth();

  return (
    <header className="header">
      {/* Logo */}
      <div className="logo">
        <Link to="/" aria-label="Clay Play - Početna">
          <img src={logo} alt="Clay Play" className="logo-img" />
        </Link>
      </div>

      {/* Navigacija + Sign in */}
      <div className="nav-container">
        <nav className="nav-links" aria-label="Main">
          {NAV_ITEMS.map(({ label, to }, i) => {
            const chars = label.split("");
            const totalDuration = 0.5; // ukupno trajanje animacije
            const perLetterDelay = totalDuration / chars.length; // proporcionalno broju slova

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

        {/* Sign in -> /login or show user name when authenticated */}
        {auth?.isAuthenticated && auth.user ? (
          <Link to="/profile" className="sign-btn">
            {auth.user.firstName || auth.user.email || "Profile"}
          </Link>
        ) : (
          <Link to="/login" className="sign-btn">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
