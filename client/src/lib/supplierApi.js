const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function getToken() {
  // Match this key to wherever your login code stores the JWT.
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
}

async function request(path, options = {}, authenticated = true) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (authenticated) {
    const token = getToken();

    if (!token) {
      throw new Error("Please log in again to continue.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = Array.isArray(result.errors)
      ? result.errors.join("\n")
      : "";

    throw new Error(
      details || result.message || `Request failed (${response.status}).`
    );
  }

  return result;
}

export const supplierApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/suppliers?${query.toString()}`);
  },

  get: (id) => request(`/suppliers/${encodeURIComponent(id)}`),

  create: (data) =>
    request("/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/suppliers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    
    remove: (id) =>
  request(`/suppliers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  // Requires a public registration endpoint in the backend.
  apply: (data) =>
    request(
      "/suppliers/apply",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    ),
};