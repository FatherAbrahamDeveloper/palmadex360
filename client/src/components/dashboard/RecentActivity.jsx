import React, { useCallback, useEffect, useState } from "react";
import {
  Package, Ship, FileText, Users, DollarSign, ShoppingCart, Truck, MessageSquare, HeadphonesIcon,
  BookOpen, UserCog, Warehouse, Shield, ShoppingBag, Building2, Activity, Loader2,
} from "lucide-react";
import { dashboardApi } from "@/services/api";
import { useRealtimeEvent } from "@/context/RealtimeContext";
import { cn, timeAgo } from "@/lib/utils";

const STYLE = {
  Product: [Package, "bg-primary/10 text-primary"],
  ExportOrder: [ShoppingCart, "bg-chart-4/10 text-chart-4"],
  Shipment: [Ship, "bg-chart-5/10 text-chart-5"],
  File: [FileText, "bg-chart-2/10 text-chart-2"],
  CRMContact: [Users, "bg-chart-4/10 text-chart-4"],
  Invoice: [DollarSign, "bg-primary/10 text-primary"],
  Expense: [DollarSign, "bg-destructive/10 text-destructive"],
  Supplier: [Truck, "bg-chart-2/10 text-chart-2"],
  Conversation: [MessageSquare, "bg-sky-500/10 text-sky-600"],
  SupportTicket: [HeadphonesIcon, "bg-fuchsia-500/10 text-fuchsia-600"],
  KnowledgeArticle: [BookOpen, "bg-violet-500/10 text-violet-600"],
  User: [UserCog, "bg-emerald-500/10 text-emerald-700"],
  StockLevel: [Warehouse, "bg-stone-500/10 text-stone-600"],
  Warehouse: [Warehouse, "bg-stone-500/10 text-stone-600"],
  ComplianceRequirement: [Shield, "bg-amber-500/10 text-amber-600"],
  PurchaseRequest: [ShoppingBag, "bg-orange-500/10 text-orange-600"],
  Customer: [Building2, "bg-lime-500/10 text-lime-700"],
};

// Live feed of real system events, refreshed whenever the server reports new activity.
export default function RecentActivity({ limit = 8 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await dashboardApi.activity({ limit }));
      setError("");
    } catch {
      setError("Activity is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);
  useRealtimeEvent("activity:new", () => load());

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-base">Recent activity</h3>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
      </div>
      {loading ? (
        <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading activity" /></div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          <Activity className="mx-auto mb-2 h-6 w-6" />
          No activity yet. Orders, shipments, registrations and messages will appear here as they happen.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const [Icon, color] = STYLE[a.entity] || [Activity, "bg-muted text-muted-foreground"];
            return (
              <li key={a.id} className="flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", color)}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
