import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyModuleState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-lg">No data yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {message || "This module is ready. Start adding data to see it here."}
      </p>
    </div>
  );
}