import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeKartica.css";
import { activateSubscription } from "../api/subscriptions";
import { capturePayPalCartPayment } from "../api/checkout";
import useAuth from "../hooks/useAuth";

const DEV_FALLBACK = false;

function loadPayPalSdk(clientId) {
  return new Promise((resolve, reject) => {
    if (window.paypal) return resolve(window.paypal);

    const existing = document.querySelector('script[data-paypal-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.paypal));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=EUR&intent=capture`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => resolve(window.paypal);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly" ? "mjesečno" : billing === "yearly" ? "godišnje" : billing;
}

function computeEndAt(billing) {
  const d = new Date();
  if (billing === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export default function PlacanjePayPal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();


  const mode = location.state?.mode || "subscription";

  // subscription mode
  const subscription = location.state?.subscription || null;
  const subscriptionId =
    location.state?.subscriptionId || subscription?.subscriptionId || subscription?.id || null;

  // cart mode
  const checkout = location.state?.checkout || null;
  const checkoutId = location.state?.checkoutId || checkout?.checkoutId || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  const priceText = useMemo(() => {
    if (mode === "cart") {
      const total = Number(checkout?.total || 0).toFixed(2);
      return `€${total}`;
    }
    if (!subscription) return "";
    const amount = Number(subscription.amount || 0).toFixed(2);
    return `€${amount}/${formatBilling(subscription.billing)}`;
  }, [mode, subscription, checkout]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setError("");

      if (!clientId) {
        setLoading(false);
        setError("Nedostaje VITE_PAYPAL_CLIENT_ID u .env (PayPal client id).");
        return;
      }


      if (mode === "cart") {
        if (!checkoutId) {
          setLoading(false);
          setError("Nema podataka o narudžbi (checkoutId). Vratite se na košaricu.");
          return;
        }
      } else {
        if (!subscriptionId || !subscription) {
          setLoading(false);
          setError("Nema podataka o pretplati. Vratite se na planove.");
          return;
        }
      }

      try {
        await loadPayPalSdk(clientId);
        if (!mounted) return;

        const el = document.getElementById("paypal-buttons");
        if (!el) return;

        el.innerHTML = "";

        window.paypal
          .Buttons({
            style: { layout: "vertical", shape: "rect" },

            createOrder: (data, actions) => {
              const value =
                mode === "cart"
                  ? Number(checkout?.total || 0).toFixed(2)
                  : Number(subscription?.amount || 0).toFixed(2);

              const description =
                mode === "cart"
                  ? `ClayPlay narudžba (checkout #${checkoutId})`
                  : `${subscription.title} (${formatBilling(subscription.billing)})`;

              const customId = mode === "cart" ? String(checkoutId) : String(subscriptionId);

              return actions.order.create({
                purchase_units: [
                  {
                    description,
                    custom_id: customId,
                    amount: { currency_code: "EUR", value },
                  },
                ],
              });
            },

            onApprove: async (data, actions) => {
              try {
                const details = await actions.order.capture();

                const transactionId =
                  details?.purchase_units?.[0]?.payments?.captures?.[0]?.id || data?.orderID;

                if (mode === "cart") {
                  const result = await capturePayPalCartPayment({
                    checkoutId,
                    transactionId,
                  });

                  navigate("/placanje/uspjeh", {
                    state: {
                      mode: "cart",
                      checkoutId,
                      checkout,
                      status: result?.status || "paid",
                      startAt: result?.startAt,
                      endAt: result?.endAt,
                      demo: false,
                      method: "paypal",
                      transactionId,
                    },
                  });

                  return;
                }

                const resolvedUserId =
                  user?.id || user?.idKorisnik || location.state?.userId || location.state?.idKorisnik || location.state?.currentUserId;

                if (!resolvedUserId) {
                  throw new Error("Nedostaje userId (morate biti prijavljeni).");
                }

                const result = await activateSubscription({
                  subscriptionId,
                  method: "paypal",
                  transactionId,
                  provider: "paypal",
                  billing: subscription?.billing,
                  userId: resolvedUserId,
                });

                navigate("/placanje/uspjeh", {
                  state: {
                    mode: "subscription",
                    subscription,
                    subscriptionId,
                    status: result?.status || "active",
                    startAt: result?.startAt,
                    endAt: result?.endAt,
                    demo: false,
                    method: "paypal",
                    transactionId,
                  },
                });
              } catch (e) {
                setError(e?.message || "PayPal plaćanje nije uspjelo.");
              }
            },

            onCancel: () => {
              setError("PayPal plaćanje je otkazano.");
            },

            onError: (err) => {
              console.error(err);
              setError("Greška u PayPal checkoutu.");
            },
          })
          .render("#paypal-buttons");

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
        setError("Ne mogu učitati PayPal SDK (provjeri internet i client id).");
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [clientId, navigate, mode, subscription, subscriptionId, checkout, checkoutId, user]);

  // Guards UI
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
        <h2 className="cardpay-title">
          PayPal plaćanje — {mode === "cart" ? "Narudžba" : "Pretplata"}
        </h2>

        <div className="cardpay-disclaimer">
          {mode === "cart" ? (
            <>
              Checkout: <strong>#{checkoutId}</strong> ({priceText})
            </>
          ) : (
            <>
              Trenutni plan: <strong>{subscription.title}</strong> ({priceText})
            </>
          )}
        </div>

        {error ? <div className="cardpay-error">{error}</div> : null}

        <div id="paypal-buttons" style={{ marginTop: 16 }} />

        {loading ? (
          <div className="cardpay-help" style={{ marginTop: 12 }}>
            Učitavam PayPal…
          </div>
        ) : null}

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
          style={{ marginTop: 14 }}
        >
          Povratak
        </button>
      </div>
    </div>
  );
}
