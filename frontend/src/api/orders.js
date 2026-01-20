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
        ? "Povijest kupnje još nije dostupna (backend endpoint nije implementiran)."
        : data?.message || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function listMyPurchasedItems() {
  const data = await fetchJson(`/api/orders/my`);
  const arr = Array.isArray(data) ? data : [];

  const flat = [];
  for (const x of arr) {
    if (Array.isArray(x?.items)) flat.push(...x.items);
    else flat.push(x);
  }
  return flat;
}
