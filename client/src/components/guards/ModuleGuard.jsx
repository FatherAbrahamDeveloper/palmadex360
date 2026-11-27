import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleConfig";

// Shows the page only if the signed-in user's role may view this module.
// The API enforces the same rules, so this is about a clear message, not security.
export default function ModuleGuard({ module, level = "VIEW", children }) {
  const { user } = useAuth();
  if (canAccess(user, module, level)) return children;
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <ShieldOff className="w-7 h-7 text-muted-foreground" />
      </div>
      <h1 className="font-heading font-semibold text-lg">You don't have access to this page</h1>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">Ask your administrator to give your role access in User & Access Management.</p>
      <Button asChild className="mt-4" size="sm"><Link to="/">Back to dashboard</Link></Button>
    </div>
  );
}
