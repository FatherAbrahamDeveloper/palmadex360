import { authApi } from "./api";

const TOKEN_KEY = "token";

// Thin wrapper kept for existing imports. All calls go through the shared API client.
const authService = {
  login: (email, password) => authApi.login({ email, password }),
  loginTwoFactor: (challengeToken, code) => authApi.loginTwoFactor({ challengeToken, code }),
  register: (data) => authApi.register(data),
  me: () => (localStorage.getItem(TOKEN_KEY) ? authApi.me() : null),
  logout: () => localStorage.removeItem(TOKEN_KEY),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
};

export default authService;
