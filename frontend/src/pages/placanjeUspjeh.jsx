import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeUspjeh.css";

function formatBilling(billing) {
  if (!billing) return "";
  return billing === "monthly" ? "mjesečno" : billing === "yearly" ? "godišnje" : billing;
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("hr-HR");
  } catch {
    return iso;
  }
}

export default function PlacanjeUspjeh() {
  const navigate = useNavigate();
  const location = useLocation();

  const subscription = location.state?.subscription;

  // kartica (stari flow) ili stripe/paypal (novi flow)
  const last4 = location.state?.last4;

  const method = location.state?.method; // "card" | "paypal"
  const provider = location.state?.provider; // "stripe" (za kartice preko Stripe)
  const transactionId = location.state?.transactionId; // paypal capture id / orderID

  const startAt = location.state?.startAt;
  const endAt = location.state?.endAt;
  const demo = location.state?.demo;

  const methodLabel =
    method === "paypal"
      ? "PayPal"
      : method === "card"
      ? provider === "stripe"
        ? "Kartica (Stripe)"
        : "Kartica"
      : "";

  return (
    <div className="ps-page">
      <div className="ps-card">
        <div className="ps-check">✓</div>
        <h1 className="ps-title">Plaćanje uspješno!</h1>

        <p className="ps-text">
          Pretplata je aktivirana{demo ? " (demo)" : ""}.
          {methodLabel ? (
            <>
              <br />
              Način plaćanja: <strong>{methodLabel}</strong>
            </>
          ) : null}
          {subscription ? (
            <>
              <br />
              Plan: <strong>{subscription.title}</strong> — €{Number(subscription.amount).toFixed(2)}/
              {formatBilling(subscription.billing)}
            </>
          ) : null}
          {last4 ? (
            <>
              <br />
              Kartica: **** {last4}
            </>
          ) : null}
          {transactionId ? (
            <>
              <br />
              Transakcija: <strong>{transactionId}</strong>
            </>
          ) : null}
          {startAt ? (
            <>
              <br />
              Aktivno od: <strong>{fmtDate(startAt)}</strong>
            </>
          ) : null}
          {endAt ? (
            <>
              <br />
              Vrijedi do: <strong>{fmtDate(endAt)}</strong>
            </>
          ) : null}
        </p>

        <div className="ps-actions">
          <button className="ps-btn" onClick={() => navigate("/")}>
            Povratak na početnu
          </button>
          <button className="ps-btn ghost" onClick={() => navigate("/plan")}>
            Pogledaj planove
          </button>
        </div>
      </div>
    </div>
  );
}
