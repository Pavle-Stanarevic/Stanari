import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanjeUspjeh.css";
import { confirmPaymentSuccess } from "../api/subscriptions";
import useAuth from "../hooks/useAuth";
import { me } from "../api/auth";
import { finalizeCheckout } from "../api/checkout";

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

  const checkoutState = { ...(location.state || {}) };
  const urlParams = new URLSearchParams(location.search);
  const urlMode = urlParams.get("mode") || urlParams.get("checkoutMode") || urlParams.get("type");
  const urlCheckoutId = urlParams.get("checkoutId") || urlParams.get("checkout_id") || urlParams.get("session_id");
  const urlPaymentIntent = urlParams.get("payment_intent") || urlParams.get("paymentIntentId");
  if (!checkoutState.mode && urlMode) checkoutState.mode = urlMode;
  if (!checkoutState.checkoutId && urlCheckoutId) checkoutState.checkoutId = urlCheckoutId;
  if (!checkoutState.paymentIntentId && urlPaymentIntent) checkoutState.paymentIntentId = urlPaymentIntent;

  let pending = null;
  try {
    const raw = sessionStorage.getItem("clayplay_pending_payment");
    pending = raw ? JSON.parse(raw) : null;
  } catch {
    pending = null;
  }

  const pendingMode = pending?.mode || pending?.checkoutMode || null;
  const effectiveMode = checkoutState?.mode || urlMode || pendingMode || null;

  const hasCheckoutId = Boolean(checkoutState?.checkoutId) || Boolean(urlCheckoutId) || Boolean(pending?.checkoutId) || Boolean(pending?.checkout?.checkoutId);

  const isCartPayment = effectiveMode === "cart" || hasCheckoutId;
  const isSubscriptionPayment = !isCartPayment;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("clayplay_pending_payment");
      const cur = raw ? JSON.parse(raw) : {};
      const next = { ...(cur || {}) };
      if (!next.mode && effectiveMode) next.mode = effectiveMode;
      if (!next.mode && isCartPayment) next.mode = "cart";
      if (!next.mode && isSubscriptionPayment) next.mode = "subscription";
      sessionStorage.setItem("clayplay_pending_payment", JSON.stringify(next));
    } catch { }
  }, [effectiveMode, isCartPayment, isSubscriptionPayment]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("userId");
    const paymentIntentId = params.get("payment_intent") || params.get("paymentIntentId");
    const redirectStatus = params.get("redirect_status");
    const billing = params.get("billing");

    let cancelled = false;

    async function finalizeCartIfNeeded() {
      if (!isCartPayment) return;

      let pending = null;
      try {
        const raw = sessionStorage.getItem("clayplay_pending_payment");
        pending = raw ? JSON.parse(raw) : null;
      } catch (e) {
        pending = null;
      }

      const effectiveCheckoutId =
        checkoutState?.checkoutId || pending?.checkoutId || pending?.checkout?.checkoutId || urlCheckoutId;
      const effectivePi =
        checkoutState?.paymentIntentId || pending?.paymentIntentId || paymentIntentId || urlPaymentIntent;

      if (effectiveCheckoutId) {
        try {
          await finalizeCheckout({ checkoutId: effectiveCheckoutId });
          try {
            window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items: [] } }));
          } catch (e) {}
          try {
            sessionStorage.removeItem("clayplay_pending_payment");
          } catch (e) {}
          return;
        } catch (err) {
          console.error("finalizeCheckout failed", err);
        }
      }

      if (effectivePi) {
        try {
          const r = await fetch((import.meta.env.VITE_API_URL || "") + "/api/payments/finalize-by-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId: effectivePi }),
            credentials: "include",
          });
          const body = await r.json().catch(() => ({}));
          if (r.ok) {
            console.log("[DEBUG] finalize-by-payment-intent ok", body);
            try {
              window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items: [] } }));
            } catch (e) {}
            try {
              sessionStorage.removeItem("clayplay_pending_payment");
            } catch (e) {}
            return;
          }
          console.warn("[DEBUG] finalize-by-payment-intent failed", body);
        } catch (err) {
          console.error("[DEBUG] finalize-by-payment-intent error", err);
        }
      }

      try {
        const resolvedUserId = userId || (await me())?.user?.id || (await me())?.id;
        if (resolvedUserId) {
          const fc = await fetch((import.meta.env.VITE_API_URL || "") + "/api/cart/force-clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ userId: resolvedUserId }),
          });
          const fcBody = await fc.json().catch(() => ({}));
          if (fc.ok) {
            console.log("[DEBUG] force-clear ok", fcBody);
            try {
              window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items: [] } }));
            } catch (e) {}
            try {
              sessionStorage.removeItem("clayplay_pending_payment");
            } catch (e) {}
          } else {
            console.warn("[DEBUG] force-clear failed", fcBody);
          }
        }
      } catch (err) {
        console.error("[DEBUG] force-clear error", err);
      }
    }

    async function handleSuccess() {
      if (isCartPayment) {
        await finalizeCartIfNeeded();
        return;
      }

      if (!(redirectStatus === "succeeded" && userId)) return;

      try {
        await confirmPaymentSuccess({ userId, paymentIntentId, billing });

        await new Promise((r) => setTimeout(r, 250));

        const normalize = (raw) => (raw && raw.user) ? raw.user : raw;
        const hasSubscription = (usr) => {
          if (!usr) return false;
          const organizator = usr.organizator ?? usr;
          try {
            if (Array.isArray(organizator.placa) && organizator.placa.length > 0) return true;
            if (Array.isArray(usr.placa) && usr.placa.length > 0) return true;
            if (organizator.subscriptionEnd || organizator.subscription_end) return true;
            if (organizator.pretplata || organizator.subscription || usr.subscription) return true;
            if (usr.isSubscribed === true || organizator.isSubscribed === true) return true;
          } catch (e) {}
          return false;
        };

        let lastFetched = null;
        try {
          const initial = normalize(await me(true));
          lastFetched = initial;
          if (!cancelled && hasSubscription(initial)) {
            setUser(initial);
            try { sessionStorage.setItem("user", JSON.stringify(initial)); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent("auth:updated", { detail: { user: initial } })); } catch (e) {}
            try { sessionStorage.removeItem("clayplay_pending_payment"); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent("subscription:updated", { detail: { user: initial } })); } catch (e) {}
            return;
          }
        } catch (e) {}

        const maxAttempts = 8;
        for (let i = 0; i < maxAttempts && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const raw = await me(true);
            const u = normalize(raw);
            lastFetched = u;
            if (hasSubscription(u)) {
              if (!cancelled) {
                setUser(u);
                try { sessionStorage.setItem("user", JSON.stringify(u)); } catch (e) {}
                try { window.dispatchEvent(new CustomEvent("auth:updated", { detail: { user: u } })); } catch (e) {}
                try { sessionStorage.removeItem("clayplay_pending_payment"); } catch (e) {}
                try { window.dispatchEvent(new CustomEvent("subscription:updated", { detail: { user: u } })); } catch (e) {}
              }
              break;
            }
          } catch (e) {}
        }

        if (!cancelled && lastFetched) {
          setUser(lastFetched);
          try { sessionStorage.setItem("user", JSON.stringify(lastFetched)); } catch (e) {}
          try { window.dispatchEvent(new CustomEvent("auth:updated", { detail: { user: lastFetched } })); } catch (e) {}
          try { sessionStorage.removeItem("clayplay_pending_payment"); } catch (e) {}
          try { window.dispatchEvent(new CustomEvent("subscription:updated", { detail: { user: lastFetched } })); } catch (e) {}
        }
      } catch (err) {
        console.error("Error confirming payment:", err);
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
          {isCartPayment ? 'Kupnja je uspješna.' : `Pretplata je aktivirana${demo ? ' (demo)' : ''}.`}
          {methodLabel ? (
            <>
              <br />
              Način plaćanja: <strong>{methodLabel}</strong>
            </>
          ) : null}
          {subscription ? (
            <>
              <br />
              Plan: <strong>{subscription.title}</strong> — €{Number(subscription.amount).toFixed(2)}/{formatBilling(subscription.billing)}
            </>
          ) : null}
          {last4 ? (
            <>
              <br />Kartica: **** {last4}
            </>
          ) : null}
          {transactionId ? (
            <>
              <br />Transakcija: <strong>{transactionId}</strong>
            </>
          ) : null}
          {startAt ? (
            <>
              <br />Aktivno od: <strong>{fmtDate(startAt)}</strong>
            </>
          ) : null}
          {endAt ? (
            <>
              <br />Vrijedi do: <strong>{fmtDate(endAt)}</strong>
            </>
          ) : null}

          {!isCartPayment ? (
            <>
              <br />
              <br />
              <em>Da bi vidjeli promjene, ponovno se ulogirajte u stranicu.</em>
            </>
          ) : null}
        </p>

        <div className="ps-actions">
          <button className="ps-btn" onClick={() => navigate("/")}>Natrag na početnu</button>

          {isCartPayment ? (
            <button className="ps-btn secondary" onClick={() => navigate("/kosarica")}>Natrag na košaricu</button>
          ) : (
            <button className="ps-btn secondary" onClick={() => navigate("/plan")}>Pregled planova</button>
          )}
        </div>
      </div>
    </div>
  );
}
