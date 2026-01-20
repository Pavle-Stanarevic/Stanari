const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") && text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      res.status === 404
        ? "Proizvodi još nisu dostupni (backend endpoint nije implementiran)."
        : data?.message || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function listProductsBySeller(sellerId) {
  return fetchJson(`/api/products?sellerId=${encodeURIComponent(sellerId)}`);
}

export async function listSoldItemsBySeller(sellerId) {
  return fetchJson(`/api/orders/sales?sellerId=${encodeURIComponent(sellerId)}`);
}

export async function listProductReviews(productId) {
  return fetchJson(`/api/products/${encodeURIComponent(productId)}/reviews`);
}

export async function createProductReview(productId, payload) {
  return fetchJson(`/api/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}
