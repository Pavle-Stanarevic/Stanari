import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeKartica.css";
import { createPaymentIntent, confirmCardPayment } from "../api/payments";

function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

function formatCardNumber(value) {
  const d = onlyDigits(value).slice(0, 19);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const d = onlyDigits(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly" ? "mjesečno" : billing === "yearly" ? "godišnje" : billing;
}

export default function PlacanjeKartica() {
  const navigate = useNavigate();
  const location = useLocation();

  const subscriptionId = location.state?.subscriptionId;
  const subscription = location.state?.subscription;

  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priceText = useMemo(() => {
    if (!subscription) return "";
    const amount = Number(subscription.amount || 0).toFixed(2);
    return `€${amount}/${formatBilling(subscription.billing)}`;
  }, [subscription]);

  function validate() {
    setError("");

    if (!subscriptionId) return "Nedostaje subscriptionId. Vratite se na planove.";
    if (!name.trim()) return "Unesite ime na kartici.";

    const digits = onlyDigits(cardNumber);
    if (digits.length < 13) return "Unesite ispravan broj kartice.";

    const expDigits = onlyDigits(expiry);
    if (expDigits.length !== 4) return "Unesite datum isteka u formatu MM/GG.";
    const mm = Number(expDigits.slice(0, 2));
    if (mm < 1 || mm > 12) return "Mjesec isteka mora biti 01–12.";

    const cvvDigits = onlyDigits(cvv);
    if (cvvDigits.length < 3) return "Unesite ispravan CVV (3–4 znamenke).";

    return "";
  }

  async function handlePay() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1) Kreiraj payment intent (backend tim će to implementirati)
      const intent = await createPaymentIntent({
        subscriptionId,
        method: "card",
      });

      // 2) Potvrdi (placeholder – pravi provider će doći kasnije)
      await confirmCardPayment({
        intentId: intent.id,
        cardForm: {
          name,
          cardNumber: onlyDigits(cardNumber), // placeholder (NE za stvarnu produkciju)
          expiry,
          cvv: onlyDigits(cvv),
        },
      });

      // 3) Success – ti možeš preusmjeriti gdje želiš
      navigate("/plan");
    } catch (e) {
      setError(e.message || "Plaćanje nije uspjelo.");
    } finally {
      setLoading(false);
    }
  }

  if (!subscriptionId || !subscription) {
    return (
      <div className="cardpay-page">
        <div className="cardpay-wrap">
          <div className="cardpay-card">
            <h2 className="cardpay-title">Nema podataka o pretplati</h2>
            <p className="cardpay-note">
              Vratite se na planove i ponovno odaberite pretplatu.
            </p>
            <button className="cardpay-back" onClick={() => navigate("/plan")}>
              Povratak na planove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cardpay-page">
      <div className="cardpay-wrap">
        <div className="cardpay-card">
          <div className="cardpay-brands" aria-hidden="true">
            <span className="brand-pill">AMEX</span>
            <span className="brand-pill">Mastercard</span>
            <span className="brand-pill">VISA</span>
          </div>

          <p className="cardpay-required">
            <strong>*</strong> označava obavezno polje.
          </p>

          <label className="cardpay-label">
            Ime na kartici <span className="req">*</span>
          </label>
          <input
            className="cardpay-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="cc-name"
          />

          <label className="cardpay-label">
            Broj kartice <span className="req">*</span>
          </label>
          <input
            className="cardpay-input"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            inputMode="numeric"
            autoComplete="cc-number"
          />

          <div className="cardpay-grid2">
            <div>
              <label className="cardpay-label">
                Datum isteka <span className="req">*</span>
              </label>
              <input
                className="cardpay-input"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/GG"
                inputMode="numeric"
                autoComplete="cc-exp"
              />
              <div className="cardpay-help">Koristite format: MM/GG</div>
            </div>

            <div>
              <div className="cardpay-labelrow">
                <label className="cardpay-label">
                  Sigurnosni kod (CVV) <span className="req">*</span>
                </label>
              </div>
              <input
                className="cardpay-input"
                value={cvv}
                onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </div>
          </div>



          {error ? <div className="cardpay-error">{error}</div> : null}

          <button
            className="cardpay-pay"
            type="button"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? "Obrada..." : "Plati sada"}
          </button>

          <button
            className="cardpay-back"
            type="button"
            onClick={() => navigate("/placanje", { state: { subscriptionId } })}
          >
            Povratak
          </button>
        </div>
      </div>
    </div>
  );
}
