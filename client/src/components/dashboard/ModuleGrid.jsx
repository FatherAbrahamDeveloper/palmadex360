import React from "react";
import { Link } from "react-router-dom";
import { getModulesForRole } from "@/lib/RoleConfig";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ModuleGrid({ role }) {
  const modules = getModulesForRole(role);

  return (
    <div>
      <h2 className="font-heading font-bold text-lg mb-4">Your Modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <Link
                to={mod.path}
                className="group block bg-card rounded-xl border border p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-semibold text-sm">{mod.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}