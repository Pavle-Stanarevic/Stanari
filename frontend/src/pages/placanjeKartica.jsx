import { useMemo, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeKartica.css";
import { createStripeCheckoutSession, createPaymentIntent } from "../api/subscriptions";
import { createStripeCartCheckoutSession } from "../api/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/CheckoutForm";
import { AuthContext } from "../contexts/AuthContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly" ? "mjesečno" : billing === "yearly" ? "godišnje" : billing;
}

export default function PlacanjeKartica() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

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
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");

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
      if (!user) {
        throw new Error("Morate biti prijavljeni.");
      }

      const amount = mode === "cart" ? checkout?.total : subscription?.amount;

      const data = await createPaymentIntent({ 
        userId: user.id || user.idKorisnik,
        amount: Math.round(amount * 100),
        billing: mode === "cart" ? null : subscription?.billing
      });

      if (!data?.clientSecret) throw new Error("Backend nije vratio clientSecret.");
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.id);
    } catch (e) {
      setError(e?.message || "Ne mogu pokrenuti Stripe plaćanje.");
    } finally {
      setLoading(false);
    }
  }

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };

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
              Plaćanje preko Stripe-a. Narudžba: <strong>#{checkoutId}</strong> ({priceText})
            </>
          ) : (
            <>
              Plaćanje preko Stripe-a. Plan: <strong>{subscription.title}</strong>{" "}
              ({priceText})
            </>
          )}
        </div>

        {error ? <div className="cardpay-error">{error}</div> : null}

        {clientSecret ? (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm 
              clientSecret={clientSecret} 
              paymentIntentId={paymentIntentId}
              userId={user.id || user.idKorisnik}
              billing={mode === "cart" ? null : subscription?.billing}
              onCancel={() => setClientSecret("")} 
            />
          </Elements>
        ) : (
          <>
            <button className="cardpay-pay" type="button" onClick={goToStripe} disabled={loading}>
              {loading ? "Pokrećem..." : "Plati karticom"}
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
          </>
        )}
      </div>
    </div>
  );
}
