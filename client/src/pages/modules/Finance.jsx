import React, { useState } from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryCards from "@/components/modules/finance/SummaryCards";
import InvoicesPanel from "@/components/modules/finance/InvoicesPanel";
import ExpensesPanel from "@/components/modules/finance/ExpensesPanel";

export default function Finance() {
  // Bumping this refetches the summary cards after any invoice, payment or expense change.
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshSummary = () => setRefreshKey((k) => k + 1);

  return (
    <ModulePageShell
      title="Finance & Accounting"
      description="Financial overview, invoicing, and accounting"
      icon={DollarSign}
    >
      <SummaryCards refreshKey={refreshKey} />

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesPanel onChanged={refreshSummary} />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <ExpensesPanel onChanged={refreshSummary} />
        </TabsContent>
      </Tabs>
    </ModulePageShell>
  );
}