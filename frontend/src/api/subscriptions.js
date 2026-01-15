export async function createSubscription({ userId, planId, billing }) {
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, planId, billing }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Greška kod spremanja pretplate.");
  }

  return res.json(); // npr. { subscriptionId: 123, amount: 20, title: "Premium" }
}
