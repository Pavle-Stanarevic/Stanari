const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function http(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function createWorkshop(payload) {
  return http("/api/workshops", { method: "POST", body: payload });
}

export function listWorkshops() {
  return http("/api/workshops");
}

export function applyToWorkshop(id, userId) {
  return http(`/api/workshops/${id}/apply`, { method: "POST", body: { userId } });
}

export function cancelWorkshop(id, userId) {
  return http(`/api/workshops/${id}/cancel`, { method: "POST", body: { userId } });
}

export function getReservedWorkshopIds(userId) {
  const url = `/api/workshops/reserved?userId=${encodeURIComponent(userId)}`;
  return http(url);
}
