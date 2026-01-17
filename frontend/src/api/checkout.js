// src/api/checkout.js
import { requestJson } from "./http";

// POST /api/checkout/from-cart -> { checkoutId }
export async function createCheckoutFromCart() {
  return requestJson(`/api/checkout/from-cart`, { method: "POST" });
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
