import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
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
export const getErrorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || fallback;

export const exportOrderApi = {
  list: (params = {}) => api.get("/export-orders", { params }).then((res) => res.data),
  create: (data) => api.post("/export-orders", data).then((res) => res.data),
  update: (id, data) =>
    api.patch(`/export-orders/${encodeURIComponent(id)}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/export-orders/${encodeURIComponent(id)}`).then(() => true),
  // Catalog products for the order form dropdown
  productOptions: () =>
    api
      .get("/products", { params: { limit: 100, sortBy: "name" } })
      .then((res) => res.data.data.filter((p) => p.isActive)),
};
export const shipmentApi = {
  list: (params = {}) => api.get("/shipments", { params }).then((res) => res.data),
  get: (id) => api.get(`/shipments/${encodeURIComponent(id)}`).then((res) => res.data),
  create: (data) => api.post("/shipments", data).then((res) => res.data),
  update: (id, data) =>
    api.patch(`/shipments/${encodeURIComponent(id)}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/shipments/${encodeURIComponent(id)}`).then(() => true),
};
export const warehouseApi = {
  list: () => api.get("/warehouses").then((res) => res.data),
  create: (data) => api.post("/warehouses", data).then((res) => res.data),
  update: (id, data) =>
    api.patch(`/warehouses/${encodeURIComponent(id)}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/warehouses/${encodeURIComponent(id)}`).then(() => true),
};

export const inventoryApi = {
  list: (params = {}) => api.get("/inventory", { params }).then((res) => res.data),
  create: (data) => api.post("/inventory", data).then((res) => res.data),
  update: (id, data) =>
    api.patch(`/inventory/${encodeURIComponent(id)}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/inventory/${encodeURIComponent(id)}`).then(() => true),
  movements: (id, params = {}) =>
    api.get(`/inventory/${encodeURIComponent(id)}/movements`, { params }).then((res) => res.data),
  recordMovement: (id, data) =>
    api.post(`/inventory/${encodeURIComponent(id)}/movements`, data).then((res) => res.data),
  productOptions: () =>
    api
      .get("/products", { params: { limit: 100, sortBy: "name" } })
      .then((res) => res.data.data.filter((p) => p.isActive)),
};
export const procurementApi = {
  list: (params = {}) => api.get("/procurement", { params }).then((res) => res.data),
  get: (id) => api.get(`/procurement/${encodeURIComponent(id)}`).then((res) => res.data),
  create: (data) => api.post("/procurement", data).then((res) => res.data),
  update: (id, data) =>
    api.patch(`/procurement/${encodeURIComponent(id)}`, data).then((res) => res.data),
  changeStatus: (id, data) =>
    api.post(`/procurement/${encodeURIComponent(id)}/status`, data).then((res) => res.data),
  remove: (id) => api.delete(`/procurement/${encodeURIComponent(id)}`).then(() => true),
  supplierOptions: () => api.get("/procurement/supplier-options").then((res) => res.data.data),
};
export const financeApi = {
  summary: (params = {}) => api.get("/finance/summary", { params }).then((res) => res.data),

  listInvoices: (params = {}) => api.get("/finance/invoices", { params }).then((res) => res.data),
  getInvoice: (id) => api.get(`/finance/invoices/${encodeURIComponent(id)}`).then((res) => res.data),
  createInvoice: (data) => api.post("/finance/invoices", data).then((res) => res.data),
  updateInvoice: (id, data) =>
    api.patch(`/finance/invoices/${encodeURIComponent(id)}`, data).then((res) => res.data),
  cancelInvoice: (id) =>
    api.post(`/finance/invoices/${encodeURIComponent(id)}/cancel`).then((res) => res.data),
  removeInvoice: (id) =>
    api.delete(`/finance/invoices/${encodeURIComponent(id)}`).then(() => true),
  recordPayment: (id, data) =>
    api.post(`/finance/invoices/${encodeURIComponent(id)}/payments`, data).then((res) => res.data),
  removePayment: (id, paymentId) =>
    api
      .delete(`/finance/invoices/${encodeURIComponent(id)}/payments/${encodeURIComponent(paymentId)}`)
      .then((res) => res.data),

  listExpenses: (params = {}) => api.get("/finance/expenses", { params }).then((res) => res.data),
  createExpense: (data) => api.post("/finance/expenses", data).then((res) => res.data),
  updateExpense: (id, data) =>
    api.patch(`/finance/expenses/${encodeURIComponent(id)}`, data).then((res) => res.data),
  removeExpense: (id) =>
    api.delete(`/finance/expenses/${encodeURIComponent(id)}`).then(() => true),
};
export const complianceApi = {
  // Requirements
  list: (params = {}) =>
    api.get("/compliance", { params }).then((res) => res.data),

  get: (id) =>
    api
      .get(`/compliance/${encodeURIComponent(id)}`)
      .then((res) => res.data),

  create: (data) =>
    api.post("/compliance", data).then((res) => res.data),

  update: (id, data) =>
    api
      .patch(`/compliance/${encodeURIComponent(id)}`, data)
      .then((res) => res.data),

  remove: (id) =>
    api.delete(`/compliance/${encodeURIComponent(id)}`).then(() => true),

  // History
  history: (id) =>
    api
      .get(`/compliance/${encodeURIComponent(id)}/history`)
      .then((res) => res.data),

  // Documents
  attachDocument: (id, data) =>
    api
      .post(`/compliance/${encodeURIComponent(id)}/documents`, data)
      .then((res) => res.data),

  updateDocument: (id, documentId, data) =>
    api
      .patch(
        `/compliance/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`,
        data
      )
      .then((res) => res.data),

  removeDocument: (id, documentId) =>
    api
      .delete(
        `/compliance/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`
      )
      .then(() => true),
};

export const globalSearchApi = {
  search: (query, signal) =>
    api.get("/search", {
      params: { q: query },
      signal,
    }).then((res) => res.data),
};

export default api;
