// src/api/checkout.js
import { requestJson } from "./http";

// POST /api/checkout/from-cart -> { checkoutId }
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

// ✅ OVO JE BITNO — MORA POSTOJATI
// GET /api/checkout/:id -> { checkoutId, total, currency, items:[...] }
export async function getCheckout(checkoutId) {
  return requestJson(`/api/checkout/${encodeURIComponent(checkoutId)}`, {
    method: "GET",
  });
}

// POST /api/payments/stripe/cart-checkout-session -> { url }
export async function createStripeCartCheckoutSession({ checkoutId }) {
  return requestJson(`/api/payments/stripe/cart-checkout-session`, {
    method: "POST",
    data: { checkoutId },
  });
}

// POST /api/payments/paypal/cart-capture
export async function capturePayPalCartPayment({ checkoutId, transactionId }) {
  return requestJson(`/api/payments/paypal/cart-capture`, {
    method: "POST",
    data: { checkoutId, transactionId },
  });
}

// POST /api/checkout/finalize -> { ... }
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
