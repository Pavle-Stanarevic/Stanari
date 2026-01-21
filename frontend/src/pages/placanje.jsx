import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanje.css";

import cardIcon from "../assets/images/credit-card.svg";
import paypalIcon from "../assets/images/pay-pal.png";
import { getCheckout } from "../api/checkout";
import { getSubscription } from "../api/subscriptions";

const DEV_FALLBACK = true;

const DEV_SUBSCRIPTION = {
  id: "dev-subscription",
  title: "Basic (placeholder)",
  amount: 9.99,
  billing: "monthly",
};

const DEV_CART_CHECKOUT = {
  checkoutId: "demo-cart-001",
  currency: "EUR",
  total: 47.97,
  items: [
    { title: "Šalica — bijela glazura", qty: 1, price: 14.99 },
    { title: "Zdjelica — plava glazura", qty: 2, price: 9.99 },
    { title: "Radionica: Osnove keramike", qty: 1, price: 12.99 },
  ],
};

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly" ? "mjesečno" : billing === "yearly" ? "godišnje" : billing;
}

function formatMoney(n, currency = "EUR") {
  const x = Number(n || 0);
  const val = Number.isNaN(x) ? 0 : x;
  return `${currency === "EUR" ? "€" : ""}${val.toFixed(2)}`;
}

function checkoutFromCartItems(items) {
  const safe = Array.isArray(items) ? items : [];
  const mapped = safe.map((it) => ({
    title: it?.title || "Stavka",
    qty: Number(it?.qty || 1),
    price: Number(it?.price || 0),
  }));

  const total = mapped.reduce((s, it) => s + it.price * (it.qty || 1), 0);

  return {
    checkoutId: "dev-from-cart-items",
    currency: "EUR",
    total,
    items: mapped,
  };
}

