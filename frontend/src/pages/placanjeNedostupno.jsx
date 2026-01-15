import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeNedostupno.css";

export default function PlacanjeNedostupno() {
  const navigate = useNavigate();
  const location = useLocation();

  const method = location.pathname.includes("paypal")
    ? "PayPal"
    : location.pathname.includes("applepay")
    ? "Apple Pay"
    : "Način plaćanja";

  const subtitle = useMemo(() => {
    if (method === "Apple Pay") {
      return "Apple Pay zahtijeva posebnu integraciju i podršku uređaja/preglednika.";
    }
    if (method === "PayPal") {
      return "PayPal se u pravilu radi preusmjeravanjem na PayPal (redirect).";
    }
    return "Ova opcija trenutno nije dostupna.";
  }, [method]);

  return (
    <div className="na-page">
      <div className="na-wrap">
        <div className="na-card">
          <h1 className="na-title">{method}</h1>
          <p className="na-text">
            Trenutno nedostupno.
            <br />
            {subtitle}
          </p>

          <div className="na-actions">
            <button className="na-btn" onClick={() => navigate("/placanje", { state: location.state })}>
              Povratak na odabir
            </button>
            <button className="na-btn ghost" onClick={() => navigate("/plan")}>
              Povratak na planove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
