const BASE_URL = import.meta.env.VITE_API_URL || "";

async function http(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  console.log(`[DEBUG_LOG] organisers API call: ${url}`, options);
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    console.log(`[DEBUG_LOG] organisers API response status: ${res.status}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[DEBUG_LOG] organisers API error:`, data);
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (err) {
    console.error(`[DEBUG_LOG] organisers API fetch exception:`, err);
    throw err;
  }
}

export function getOrganizator(organizatorId) {
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}`);
}

export function getOrganizatorRadionice(organizatorId, type) {
  const t = type ? `?type=${encodeURIComponent(type)}` : "";
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}/radionice${t}`);
}

export function getOrganizatorIzlozbe(organizatorId, type) {
  const t = type ? `?type=${encodeURIComponent(type)}` : "";
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}/izlozbe${t}`);
}

export function getOrganizatorProizvodi(organizatorId) {
  return http(`/api/organizatori/${encodeURIComponent(organizatorId)}/proizvodi`);
}
