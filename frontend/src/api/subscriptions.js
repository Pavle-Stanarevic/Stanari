const API = import.meta.env.VITE_API_URL;

function getCookie(name = "XSRF-TOKEN") {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

async function postJsonWithCsrf(path, data) {
  const csrf = getCookie();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || res.statusText || "Request failed");
  }

  return res.json().catch(() => ({}));
}

// ✅ Create subscription (plan + billing)
export async function createSubscription({ userId, planId, billing }) {
  return postJsonWithCsrf(`/api/subscriptions`, { userId, planId, billing });
}

// ✅ Activate subscription after PayPal (or other non-Stripe flows)
export async function activateSubscription({
  subscriptionId,
  method,
  cardLast4,
  transactionId,
  provider,
}) {
  return postJsonWithCsrf(`/api/subscriptions/${subscriptionId}/activate`, {
    method,
    cardLast4,
    transactionId,
    provider,
  });
}

// ✅ Stripe checkout session (dynamic price from DB)
export async function createStripeCheckoutSession({ subscriptionId, billing }) {
  return postJsonWithCsrf(`/api/payments/stripe/checkout-session`, {
    subscriptionId,
    billing,
  });
}

// ✅ After Stripe redirect: confirm session + return status/dates
export async function confirmStripeCheckout({ sessionId, subscriptionId }) {
  return postJsonWithCsrf(`/api/payments/stripe/confirm`, { sessionId, subscriptionId });
}
