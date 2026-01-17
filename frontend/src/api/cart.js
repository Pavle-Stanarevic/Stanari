const API_BASE = import.meta.env.VITE_API_URL || "";
const BASE = `${API_BASE}/api/cart`;
const STORAGE_KEY_PREFIX = "stanari_cart_v1:";
let forceLocal = false;

function getUserIdFromSession() {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id ?? u?.userId ?? u?.korisnikId ?? null;
  } catch {
    return null;
  }
}

function getStorageKey() {
  const uid = getUserIdFromSession();
  return `${STORAGE_KEY_PREFIX}${uid ?? "guest"}`;
}

function loadLocalItems() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

function saveLocalItems(items) {
  localStorage.setItem(getStorageKey(), JSON.stringify(items || []));
}

function extractItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function notifyCartUpdated(items) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items } }));
}

function shouldUseLocal(err) {
  if (!err) return false;
  if (err.status === 404) return true;
  const msg = String(err.message || "");
  return msg.includes("\"status\":404") || /not found/i.test(msg);
}

function toWorkshopItem(workshopId, details = {}) {
  const title =
    details?.title ||
    details?.nazivRadionica ||
    details?.name ||
    `Radionica #${workshopId}`;
  const price = Number(details?.price ?? details?.cijena ?? details?.cijenaRadionica ?? 0);
  const meta = details?.meta || {
    dateISO: details?.dateISO || details?.startDateTime || details?.date || null,
    location: details?.location || details?.lokacija || null,
  };
  return {
    id: `workshop:${workshopId}`,
    type: "workshop",
    title,
    price,
    qty: 1,
    meta,
  };
}

function toProductItem(productId, qty, details = {}) {
  const title =
    details?.title ||
    details?.opisProizvod ||
    details?.nazivProizvod ||
    details?.name ||
    `Proizvod #${productId}`;
  const price = Number(details?.price ?? details?.cijenaProizvod ?? 0);
  const meta = details?.meta || {
    category: details?.category || details?.kategorijaProizvod || null,
  };
  return {
    id: `product:${productId}`,
    type: "product",
    title,
    price,
    qty: Number(qty || 1),
    meta,
  };
}

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

  if (!res.ok) {
    const err = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (!contentType.includes("application/json")) {
    // backend može vratiti empty body kod DELETE
    return text ? JSON.parse(text) : null;
  }
  return text ? JSON.parse(text) : null;
}

// GET /api/cart  -> { items: [...] } ili [...]
export async function getCart() {
  if (forceLocal) {
    const items = loadLocalItems();
    notifyCartUpdated(items);
    return { items };
  }
  try {
    const data = await fetchJson(`${BASE}`);
    const items = extractItems(data);
    if (items.length) notifyCartUpdated(items);
    return data;
  } catch (e) {
    if (shouldUseLocal(e)) {
      forceLocal = true;
      const items = loadLocalItems();
      notifyCartUpdated(items);
      return { items };
    }
    throw e;
  }
}

// POST /api/cart/items  body: { type: "workshop", workshopId, qty: 1 }
export async function addWorkshopToCart(workshopId, qty = 1, details = {}) {
  if (!forceLocal) {
    try {
      const data = await fetchJson(`${BASE}/items`, {
        method: "POST",
        body: JSON.stringify({ type: "workshop", workshopId, qty }),
      });
      const items = extractItems(data);
      if (items.length) notifyCartUpdated(items);
      return data;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  const items = loadLocalItems();
  const id = `workshop:${workshopId}`;
  const existing = items.find((x) => x.id === id);
  if (!existing) {
    items.push(toWorkshopItem(workshopId, details));
  }
  saveLocalItems(items);
  notifyCartUpdated(items);
  return { items };
}

// POST /api/cart/items  body: { type: "product", productId, qty: 1 }
export async function addProductToCart(productId, qty = 1, details = {}) {
  if (!forceLocal) {
    try {
      const data = await fetchJson(`${BASE}/items`, {
        method: "POST",
        body: JSON.stringify({ type: "product", productId, qty }),
      });
      const items = extractItems(data);
      if (items.length) notifyCartUpdated(items);
      return data;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  const items = loadLocalItems();
  const id = `product:${productId}`;
  const existing = items.find((x) => x.id === id);
  if (!existing) {
    items.push(toProductItem(productId, 1, details));
  } else {
    existing.qty = 1;
  }
  saveLocalItems(items);
  notifyCartUpdated(items);
  return { items };
}

// PATCH /api/cart/items/:itemId  body: { qty }
export async function updateCartItemQty(itemId, qty) {
  if (!forceLocal) {
    try {
      const data = await fetchJson(`${BASE}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ qty }),
      });
      const items = extractItems(data);
      if (items.length) notifyCartUpdated(items);
      return data;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  const items = loadLocalItems();
  const q = Math.max(1, Number(qty || 1));
  const next = items.map((x) => (x.id === itemId ? { ...x, qty: q } : x));
  saveLocalItems(next);
  notifyCartUpdated(next);
  return { items: next };
}

// DELETE /api/cart/items/:itemId
export async function removeCartItem(itemId) {
  if (!forceLocal) {
    try {
      const data = await fetchJson(`${BASE}/items/${itemId}`, { method: "DELETE" });
      const items = extractItems(data);
      if (items.length) notifyCartUpdated(items);
      return data;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  const items = loadLocalItems().filter((x) => x.id !== itemId);
  saveLocalItems(items);
  notifyCartUpdated(items);
  return { items };
}

// DELETE /api/cart (clear)
export async function clearCart() {
  if (!forceLocal) {
    try {
      const data = await fetchJson(`${BASE}`, { method: "DELETE" });
      const items = extractItems(data);
      if (items.length) notifyCartUpdated(items);
      return data;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  saveLocalItems([]);
  notifyCartUpdated([]);
  return { items: [] };
}
