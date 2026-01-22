// ../api/workshops.js
const BASE_URL = import.meta.env.VITE_API_URL || "";

async function http(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  console.log(`[DEBUG_LOG] workshop API call: ${url}`, options);

  const {
    method = "GET",
    headers = {},
    body = undefined,
    rawBody = false, // ako je true, ne JSON.stringify (korisno za FormData)
  } = options;

  try {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: rawBody ? { ...(headers || {}) } : { "Content-Type": "application/json", ...(headers || {}) },
      body: body == null ? undefined : rawBody ? body : JSON.stringify(body),
    });

    console.log(`[DEBUG_LOG] workshop API response status: ${res.status}`);

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");

    // pokušaj parse JSON ako je JSON, inače ostavi text
    const data = contentType.includes("application/json")
      ? (() => {
          try {
            return JSON.parse(text || "{}");
          } catch {
            return {};
          }
        })()
      : text;

    if (!res.ok) {
      console.error(`[DEBUG_LOG] workshop API error:`, data);

      // backend možda vraća {message}, ili plain text
      const msg =
        (data && typeof data === "object" && data.message) ||
        (typeof data === "string" && data) ||
        "Request failed";

      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error(`[DEBUG_LOG] workshop API fetch exception:`, err);
    throw err;
  }
}

/* ---------- CRUD ---------- */
export function createWorkshop(payload) {
  return http("/api/workshops", { method: "POST", body: payload });
}

export function listWorkshops() {
  return http("/api/workshops");
}

/* ---------- Reservations ---------- */
export function applyToWorkshop(id, userId) {
  return http(`/api/workshops/${id}/apply`, { method: "POST", body: { userId } });
}

/**
 * Jednostavna varijanta (ako backend implementira samo POST /cancel)
 */
export function cancelWorkshop(id, userId) {
  return http(`/api/workshops/${id}/cancel`, { method: "POST", body: { userId } });
}

/**
 * Fallback varijanta: prvo DELETE /reservations/:userId, ako backend to ima.
 * Ako nema, pređe na POST /cancel.
 *
 * Backend može implementirati:
 *  - DELETE /api/workshops/:workshopId/reservations/:userId
 *    ili
 *  - POST   /api/workshops/:workshopId/cancel { userId }
 *
 * Frontend je spreman za oba.
 */
export async function cancelWorkshopReservation(workshopId, userId) {
  if (!workshopId) throw new Error("Nedostaje workshopId.");
  if (userId == null) throw new Error("Nedostaje userId.");

  try {
    return await http(`/api/workshops/${workshopId}/reservations/${userId}`, { method: "DELETE" });
  } catch (e) {
    return await http(`/api/workshops/${workshopId}/cancel`, { method: "POST", body: { userId } });
  }
}

export function getReservedWorkshopIds(userId) {
  const url = `/api/workshops/reserved?userId=${encodeURIComponent(userId)}`;
  return http(url);
}

/* ---------- Photos ---------- */
export async function uploadWorkshopPhotos(id, files) {
  const fd = new FormData();
  (files || []).forEach((f) => fd.append("images", f));

  // ide kroz isti http, ali rawBody = true da ne dira FormData
  const data = await http(`/api/workshops/${id}/photos`, {
    method: "POST",
    rawBody: true,
    body: fd,
  });

  // očekujemo array urlova ili objekata
  return Array.isArray(data) ? data : [];
}
