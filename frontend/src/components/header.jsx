import React from "react";
import "../styles/header.css";
import logo from "../images/logo.png";

export default function Header() {
  return (
    <header className="header">
  <div className="logo">
    <img src={logo} alt="Clay Play" className="logo-img" />
  </div>

  <div className="nav-container">
    <nav className="nav-links">
        {["Rezervacije Termina", "Shop", "Izložbe", "Naš Tim"].map((word, i) => (
            <a href="#" key={i}>
                {word.split("").map((char, j) => (
                   <span
                        key={j}
                        style={{ animationDelay: `${j * 0.05}s` }} // ⏳ svako slovo malo kasni
                    >
                        {char === " " ? "\u00A0" : char}
                   </span>
                ))}
            </a>
        ))}
    </nav>

    <button className="sign-btn">Sign in</button>
  </div>
</header>

  );
}
