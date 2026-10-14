import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { ShoppingCart, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const orders = [
  { id: "EXP-2024-0142", client: "Global Foods Inc.", product: "Cocoa Beans", qty: "120 tons", value: "$384,000", status: "In Transit", progress: 65 },
  { id: "EXP-2024-0138", client: "Euro Exports Ltd.", product: "Shea Butter", qty: "80 tons", value: "$144,000", status: "Processing", progress: 30 },
  { id: "EXP-2024-0135", client: "Pacific Trade Co.", product: "Cashew Nuts", qty: "50 tons", value: "$205,000", status: "Delivered", progress: 100 },
  { id: "EXP-2024-0131", client: "Sahara Commodities", product: "Sesame Seeds", qty: "200 tons", value: "$390,000", status: "Pending", progress: 10 },
];

const statusStyles = {
  "In Transit": "bg-chart-5/10 text-chart-5",
  "Processing": "bg-chart-4/10 text-chart-4",
  "Delivered": "bg-primary/10 text-primary",
  "Pending": "bg-muted text-muted-foreground",
};

export default function ExportOrders() {
  return (
    <ModulePageShell
      title="Export Order Management"
      description="Track and manage all export orders"
      icon={ShoppingCart}
      actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Order</Button>}
    >
      <div className="space-y-4">
        {orders.map((o, i) => (
          <div key={i} className="bg-card rounded-xl border border p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                  <Badge variant="secondary" className={statusStyles[o.status]}>{o.status}</Badge>
                </div>
                <h3 className="font-semibold mt-1">{o.client}</h3>
              </div>
              <span className="text-lg font-heading font-bold text-primary">{o.value}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
              <span>{o.product}</span>
              <span>{o.qty}</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={o.progress} className="flex-1 h-2" />
              <span className="text-xs font-medium text-muted-foreground w-10 text-right">{o.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </ModulePageShell>
  );
}