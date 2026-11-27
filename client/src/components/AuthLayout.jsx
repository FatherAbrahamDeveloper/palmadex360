import React from "react";
import { ShieldCheck, Ship, Globe2, BarChart3 } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

const POINTS = [
  { icon: Globe2, text: "Buyers place export orders and follow them to delivery" },
  { icon: Ship, text: "Live shipment tracking from origin to destination port" },
  { icon: BarChart3, text: "Real-time reports on orders, revenue and markets" },
  { icon: ShieldCheck, text: "Verified accounts, role-based access and two-step sign-in" },
];

// Split screen: brand panel on large screens, the form card on the right.
export default function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden bg-[hsl(202_100%_18%)] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_10%_0%,rgba(56,189,248,0.28),transparent_60%),radial-gradient(600px_400px_at_100%_100%,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg">
            <img src="/palmadex-icon.png" alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-heading text-lg font-bold leading-tight">Palmadex 360</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Palmadex Global Integrated Services</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <h2 className="font-heading text-4xl font-bold leading-[1.15] tracking-tight">
            Export and import trade,<br />
            <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">managed end to end.</span>
          </h2>
          <ul className="space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-[15px] text-white/80">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
                  <p.icon className="h-4 w-4 text-sky-300" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Palmadex Global Integrated Services Ltd</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center bg-app-gradient px-4 py-10">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-soft ring-1 ring-border">
              <img src="/palmadex-icon.png" alt="" className="h-full w-full object-contain" />
            </div>
            <p className="font-heading text-lg font-bold">Palmadex 360</p>
          </div>
          <div className="mb-6">
            <h1 className="font-heading text-[28px] font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="surface p-6 sm:p-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
