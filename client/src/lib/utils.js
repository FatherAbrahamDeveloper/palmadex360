import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isIframe =
  typeof window !== "undefined" && window.self !== window.top;
// Display name for the signed-in user (the API returns firstName and lastName).
export function getUserDisplayName(user, fallback = "User") {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return name || user?.email || fallback;
}

export const prettyEnum = (v) => (v ? String(v).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "");

export function timeAgo(date) {
  if (!date) return "";
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.round(h / 24);
  if (d < 7) return d === 1 ? "yesterday" : `${d} days ago`;
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatMoney(amount, currency = "USD") {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: n >= 1e5 ? 0 : 2 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");
export const formatDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
export const formatBytes = (b) => {
  if (!b) return "0 B";
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), 3);
  return `${(b / 1024 ** i).toFixed(i ? 1 : 0)} ${["B", "KB", "MB", "GB"][i]}`;
};

// Turns a relative /api/v1/... file link from the API into an absolute URL on the API host.
export function apiFileUrl(url, baseURL) {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  const origin = new URL(baseURL || window.location.origin, window.location.origin).origin;
  return `${origin}${url}`;
}
