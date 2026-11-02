import React from "react";
import { MapPin, Clock, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const STATUS_LABELS = {
  BOOKED: "Booked",
  LOADING: "Loading",
  AT_SEA: "At Sea",
  CUSTOMS: "Customs",
  ARRIVED: "Arrived",
  CANCELLED: "Cancelled",
};

const statusStyles = {
  BOOKED: "bg-muted text-muted-foreground",
  LOADING: "bg-chart-4/10 text-chart-4",
  AT_SEA: "bg-chart-5/10 text-chart-5",
  CUSTOMS: "bg-destructive/10 text-destructive",
  ARRIVED: "bg-primary/10 text-primary",
  CANCELLED: "bg-muted text-muted-foreground",
};

// UTC so a date saved as "2026-01-28" never shifts to the previous day.
export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
      })
    : "Not set";

export default function ShipmentCard({ shipment, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted-foreground">{shipment.shipmentNumber}</span>
        <Badge variant="secondary" className={statusStyles[shipment.status]}>
          {STATUS_LABELS[shipment.status]}
        </Badge>
      </div>
      <h3 className="font-semibold text-sm">{shipment.vesselName}</h3>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" /> {shipment.originPort} → {shipment.destinationPort}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0" /> ETA: {formatDate(shipment.eta)}
        </div>
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 shrink-0" /> {shipment.containerCount} container(s)
        </div>
      </div>
    </div>
  );
}