import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { MessageSquare, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const threads = [
  { from: "Global Foods Inc.", msg: "Hi, can we get an update on the cocoa shipment?", time: "10 min ago", unread: true },
  { from: "Logistics Team", msg: "Container SHP-4521 has cleared customs", time: "1 hr ago", unread: true },
  { from: "Agro Harvest Ltd.", msg: "New price list attached for Q1 2025", time: "3 hrs ago", unread: false },
  { from: "Compliance Dept.", msg: "NAFDAC renewal documents needed by Feb 1", time: "Yesterday", unread: false },
];

export default function Communication() {
  return (
    <ModulePageShell title="Communication Centre" description="Internal and external messaging hub" icon={MessageSquare}>
      <div className="bg-card rounded-xl border border overflow-hidden">
        <div className="divide-y divide-border">
          {threads.map((t, i) => (
            <div key={i} className="px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">{t.from.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.from}</span>
                  <span className="text-xs text-muted-foreground">{t.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{t.msg}</p>
              </div>
              {t.unread && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
            </div>
          ))}
        </div>
        <div className="border-t border p-4 flex gap-2">
          <Input placeholder="Type a message..." className="flex-1" />
          <Button variant="ghost" size="icon"><Paperclip className="w-4 h-4" /></Button>
          <Button size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </ModulePageShell>
  );
}