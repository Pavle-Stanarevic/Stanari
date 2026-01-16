import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeKartica.css";
import { confirmStripeCheckout } from "../api/subscriptions";

export default function PlacanjeStripeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  const [msg, setMsg] = useState("Provjeravam status plaćanja…");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id"); // Stripe standard

    const raw = sessionStorage.getItem("clayplay_pending_payment");
    const pending = raw ? JSON.parse(raw) : null;

    const subscription = pending?.subscription || null;
    const subscriptionId = pending?.subscriptionId || null;

    async function run() {
      if (!sessionId) {
        setMsg("Nedostaje session_id. Plaćanje je možda otkazano.");
        return;
      }

      if (!subscriptionId || !subscription) {
        setMsg("Nema podataka o pretplati. Vratite se na planove.");
        return;
      }

      try {
        // Backend potvrdi session i aktivira pretplatu (ili vrati da je aktivna preko webhooka)
        const result = await confirmStripeCheckout({ sessionId, subscriptionId });

        sessionStorage.removeItem("clayplay_pending_payment");

        navigate("/placanje/uspjeh", {
          state: {
            subscription,
            status: result?.status || "active",
            startAt: result?.startAt,
            endAt: result?.endAt,
            demo: false,
            method: "card",
            provider: "stripe",
          },
        });
      } catch (e) {
        setMsg(e?.message || "Ne mogu potvrditi Stripe plaćanje. Pokušajte ponovno.");
      }
    }

    run();
  }, [location.search, navigate]);

  return (
    <div className="cardpay-page">
      <div className="cardpay-card">
        <h2 className="cardpay-title">{msg}</h2>
        <p className="cardpay-note">Ako se ništa ne dogodi, vratite se na planove.</p>

        <button className="cardpay-back" onClick={() => navigate("/plan")} style={{ marginTop: 12 }}>
          Povratak na planove
        </button>
      </div>
    </div>
  );
}
