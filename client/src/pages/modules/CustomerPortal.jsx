import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Globe, Package, Ship, FileText, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const portalItems = [
  { icon: Package, title: "My Orders", count: 5, desc: "View and track your export orders" },
  { icon: Ship, title: "Shipment Tracking", count: 2, desc: "Real-time shipment status updates" },
  { icon: FileText, title: "My Documents", count: 14, desc: "Access certificates and invoices" },
  { icon: MessageSquare, title: "Messages", count: 3, desc: "Communication with Palmadex team" },
];

export default function CustomerPortal() {
  return (
    <ModulePageShell title="Customer Portal" description="Client-facing hub for order tracking and documents" icon={Globe}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {portalItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-card rounded-xl border border p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className="bg-accent text-accent-foreground">{item.count}</Badge>
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </ModulePageShell>
  );
}