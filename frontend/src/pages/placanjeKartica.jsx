import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeKartica.css";
import { createStripeCheckoutSession } from "../api/subscriptions";

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly" ? "mjesečno" : billing === "yearly" ? "godišnje" : billing;
}

export default function PlacanjeKartica() {
  const navigate = useNavigate();
  const location = useLocation();

  const subscription = location.state?.subscription || null;
  const subscriptionId =
    location.state?.subscriptionId ||
    subscription?.subscriptionId ||
    subscription?.id ||
    null;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const priceText = useMemo(() => {
    if (!subscription) return "";
    const amount = Number(subscription.amount || 0).toFixed(2);
    return `€${amount}/${formatBilling(subscription.billing)}`;
  }, [subscription]);

  async function goToStripe() {
    setError("");

    if (!subscriptionId || !subscription) {
      setError("Nema podataka o pretplati. Vratite se na planove.");
      return;
    }

    setLoading(true);
    try {
      // spremimo u sessionStorage (treba redirect page-u)
      sessionStorage.setItem(
        "clayplay_pending_payment",
        JSON.stringify({
          subscriptionId,
          subscription,
          paymentMethod: "card",
        })
      );

      const data = await createStripeCheckoutSession({
        subscriptionId,
        billing: subscription.billing,
      });

      if (!data?.url) throw new Error("Backend nije vratio Stripe URL.");

      window.location.href = data.url;
    } catch (e) {
      setError(e?.message || "Ne mogu pokrenuti Stripe checkout.");
      setLoading(false);
    }
  }

  if (!subscriptionId || !subscription) {
    return (
      <div className="cardpay-page">
        <div className="cardpay-card">
          <h2 className="cardpay-title">Nema podataka o pretplati</h2>
          <p className="cardpay-note">Vratite se na planove i ponovno odaberite pretplatu.</p>
          <button className="cardpay-back" onClick={() => navigate("/plan")}>
            Povratak na planove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cardpay-page">
      <div className="cardpay-card">
        <h2 className="cardpay-title">Plaćanje karticom (Stripe TEST)</h2>

        <div className="cardpay-disclaimer">
          Plaćanje se izvršava preko Stripe checkouta (vanjski servis). Trenutni plan:{" "}
          <strong>{subscription.title}</strong> ({priceText})
        </div>

        {error ? <div className="cardpay-error">{error}</div> : null}

        <button className="cardpay-pay" type="button" onClick={goToStripe} disabled={loading}>
          {loading ? "Preusmjeravam..." : "Nastavi na Stripe"}
        </button>

        <button
          className="cardpay-back"
          type="button"
          onClick={() =>
            navigate("/placanje", {
              state: { subscriptionId, subscription },
            })
          }
          style={{ marginTop: 12 }}
          disabled={loading}
        >
          Povratak
        </button>
      </div>
    </div>
  );
}
