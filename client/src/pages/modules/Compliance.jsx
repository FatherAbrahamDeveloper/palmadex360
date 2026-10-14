import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const checks = [
  { title: "NAFDAC Export Permit", region: "Nigeria", status: "Compliant", score: 100 },
  { title: "EU Food Safety Standards", region: "European Union", status: "In Review", score: 75 },
  { title: "USDA Import Regulations", region: "United States", status: "Compliant", score: 100 },
  { title: "Phytosanitary Requirements", region: "Global", status: "Action Required", score: 45 },
  { title: "SON Export Certification", region: "Nigeria", status: "Compliant", score: 100 },
];

const statusConfig = {
  Compliant: { style: "bg-primary/10 text-primary", icon: CheckCircle },
  "In Review": { style: "bg-chart-4/10 text-chart-4", icon: Clock },
  "Action Required": { style: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

export default function Compliance() {
  return (
    <ModulePageShell
      title="Trade Compliance"
      description="Monitor regulations, certifications, and compliance status"
      icon={Shield}
    >
      <div className="space-y-3">
        {checks.map((c, i) => {
          const cfg = statusConfig[c.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={i} className="bg-card rounded-xl border border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">{c.region}</p>
                </div>
                <Badge variant="secondary" className={cfg.style}>
                  <StatusIcon className="w-3 h-3 mr-1" /> {c.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Progress value={c.score} className="flex-1 h-2" />
                <span className="text-xs font-medium w-10 text-right">{c.score}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </ModulePageShell>
  );
}