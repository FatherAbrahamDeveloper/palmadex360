import React from "react";
import { Link } from "react-router-dom";
import { Plus, FileUp, Send, Eye, ShoppingCart, HeadphonesIcon, UserPlus, Package, Ship, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleConfig";

const ACTIONS = [
  { label: "Place an order", icon: ShoppingCart, to: "/portal?tab=catalog", module: "portal", level: "EDIT", customerOnly: true },
  { label: "Track my shipments", icon: Ship, to: "/portal?tab=shipments", module: "portal", customerOnly: true },
  { label: "New export order", icon: Plus, to: "/orders?new=1", module: "orders", level: "EDIT", staffOnly: true },
  { label: "Upload document", icon: FileUp, to: "/documents", module: "documents", level: "EDIT", staffOnly: true },
  { label: "Review registrations", icon: UserPlus, to: "/access?status=PENDING", module: "access", level: "EDIT", staffOnly: true },
  { label: "Add product", icon: Package, to: "/products", module: "products", level: "EDIT", staffOnly: true },
  { label: "Send a message", icon: Send, to: "/communication", module: "communication", level: "EDIT" },
  { label: "Get support", icon: HeadphonesIcon, to: "/support?new=1", module: "support" },
  { label: "View reports", icon: Eye, to: "/reports", module: "reports", staffOnly: true },
  { label: "Help articles", icon: BookOpen, to: "/knowledge", module: "knowledge" },
];

export default function QuickActions() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const items = ACTIONS.filter((a) => (!a.customerOnly || isCustomer) && (!a.staffOnly || !isCustomer) && canAccess(user, a.module, a.level || "VIEW")).slice(0, 5);

  if (!items.length) return null;
  return (
    <div className="surface p-5">
      <h3 className="font-heading font-bold text-base mb-3">Quick actions</h3>
      <div className="space-y-2">
        {items.map((a) => {
          const Icon = a.icon;
          return (
            <Button key={a.label} asChild variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-accent">
              <Link to={a.to}>
                <span className="icon-tile w-8 h-8"><Icon className="w-4 h-4" /></span>
                <span className="text-sm font-medium">{a.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
