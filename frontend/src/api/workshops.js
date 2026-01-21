const BASE_URL = import.meta.env.VITE_API_URL || "";

async function http(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  console.log(`[DEBUG_LOG] workshop API call: ${url}`, options);
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    console.log(`[DEBUG_LOG] workshop API response status: ${res.status}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[DEBUG_LOG] workshop API error:`, data);
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (err) {
    console.error(`[DEBUG_LOG] workshop API fetch exception:`, err);
    throw err;
  }
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

export async function uploadWorkshopPhotos(id, files) {
  const fd = new FormData();
  (files || []).forEach((f) => fd.append("images", f));
  const res = await fetch(`${BASE_URL}/api/workshops/${id}/photos`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    let msg = "";
    try {
      msg = (await res.text()) || res.statusText;
    } catch {}
    throw new Error(msg || "Request failed");
  }
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}
