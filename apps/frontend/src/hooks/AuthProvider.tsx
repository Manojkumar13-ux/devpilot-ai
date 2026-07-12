import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, setAuthToken } from "../lib/api";
import type { User } from "@devpilot/shared";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("accessToken");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setAuthToken(token);
      api.auth.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("accessToken");
          setAuthToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const data = await api.auth.login({ email, password });
    setAuthToken(data.tokens.accessToken);
    localStorage.setItem("accessToken", data.tokens.accessToken);
    setUser(data.user);
  }

  async function register(email: string, password: string, username: string) {
    const data = await api.auth.register({ email, password, username });
    setAuthToken(data.tokens.accessToken);
    localStorage.setItem("accessToken", data.tokens.accessToken);
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
