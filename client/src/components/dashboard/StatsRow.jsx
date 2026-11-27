import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Minus, Users, ShoppingCart, Ship, DollarSign, Truck, HeadphonesIcon, Package,
  Warehouse, ShoppingBag, UserPlus, BookOpen, FileText, Globe,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ICONS = {
  crmContacts: Users, activeOrders: ShoppingCart, shipmentsInTransit: Ship, revenueMtd: DollarSign, suppliers: Truck,
  openTickets: HeadphonesIcon, products: Package, lowStock: Warehouse, purchaseRequests: ShoppingBag, pendingApprovals: UserPlus,
  knowledge: BookOpen, myOrders: ShoppingCart, myShipments: Ship, myInvoices: DollarSign, myDocuments: FileText, myTickets: HeadphonesIcon,
  portalPending: Globe,
};
const TONES = [
  "from-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "from-sky-500/15 text-sky-600 dark:text-sky-400",
  "from-violet-500/15 text-violet-600 dark:text-violet-400",
  "from-amber-500/15 text-amber-600 dark:text-amber-400",
  "from-rose-500/15 text-rose-600 dark:text-rose-400",
];

export default function StatsRow({ cards, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((s, i) => {
        const up = s.change > 0;
        const flat = s.change === 0;
        const TrendIcon = s.change == null ? null : flat ? Minus : up ? TrendingUp : TrendingDown;
        const Icon = ICONS[s.id] || BarIcon;
        return (
          <Link key={s.id} to={s.link || "/"} className={cn("surface surface-hover relative overflow-hidden p-5", i === 4 && "col-span-2 md:col-span-1")}>
            <div className="relative flex items-start justify-between gap-2">
              <p className="eyebrow">{s.label}</p>
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br to-transparent", TONES[i % 5])}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="relative mt-3 truncate font-heading text-[26px] font-bold leading-none tracking-tight">{s.display}</p>
            <div className="relative mt-3 flex items-center justify-between gap-2">
              {s.sub && <p className="truncate text-xs text-muted-foreground">{s.sub}</p>}
              {TrendIcon && (
                <span title={s.changeLabel} className={cn("flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold", flat ? "bg-muted text-muted-foreground" : up ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>
                  <TrendIcon className="h-3 w-3" aria-hidden="true" />{`${up ? "+" : ""}${s.change}%`}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function BarIcon(props) {
  return <TrendingUp {...props} />;
}
