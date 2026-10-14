import React from "react";
import { useQuery } from "@tanstack/react-query";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/RoleConfig";

const roleColors = {
  superadmin: "bg-emerald-700 text-white",
  staff: "bg-teal-600 text-white",
  client: "bg-green-600 text-white",
  supplier: "bg-lime-600 text-white",
};

export default function AccessManagement() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  return (
    <ModulePageShell
      title="User & Access Management"
      description="Manage users, roles, and permissions"
      icon={Settings}
      actions={<Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> Invite User</Button>}
    >
      <div className="bg-card rounded-xl border border overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={roleColors[u.role] || "bg-muted text-muted-foreground"}>
                        {ROLES[u.role]?.label || u.role || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={u.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                        {u.status || "active"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModulePageShell>
  );
}