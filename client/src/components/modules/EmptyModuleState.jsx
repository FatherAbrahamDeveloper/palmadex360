import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyModuleState({ message, icon: Icon = Inbox, title = "Nothing here yet", action }) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="icon-tile mb-4 h-14 w-14"><Icon className="h-6 w-6" /></div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message || "This module is ready. Start adding data to see it here."}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
