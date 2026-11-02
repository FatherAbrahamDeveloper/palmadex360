import React, { useCallback, useEffect, useState } from "react";
import { Plus, Receipt, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { financeApi, getErrorMessage } from "@/services/api";
import InvoiceFormDialog from "./InvoiceFormDialog";
import InvoiceDetailDialog from "./InvoiceDetailDialog";
import Pager from "./Pager";
import { formatMoney, formatDate, INVOICE_STATUS_LABELS, invoiceStatusStyles } from "./format";

const PAGE_SIZE = 20;
const ALL = "all";

export default function InvoicesPanel({ onChanged }) {
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeApi.listInvoices({
        page, limit: PAGE_SIZE, status: status === ALL ? undefined : status,
      });
      setInvoices(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load invoices"));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { load(); onChanged(); };
  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openDetail = (inv) => { setSelectedId(inv.id); setDetailOpen(true); };
  const openEdit = (inv) => { setDetailOpen(false); setEditing(inv); setFormOpen(true); };

  const handleDeleted = () => {
    onChanged();
    if (invoices.length === 1 && page > 1) setPage(page - 1);
    else load();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All invoices</SelectItem>
            {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>
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
      ) : invoices.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center space-y-3">
          <Receipt className="w-8 h-8 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">{status === ALL ? "No invoices yet" : "No invoices with this status"}</h3>
          <p className="text-sm text-muted-foreground">
            {status === ALL ? "Create your first invoice to start tracking payments." : "Try a different filter."}
          </p>
          {status === ALL && (
            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Invoice", "Client", "Amount", "Date", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      tabIndex={0}
                      onClick={() => openDetail(inv)}
                      onKeyDown={(e) => e.key === "Enter" && openDetail(inv)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-medium">{inv.customerName}</td>
                      <td className="px-4 py-3 font-bold">
                        {formatMoney(inv.amount, inv.currency)}
                        {inv.status === "PARTIALLY_PAID" && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            Balance {formatMoney(inv.balance, inv.currency)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.issueDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={invoiceStatusStyles[inv.displayStatus]}>
                          {INVOICE_STATUS_LABELS[inv.displayStatus]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pager meta={meta} page={page} setPage={setPage} />
        </>
      )}

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} invoice={editing} onSaved={refresh} />
      <InvoiceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        invoiceId={selectedId}
        onChanged={() => { load(); onChanged(); }}
        onEdit={openEdit}
        onDeleted={handleDeleted}
      />
    </div>
  );
}