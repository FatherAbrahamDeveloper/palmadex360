import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://palmadex360.onrender.com/api/v1",
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
    const status = error.response?.status;
    const url = error.config?.url || "";
    // A failed sign-in also returns 401; only an expired session should redirect.
    const isAuthAttempt = /\/auth\/(login|register|verify-email|reset-password|forgot-password|resend-verification)/.test(url);

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem("token");
      const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/supplier-application"];
      if (!publicPaths.some((p) => window.location.pathname.startsWith(p))) {
        window.location.href = "/login";
      }
    }

    if (status === 403 && error.response?.data?.code === "FACE_ENROLLMENT_REQUIRED") {
      window.dispatchEvent(new CustomEvent("palmadex:face-required"));
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

// Commodity quality checklists (QA/QC), part of Procurement.
const qaPath = (p = "") => `/procurement/qa${p}`;
const qaId = (id) => encodeURIComponent(id);
export const qaApi = {
  options: () => api.get(qaPath("/options")).then((res) => res.data.data),
  templates: (params = {}) => api.get(qaPath("/templates"), { params }).then((res) => res.data.data),
  template: (id) => api.get(qaPath(`/templates/${qaId(id)}`)).then((res) => res.data.data),
  createTemplate: (data) => api.post(qaPath("/templates"), data).then((res) => res.data.data),
  updateTemplate: (id, data) => api.patch(qaPath(`/templates/${qaId(id)}`), data).then((res) => res.data.data),
  removeTemplate: (id) => api.delete(qaPath(`/templates/${qaId(id)}`)).then((res) => res.data),
  list: (params = {}) => api.get(qaPath("/inspections"), { params }).then((res) => res.data),
  get: (id) => api.get(qaPath(`/inspections/${qaId(id)}`)).then((res) => res.data.data),
  create: (data) => api.post(qaPath("/inspections"), data).then((res) => res.data.data),
  update: (id, data) => api.patch(qaPath(`/inspections/${qaId(id)}`), data).then((res) => res.data.data),
  submit: (id, data) => api.post(qaPath(`/inspections/${qaId(id)}/submit`), data).then((res) => res.data.data),
  override: (id, data) => api.post(qaPath(`/inspections/${qaId(id)}/override`), data).then((res) => res.data.data),
  remove: (id) => api.delete(qaPath(`/inspections/${qaId(id)}`)).then(() => true),
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

const enc = encodeURIComponent;
const data = (res) => res.data;

export const authApi = {
  login: (body) => api.post("/auth/login", body).then(data),
  loginTwoFactor: (body) => api.post("/auth/login/2fa", body).then(data),
  register: (body) => api.post("/auth/register", body).then(data),
  me: () => api.get("/auth/me").then(data),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }).then(data),
  resendVerification: (email) => api.post("/auth/resend-verification", { email }).then(data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }).then(data),
  resetPassword: (body) => api.post("/auth/reset-password", body).then(data),
  updateProfile: (body) => api.patch("/auth/me", body).then(data),
  changePassword: (body) => api.post("/auth/change-password", body).then(data),
  logoutAll: () => api.post("/auth/logout-all").then(data),
  setupTwoFactor: () => api.post("/auth/2fa/setup").then(data),
  enableTwoFactor: (code) => api.post("/auth/2fa/enable", { code }).then(data),
  disableTwoFactor: (body) => api.post("/auth/2fa/disable", body).then(data),
  enrollFace: (image) => api.post("/auth/face", { image, consent: true }).then(data),
  myFace: () => api.get("/auth/face", { responseType: "blob" }).then(data),
};

export const userApi = {
  list: (params = {}) => api.get("/users", { params }).then(data),
  stats: () => api.get("/users/stats").then((r) => r.data.data),
  get: (id) => api.get(`/users/${enc(id)}`).then((r) => r.data.data),
  invite: (body) => api.post("/users", body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/users/${enc(id)}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/users/${enc(id)}`),
  approve: (id, body) => api.post(`/users/${enc(id)}/approve`, body).then((r) => r.data.data),
  reject: (id, body) => api.post(`/users/${enc(id)}/reject`, body).then((r) => r.data.data),
  action: (id, action) => api.post(`/users/${enc(id)}/${action}`).then(data),
  face: (id) => api.get(`/users/${enc(id)}/face`, { responseType: "blob" }).then(data),
  reviewFace: (id, body) => api.post(`/users/${enc(id)}/face/review`, body).then((r) => r.data.data),
};

export const accessApi = {
  meta: () => api.get("/access/meta").then((r) => r.data.data),
  matrix: () => api.get("/access/permissions").then((r) => r.data.data),
  update: (changes) => api.put("/access/permissions", { changes }).then((r) => r.data.data),
  reset: (role) => api.post("/access/permissions/reset", { role }).then((r) => r.data.data),
};

export const customerApi = {
  list: (params = {}) => api.get("/customers", { params }).then(data),
  options: () => api.get("/customers/options").then((r) => r.data.data),
  get: (id) => api.get(`/customers/${enc(id)}`).then((r) => r.data.data),
  create: (body) => api.post("/customers", body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/customers/${enc(id)}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/customers/${enc(id)}`),
};