export default function Placanje() {
  const navigate = useNavigate();
  const location = useLocation();

  const subscriptionId = location.state?.subscriptionId;
  const initialSubscription = location.state?.subscription;
  const checkoutId = location.state?.checkoutId;
  const cartItems = location.state?.items || null;

  const demoCart = new URLSearchParams(location.search).get("demoCart") === "1";

  const mode =
    location.state?.mode || (demoCart ? "cart" : checkoutId ? "cart" : "subscription");

  const [paymentMethod, setPaymentMethod] = useState(null);

  const [subscription, setSubscription] = useState(initialSubscription || null);
  const [checkout, setCheckout] = useState(null);

  const [loading, setLoading] = useState(!initialSubscription && mode === "subscription" ? true : mode === "cart");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      // Ako već imamo podatke iz state-a, ne moramo ih ponovno dohvaćati
      if (mode === "subscription" && initialSubscription) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      // CART
      if (mode === "cart") {
        if (demoCart) {
          setCheckout(DEV_CART_CHECKOUT);
          setLoading(false);
          return;
        }

        if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
          setCheckout(checkoutFromCartItems(cartItems));
          setLoading(false);
          return;
        }

        if (checkoutId) {
          try {
            const data = await getCheckout(checkoutId);
            if (!mounted) return;
            setCheckout({ ...data, checkoutId });
          } catch (e) {
            if (!mounted) return;
            if (DEV_FALLBACK) setCheckout({ ...DEV_CART_CHECKOUT, checkoutId });
            else setError(e?.message || "Greška pri dohvaćanju narudžbe.");
          } finally {
            if (mounted) setLoading(false);
          }
          return;
        }

        if (DEV_FALLBACK) {
          setCheckout(DEV_CART_CHECKOUT);
          setLoading(false);
          return;
        }

        navigate("/kosarica");
        return;
      }

      // SUBSCRIPTION
      if (!subscriptionId) {
        if (DEV_FALLBACK) {
          setSubscription(DEV_SUBSCRIPTION);
          setLoading(false);
          return;
        }
        navigate("/plan");
        return;
      }

      try {
        const billingInfo = initialSubscription?.billing || "monthly";
        const data = await getSubscription(subscriptionId, billingInfo);
        if (!mounted) return;
        setSubscription(data);
      } catch (e) {
        if (!mounted) return;
        if (DEV_FALLBACK) setSubscription({ ...DEV_SUBSCRIPTION, id: subscriptionId });
        else setError(e?.message || "Greška pri dohvaćanju.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [mode, demoCart, checkoutId, subscriptionId, navigate, cartItems, initialSubscription]);

  const summaryTitle = useMemo(() => {
    return mode === "cart" ? "Vaša košarica" : "Vaša pretplata";
  }, [mode]);

  function handleContinue() {
    if (!paymentMethod) return;

    const routeMap = {
      card: "/placanje/kartica",
      paypal: "/placanje/paypal",
    };

    const payload =
      mode === "cart"
        ? {
            mode: "cart",
            checkoutId: checkout?.checkoutId || checkoutId || DEV_CART_CHECKOUT.checkoutId,
            checkout: checkout || DEV_CART_CHECKOUT,
            paymentMethod,
          }
        : {
            mode: "subscription",
            subscriptionId: subscription?.id || subscriptionId,
            subscription,
            paymentMethod,
          };

    sessionStorage.setItem("clayplay_pending_payment", JSON.stringify(payload));
    navigate(routeMap[paymentMethod], { state: payload });
  }

  if (loading) return <p className="placanje-state">Učitavanje...</p>;
  if (error) return <p className="placanje-state error">{error}</p>;

  if (mode === "cart" && !checkout) return <p className="placanje-state error">Nema košarice.</p>;
  if (mode !== "cart" && !subscription)
    return <p className="placanje-state error">Nema pretplate.</p>;

  return (
    <div className="placanje-page">
      <div className="placanje-wrap">
        <header className="placanje-header">
          <h1 className="placanje-title">Odaberite način plaćanja</h1>
          <p className="placanje-subtitle">
            {mode === "cart"
              ? "Pregledajte košaricu i odaberite način plaćanja."
              : "Pretplatom možete upravljati u bilo kojem trenutku."}
          </p>
        </header>

        <section className="placanje-section">
          <h2 className="placanje-h2">{summaryTitle}</h2>

          <div className="subscription-card">
            <div className="subscription-top">
              <div>
                <p className="subscription-kicker">
                  {mode === "cart" ? "Košarica → naplata" : "Odabrani plan"}
                </p>

                <h3 className="subscription-title">
                  {mode === "cart" ? `Checkout #${checkout.checkoutId}` : subscription.title}
                </h3>

                {mode === "cart" && Array.isArray(checkout.items) && checkout.items.length ? (
                  <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                    {checkout.items.map((it, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>
                          {it.title} {it.qty ? `× ${it.qty}` : ""}
                        </span>
                        <span>{formatMoney(it.price * (it.qty || 1), checkout.currency)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="subscription-right">
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => navigate(mode === "cart" ? "/kosarica" : "/plan")}
                >
                  Uredi
                </button>

                <div className="subscription-price">
                  {mode === "cart" ? (
                    <span className="price-amount">
                      {formatMoney(checkout.total, checkout.currency)}
                    </span>
                  ) : (
                    <>
                      <span className="price-amount">€{Number(subscription.amount).toFixed(2)}</span>
                      <span className="price-cycle">/{formatBilling(subscription.billing)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="placanje-section">
          <h2 className="placanje-h2">Odaberite način plaćanja</h2>

          <div className="payment-list">
            <button
              className={`payment-row ${paymentMethod === "card" ? "selected" : ""}`}
              type="button"
              onClick={() => setPaymentMethod("card")}
            >
              <span className="payment-label">Kreditna ili debitna kartica</span>
              <span className="payment-right">
                <img className="payment-icon" src={cardIcon} alt="" />
              </span>
            </button>

            <button
              className={`payment-row ${paymentMethod === "paypal" ? "selected" : ""}`}
              type="button"
              onClick={() => setPaymentMethod("paypal")}
            >
              <span className="payment-label">PayPal</span>
              <span className="payment-right">
                <img className="payment-icon" src={paypalIcon} alt="PayPal" />
              </span>
            </button>
          </div>
        </section>

        <div className="placanje-actions">
          <button
            className="primary-btn"
            type="button"
            onClick={handleContinue}
            disabled={!paymentMethod}
            title={!paymentMethod ? "Odaberite način plaćanja" : ""}
          >
            Nastavi
          </button>

          <button
            className="ghost-btn"
            type="button"
            onClick={() => navigate(mode === "cart" ? "/kosarica" : "/plan")}
          >
            {mode === "cart" ? "Povratak na košaricu" : "Povratak na planove"}
          </button>
        </div>
      </div>
    </div>
  );
}
