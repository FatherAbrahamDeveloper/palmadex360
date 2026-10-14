import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Ship, MapPin, Clock, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const shipments = [
  { id: "SHP-4521", vessel: "MV Atlantic Cargo", origin: "Lagos, NG", dest: "Rotterdam, NL", eta: "Jan 28, 2025", status: "At Sea", items: 3 },
  { id: "SHP-4518", vessel: "MSC Carolina", origin: "Apapa, NG", dest: "Hamburg, DE", eta: "Feb 3, 2025", status: "Loading", items: 2 },
  { id: "SHP-4512", vessel: "CMA CGM Marlin", origin: "Tin Can, NG", dest: "Felixstowe, UK", eta: "Jan 22, 2025", status: "Arrived", items: 5 },
  { id: "SHP-4509", vessel: "Maersk Sealand", origin: "Lagos, NG", dest: "Jebel Ali, UAE", eta: "Feb 10, 2025", status: "Customs", items: 1 },
];

const statusStyles = {
  "At Sea": "bg-chart-5/10 text-chart-5",
  "Loading": "bg-chart-4/10 text-chart-4",
  "Arrived": "bg-primary/10 text-primary",
  "Customs": "bg-destructive/10 text-destructive",
};

export default function Shipping() {
  return (
    <ModulePageShell
      title="Shipping & Logistics"
      description="Track shipments and logistics operations"
      icon={Ship}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shipments.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
              <Badge variant="secondary" className={statusStyles[s.status]}>{s.status}</Badge>
            </div>
            <h3 className="font-semibold text-sm">{s.vessel}</h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {s.origin} → {s.dest}</div>
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> ETA: {s.eta}</div>
              <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5" /> {s.items} container(s)</div>
            </div>
          </div>
        ))}
      </div>
    </ModulePageShell>
  );
}