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
        const u = await me();
        setUser(u ?? null);
        if (u) sessionStorage.setItem("user", JSON.stringify(u));
        else sessionStorage.removeItem("user");
      } catch {
        setUser(null);
        sessionStorage.removeItem("user");
      }
    })();
  }, [user]);

  const signIn = (u) => {
    setUser(u);
    if (u) sessionStorage.setItem("user", JSON.stringify(u));
    else sessionStorage.removeItem("user");
  };

  const signOut = async () => {
    try { await apiLogout(); } catch {}
    setUser(null);
    sessionStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
