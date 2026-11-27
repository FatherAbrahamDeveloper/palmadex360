import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-background bg-app-gradient">
      {mobileOpen && <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="hidden md:block">
        <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      {mobileOpen && (
        <div className="md:hidden">
          <Sidebar user={user} collapsed={false} onToggle={() => setMobileOpen(false)} />
        </div>
      )}
      <div className={cn("transition-all duration-300", collapsed ? "md:ml-[72px]" : "md:ml-64")}>
        <TopBar user={user} onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
