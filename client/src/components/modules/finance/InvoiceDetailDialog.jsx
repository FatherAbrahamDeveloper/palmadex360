import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { financeApi, getErrorMessage } from "@/services/api";
import {
  formatMoney, formatDate, todayInput,
  INVOICE_STATUS_LABELS, invoiceStatusStyles, PAYMENT_METHOD_LABELS,
} from "./format";

function Detail({ label, children }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}

const emptyPayment = (balance) => ({
  amount: balance ? String(balance) : "", method: "BANK_TRANSFER",
  paidAt: todayInput(), reference: "",
});

export default function InvoiceDetailDialog({ open, onOpenChange, invoiceId, onChanged, onEdit, onDeleted }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [payment, setPayment] = useState(emptyPayment(0));
  const [payError, setPayError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // { title, description, label, run }

  const load = useCallback(async (id) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await financeApi.getInvoice(id);
      setInvoice(res.data);
      setPayment(emptyPayment(res.data.balance));
    } catch (err) {
      setLoadError(getErrorMessage(err, "Failed to load the invoice"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && invoiceId) {
      setInvoice(null);
      setPayError(null);
      load(invoiceId);
    }
  }, [open, invoiceId, load]);

  const applyUpdate = (data) => {
    setInvoice(data);
    setPayment(emptyPayment(data.balance));
    onChanged();
  };

  async function submitPayment(e) {
    e.preventDefault();
    const amount = Number(payment.amount);
    if (!(amount > 0)) return setPayError("Enter an amount greater than 0");
    if (amount > invoice.balance) return setPayError(`Cannot exceed the balance of ${formatMoney(invoice.balance, invoice.currency)}`);
    setPayError(null);

    setBusy(true);
    try {
      const res = await financeApi.recordPayment(invoice.id, {
        amount: payment.amount,
        method: payment.method,
        paidAt: payment.paidAt || undefined,
        reference: payment.reference.trim() || null,
      });
      applyUpdate(res.data);
      toast.success("Payment recorded");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not record the payment"));
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    setBusy(true);
    try {
      await confirm.run();
    } catch (err) {
      toast.error(getErrorMessage(err, "That action failed"));
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  const askCancel = () =>
    setConfirm({
      title: "Cancel this invoice?",
      description: "The invoice will be marked as cancelled and excluded from revenue.",
      label: "Cancel invoice",
      run: async () => {
        const res = await financeApi.cancelInvoice(invoice.id);
        applyUpdate(res.data);
        toast.success("Invoice cancelled");
      },
    });

  const askDelete = () =>
    setConfirm({
      title: "Delete this invoice?",
      description: `This permanently removes ${invoice.invoiceNumber}. This cannot be undone.`,
      label: "Delete",
      run: async () => {
        await financeApi.removeInvoice(invoice.id);
        toast.success("Invoice deleted");
        onOpenChange(false);
        onDeleted();
      },
    });

  const askRemovePayment = (p) =>
    setConfirm({
      title: "Remove this payment?",
      description: `${formatMoney(p.amount, invoice.currency)} will be taken off the amount paid and the invoice status will update.`,
      label: "Remove payment",
      run: async () => {
        const res = await financeApi.removePayment(invoice.id, p.id);
        applyUpdate(res.data);
        toast.success("Payment removed");
      },
    });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {loading && !invoice ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : loadError ? (
            <div className="space-y-3 text-center py-4">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => load(invoiceId)}>Try again</Button>
            </div>
          ) : invoice ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{invoice.invoiceNumber}</span>
                  <Badge variant="secondary" className={invoiceStatusStyles[invoice.displayStatus]}>
                    {INVOICE_STATUS_LABELS[invoice.displayStatus]}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{invoice.customerName}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-4">
                <Detail label="Amount">{formatMoney(invoice.amount, invoice.currency)}</Detail>
                <Detail label="Paid">{formatMoney(invoice.amountPaid, invoice.currency)}</Detail>
                <Detail label="Balance">{formatMoney(invoice.balance, invoice.currency)}</Detail>
                <Detail label="Issued">{formatDate(invoice.issueDate)}</Detail>
                <Detail label="Due">{formatDate(invoice.dueDate)}</Detail>
                <Detail label="Export order">{invoice.exportOrder?.orderNumber || "None"}</Detail>
              </div>

              {invoice.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice.canRecordPayment && (
                <form onSubmit={submitPayment} className="space-y-3 rounded-md border p-3">
                  <p className="text-sm font-semibold">Record a payment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Amount ({invoice.currency})</Label>
                      <Input type="number" min="0" step="any" value={payment.amount}
                        onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date received</Label>
                      <Input type="date" value={payment.paidAt}
                        onChange={(e) => setPayment((p) => ({ ...p, paidAt: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Method</Label>
                      <Select value={payment.method} onValueChange={(v) => setPayment((p) => ({ ...p, method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Reference (optional)</Label>
                      <Input value={payment.reference}
                        onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))} />
                    </div>
                  </div>
                  {payError && <p className="text-xs text-destructive">{payError}</p>}
                  <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving..." : "Record payment"}</Button>
                </form>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">Payments</p>
                {invoice.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {invoice.payments.map((p) => (
                      <li key={p.id} className="p-3 text-sm flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{formatMoney(p.amount, invoice.currency)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(p.paidAt)} · {PAYMENT_METHOD_LABELS[p.method]}
                            {p.recordedBy ? ` · ${p.recordedBy.name}` : ""}
                          </p>
                          {p.reference && <p className="text-xs text-muted-foreground truncate">Ref: {p.reference}</p>}
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => askRemovePayment(p)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex gap-2">
                  {invoice.canCancel && (
                    <Button variant="outline" size="sm" onClick={askCancel}>Cancel invoice</Button>
                  )}
                  {invoice.canDelete && (
                    <Button variant="outline" size="sm" className="text-destructive" onClick={askDelete}>Delete</Button>
                  )}
                </div>
                {invoice.canEdit && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(invoice)}>Edit details</Button>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirm} disabled={busy}>{confirm?.label}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}