import React, { useCallback, useEffect, useState } from "react";
import { Plus, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { financeApi, getErrorMessage } from "@/services/api";
import ExpenseFormDialog from "./ExpenseFormDialog";
import Pager from "./Pager";
import { formatMoney, formatDate, EXPENSE_CATEGORY_LABELS } from "./format";

const PAGE_SIZE = 20;
const ALL = "all";

export default function ExpensesPanel({ onChanged }) {
  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeApi.listExpenses({
        page, limit: PAGE_SIZE, category: category === ALL ? undefined : category,
      });
      setExpenses(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load expenses"));
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => {
    onChanged();
    // If the last item on a later page was deleted, step back a page.
    if (expenses.length === 1 && page > 1) setPage(page - 1);
    else load();
  };

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (x) => { setEditing(x); setFormOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Expense</Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl border p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center space-y-3">
          <Wallet className="w-8 h-8 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">{category === ALL ? "No expenses yet" : "No expenses in this category"}</h3>
          <p className="text-sm text-muted-foreground">
            {category === ALL ? "Record an expense to see it in your monthly total." : "Try a different category."}
          </p>
          {category === ALL && (
            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Expense</Button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Date", "Description", "Category", "Vendor", "Amount"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((x) => (
                    <tr
                      key={x.id}
                      tabIndex={0}
                      onClick={() => openEdit(x)}
                      onKeyDown={(e) => e.key === "Enter" && openEdit(x)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:bg-muted/40"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(x.expenseDate)}</td>
                      <td className="px-4 py-3 font-medium">{x.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{EXPENSE_CATEGORY_LABELS[x.category]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{x.vendor || "—"}</td>
                      <td className="px-4 py-3 font-bold">{formatMoney(x.amount, x.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pager meta={meta} page={page} setPage={setPage} />
        </>
      )}

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} expense={editing} onSaved={handleSaved} />
    </div>
  );
}