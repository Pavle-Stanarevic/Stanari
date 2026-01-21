import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeUspjeh.css";
import { confirmPaymentSuccess } from "../api/subscriptions";
import useAuth from "../hooks/useAuth";
import { me } from "../api/auth";

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
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("userId");
    const paymentIntentId = params.get("payment_intent") || params.get("paymentIntentId");
    const redirectStatus = params.get("redirect_status");
    const billing = params.get("billing");

    console.log("PlacanjeUspjeh: status=", redirectStatus, "userId=", userId, "PI=", paymentIntentId, "billing=", billing);

    let cancelled = false;

    async function handleSuccess() {
      if (!(redirectStatus === "succeeded" && userId)) return;

      console.log("[DEBUG_LOG] PlacanjeUspjeh: Succeeded status detected, confirming...");

      try {
        await confirmPaymentSuccess({ userId, paymentIntentId, billing });
        console.log("[DEBUG_LOG] PlacanjeUspjeh: Payment confirmed successfully.");

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const normalize = (raw) => (raw && raw.user) ? raw.user : raw;

        const hasSubscription = (usr) => {
          if (!usr) return false;
          const organizator = usr.organizator ?? usr;
          try {
            if (Array.isArray(organizator.placa) && organizator.placa.length > 0) return true;
            if (Array.isArray(usr.placa) && usr.placa.length > 0) return true;
            if (organizator.subscriptionEnd || organizator.subscription_end) return true;
            if (organizator.pretplata || organizator.subscription || usr.subscription) return true;
          } catch (e) {
          }
          return false;
        };

        let lastFetched = null;
        try {
          const initial = normalize(await me());
          console.log("[DEBUG_LOG] PlacanjeUspjeh: initial me() returned:", initial);
          lastFetched = initial;
          if (!cancelled && hasSubscription(initial)) {
            setUser(initial);
            try { sessionStorage.setItem("user", JSON.stringify(initial)); } catch (e) { /* ignore */ }
            console.log("[DEBUG_LOG] PlacanjeUspjeh: Subscription found on initial fetch, updated auth.");
            return;
          }
        } catch (err) {
          console.error("[DEBUG_LOG] PlacanjeUspjeh: Error on initial me():", err);
        }

        const maxAttempts = 8;
        for (let i = 0; i < maxAttempts && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const raw = await me();
            const u = normalize(raw);
            console.log("[DEBUG_LOG] PlacanjeUspjeh: Poll attempt", i + 1, "me() returned:", u);
            lastFetched = u;
            if (hasSubscription(u)) {
              if (!cancelled) {
                setUser(u);
                try { sessionStorage.setItem("user", JSON.stringify(u)); } catch (e) { /* ignore */ }
              }
              console.log("[DEBUG_LOG] PlacanjeUspjeh: Subscription detected after polling.");
              return;
            }
          } catch (err) {
            console.error("[DEBUG_LOG] PlacanjeUspjeh: Error fetching me during polling:", err);
          }
        }

        if (!cancelled && lastFetched) {
          setUser(lastFetched);
          try { sessionStorage.setItem("user", JSON.stringify(lastFetched)); } catch (e) { /* ignore */ }
          console.log("[DEBUG_LOG] PlacanjeUspjeh: Updated auth with last fetched user (fallback).", lastFetched);
        }
      } catch (err) {
        console.error("[DEBUG_LOG] PlacanjeUspjeh: Error confirming payment:", err);
      }
    }

    handleSuccess();

    return () => {
      cancelled = true;
    };
  }, [location, setUser]);

  const subscription = location.state?.subscription;

  const last4 = location.state?.last4;

  const method = location.state?.method;
  const provider = location.state?.provider;
  const transactionId = location.state?.transactionId;

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
