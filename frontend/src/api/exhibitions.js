const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  if (!contentType.includes("application/json")) return text ? JSON.parse(text) : null;
  return text ? JSON.parse(text) : null;
}

// GET /api/exhibitions
export function listExhibitions() {
  return fetchJson("/api/exhibitions");
}

// POST /api/exhibitions  (multipart: title, location, startDateTime, organizerId, images[])
export function createExhibition({ title, location, startDateTime, organizerId }, files = []) {
  const fd = new FormData();
  fd.append("title", title);
  fd.append("location", location);
  fd.append("startDateTime", startDateTime);
  if (organizerId != null) fd.append("organizerId", String(organizerId));

  (files || []).forEach((f) => fd.append("images", f));

  return fetchJson("/api/exhibitions", {
    method: "POST",
    body: fd,
  });
}

// POST /api/exhibitions/:id/apply  body: { userId }
export function applyToExhibition(id, userId) {
  return fetchJson(`/api/exhibitions/${id}/apply`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// GET /api/exhibitions/reserved?userId=...
export function getReservedExhibitionIds(userId) {
  return fetchJson(`/api/exhibitions/reserved?userId=${encodeURIComponent(userId)}`);
}

// GET /api/exhibitions/applications?userId=...
export function getExhibitionApplications(userId) {
  return fetchJson(`/api/exhibitions/applications?userId=${encodeURIComponent(userId)}`);
}
