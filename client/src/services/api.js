import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://api.renamyconnect.com/api/v1",
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
export const supplierApi = {
  list: (params = {}) =>
    api.get("/suppliers", { params }).then((res) => res.data),

  get: (id) =>
    api.get(`/suppliers/${encodeURIComponent(id)}`).then((res) => res.data),

  create: (data) =>
    api.post("/suppliers", data).then((res) => res.data),

  update: (id, data) =>
    api.patch(`/suppliers/${encodeURIComponent(id)}`, data).then((res) => res.data),
};

export default api;
