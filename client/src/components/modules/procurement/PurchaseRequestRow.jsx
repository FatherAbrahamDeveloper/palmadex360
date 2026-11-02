import React from "react";
import { Badge } from "@/components/ui/badge";

export const STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const statusStyles = {
  APPROVED: "bg-primary/10 text-primary",
  PENDING: "bg-chart-4/10 text-chart-4",
  IN_PROGRESS: "bg-chart-5/10 text-chart-5",
  COMPLETED: "bg-muted text-muted-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

// UTC so a date saved as "2026-01-28" never shifts to the previous day.
export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
      })
    : "Not set";

export const formatItem = (r) =>
  r.quantity !== null
    ? `${r.itemName} — ${Number(r.quantity).toLocaleString()}${r.unit ? ` ${r.unit}` : ""}`
    : r.itemName;

export const formatMoney = (value, currency) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: currency || "NGN", maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
};

export default function PurchaseRequestRow({ request, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="bg-card rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:shadow-sm transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{request.requestNumber}</span>
          <Badge variant="secondary" className={statusStyles[request.status]}>
            {STATUS_LABELS[request.status]}
          </Badge>
        </div>
        <p className="font-medium text-sm mt-1 truncate">{formatItem(request)}</p>
        <p className="text-xs text-muted-foreground">
          {request.supplierName} · {formatDate(request.createdAt)}
        </p>
      </div>
      {request.estimatedCost !== null && (
        <span className="text-sm font-heading font-bold text-primary shrink-0">
          {formatMoney(request.estimatedCost, request.currency)}
        </span>
      )}
    </div>
  );
}