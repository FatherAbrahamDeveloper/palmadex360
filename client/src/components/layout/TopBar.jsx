
import React, { useState } from "react";

import {
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/RoleConfig";
import GlobalSearch from "@/components/layout/GlobalSearch";

export default function TopBar({ user, onMobileMenuToggle }) {
  const role = user?.role || "CLIENT";
  const roleInfo = ROLES[role];

  const [mobileSearch, setMobileSearch] = useState(false);

  return (
    <header className="h-16 w-full bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-40">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-3 flex-1 min-w-0">

        {/* MOBILE MENU */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* DESKTOP GLOBAL SEARCH */}
        <div className="hidden md:block w-80 min-w-0">
          <GlobalSearch role={role} />
        </div>

        {/* MOBILE SEARCH TOGGLE */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={() => {
            setMobileSearch((previous) => !previous);
          }}
          aria-label="Toggle mobile search"
        >
          {mobileSearch ? (
            <X className="w-5 h-5" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </Button>

      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">

        {/* NOTIFICATIONS */}
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />

          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* USER PROFILE */}
        <div className="flex items-center gap-2">

          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">
              {(user?.full_name || "U")
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight">
              {user?.full_name || "User"}
            </p>

            <p className="text-[11px] text-muted-foreground">
              {roleInfo?.label || "User"}
            </p>
          </div>

        </div>

      </div>

      {/* MOBILE SEARCH PANEL */}
      {mobileSearch && (
        <div className="fixed top-16 left-0 right-0 w-full p-3 bg-card border-b border-border shadow-2xl md:hidden z-[100]">

          <div className="w-full min-w-0">
            <GlobalSearch
              role={role}
              onNavigate={() => setMobileSearch(false)}
            />
          </div>

        </div>
      )}

    </header>
  );
}
