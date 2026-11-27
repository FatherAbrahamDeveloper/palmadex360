import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ModulePageShell({ title, description, icon: Icon, children, actions }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-muted-foreground print:hidden">
            <Link to="/" className="hover:text-foreground">Dashboard</Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span className="truncate text-foreground/80">{title}</span>
          </nav>
          <div className="flex items-center gap-3.5">
            {Icon && <div className="icon-tile h-11 w-11 shrink-0"><Icon className="h-5 w-5" /></div>}
            <div className="min-w-0">
              <h1 className="page-title truncate">{title}</h1>
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end print:hidden">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}
