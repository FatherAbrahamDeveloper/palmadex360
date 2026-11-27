import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON = { warning: AlertTriangle, info: Info, success: CheckCircle2 };
const COLOR = { warning: "text-amber-600 bg-amber-500/10", info: "text-sky-600 bg-sky-500/10", success: "text-emerald-600 bg-emerald-500/10" };

export default function InsightsPanel({ insights = [], title = "Needs attention", empty = "Nothing needs your attention right now." }) {
  return (
    <div className="surface p-5">
      <h3 className="font-heading font-bold text-base mb-4">{title}</h3>
      {insights.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {empty}</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((i, idx) => {
            const Icon = ICON[i.level] || Info;
            return (
              <li key={idx}>
                <Link to={i.link || "/"} className="group flex items-start gap-3 rounded-lg p-2 -m-2 hover:bg-muted/60">
                  <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", COLOR[i.level])}><Icon className="h-4 w-4" /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">{i.title}</span>
                    <span className="block text-xs text-muted-foreground">{i.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 mt-2 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
