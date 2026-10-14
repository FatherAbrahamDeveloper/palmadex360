import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Warehouse, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const items = [
  { name: "Cocoa Beans (Grade A)", warehouse: "Lagos Main", qty: "450 tons", capacity: 80 },
  { name: "Shea Butter (Raw)", warehouse: "Lagos Main", qty: "220 tons", capacity: 55 },
  { name: "Sesame Seeds", warehouse: "Kano Depot", qty: "300 tons", capacity: 72 },
  { name: "Dried Hibiscus", warehouse: "Lagos Main", qty: "180 tons", capacity: 42 },
  { name: "Cashew Nuts", warehouse: "Kano Depot", qty: "15 tons", capacity: 8 },
];

export default function Inventory() {
  return (
    <ModulePageShell
      title="Inventory & Warehouse"
      description="Monitor stock levels and warehouse operations"
      icon={Warehouse}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div key={i} className="bg-card rounded-xl border border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">{item.name}</h3>
              {item.capacity < 15 && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{item.warehouse}</p>
            <p className="text-lg font-heading font-bold text-primary">{item.qty}</p>
            <div className="flex items-center gap-2 mt-3">
              <Progress value={item.capacity} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">{item.capacity}%</span>
            </div>
          </div>
        ))}
      </div>
    </ModulePageShell>
  );
}