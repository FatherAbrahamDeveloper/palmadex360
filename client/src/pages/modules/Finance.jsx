import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const invoices = [
  { id: "INV-2847", client: "Global Foods Inc.", amount: "$45,200", date: "Jan 15, 2025", status: "Paid" },
  { id: "INV-2843", client: "Euro Exports Ltd.", amount: "$128,500", date: "Jan 10, 2025", status: "Overdue" },
  { id: "INV-2839", client: "Pacific Trade Co.", amount: "$67,800", date: "Jan 5, 2025", status: "Paid" },
  { id: "INV-2835", client: "Sahara Commodities", amount: "$89,100", date: "Dec 28, 2024", status: "Pending" },
];

const statusStyles = {
  Paid: "bg-primary/10 text-primary",
  Overdue: "bg-destructive/10 text-destructive",
  Pending: "bg-chart-4/10 text-chart-4",
};

const summaryCards = [
  { label: "Revenue (YTD)", value: "$4.2M", icon: TrendingUp, change: "+18%" },
  { label: "Outstanding", value: "$217K", icon: Receipt, change: "12 invoices" },
  { label: "Expenses (MTD)", value: "$890K", icon: TrendingDown, change: "-5%" },
];

export default function Finance() {
  return (
    <ModulePageShell title="Finance & Accounting" description="Financial overview, invoicing, and accounting" icon={DollarSign}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-card rounded-xl border border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</span>
              </div>
              <p className="text-2xl font-heading font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.change}</p>
            </div>
          );
        })}
      </div>
      <h3 className="font-heading font-bold text-base mb-3">Recent Invoices</h3>
      <div className="bg-card rounded-xl border border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs">{inv.id}</td>
                  <td className="px-4 py-3 font-medium">{inv.client}</td>
                  <td className="px-4 py-3 font-bold">{inv.amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className={statusStyles[inv.status]}>{inv.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModulePageShell>
  );
}