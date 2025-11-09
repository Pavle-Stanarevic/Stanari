const API = import.meta.env.VITE_API_URL;

// Pokušaj prvo stari JSON/JWT login (/api/auth/login).
// Ako je 404 → automatski probaj Spring form login (/login).
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

    // ako nije 404 (npr. 401/400), tretiraj kao grešku i prekini
    if (r.status !== 404) {
      throw new Error("Invalid credentials");
    }
    // ako je 404 -> padni na form login
  } catch (_) {
    // ignoriraj i probaj form-login ispod
  }

  // 2) Spring form login pokušaj
  const body = new URLSearchParams({ username: email, password }); // Spring očekuje "username"
  const s = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    credentials: "include",
    redirect: "manual",
  });

  if (s.status === 302 || s.ok) {
    return { mode: "session" };
  }

  throw new Error("Invalid credentials");
}

// ostalo ostavi kako jest
export async function me() {
  try {
    const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
    if (res.status === 404) return null; // endpoint ne postoji na ovoj grani
    if (res.ok) return res.json();
    return null;
  } catch {
    return null;
  }
}

export async function logout() {
  return fetch(`${API}/logout`, { method: "POST", credentials: "include" });
}

export async function register(data) {
  return postJsonWithCsrf(`/api/auth/register`, data);
}
