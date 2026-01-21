

const API = import.meta.env.VITE_API_URL || ""; 
console.log(`[DEBUG_LOG] auth.js initialized. API URL: "${API}"`);


function getCookie(name = "XSRF-TOKEN") {
  return document.cookie
    .split("; ")
    .find(r => r.startsWith(name + "="))
    ?.split("=")[1];
}

async function postJsonWithCsrf(path, data) {
  const csrf = getCookie();
  const url = `${API}${path}`;
  console.log(`[DEBUG_LOG] postJsonWithCsrf: Fetching ${url}`, { data });
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
      },
      body: JSON.stringify(data),
    });
    console.log(`[DEBUG_LOG] postJsonWithCsrf: Response status: ${res.status}`);
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.text()) || res.statusText; } catch {}
      console.error(`[DEBUG_LOG] postJsonWithCsrf: Request failed with status ${res.status}: ${msg}`);
      throw new Error(msg || "Request failed");
    }
    try {
      const json = await res.json();
      console.log(`[DEBUG_LOG] postJsonWithCsrf: Success JSON:`, json);
      return json;
    } catch {
      console.log(`[DEBUG_LOG] postJsonWithCsrf: Success (no JSON body)`);
      return {};
    }
  } catch (error) {
    console.error(`[DEBUG_LOG] postJsonWithCsrf: FETCH ERROR:`, error);
    throw error;
  }
}

async function putJsonWithCsrf(path, data) {
  const csrf = getCookie();
  const url = `${API}${path}`;
  console.log(`[DEBUG_LOG] putJsonWithCsrf: Fetching ${url}`, { data });
  try {
    const res = await fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
      },
      body: JSON.stringify(data),
    });
    console.log(`[DEBUG_LOG] putJsonWithCsrf: Response status: ${res.status}`);
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.text()) || res.statusText; } catch {}
      console.error(`[DEBUG_LOG] putJsonWithCsrf: Request failed with status ${res.status}: ${msg}`);
      throw new Error(msg || "Request failed");
    }
    try {
      const json = await res.json();
      console.log(`[DEBUG_LOG] putJsonWithCsrf: Success JSON:`, json);
      return json;
    } catch {
      console.log(`[DEBUG_LOG] putJsonWithCsrf: Success (no JSON body)`);
      return {};
    }
  } catch (error) {
    console.error(`[DEBUG_LOG] putJsonWithCsrf: FETCH ERROR:`, error);
    throw error;
  }
}

async function postMultipartWithCsrf(path, formData) {
  const csrf = getCookie();
  const url = `${API}${path}`;
  console.log(`[DEBUG_LOG] postMultipartWithCsrf: Fetching ${url}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        ...(csrf ? { "X-XSRF-TOKEN": csrf } : {}),
      },
      body: formData,
    });
    console.log(`[DEBUG_LOG] postMultipartWithCsrf: Response status: ${res.status}`);
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.text()) || res.statusText; } catch {}
      console.error(`[DEBUG_LOG] postMultipartWithCsrf: Request failed with status ${res.status}: ${msg}`);
      throw new Error(msg || "Request failed");
    }
    try {
      const json = await res.json();
      console.log(`[DEBUG_LOG] postMultipartWithCsrf: Success JSON:`, json);
      return json;
    } catch {
      console.log(`[DEBUG_LOG] postMultipartWithCsrf: Success (no JSON body)`);
      return {};
    }
  } catch (error) {
    console.error(`[DEBUG_LOG] postMultipartWithCsrf: FETCH ERROR:`, error);
    throw error;
  }
}


export async function login(email, password) {
  try {
    console.log(`[DEBUG_LOG] login: Attempting login for ${email}`);
    const r = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) {
      const data = await r.json().catch(() => ({}));
      console.log(`[DEBUG_LOG] login: Success. Cookie after login: ${document.cookie}`);
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

export async function me(force = false) {
  try {
    const url = `${API}/api/auth/me?t=${Date.now()}${force ? '&f=1' : ''}`;
    console.log(`[DEBUG_LOG] me: Fetching ${url}`);
    const res = await fetch(url, { credentials: "include" });
    console.log(`[DEBUG_LOG] me: Response status: ${res.status}`);
    if (res.status === 401) {
      console.log(`[DEBUG_LOG] me: Not authenticated (401). Cookie: ${document.cookie}`);
      return null;
    }
    if (res.status === 404) {
      console.log(`[DEBUG_LOG] me: Not found (404)`);
      return null;
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      console.log(`[DEBUG_LOG] me: Success (status ${res.status}):`, data);
      return data?.user ?? data; // ✅ ako backend vrati {user, token}, uzmi user
    }
    console.log(`[DEBUG_LOG] me: Request failed with status ${res.status}`);
    return null;
  } catch (error) {
    console.error(`[DEBUG_LOG] me: FETCH ERROR:`, error);
    return null;
  }
}


export async function logout() {
  const csrf = getCookie();
  return fetch(`${API}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: csrf ? { "X-XSRF-TOKEN": csrf } : {},
  });
}


export async function register(data, imageFile) {
  console.log(`[DEBUG_LOG] register called. data:`, data, `imageFile:`, imageFile);
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
  console.log("[DEBUG_LOG] registerPolaznik called", { data });
  return postJsonWithCsrf(`/api/auth/register`, { ...data, userType: "polaznik" });
}
export async function registerOrganizator(data) {
  console.log("[DEBUG_LOG] registerOrganizator called", { data });
  return postJsonWithCsrf(`/api/auth/register`, { ...data, userType: "organizator" });
}

export async function updateProfile(id, data) {
  return putJsonWithCsrf(`/api/users/${id}`, data);
}


const api = { login, me, logout, register, registerPolaznik, registerOrganizator, updateProfile };
export default api;
