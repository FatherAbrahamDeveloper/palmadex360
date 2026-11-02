import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { financeApi, getErrorMessage } from "@/services/api";
import { formatMoney } from "./format";

const changeText = (p, label) =>
  p === null ? "No earlier data to compare" : `${p > 0 ? "+" : ""}${p}% vs ${label}`;

export default function SummaryCards({ refreshKey }) {
  const [currency, setCurrency] = useState(undefined);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    financeApi
      .summary(currency ? { currency } : {})
      .then((res) => { if (!cancelled) { setData(res.data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err, "Failed to load the summary")); });
    return () => { cancelled = true; };
  }, [currency, refreshKey]);

  if (error) {
    return <p className="text-sm text-destructive mb-6">{error}</p>;
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  const cards = [
    {
      label: "Revenue (YTD)", icon: TrendingUp,
      value: formatMoney(data.revenueYtd, data.currency, { compact: true }),
      change: changeText(data.revenueChangePct, "last year"),
    },
    {
      label: "Outstanding", icon: Receipt,
      value: formatMoney(data.outstanding, data.currency, { compact: true }),
      change: `${data.outstandingCount} invoice${data.outstandingCount === 1 ? "" : "s"}${data.overdueCount ? ` · ${data.overdueCount} overdue` : ""}`,
    },
    {
      label: "Expenses (MTD)", icon: TrendingDown,
      value: formatMoney(data.expensesMtd, data.currency, { compact: true }),
      change: changeText(data.expensesChangePct, "last month"),
    },
  ];

  return (
    <div className="mb-6">
      {data.currencies.length > 1 && (
        <div className="flex justify-end mb-2">
          <Select value={data.currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {data.currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card rounded-xl border p-5">
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
    </div>
  );
}