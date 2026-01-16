const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function http(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function getOrganizator(organizatorId) {
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}`);
}

// type: "past" | "upcoming"
export function getOrganizatorRadionice(organizatorId, type) {
  const t = type ? `?type=${encodeURIComponent(type)}` : "";
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}/radionice${t}`);
}

// type: "past" | "upcoming"
export function getOrganizatorIzlozbe(organizatorId, type) {
  const t = type ? `?type=${encodeURIComponent(type)}` : "";
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}/izlozbe${t}`);
}

export function getOrganizatorProizvodi(organizatorId) {
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}/proizvodi`);
}
