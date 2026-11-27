import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/context/RealtimeContext";
import { getModulesForUser, roleLabel } from "@/lib/roleConfig";
import { cn, getUserDisplayName } from "@/lib/utils";

// Modules grouped the way the business works, so 16 items stay easy to scan.
const GROUPS = [
  { title: "Sales & customers", ids: ["crm", "portal", "orders", "communication"] },
  { title: "Supply chain", ids: ["suppliers", "products", "procurement", "inventory", "shipping"] },
  { title: "Documents & finance", ids: ["documents", "compliance", "finance"] },
  { title: "Insights & admin", ids: ["reports", "support", "knowledge", "access"] },
];

function NavItem({ to, icon: Icon, label, active, collapsed, badge }) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-white/[0.12] text-white"
          : "text-sidebar-foreground/65 hover:bg-white/[0.05] hover:text-white"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" aria-hidden="true" />}
      <span className="relative shrink-0">
        <Icon className={cn("h-[18px] w-[18px]", active ? "text-sidebar-primary" : "")} />
        {badge > 0 && collapsed && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-sidebar" />}
      </span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white" aria-label={`${badge} unread`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ user, collapsed, onToggle }) {
  const { user: authUser, logout } = useAuth();
  const current = user || authUser;
  const { unreadMessages } = useRealtime();
  const location = useLocation();
  const modules = getModulesForUser(current);
  const byId = Object.fromEntries(modules.map((m) => [m.id, m]));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        "bg-[radial-gradient(600px_300px_at_0%_0%,hsl(var(--sidebar-primary)/0.12),transparent_70%)]",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center gap-3 px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
          <img src="/palmadex-icon.png" alt="" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-heading text-[15px] font-bold leading-tight text-white">Palmadex 360</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/45">Export platform</p>
          </div>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2" aria-label="Main">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === "/"} collapsed={collapsed} />
        {GROUPS.map((g) => {
          const items = g.ids.map((id) => byId[id]).filter(Boolean);
          if (!items.length) return null;
          return (
            <div key={g.title} className="space-y-0.5">
              {collapsed ? <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" /> : (
                <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55">{g.title}</p>
              )}
              {items.map((m) => (
                <NavItem
                  key={m.id} to={m.path} icon={m.icon} label={m.label} collapsed={collapsed}
                  active={location.pathname === m.path || location.pathname.startsWith(`${m.path}/`)}
                  badge={m.id === "communication" ? unreadMessages : 0}
                />
              ))}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3 rounded-xl p-2", collapsed && "justify-center p-0")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-sm font-semibold text-white">
            {getUserDisplayName(current, "U").charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{getUserDisplayName(current)}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/50">{current?.customer?.name || roleLabel(current?.role)}</p>
            </div>
          )}
          {!collapsed && (
            <button type="button" onClick={logout} className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-white/[0.06] hover:text-white" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <button
        type="button" onClick={onToggle}
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        className="absolute -right-3 top-[76px] hidden h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-soft hover:text-foreground md:flex"
      >
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
