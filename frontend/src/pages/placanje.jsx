import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanje.css";

import cardIcon from "../assets/images/credit-card.svg";
import paypalIcon from "../assets/images/pay-pal.png";
import applePayIcon from "../assets/images/apple-pay.png";

const DEV_FALLBACK = true;

const DEV_SUBSCRIPTION = {
  title: "Basic (placeholder)",
  amount: 9.99,
  billing: "monthly",
};

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly"
    ? "mjesečno"
    : billing === "yearly"
    ? "godišnje"
    : billing;
}

export default function Placanje() {
  const navigate = useNavigate();
  const location = useLocation();

  const subscriptionId = location.state?.subscriptionId;

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    if (!subscriptionId) {
      if (DEV_FALLBACK) {
        setSubscription(DEV_SUBSCRIPTION);
        setLoading(false);
        return;
      }
      navigate("/plan");
      return;
    }

    async function loadSubscription() {
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}`);
        if (!res.ok) throw new Error("Ne mogu dohvatiti pretplatu.");
        const data = await res.json();
        setSubscription(data);
      } catch (e) {
        if (DEV_FALLBACK) {
          setSubscription(DEV_SUBSCRIPTION);
        } else {
          setError(e.message || "Greška pri dohvaćanju.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [subscriptionId, navigate]);

  if (loading) return <p className="placanje-state">Učitavanje...</p>;
  if (error) return <p className="placanje-state error">{error}</p>;
  if (!subscription)
    return <p className="placanje-state error">Nema podataka o pretplati.</p>;

  return (
    <div className="placanje-page">
      <div className="placanje-wrap">
        <header className="placanje-header">
          <h1 className="placanje-title">Odaberite način plaćanja</h1>
          <p className="placanje-subtitle">
            Pretplatom možete upravljati u bilo kojem trenutku.
          </p>
        </header>

        <section className="placanje-section">
          <h2 className="placanje-h2">Vaša pretplata</h2>

          <div className="subscription-card">
            <div className="subscription-top">
              <div>
                <p className="subscription-kicker">Odabrani plan</p>
                <h3 className="subscription-title">{subscription.title}</h3>
              </div>

              <div className="subscription-right">
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => navigate("/plan")}
                >
                  Uredi
                </button>

                <div className="subscription-price">
                  <span className="price-amount">
                    €{Number(subscription.amount).toFixed(2)}
                  </span>
                  <span className="price-cycle">
                    /{formatBilling(subscription.billing)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="placanje-section">
          <h2 className="placanje-h2">Odaberite način plaćanja</h2>

          <div className="payment-list">
              <button
                className={`payment-row ${
                  paymentMethod === "card" ? "selected" : ""
                }`}
                type="button"
                onClick={() => setPaymentMethod("card")}
              >
              <span className="payment-label">
                Kreditna ili debitna kartica
              </span>
              <span className="payment-right">
                <img className="payment-icon" src={cardIcon} alt="" />

              </span>
            </button>

            <button
              className={`payment-row ${
                paymentMethod === "paypal" ? "selected" : ""
              }`}
              type="button"
              onClick={() => setPaymentMethod("paypal")}
            >
              <span className="payment-label">PayPal</span>
              <span className="payment-right">
                <img className="payment-icon" src={paypalIcon} alt="PayPal" />
              </span>
            </button>

            <button
              className={`payment-row ${
                paymentMethod === "applepay" ? "selected" : ""
              }`}
              type="button"
              onClick={() => setPaymentMethod("applepay")}
            >
              <span className="payment-label">Apple Pay</span>
              <span className="payment-right">
                <img
                  className="payment-icon apple"
                  src={applePayIcon}
                  alt="Apple Pay"
                />
              </span>
            </button>
          </div>
        </section>

        <div className="placanje-actions">
          <button className="primary-btn" type="button">
            Nastavi
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => navigate("/plan")}
          >
            Povratak na planove
          </button>
        </div>
      </div>
    </div>
  );
}
