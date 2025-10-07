import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) { setToken(t); try { setUser(JSON.parse(u)); } catch {} }
    setLoading(false);
  }, []);

  const login = (t, u) => { localStorage.setItem("token", t); localStorage.setItem("user", JSON.stringify(u)); setToken(t); setUser(u); };
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setToken(null); setUser(null); };

  const value = useMemo(() => ({ user, token, login, logout, loading }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
