import React, { useEffect, useRef, useState } from "react";

export default function GoogleAuthButton({ mode = "login", onSuccess, onPrefill, text, size = "large" }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const ensureScript = () => {
    return new Promise((resolve) => {
      const existing = document.querySelector('script[src^="https://accounts.google.com/gsi/client"]');
      if (existing) {
        if (window.google?.accounts?.id) return resolve(true);
        existing.addEventListener("load", () => resolve(true), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(true);
      document.head.appendChild(s);
    });
  };

  useEffect(() => {
    if (!clientId) return;
    ensureScript().then(() => setReady(true));
  }, [clientId]);

  useEffect(() => {
    if (!ready || !containerRef.current || !clientId) return;
    const google = window.google;
    if (!google?.accounts?.id) return;

    const handleCredential = async (response) => {
      try {
        const idToken = response?.credential;
        if (!idToken) return;

        if (mode === "prefill") {
          const info = decodeJwt(idToken);
          const firstName = info?.given_name || info?.name?.split(" ")?.[0] || "";
          const lastName = info?.family_name || (info?.name?.split(" ")?.slice(1)?.join(" ") ?? "");
          const email = info?.email || "";
          onPrefill?.({ firstName, lastName, email });
        } else {
          const API = import.meta.env.VITE_API_URL;
          const res = await fetch(`${API}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken }),
          });
          if (!res.ok) {
            const msg = await res.text().catch(() => "");
            throw new Error(msg || "Google login failed");
          }
          const data = await res.json();
          onSuccess?.(data?.user || data?.data?.user || null);
        }
      } catch (e) {
        console.error(e);
        alert(e.message || "Google authentication failed");
      }
    };

    try {
      google.accounts.id.initialize({ client_id: clientId, callback: handleCredential, auto_select: false });
      containerRef.current.innerHTML = ""; // clear existing
      google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size,
        text: mode === "login" ? "signin_with" : "continue_with",
        type: "standard",
        shape: "rectangular",
        logo_alignment: "left",
      });
      try { google.accounts.id.prompt(); } catch {}
    } catch (e) {
      console.warn("Google button render failed:", e);
    }
  }, [ready, clientId, mode, onSuccess, onPrefill, size]);

  const fallbackLabel = text || (mode === "login" ? "Prijavi se Google računom" : "Popuni iz Google računa");

  const handleFallbackClick = async () => {
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set; cannot initialize Google Sign-In");
      alert("Google prijava nije konfigurirana. Postavite VITE_GOOGLE_CLIENT_ID i ponovno pokrenite frontend.");
      return;
    }
    await ensureScript();
    setReady(true);
    try { window.google?.accounts?.id?.prompt(); } catch {}
  };

  const canShowOfficial = !!clientId && ready && !!window.google?.accounts?.id;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div ref={containerRef} style={{ display: canShowOfficial ? "block" : "none" }} />
      {!canShowOfficial && (
        <button
          type="button"
          onClick={handleFallbackClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            border: "1px solid #dadce0",
            borderRadius: 4,
            background: "#fff",
            color: "#3c4043",
            fontSize: 14,
            cursor: clientId ? "pointer" : "not-allowed",
            opacity: clientId ? 1 : 0.7,
          }}
          disabled={!clientId}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.91 29.223 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.676 5.119 29.632 3 24 3 12.954 3 4 11.954 4 23s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.297 16.472 18.779 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.676 5.119 29.632 3 24 3 16.318 3 9.656 7.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 43c5.166 0 9.86-1.977 13.409-5.191l-6.197-5.238C29.223 36 24 36 24 36c-5.202 0-9.57 3.071-11.381 7.454L6.5 43.5C9.822 46.32 16.394 43 24 43z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.725 3.257-5.37 6-11.303 6 0 0 5.223 0 7.212-3.429l7.429 6.5C41.18 34.977 44 29.5 44 23c0-1.341-.138-2.651-.389-3.917z"/>
          </svg>
          <span>{fallbackLabel}</span>
        </button>
      )}
    </div>
  );
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    try {
      const payload = token.split(".")[1];
      const json = atob(payload);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
