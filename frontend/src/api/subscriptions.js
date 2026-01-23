// src/api/subscriptions.js
import { requestJson } from "./http";

// GET /api/subscriptions/pricing
export async function getPricing() {
  return requestJson(`/api/subscriptions/pricing`, { method: "GET" });
}

// POST /api/subscriptions
export async function createSubscription({ userId, planId, billing }) {
  return requestJson(`/api/subscriptions`, {
    method: "POST",
    data: { userId, planId, billing },
  });
}

// GET /api/subscriptions/:id
export async function getSubscription(subscriptionId, billing) {
  const url = `/api/subscriptions/${subscriptionId}${billing ? `?billing=${billing}` : ""}`;
  return requestJson(url, { method: "GET" });
}

// POST /api/subscriptions/:id/activate
export async function activateSubscription({
  subscriptionId,
  method,
  billing,
  userId,
  cardLast4,
  transactionId,
  provider,
}) {
  return requestJson(`/api/subscriptions/${subscriptionId}/activate`, {
    method: "POST",
    data: { method, billing, userId, cardLast4, transactionId, provider },
  });
}

// POST /api/payments/create-payment-intent
export async function createPaymentIntent({ userId, amount, billing }) {
  return requestJson(`/api/payments/create-payment-intent`, {
    method: "POST",
    data: { userId, amount, billing },
  });
}

// POST /api/payments/confirm-success
export async function confirmPaymentSuccess({ userId, paymentIntentId, billing }) {
  return requestJson(`/api/payments/confirm-success`, {
    method: "POST",
    data: { userId, paymentIntentId, billing },
  });
}

// POST /api/payments/stripe/checkout-session (subscription)
export async function createStripeCheckoutSession({ subscriptionId, billing }) {
  return requestJson(`/api/payments/stripe/checkout-session`, {
    method: "POST",
    data: { subscriptionId, billing },
  });
}

// POST /api/payments/stripe/confirm
export async function confirmStripeCheckout({ sessionId, subscriptionId }) {
  return requestJson(`/api/payments/stripe/confirm`, {
    method: "POST",
    data: { sessionId, subscriptionId },
  });
}
