// frontend/src/api/exhibitions.js

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

  const text = await res.text();

  // probaj parsirati JSON ako može
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    // backend ti često vraća plain text; u erroru ćeš to vidjeti
    const msg =
      (data && (data.message || data.error)) ||
      (typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/* -------------------- Exhibitions (public) -------------------- */

// GET /api/exhibitions
export function listExhibitions() {
  return fetchJson("/api/exhibitions");
}

/**
 * VAŽNO:
 * Tvoj backend NEMA GET /api/exhibitions/:id
 * Zato ovu funkciju implementiramo preko listExhibitions() + find.
 * I dalje su svi podaci iz baze/backenda.
 */
export async function getExhibitionById(id) {
  const all = await listExhibitions();
  const arr = Array.isArray(all) ? all : [];
  const wanted = Number(id);

  return (
    arr.find((x) => Number(x?.id ?? x?.idIzlozba ?? x?.exhibitionId) === wanted) || null
  );
}

// POST /api/exhibitions  (multipart: title, location, description, startDateTime, organizerId, images[])
export function createExhibition(
  { title, location, description, startDateTime, organizerId },
  files = []
) {
  const fd = new FormData();
  fd.append("title", title);
  fd.append("location", location);
  if (description != null) fd.append("description", description);
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

/* -------------------- Comments -------------------- */

// GET /api/exhibitions/:id/comments
export function listExhibitionComments(id) {
  return fetchJson(`/api/exhibitions/${id}/comments`);
}

// POST /api/exhibitions/:id/comments  body: { userId, text }
export function createExhibitionComment(id, userId, text) {
  return fetchJson(`/api/exhibitions/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ userId, text }),
  });
}

/* -------------------- Organizer: applications list + decision --------------------
   OVO NEĆE RADITI dok backend ne doda rute.
   Ali neće ti rušiti app dok ih ne koristiš.
*/

// GET /api/exhibitions/:id/applications?organizerId=...
export function listExhibitionApplicationsByExhibition(exhibitionId, organizerId) {
  const qs =
    organizerId != null ? `?organizerId=${encodeURIComponent(organizerId)}` : "";
  return fetchJson(`/api/exhibitions/${exhibitionId}/applications${qs}`);
}

// PATCH /api/exhibitions/:exhibitionId/applications/:applicationId/decision
// body: { organizerId, decision }  decision: "ACCEPT" | "REJECT"
export function decideExhibitionApplication(
  exhibitionId,
  applicationId,
  organizerId,
  decision
) {
  return fetchJson(
    `/api/exhibitions/${exhibitionId}/applications/${applicationId}/decision`,
    {
      method: "PATCH",
      body: JSON.stringify({ organizerId, decision }),
    }
  );
}
