export async function createSubscription({ userId, planId, billing }) {
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId, planId, billing }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Greška kod spremanja pretplate.");
  }

  return res.json(); // npr. { subscriptionId: 123, amount: 20, title: "Premium" }
}

/**
 * Backend tim: implementirati endpoint koji aktivira pretplatu i upiše payment.
 * Predloženi endpoint:
 * POST /api/subscriptions/:subscriptionId/activate
 * Body: { method: "card", cardLast4: "4242" }
 * Response: { status: "active", startAt: "...", endAt: "..." }
 */

export async function activateSubscription({ subscriptionId, method, cardLast4 }) {
  const res = await fetch(`/api/subscriptions/${subscriptionId}/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ method, cardLast4 }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Greška kod aktivacije pretplate.");
  }

  return res.json(); 
  // očekuj: { status: "active", startAt: "...", endAt: "..." }
}

