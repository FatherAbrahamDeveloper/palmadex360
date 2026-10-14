import React from "react";
import { Package, Ship, FileText, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  { icon: Package, label: "New product added: Organic Cocoa Beans", time: "2 min ago", color: "bg-primary/10 text-primary" },
  { icon: Ship, label: "Shipment RC-4521 departed Lagos port", time: "28 min ago", color: "bg-chart-5/10 text-chart-5" },
  { icon: FileText, label: "Certificate of Origin uploaded", time: "1 hr ago", color: "bg-chart-2/10 text-chart-2" },
  { icon: Users, label: "New client: Global Foods Inc. registered", time: "3 hrs ago", color: "bg-chart-4/10 text-chart-4" },
  { icon: DollarSign, label: "Invoice #INV-2847 paid — $45,200", time: "5 hrs ago", color: "bg-primary/10 text-primary" },
];

export default function RecentActivity() {
  return (
    <div className="bg-card rounded-xl border border p-5">
      <h3 className="font-heading font-bold text-base mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", a.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}