const withCustomer = (customerId, params = {}) => ({ params: { ...params, ...(customerId ? { customerId } : {}) } });
export const portalApi = {
  summary: (customerId) => api.get("/portal/summary", withCustomer(customerId)).then((r) => r.data.data),
  catalog: (q) => api.get("/portal/catalog", { params: { q } }).then((r) => r.data.data),
  orders: (customerId, params) => api.get("/portal/orders", withCustomer(customerId, params)).then(data),
  order: (customerId, id) => api.get(`/portal/orders/${enc(id)}`, withCustomer(customerId)).then((r) => r.data.data),
  placeOrder: (body) => api.post("/portal/orders", body).then((r) => r.data.data),
  cancelOrder: (id) => api.post(`/portal/orders/${enc(id)}/cancel`).then((r) => r.data.data),
  shipments: (customerId) => api.get("/portal/shipments", withCustomer(customerId)).then((r) => r.data.data),
  invoices: (customerId) => api.get("/portal/invoices", withCustomer(customerId)).then((r) => r.data.data),
  documents: (customerId) => api.get("/portal/documents", withCustomer(customerId)).then((r) => r.data.data),
};

export const communicationApi = {
  directory: (q) => api.get("/communication/directory", { params: { q } }).then((r) => r.data.data),
  conversations: (q) => api.get("/communication/conversations", { params: { q } }).then((r) => r.data.data),
  unread: () => api.get("/communication/unread").then((r) => r.data.data.unread),
  create: (body) => api.post("/communication/conversations", body).then((r) => r.data.data),
  get: (id) => api.get(`/communication/conversations/${enc(id)}`).then((r) => r.data.data),
  rename: (id, title) => api.patch(`/communication/conversations/${enc(id)}`, { title }).then((r) => r.data.data),
  addMembers: (id, userIds) => api.post(`/communication/conversations/${enc(id)}/members`, { userIds }).then((r) => r.data.data),
  leave: (id) => api.delete(`/communication/conversations/${enc(id)}/members/me`),
  messages: (id, params) => api.get(`/communication/conversations/${enc(id)}/messages`, { params }).then(data),
  send: (id, body) => api.post(`/communication/conversations/${enc(id)}/messages`, body).then((r) => r.data.data),
  edit: (messageId, content) => api.patch(`/communication/messages/${enc(messageId)}`, { content }).then((r) => r.data.data),
  remove: (messageId) => api.delete(`/communication/messages/${enc(messageId)}`),
  read: (id) => api.post(`/communication/conversations/${enc(id)}/read`),
};

export const supportApi = {
  list: (params = {}) => api.get("/support/tickets", { params }).then(data),
  stats: () => api.get("/support/stats").then((r) => r.data.data),
  agents: () => api.get("/support/agents").then((r) => r.data.data),
  create: (body) => api.post("/support/tickets", body).then((r) => r.data.data),
  get: (id) => api.get(`/support/tickets/${enc(id)}`).then((r) => r.data.data),
  reply: (id, body) => api.post(`/support/tickets/${enc(id)}/messages`, body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/support/tickets/${enc(id)}`, body).then((r) => r.data.data),
  close: (id) => api.post(`/support/tickets/${enc(id)}/close`).then((r) => r.data.data),
  reopen: (id) => api.post(`/support/tickets/${enc(id)}/reopen`).then((r) => r.data.data),
  remove: (id) => api.delete(`/support/tickets/${enc(id)}`),
};

export const knowledgeApi = {
  categories: () => api.get("/knowledge/categories").then((r) => r.data.data),
  createCategory: (body) => api.post("/knowledge/categories", body).then((r) => r.data.data),
  updateCategory: (id, body) => api.patch(`/knowledge/categories/${enc(id)}`, body).then((r) => r.data.data),
  removeCategory: (id) => api.delete(`/knowledge/categories/${enc(id)}`),
  list: (params = {}) => api.get("/knowledge/articles", { params }).then(data),
  get: (idOrSlug, preview) => api.get(`/knowledge/articles/${enc(idOrSlug)}`, { params: preview ? { preview: 1 } : {} }).then((r) => r.data.data),
  create: (body) => api.post("/knowledge/articles", body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/knowledge/articles/${enc(id)}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/knowledge/articles/${enc(id)}`),
  feedback: (id, helpful) => api.post(`/knowledge/articles/${enc(id)}/feedback`, { helpful }).then((r) => r.data.data),
};

export const dashboardApi = {
  summary: () => api.get("/dashboard/summary").then((r) => r.data.data),
  activity: (params = {}) => api.get("/activity", { params }).then((r) => r.data.data),
};

export const notificationApi = {
  list: (params = {}) => api.get("/notifications", { params }).then(data),
  read: (id) => api.post(`/notifications/${enc(id)}/read`),
  readAll: () => api.post("/notifications/read-all"),
};

export const reportApi = {
  overview: (params = {}) => api.get("/reports/overview", { params }).then((r) => r.data.data),
  monthly: (month) => api.get("/reports/monthly", { params: { month } }).then((r) => r.data.data),
  // Downloads a CSV with the session token, then saves it in the browser.
  async download(dataset, params = {}) {
    const res = await api.get("/reports/export", { params: { dataset, ...params }, responseType: "blob" });
    const name = /filename="([^"]+)"/.exec(res.headers["content-disposition"] || "")?.[1] || `${dataset}.csv`;
    const url = URL.createObjectURL(res.data);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export const fileApi = {
  upload: (files, extra = {}) => {
    const form = new FormData();
    [...files].forEach((f) => form.append("files", f));
    Object.entries(extra).forEach(([k, v]) => v && form.append(k, v));
    return api.post("/files/upload", form).then((r) => r.data.files);
  },
  update: (id, body) => api.patch(`/files/${enc(id)}`, body).then((r) => r.data.file),
};

export const globalSearchApi = {
  search: (query, signal) =>
    api.get("/search", {
      params: { q: query },
      signal,
    }).then((res) => res.data),
};

export default api;
