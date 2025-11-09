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
  const [user, setUser] = useState(undefined);

  const signIn = (u) => {
    setUser(u);
    if (u) sessionStorage.setItem("user", JSON.stringify(u));
    else sessionStorage.removeItem("user");
  };

  const signOut = async () => {
    try { await logout(); } catch {}
    setUser(null);
    sessionStorage.removeItem("user");
  };

  useEffect(() => {
    // može ostati tvoj postojeći me() poziv; ako vrati null → nije ulogiran
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

