import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "system", icon: Monitor, label: "Match device" },
];

export function ThemeSegmented({ className }) {
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("flex rounded-lg bg-muted p-0.5", className)}>
      {OPTIONS.map((o) => (
        <button
          key={o.id} type="button" role="radio" aria-checked={theme === o.id} title={o.label} onClick={() => setTheme(o.id)}
          className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs", theme === o.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground")}
        >
          <o.icon className="h-3.5 w-3.5" /> {o.label === "Match device" ? "Auto" : o.label}
        </button>
      ))}
    </div>
  );
}

export default function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const dark = resolved === "dark";
  return (
    <button
      type="button" onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
