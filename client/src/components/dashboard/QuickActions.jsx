import React from "react";
import { Link } from "react-router-dom";
import { Plus, FileUp, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = {
  superadmin: [
    { label: "New Order", icon: Plus, to: "/orders" },
    { label: "Upload Document", icon: FileUp, to: "/documents" },
    { label: "Send Message", icon: Send, to: "/communication" },
    { label: "View Reports", icon: Eye, to: "/reports" },
  ],
  staff: [
    { label: "New Order", icon: Plus, to: "/orders" },
    { label: "Upload Document", icon: FileUp, to: "/documents" },
    { label: "Send Message", icon: Send, to: "/communication" },
  ],
  client: [
    { label: "Track Orders", icon: Eye, to: "/orders" },
    { label: "View Documents", icon: FileUp, to: "/documents" },
    { label: "Contact Us", icon: Send, to: "/communication" },
  ],
  supplier: [
    { label: "My Products", icon: Plus, to: "/products" },
    { label: "Messages", icon: Send, to: "/communication" },
    { label: "View Inventory", icon: Eye, to: "/inventory" },
  ],
};

export default function QuickActions({ role }) {
  const items = actions[role] || actions.client;

  return (
    <div className="bg-card rounded-xl border border p-5">
      <h3 className="font-heading font-bold text-base mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {items.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} to={a.to}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 hover:bg-accent">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{a.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}