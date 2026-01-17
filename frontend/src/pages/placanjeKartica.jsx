import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeKartica.css";
import { createStripeCheckoutSession } from "../api/subscriptions";
import { createStripeCartCheckoutSession } from "../api/checkout";

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly" ? "mjesečno" : billing === "yearly" ? "godišnje" : billing;
}

export default function PlacanjeKartica() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.state?.mode || "subscription";

  const subscription = location.state?.subscription || null;
  const subscriptionId =
    location.state?.subscriptionId ||
    subscription?.subscriptionId ||
    subscription?.id ||
    null;

  const checkout = location.state?.checkout || null;
  const checkoutId = location.state?.checkoutId || checkout?.checkoutId || null;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const titleText =
    mode === "cart" ? "Plaćanje karticom (Narudžba)" : "Plaćanje karticom (Pretplata)";

  const priceText = useMemo(() => {
    if (mode === "cart") {
      const total = Number(checkout?.total || 0).toFixed(2);
      return `€${total}`;
    }
    if (!subscription) return "";
    const amount = Number(subscription.amount || 0).toFixed(2);
    return `€${amount}/${formatBilling(subscription.billing)}`;
  }, [mode, subscription, checkout]);

  async function goToStripe() {
    setError("");
    setLoading(true);

    try {
      if (mode === "cart") {
        if (!checkoutId) throw new Error("Nema checkoutId. Vratite se na košaricu.");

        sessionStorage.setItem(
          "clayplay_pending_payment",
          JSON.stringify({ mode: "cart", checkoutId, checkout, paymentMethod: "card" })
        );

        const data = await createStripeCartCheckoutSession({ checkoutId });
        if (!data?.url) throw new Error("Backend nije vratio Stripe URL.");
        window.location.href = data.url;
        return;
      }

      if (!subscriptionId || !subscription) {
        throw new Error("Nema podataka o pretplati. Vratite se na planove.");
      }

      sessionStorage.setItem(
        "clayplay_pending_payment",
        JSON.stringify({ mode: "subscription", subscriptionId, subscription, paymentMethod: "card" })
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

  if (mode === "cart" && !checkoutId) {
    return (
      <div className="cardpay-page">
        <div className="cardpay-card">
          <h2 className="cardpay-title">Nema podataka o narudžbi</h2>
          <p className="cardpay-note">Vratite se na košaricu i ponovno pokrenite naplatu.</p>
          <button className="cardpay-back" onClick={() => navigate("/kosarica")}>
            Povratak na košaricu
          </button>
        </div>
      </div>
    );
  }

  if (mode !== "cart" && (!subscriptionId || !subscription)) {
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
        <h2 className="cardpay-title">{titleText}</h2>

        <div className="cardpay-disclaimer">
          {mode === "cart" ? (
            <>
              Plaćanje preko Stripe checkouta. Checkout: <strong>#{checkoutId}</strong> ({priceText})
            </>
          ) : (
            <>
              Plaćanje preko Stripe checkouta. Plan: <strong>{subscription.title}</strong>{" "}
              ({priceText})
            </>
          )}
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
              state:
                mode === "cart"
                  ? { mode: "cart", checkoutId, checkout }
                  : { mode: "subscription", subscriptionId, subscription },
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
