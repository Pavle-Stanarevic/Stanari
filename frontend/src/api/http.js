const API = import.meta.env.VITE_API_URL || "";

export function getCookie(name = "XSRF-TOKEN") {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

export async function requestJson(path, { method = "GET", data, headers } = {}) {
  const csrf = getCookie();

  const res = await fetch(`${API}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
      ...(headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(text || res.statusText || `HTTP ${res.status}`);
  }

  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}
