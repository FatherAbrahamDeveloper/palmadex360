import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";

export default function AppLayout({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      <div className={cn("hidden md:block")}>
        <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      {mobileOpen && (
        <div className="md:hidden">
          <Sidebar user={user} collapsed={false} onToggle={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className={cn("transition-all duration-300", collapsed ? "md:ml-[68px]" : "md:ml-64")}>
        <TopBar user={user} onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 md:p-6 lg:p-8 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}