import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const requests = [
  { id: "PR-0089", item: "Cocoa Beans — 500 tons", supplier: "Agro Harvest Ltd.", status: "Approved", date: "Jan 14, 2025" },
  { id: "PR-0087", item: "Packaging Materials", supplier: "PackRight Industries", status: "Pending", date: "Jan 12, 2025" },
  { id: "PR-0085", item: "Sesame Seeds — 300 tons", supplier: "Cassava Plus Industries", status: "In Progress", date: "Jan 10, 2025" },
  { id: "PR-0082", item: "Cold Storage Lease", supplier: "Lagos Cold Chain", status: "Completed", date: "Jan 7, 2025" },
];

const statusStyles = {
  Approved: "bg-primary/10 text-primary",
  Pending: "bg-chart-4/10 text-chart-4",
  "In Progress": "bg-chart-5/10 text-chart-5",
  Completed: "bg-muted text-muted-foreground",
};

export default function Procurement() {
  return (
    <ModulePageShell
      title="Procurement"
      description="Manage purchase requests and procurement workflows"
      icon={ShoppingBag}
      actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Request</Button>}
    >
      <div className="space-y-3">
        {requests.map((r, i) => (
          <div key={i} className="bg-card rounded-xl border border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:shadow-sm transition-shadow cursor-pointer">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                <Badge variant="secondary" className={statusStyles[r.status]}>{r.status}</Badge>
              </div>
              <p className="font-medium text-sm mt-1">{r.item}</p>
              <p className="text-xs text-muted-foreground">{r.supplier} · {r.date}</p>
            </div>
          </div>
        ))}
      </div>
    </ModulePageShell>
  );
}