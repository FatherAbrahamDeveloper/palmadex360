// src/api/productApi.js
// Assumes an axios instance at "@/lib/api" with baseURL "/api" (or your API URL)
// and the auth token attached via an interceptor. Adjust the import if yours differs.
import api from "@/services/api";

export const productApi = {
  list: async (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    const { data } = await api.get("/products", { params: clean });
    return data; // { data: [...], meta: {...} }
  },
  categories: async () => (await api.get("/products/categories")).data.data,
  get: async (id) => (await api.get(`/products/${id}`)).data.data,
  create: async (payload) => (await api.post("/products", payload)).data.data,
  update: async (id, payload) => (await api.patch(`/products/${id}`, payload)).data.data,
  remove: async (id) => api.delete(`/products/${id}`),
};

export function getErrorMessage(err) {
  const d = err?.response?.data;
  if (d?.errors?.length) return d.errors.map((e) => `${e.field}: ${e.message}`).join(", ");
  return d?.message || err?.message || "Something went wrong";
}

export function formatPrice(p) {
  if (p.price == null) return "—";
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency || "USD",
    maximumFractionDigits: 2,
  }).format(p.price);
  return p.unit ? `${amount}/${p.unit}` : amount;
}

export function formatStock(p) {
  const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(p.stockQuantity);
  return p.unit && p.unit !== "service" ? `${qty} ${p.unit}${p.unit === "ton" && p.stockQuantity !== 1 ? "s" : ""}` : qty;
}

export const STATUS_STYLES = {
  ACTIVE: { label: "Active", cls: "bg-primary/10 text-primary" },
  INACTIVE: { label: "Inactive", cls: "bg-muted text-muted-foreground" },
  OUT_OF_STOCK: { label: "Out of Stock", cls: "bg-destructive/10 text-destructive" },
};
