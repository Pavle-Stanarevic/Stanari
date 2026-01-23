import { requestJson } from "./http";

// iz kosarice napravi checkout
export async function createCheckoutFromCart(payload = {}) {
  const url = (import.meta.env.VITE_API_URL || "") + "/api/checkout/from-cart";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });

  const text = await res.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg = body?.message || (typeof body === "string" ? body : "Server error");
    const err = new Error(msg);
    err.body = body;
    throw err;
  }
  return body;
}

// dohvati napravljeni checkout
export async function getCheckout(checkoutId) {
  return requestJson(`/api/checkout/${encodeURIComponent(checkoutId)}`, {
    method: "GET",
  });
}

// placanje stripeom
export async function createStripeCartCheckoutSession({ checkoutId }) {
  return requestJson(`/api/payments/stripe/cart-checkout-session`, {
    method: "POST",
    data: { checkoutId },
  });
}

// potvrdi paypal placanje
export async function capturePayPalCartPayment({ checkoutId, transactionId }) {
  return requestJson(`/api/payments/paypal/cart-capture`, {
    method: "POST",
    data: { checkoutId, transactionId },
  });
}

// zavrsi checkout, isprazni kosaricu
export async function finalizeCheckout(payload = {}) {
  const url = (import.meta.env.VITE_API_URL || "") + "/api/checkout/finalize";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg = body?.message || (typeof body === "string" ? body : "Server error");
    const err = new Error(msg);
    err.body = body;
    throw err;
  }
  return body;
}
