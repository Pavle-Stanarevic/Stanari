

const API = import.meta.env.VITE_API_URL; 


function getCookie(name = "XSRF-TOKEN") {
  return document.cookie
    .split("; ")
    .find(r => r.startsWith(name + "="))
    ?.split("=")[1];
}

async function postJsonWithCsrf(path, data) {
  const csrf = getCookie();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.text()) || res.statusText; } catch {}
    throw new Error(msg || "Request failed");
  }
  try { return await res.json(); } catch { return {}; }
}

async function putJsonWithCsrf(path, data) {
  const csrf = getCookie();
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.text()) || res.statusText; } catch {}
    throw new Error(msg || "Request failed");
  }
  try { return await res.json(); } catch { return {}; }
}

async function postMultipartWithCsrf(path, formData) {
  const csrf = getCookie();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.text()) || res.statusText; } catch {}
    throw new Error(msg || "Request failed");
  }
  try { return await res.json(); } catch { return {}; }
}


export async function login(email, password) {
  try {
    const r = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) {
      const data = await r.json().catch(() => ({}));
      return { mode: "jwt", data }; 
    }
    if (r.status !== 404) throw new Error("Invalid credentials");

  } catch {
  }

  const body = new URLSearchParams({ username: email, password });
  const s = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    credentials: "include",
    redirect: "manual",
  });
  if (s.status === 302 || s.ok) return { mode: "session" };
  throw new Error("Invalid credentials");
}

export async function me() {
  try {
    const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
    if (res.status === 404) return null;
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}


export async function logout() {
  const csrf = getCookie();
  return fetch(`${API}/logout`, {
    method: "POST",
    credentials: "include",
    headers: csrf ? { "X-XSRF-TOKEN": csrf } : {},
  });
}


export async function register(data, imageFile) {
  if (imageFile) {
    const fd = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    fd.append("image", imageFile);
    return postMultipartWithCsrf(`/api/auth/register`, fd);
  }
  return postJsonWithCsrf(`/api/auth/register`, data);
}


export async function registerPolaznik(data) {
  return postJsonWithCsrf(`/api/auth/registerPolaznik`, data);
}
export async function registerOrganizator(data) {
  return postJsonWithCsrf(`/api/auth/registerOrganizator`, data);
}

export async function updateProfile(id, data) {
  return putJsonWithCsrf(`/api/users/${id}`, data);
}


const api = { login, me, logout, register, registerPolaznik, registerOrganizator, updateProfile };
export default api;
