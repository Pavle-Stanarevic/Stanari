// frontend/src/api/auth.js

const API = import.meta.env.VITE_API_URL; // npr. http://localhost:8080

// --- helperi ---
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

// --- LOGIN: najprije pokušaj JSON /api/auth/login (JWT), ako je 404 probaj /login (session) ---
export async function login(email, password) {
  // 1) JSON/JWT pokušaj
  try {
    const r = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) {
      const data = await r.json().catch(() => ({}));
      return { mode: "jwt", data }; // npr. { token, user }
    }
    if (r.status !== 404) throw new Error("Invalid credentials");
    // 404 -> probaj form-login ispod
  } catch {
    // padni na form login
  }

  // 2) Spring form-login (session cookie)
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

// --- ME: toleriraj 404 (ako endpoint ne postoji na ovoj grani) ---
export async function me() {
  try {
    const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
    if (res.status === 404) return null;
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

// --- LOGOUT ---
export async function logout() {
  const csrf = getCookie();
  return fetch(`${API}/logout`, {
    method: "POST",
    credentials: "include",
    headers: csrf ? { "X-XSRF-TOKEN": csrf } : {},
  });
}

// --- REGISTER ---
// Ako backend ima 1 endpoint:
export async function register(data) {
  return postJsonWithCsrf(`/api/auth/register`, data);
}

// Ako backend ima 2 endpointa, koristi ove iz svojih stranica:
// import { registerPolaznik as register } from "../api/auth";
// import { registerOrganizator as register } from "../api/auth";
export async function registerPolaznik(data) {
  return postJsonWithCsrf(`/api/auth/register-polaznik`, data);
}
export async function registerOrganizator(data) {
  return postJsonWithCsrf(`/api/auth/register-organizator`, data);
}

// (opcionalno) default export ako negdje postoji `import api from "../api/auth"`
const api = { login, me, logout, register, registerPolaznik, registerOrganizator };
export default api;
