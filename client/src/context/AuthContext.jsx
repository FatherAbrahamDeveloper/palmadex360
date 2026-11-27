import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await authService.me();
      setUser(res?.user || null);
      return res?.user || null;
    } catch {
      authService.logout();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // The API asks for face registration: reload the user so the gate shows.
  useEffect(() => {
    const onFace = () => refresh();
    window.addEventListener("palmadex:face-required", onFace);
    return () => window.removeEventListener("palmadex:face-required", onFace);
  }, [refresh]);

  const startSession = (res) => {
    authService.setToken(res.token);
    setUser(res.user);
    return res;
  };

  // Returns { twoFactorRequired, challengeToken } when a code is still needed.
  async function login(email, password) {
    const res = await authService.login(email, password);
    if (res.twoFactorRequired) return res;
    return startSession(res);
  }

  async function loginTwoFactor(challengeToken, code) {
    return startSession(await authService.loginTwoFactor(challengeToken, code));
  }

  // New accounts wait for email verification and approval, so usually no session starts here.
  async function register(data) {
    const res = await authService.register(data);
    if (res.token) startSession(res);
    return res;
  }

  function logout() {
    authService.logout();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginTwoFactor, register, logout, refresh, setUser, startSession, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
