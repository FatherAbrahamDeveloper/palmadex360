import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Active Orders", value: "142", change: "+12%", up: true, color: "text-primary" },
  { label: "Products Listed", value: "1,238", change: "+5%", up: true, color: "text-chart-2" },
  { label: "Pending Shipments", value: "37", change: "-3%", up: false, color: "text-chart-5" },
  { label: "Revenue (MTD)", value: "$2.4M", change: "+18%", up: true, color: "text-chart-4" },
];

export default function StatsRow({ role }) {
  const visibleStats = role === "supplier" ? stats.slice(0, 2) : role === "client" ? stats.filter((_, i) => i !== 1) : stats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {visibleStats.map((s) => (
        <div key={s.label} className="bg-card rounded-xl border border p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
          <div className="flex items-end justify-between mt-2">
            <span className={cn("text-2xl font-bold font-heading", s.color)}>{s.value}</span>
            <div className={cn("flex items-center gap-1 text-xs font-medium", s.up ? "text-primary" : "text-destructive")}>
              {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {s.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}