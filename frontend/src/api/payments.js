// frontend/src/api/payments.js
// Backend tim kasnije implementira ove rute.
// Ti samo zoveš endpointove i UI već radi.

export async function createPaymentIntent({ subscriptionId, method }) {
  const res = await fetch("/api/payments/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ subscriptionId, method }),
  });

  if (!res.ok) {
    let msg = "Greška pri pokretanju plaćanja.";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export async function confirmCardPayment({ intentId, cardForm }) {
  // ⚠️ U pravoj integraciji se kartični podaci NE šalju tvom backendu,
  // nego payment provideru (Stripe/Adyen). Ovo je samo placeholder API.
  const res = await fetch(`/api/payments/intent/${intentId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(cardForm),
  });

  if (!res.ok) {
    let msg = "Plaćanje nije uspjelo.";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}
