import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Aug", revenue: 1800000, orders: 28 },
  { month: "Sep", revenue: 2100000, orders: 32 },
  { month: "Oct", revenue: 1950000, orders: 29 },
  { month: "Nov", revenue: 2400000, orders: 38 },
  { month: "Dec", revenue: 2200000, orders: 35 },
  { month: "Jan", revenue: 2600000, orders: 42 },
];

export default function Reports() {
  return (
    <ModulePageShell
      title="Reports & Analytics"
      description="Business intelligence, trends, and export performance"
      icon={BarChart3}
      actions={<Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" /> Export</Button>}
    >
      <div className="bg-card rounded-xl border border p-6">
        <h3 className="font-heading font-bold text-base mb-4">Monthly Export Revenue</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
              <Tooltip
                formatter={(value) => [`$${(value / 1e6).toFixed(2)}M`, "Revenue"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="revenue" fill="hsl(152, 60%, 32%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          { label: "Total Orders (6mo)", value: "204" },
          { label: "Avg. Order Value", value: "$63,200" },
          { label: "Top Market", value: "European Union" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border p-5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-heading font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>
    </ModulePageShell>
  );
}