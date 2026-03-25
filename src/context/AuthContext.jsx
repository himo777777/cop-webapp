import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("cop_auth"))?.user || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("cop_auth"))?.token || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const api = useCallback(async (path, opts = {}) => {
    const headers = { "Content-Type": "application/json", ...opts.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    if (res.status === 401) { setUser(null); setToken(null); throw new Error("Session utgangen"); }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `API error ${res.status}`);
    }
    return res.json();
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Felaktigt anvandarnamn eller losenord");
      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      try { sessionStorage.setItem("cop_auth", JSON.stringify({ token: data.access_token, user: data.user })); } catch {}
      return data;
    } finally { setLoading(false); }
  };

  const logout = () => {
    setUser(null); setToken(null);
    try { sessionStorage.removeItem("cop_auth"); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, api, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
