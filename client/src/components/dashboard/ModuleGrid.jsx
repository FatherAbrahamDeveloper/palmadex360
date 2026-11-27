import React from "react";
import { Link } from "react-router-dom";
import { getModulesForUser } from "@/lib/roleConfig";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ModuleGrid() {
  const { user } = useAuth();
  const modules = getModulesForUser(user);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between"><h2 className="font-heading text-lg font-bold">Your modules</h2><span className="text-xs text-muted-foreground">{modules.length} available</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                className="group block h-full surface surface-hover p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="icon-tile h-10 w-10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="w-5 h-5" />
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