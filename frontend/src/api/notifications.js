const API = import.meta.env.VITE_API_URL || "";

function getCookie(name = "XSRF-TOKEN") {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

async function patchJsonWithCsrf(path, data) {
  const token = getCookie();
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-XSRF-TOKEN": token } : {}),
    },
    credentials: "include",
    body: JSON.stringify(data ?? {}),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function setNotificationsPreference(userId, enabled) {
  if (userId == null) throw new Error("Missing userId");
  return patchJsonWithCsrf(`/api/users/${userId}/notifications`, { enabled: !!enabled });
}
