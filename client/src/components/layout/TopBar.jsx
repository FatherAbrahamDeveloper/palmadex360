import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X, UserCircle, LogOut } from "lucide-react";
import GlobalSearch from "@/components/layout/GlobalSearch";
import NotificationBell from "@/components/layout/NotificationBell";
import ThemeToggle, { ThemeSegmented } from "@/components/layout/ThemeToggle";
import { roleLabel } from "@/lib/roleConfig";
import { cn, getUserDisplayName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/context/RealtimeContext";

const iconBtn = "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";

export default function TopBar({ user, onMobileMenuToggle }) {
  const { logout } = useAuth();
  const { connected } = useRealtime();
  const [mobileSearch, setMobileSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const outside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/75 px-3 backdrop-blur-xl sm:px-4 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button type="button" className={cn(iconBtn, "md:hidden")} onClick={onMobileMenuToggle} aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden w-full max-w-md md:block"><GlobalSearch /></div>
        <button type="button" className={cn(iconBtn, "md:hidden")} onClick={() => setMobileSearch((v) => !v)} aria-label={mobileSearch ? "Close search" : "Open search"}>
          {mobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn("mr-1 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:flex", connected ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}
          title={connected ? "Live updates are on" : "Reconnecting to live updates"}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
          {connected ? "Live" : "Offline"}
        </span>
        <ThemeToggle />
        <NotificationBell />
        <div className="relative ml-1" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-muted" aria-haspopup="menu" aria-expanded={menuOpen}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-sm font-semibold text-white">
              {getUserDisplayName(user, "U").charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-sm font-medium leading-tight">{getUserDisplayName(user)}</span>
              <span className="block text-[11px] text-muted-foreground">{user?.customer?.name || roleLabel(user?.role)}</span>
            </span>
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-[100] mt-2 w-64 rounded-2xl border bg-popover p-2 shadow-lift">
              <div className="px-2 pb-2 pt-1">
                <p className="truncate text-sm font-medium">{getUserDisplayName(user)}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ThemeSegmented className="mx-1 mb-2" />
              <Link role="menuitem" to="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted">
                <UserCircle className="h-4 w-4 text-muted-foreground" /> My account & security
              </Link>
              <button role="menuitem" type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted">
                <LogOut className="h-4 w-4 text-muted-foreground" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileSearch && (
        <div className="fixed left-0 right-0 top-16 z-[100] border-b bg-card p-3 shadow-lift md:hidden">
          <GlobalSearch autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  );
}
