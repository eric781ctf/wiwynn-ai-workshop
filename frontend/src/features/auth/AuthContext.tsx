import * as React from "react";
import * as authApi from "./api";
import type { AuthUser } from "./api";
import { getToken, setToken } from "@/lib/api-client";

const USER_KEY = "vms.user";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    token: null,
    isReady: false,
  });

  React.useEffect(() => {
    const token = getToken();
    const user = readStoredUser();
    setState({
      user: token && user ? user : null,
      token: token && user ? token : null,
      isReady: true,
    });
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setState({ user: res.user, token: res.token, isReady: true });
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort
    }
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isReady: true });
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
