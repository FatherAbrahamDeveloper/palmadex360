import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { getModulesForRole, ROLES, USER_ROLES } from "@/lib/RoleConfig";
import { LayoutDashboard, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar({ user, collapsed, onToggle }) {

  const { logout } = useAuth();

  const location = useLocation();
const role = user?.role || USER_ROLES.CLIENT;
  const modules = getModulesForRole(role);
  const roleInfo = ROLES[role];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-40 transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
  <img
    src="/palmadexLogo.svg"
    alt="Palmadex 360"
    className="w-9 h-9 object-contain"
  />
</div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-display font-bold text-base text-sidebar-foreground leading-tight truncate">Palmadex 360</h1>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">Export Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            location.pathname === "/"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>

        {modules.map((mod) => {
          const Icon = mod.icon;
          const isActive = location.pathname.startsWith(mod.path);
          return (
            <Link
              key={mod.id}
              to={mod.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              title={collapsed ? mod.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{mod.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2 shrink-0">
        {!collapsed && (
          <div className="px-2 pb-1">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.full_name || "User"}</p>
            <span className={cn("inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium", roleInfo?.color)}>
              {roleInfo?.label}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}