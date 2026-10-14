import React from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLES } from "@/lib/RoleConfig";
import { cn } from "@/lib/utils";

export default function TopBar({ user, onMobileMenuToggle }) {
  const role = user?.role || "client";
  const roleInfo = ROLES[role];

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileMenuToggle}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-72">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search modules, orders, documents..."
            className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {(user?.full_name || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight">{user?.full_name || "User"}</p>
            <p className="text-[11px] text-muted-foreground">{roleInfo?.label}</p>
          </div>
        </div>
      </div>
    </header>
  );
}