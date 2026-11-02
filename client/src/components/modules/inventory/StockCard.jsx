import React from "react";
import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const formatQty = (qty, unit) => {
  const label = unit === "ton" && qty !== 1 ? "tons" : unit;
  return `${Number(qty).toLocaleString()} ${label}`;
};

export default function StockCard({ item, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm">{item.product.name}</h3>
        {item.isLowStock && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{item.warehouse.name}</p>
      <p className="text-lg font-heading font-bold text-primary">{formatQty(item.quantity, item.unit)}</p>
      {item.capacityPercent !== null ? (
        <div className="flex items-center gap-2 mt-3">
          <Progress value={item.capacityPercent} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground">{item.capacityPercent}%</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-3">No capacity set</p>
      )}
    </div>
  );
}