import { createContext, useEffect, useState } from "react";
import { me, logout as apiLogout } from "../api/auth";

export const AuthContext = createContext({
  user: undefined,        
  setUser: () => {},
  signIn: () => {},
  signOut: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : undefined; 
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    if (user !== undefined) return;
    (async () => {
      try {
        console.log("[DEBUG_LOG] AuthProvider: user is undefined, calling me()...");
        const u = await me();
        console.log("[DEBUG_LOG] AuthProvider: me() returned", u);
        setUser(u ?? null);
        if (u) {
          sessionStorage.setItem("user", JSON.stringify(u));
        } else {
          console.log("[DEBUG_LOG] AuthProvider: user not authenticated");
          sessionStorage.removeItem("user");
        }
      } catch (err) {
        console.error("[DEBUG_LOG] AuthProvider: me() failed", err);
        setUser(null);
        sessionStorage.removeItem("user");
      }
    })();
  }, [user]);

  const signIn = (u) => {
    console.log("[DEBUG_LOG] AuthProvider: signIn called with", u);
    setUser(u);
    if (u) {
      sessionStorage.setItem("user", JSON.stringify(u));
      window.dispatchEvent(new CustomEvent("auth:updated", { detail: { user: u } }));
    }
    else sessionStorage.removeItem("user");
  };

  const signOut = async () => {
    try { await apiLogout(); } catch {}
    setUser(null);
    sessionStorage.removeItem("user");
    window.dispatchEvent(new CustomEvent("auth:updated", { detail: { user: null } }));
  };

  useEffect(() => {
    const handleAuthUpdated = (e) => {
      const newUser = e.detail?.user;
      if (newUser !== undefined) {
        console.log("[DEBUG_LOG] AuthProvider: auth:updated event received, updating user state", newUser);
        setUser(newUser);
      }
    };
    window.addEventListener("auth:updated", handleAuthUpdated);
    return () => window.removeEventListener("auth:updated", handleAuthUpdated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, signIn, signOut, isAuthenticated: !!user, isSubscribed: !!user?.isSubscribed }}>
      {children}
    </AuthContext.Provider>
  );
}
