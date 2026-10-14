import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ModulePageShell({ title, description, icon: Icon, children, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-heading font-bold">{title}</h1>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}