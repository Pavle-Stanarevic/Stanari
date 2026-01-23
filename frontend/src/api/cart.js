const API_BASE = import.meta.env.VITE_API_URL || "";
const BASE = `${API_BASE}/api/cart`;
const STORAGE_KEY_PREFIX = "stanari_cart_v1:";
let forceLocal = false;

// dohvati ID usera
function getUserIdFromSession() {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id ?? u?.userId ?? u?.idKorisnik ?? null;
  } catch {
    return null;
  }
}


function withUser(body = {}) {
  const uid = getUserIdFromSession();
  if (uid != null) return { ...body, userId: uid };
  return body;
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

// lokalni dio kosarice - fallback ako backend ne radi
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

// backend dio kosarice
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
    idRadionica: Number(workshopId),
  };
}

function toProductItem(productId, qty, details = {}) {
  const title =
    details?.nazivProizvod ||
    details?.title ||
    details?.opisProizvod ||
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
    productId: Number(productId),
  };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
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

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  return text;
}

export async function getCart() {
  // fallback za lokalni cart
  if (forceLocal) {
    const items = loadLocalItems();
    notifyCartUpdated(items);
    return { items };
  }

  // pravi cart
  try {
    const uid = getUserIdFromSession();
    const url = uid ? `${BASE}?userId=${encodeURIComponent(uid)}` : `${BASE}`;
    const data = await fetchJson(url);
    const items = extractItems(data);

    if (items.length) notifyCartUpdated(items);
    return data;

  } catch (e) {
    // lokalni cart
    if (shouldUseLocal(e)) {
      forceLocal = true;
      const items = loadLocalItems();
      notifyCartUpdated(items);
      return { items };
    }
    throw e;
  }
}

export async function addWorkshopToCart(workshopId, qty = 1, details = {}) {
  if (!forceLocal) {
    try {
      const body = withUser({ type: "workshop",
                              workshopId: Number(workshopId),
                              qty: Number(qty),
                              title: details?.title || undefined,
                              price: details?.price ?? undefined,
                              meta: details?.meta ?? undefined });

      const data = await fetchJson(`${BASE}/items`, { method: "POST", body: JSON.stringify(body) });
      const items = extractItems(data);

      notifyCartUpdated(items);
      return items;

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
    saveLocalItems(items);
    notifyCartUpdated(items);
  }
  return items;
}

export async function addProductToCart(productId, qty = 1, details = {}) {
  if (!forceLocal) {
    try {
      const body = withUser({ type: "product",
                              productId: Number(productId),
                              qty: Number(qty),
                              title: details?.title || undefined,
                              price: details?.price ?? undefined,
                              meta: details?.meta ?? undefined });

      const data = await fetchJson(`${BASE}/items`, { method: "POST", body: JSON.stringify(body) });
      const items = extractItems(data);
      notifyCartUpdated(items);
      return items;
      
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  //lokalni dio kosarice - fallback ak ne radi back
  const items = loadLocalItems();
  const id = `product:${productId}`;
  const existing = items.find((x) => x.id === id);
  if (!existing) {
    items.push(toProductItem(productId, qty, details));
    saveLocalItems(items);
    notifyCartUpdated(items);
  }
  return items;
}

export async function addCartItem(payload) {
  if (!payload) throw new Error("Missing payload");

  if (payload.type === "product") return addProductToCart(payload.productId || payload.id || payload.productId,
                                                          payload.qty || 1,
                                                          payload);

  if (payload.type === "workshop") return addWorkshopToCart(payload.workshopId || payload.id || payload.idRadionica,
                                                            payload.qty || 1,
                                                            payload);

  throw new Error("Unknown cart item type");
}

export async function updateCartItemQty(itemId, qty) {
  if (!itemId) throw new Error("Missing itemId");
  if (!forceLocal) {
    try {
      const uid = getUserIdFromSession();
      const body = withUser({ qty: Number(qty) });
      const data = await fetchJson(`${BASE}/items/${encodeURIComponent(String(itemId))}`, { method: "PATCH", body: JSON.stringify(body) });
      const items = extractItems(data);
      notifyCartUpdated(items);
      return items;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  // lokalni dio kosarice
  const items = loadLocalItems();
  const updated = items.map((it) => (it.id === itemId ? { ...it, qty: Number(qty) } : it));
  saveLocalItems(updated);
  notifyCartUpdated(updated);
  return updated;
}

export async function removeCartItem(itemId) {
  if (!itemId) throw new Error("Missing itemId");
  if (!forceLocal) {
    try {
      const body = withUser();
      const data = await fetchJson(`${BASE}/items/${encodeURIComponent(String(itemId))}`, { method: "DELETE", body: JSON.stringify(body) });
      const items = extractItems(data);
      notifyCartUpdated(items);
      return items;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  // lokalni dio kosarice
  const items = loadLocalItems().filter((it) => it.id !== itemId);
  saveLocalItems(items);
  notifyCartUpdated(items);
  return items;
}

export async function clearCart() {
  if (!forceLocal) {
    try {
      const body = withUser();
      const data = await fetchJson(`${BASE}`, { method: "DELETE", body: JSON.stringify(body) });
      const items = extractItems(data);
      notifyCartUpdated(items);
      return items;
    } catch (e) {
      if (!shouldUseLocal(e)) throw e;
      forceLocal = true;
    }
  }

  // lokalni dio kosarice
  saveLocalItems([]);
  notifyCartUpdated([]);
  return [];
}

export async function checkoutCart() {
  if (!forceLocal) {
    try {
      const body = withUser();
      const data = await fetchJson(`${BASE}/checkout`, { method: "POST", body: JSON.stringify(body) });
      const refreshed = await getCart();
      const items = extractItems(refreshed);
      notifyCartUpdated(items);
      return data;
    } catch (e) {
      try { await getCart(); } catch {}
      throw e;
    }
  }

  //lokalni dio kosraice
  saveLocalItems([]);
  notifyCartUpdated([]);
  return { status: "ok" };
}

export async function forceUseLocalMode() {
  forceLocal = true;
}

export default {
  getCart,
  addWorkshopToCart,
  addProductToCart,
  addCartItem,
  updateCartItemQty,
  removeCartItem,
  clearCart,
  checkoutCart,
  forceUseLocalMode,
};
