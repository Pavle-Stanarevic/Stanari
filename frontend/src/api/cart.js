const BASE = "/api/cart";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include", // ako koristiš cookie auth
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  if (!contentType.includes("application/json")) {
    // backend može vratiti empty body kod DELETE
    return text ? JSON.parse(text) : null;
  }
  return text ? JSON.parse(text) : null;
}

// GET /api/cart  -> { items: [...] } ili [...]
export async function getCart() {
  return fetchJson(`${BASE}`);
}

// POST /api/cart/items  body: { type: "workshop", workshopId, qty: 1 }
export async function addWorkshopToCart(workshopId, qty = 1) {
  return fetchJson(`${BASE}/items`, {
    method: "POST",
    body: JSON.stringify({ type: "workshop", workshopId, qty }),
  });
}

// POST /api/cart/items  body: { type: "product", productId, qty: 1 }
export async function addProductToCart(productId, qty = 1) {
  return fetchJson(`${BASE}/items`, {
    method: "POST",
    body: JSON.stringify({ type: "product", productId, qty }),
  });
}

// PATCH /api/cart/items/:itemId  body: { qty }
export async function updateCartItemQty(itemId, qty) {
  return fetchJson(`${BASE}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ qty }),
  });
}

// DELETE /api/cart/items/:itemId
export async function removeCartItem(itemId) {
  return fetchJson(`${BASE}/items/${itemId}`, { method: "DELETE" });
}

// DELETE /api/cart (clear)
export async function clearCart() {
  return fetchJson(`${BASE}`, { method: "DELETE" });
}
