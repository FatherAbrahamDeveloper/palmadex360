import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeEvent } from "@/context/RealtimeContext";
import StatsRow from "@/components/dashboard/StatsRow";
import ModuleGrid from "@/components/dashboard/ModuleGrid";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/roleConfig";
import { dashboardApi, getErrorMessage } from "@/services/api";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const roleInfo = ROLES[user?.role];
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await dashboardApi.summary());
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load the dashboard"));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Keep the figures current as things change elsewhere in the system.
  useRealtimeEvent("activity:new", () => load());

  const isCustomer = user?.role === "CUSTOMER";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-[hsl(202_100%_20%)] px-6 py-7 text-white shadow-lift md:px-8 md:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_260px_at_90%_-20%,rgba(56,189,248,0.35),transparent_60%),radial-gradient(500px_240px_at_0%_120%,rgba(14,165,233,0.25),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/55">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight tracking-tight md:text-[32px]">
              {greeting()}, {user?.firstName || "there"}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/70">
              {isCustomer ? `Your orders and shipments with Palmadex${user?.customer?.name ? ` for ${user.customer.name}` : ""}.` : "Here's what's happening across your export operations today."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-white/15 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {roleInfo?.label}
          </span>
        </div>
      </div>

      {error ? (
        <div className="surface p-6 text-center space-y-3">
          <AlertCircle className="w-7 h-7 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>Try again</Button>
        </div>
      ) : (
        <StatsRow cards={data?.cards || []} loading={!data} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {!isCustomer && data?.insights && <InsightsPanel insights={data.insights} />}
          <ModuleGrid />
        </div>
        <div className="space-y-4">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
