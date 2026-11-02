import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const STATUS_LABELS = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusStyles = {
  IN_TRANSIT: "bg-chart-5/10 text-chart-5",
  PROCESSING: "bg-chart-4/10 text-chart-4",
  DELIVERED: "bg-primary/10 text-primary",
  PENDING: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
};

function formatValue(value, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function formatQty(qty, unit) {
  const label = unit === "ton" && qty !== 1 ? "tons" : unit;
  return `${Number(qty).toLocaleString()} ${label}`;
}

export default function ExportOrderCard({ order, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
            <Badge variant="secondary" className={statusStyles[order.status]}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <h3 className="font-semibold mt-1">{order.customerName}</h3>
        </div>
        <span className="text-lg font-heading font-bold text-primary">
          {formatValue(order.totalValue, order.currency)}
        </span>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
        <span>{order.productName}</span>
        <span>{formatQty(order.quantity, order.unit)}</span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={order.progress} className="flex-1 h-2" />
        <span className="text-xs font-medium text-muted-foreground w-10 text-right">
          {order.progress}%
        </span>
      </div>
    </div>
  );
}