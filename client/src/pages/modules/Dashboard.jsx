import React from "react";
import { useAuth } from "@/context/AuthContext";
import StatsRow from "@/components/dashboard/StatsRow";
import ModuleGrid from "@/components/dashboard/ModuleGrid";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { ROLES } from "@/lib/RoleConfig";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const roleInfo = ROLES[role];
  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening across your export operations today.
          </p>
        </div>
        <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-medium self-start ${roleInfo?.color}`}>
          {roleInfo?.label}
        </span>
      </div>

      {/* Stats */}
      <StatsRow role={role} />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ModuleGrid role={role} />
        </div>
        <div className="space-y-4">
          <QuickActions role={role} />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}