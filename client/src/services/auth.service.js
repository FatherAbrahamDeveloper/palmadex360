import axios from "axios";

const API_URL =
  //import.meta.env.VITE_API_URL ||  "http://localhost:5000/api/v1";
  import.meta.env.VITE_API_URL ||  "https://api.renamyconnect.com/api/v1";

const TOKEN_KEY = "token";

const authService = {
  async login(email, password) {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      {
        email,
        password,
      }
    );

    const token = response.data?.token;

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    return response.data;
  },

  async register(data) {
    const response = await axios.post(
      `${API_URL}/auth/register`,
      data
    );

    const token = response.data?.token;

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    return response.data;
  },

  async logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async me() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return null;
    }

    const response = await axios.get(
      `${API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};

export default authService;
