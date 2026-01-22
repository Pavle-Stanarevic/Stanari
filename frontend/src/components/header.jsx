import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getCart } from "../api/cart";
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
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = async () => {
    try {
      const data = await getCart();
      const items = Array.isArray(data) ? data : data?.items || [];
      setCartCount(items.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onCartUpdated = (e) => {
      const items = e?.detail?.items;
      if (Array.isArray(items)) setCartCount(items.length);
      else refreshCartCount();
    };

    const onStorage = (e) => {
      if (e.key && e.key.startsWith("stanari_cart_v1:")) refreshCartCount();
    };

    window.addEventListener("cart:updated", onCartUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cart:updated", onCartUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const isOrganizer =
    isAuthenticated && user?.userType === "organizator";
  const organizerStatus = String(user?.organizerStatus || "").toUpperCase();
  const isApprovedOrganizer = isOrganizer && organizerStatus === "APPROVED";
  const isPendingOrganizer = isOrganizer && organizerStatus === "PENDING";
  const isRejectedOrganizer = isOrganizer && organizerStatus === "REJECTED";
  const isSubscribed = !!user?.isSubscribed;

  const navItems = isOrganizer
    ? [...NAV_ITEMS, { label: "Pretplata", to: "/plan" }]
    : NAV_ITEMS;

  return (
    <>
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
            {isAuthenticated && user && (
              <Link to="/kosarica" className="sign-btn">
                Košarica
                {cartCount > 0 && <span className="cart-indicator">{cartCount}</span>}
              </Link>
            )}

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

      {isPendingOrganizer ? (
        <div className="status-banner status-banner--pending">
          Čeka se odobrenje admina. Dok je profil na čekanju, ne možete objavljivati radionice,
          izložbe ni proizvode.
        </div>
      ) : null}

      {isRejectedOrganizer ? (
        <div className="status-banner status-banner--rejected">
          Vaš profil je odbijen. Kontaktirajte admina za dodatne informacije.
        </div>
      ) : null}

      {isApprovedOrganizer && !isSubscribed ? (
        <div className="status-banner status-banner--subscription">
          Za objavljivanje radionica, izložbi i proizvoda potrebna je aktivna pretplata.
        </div>
      ) : null}
    </>
  );
}
