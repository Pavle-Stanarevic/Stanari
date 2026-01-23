import { requestJson } from "./http";

// dohvati cijene clanarina
export async function getPricing() {
  return requestJson(`/api/subscriptions/pricing`, { method: "GET" });
}

// subscribeaj se
export async function createSubscription({ userId, planId, billing }) {
  return requestJson(`/api/subscriptions`, {
    method: "POST",
    data: { userId, planId, billing },
  });
}

export async function getSubscription(subscriptionId, billing) {
  const url = `/api/subscriptions/${subscriptionId}${billing ? `?billing=${billing}` : ""}`;
  return requestJson(url, { method: "GET" });
}

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

// plati sub
export async function createPaymentIntent({ userId, amount, billing }) {
  return requestJson(`/api/payments/create-payment-intent`, {
    method: "POST",
    data: { userId, amount, billing },
  });
}

// jesi uspio platit
export async function confirmPaymentSuccess({ userId, paymentIntentId, billing }) {
  return requestJson(`/api/payments/confirm-success`, {
    method: "POST",
    data: { userId, paymentIntentId, billing },
  });
}

// placanje stripeom
export async function createStripeCheckoutSession({ subscriptionId, billing }) {
  return requestJson(`/api/payments/stripe/checkout-session`, {
    method: "POST",
    data: { subscriptionId, billing },
  });
}

// potvrdi stripe placanje
export async function confirmStripeCheckout({ sessionId, subscriptionId }) {
  return requestJson(`/api/payments/stripe/confirm`, {
    method: "POST",
    data: { sessionId, subscriptionId },
  });
}
