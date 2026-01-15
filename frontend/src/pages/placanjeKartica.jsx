import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeKartica.css";
import { activateSubscription } from "../api/subscriptions";

const DEV_FALLBACK = true;

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

function luhnCheck(digits) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isExpiryValidMMYY(mm, yy) {
  if (mm < 1 || mm > 12) return false;

  const year = 2000 + yy;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && mm < currentMonth) return false;

  return true;
}

// DEV fallback endAt računanje (ako backend nije spreman)
function computeEndAt(billing) {
  const d = new Date();
  if (billing === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
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

    if (!subscriptionId || !subscription) return "Nema podataka o pretplati. Vratite se na planove.";
    if (!name.trim()) return "Unesite ime na kartici.";

    const digits = onlyDigits(cardNumber);
    if (digits.length < 13 || digits.length > 19) return "Unesite ispravan broj kartice (13–19 znamenki).";
    if (!luhnCheck(digits)) return "Broj kartice nije valjan (provjera nije prošla).";

    const expDigits = onlyDigits(expiry);
    if (expDigits.length !== 4) return "Unesite datum isteka u formatu MM/GG.";

    const mm = Number(expDigits.slice(0, 2));
    const yy = Number(expDigits.slice(2, 4));
    if (!isExpiryValidMMYY(mm, yy)) return "Kartica je istekla ili datum nije ispravan.";

    const cvvDigits = onlyDigits(cvv);
    if (cvvDigits.length < 3 || cvvDigits.length > 4) return "Unesite ispravan CVV (3–4 znamenke).";

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

    const last4 = onlyDigits(cardNumber).slice(-4);

    try {
      // ✅ pokušaj pravi backend poziv
      const result = await activateSubscription({
        subscriptionId,
        method: "card",
        cardLast4: last4,
      });

      navigate("/placanje/uspjeh", {
        state: {
          subscription,
          last4,
          status: result?.status || "active",
          startAt: result?.startAt,
          endAt: result?.endAt,
          demo: false,
        },
      });
    } catch (e) {
      if (!DEV_FALLBACK) {
        setError(e.message || "Plaćanje nije uspjelo.");
        setLoading(false);
        return;
      }

      // demo: simulacija obrade
      await new Promise((r) => setTimeout(r, 700));

      const startAt = new Date().toISOString();
      const endAt = computeEndAt(subscription?.billing);

      navigate("/placanje/uspjeh", {
        state: {
          subscription,
          last4,
          status: "active",
          startAt,
          endAt,
          demo: true,
        },
      });
    } finally {
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
            <label className="cardpay-label">
              Sigurnosni kod (CVV) <span className="req">*</span>
            </label>
            <input
              className="cardpay-input"
              value={cvv}
              onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </div>
        </div>

        <div className="cardpay-disclaimer">
          Plaćanje aktivira pretplatu u bazi (kad backend bude spreman). Trenutni plan:{" "}
          <strong>{subscription.title}</strong> ({priceText})
        </div>

        {error ? <div className="cardpay-error">{error}</div> : null}

        <button className="cardpay-pay" type="button" onClick={handlePay} disabled={loading}>
          {loading ? "Obrada..." : "Plati sada"}
        </button>

        <button
          className="cardpay-back"
          type="button"
          onClick={() =>
            navigate("/placanje", {
              state: { subscriptionId },
            })
          }
        >
          Povratak
        </button>
      </div>
    </div>
  );
}
