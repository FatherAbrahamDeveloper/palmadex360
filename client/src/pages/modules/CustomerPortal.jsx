import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Globe, Package, Ship, FileText, DollarSign, ShoppingCart, Search, Loader2, Plus, ArrowLeft, Download,
  MessageSquare, HeadphonesIcon, Building2, Pencil, Eye, CheckCircle2, Circle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import api, { portalApi, customerApi, getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeEvent } from "@/context/RealtimeContext";
import { canAccess } from "@/lib/roleConfig";
import { cn, formatDate, formatMoney, formatBytes, prettyEnum, apiFileUrl, timeAgo } from "@/lib/utils";

const ORDER_STYLE = {
  PENDING: "bg-amber-100 text-amber-800", PROCESSING: "bg-sky-100 text-sky-800", IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-slate-200 text-slate-700",
};
const INVOICE_STYLE = { PENDING: "bg-amber-100 text-amber-800", PARTIALLY_PAID: "bg-sky-100 text-sky-800", PAID: "bg-emerald-100 text-emerald-800", OVERDUE: "bg-red-100 text-red-800", CANCELLED: "bg-slate-200 text-slate-700" };
const STEP_LABEL = { BOOKED: "Booked", LOADING: "Loading", AT_SEA: "At sea", CUSTOMS: "Customs", ARRIVED: "Arrived" };
const fileHref = (f, download) => `${apiFileUrl(f.url, api.defaults.baseURL)}${download ? "&download=1" : ""}`;

function Badge({ children, className }) {
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", className)}>{children}</span>;
}

function Empty({ icon: Icon, text, action }) {
  return (
    <div className="surface p-10 text-center space-y-3">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

function ShipmentTimeline({ s }) {
  return (
    <div className="surface p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{s.shipmentNumber} · {s.vesselName}</p>
          <p className="text-xs text-muted-foreground">{s.originPort} to {s.destinationPort}{s.shippingLine ? ` · ${s.shippingLine}` : ""}{s.billOfLadingNumber ? ` · B/L ${s.billOfLadingNumber}` : ""}</p>
          {s.orders?.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">Orders: {s.orders.map((o) => o.orderNumber).join(", ")}</p>}
        </div>
        <div className="text-right text-xs">
          {s.etd && <p>Departs {formatDate(s.etd)}</p>}
          {s.eta && <p className="font-medium">Arrives {formatDate(s.eta)}</p>}
        </div>
      </div>
      {s.status === "CANCELLED" ? (
        <Badge className="bg-slate-200 text-slate-700">Cancelled</Badge>
      ) : (
        <ol className="grid grid-cols-5 gap-1" aria-label="Shipment progress">
          {s.steps.map((step, i) => {
            const done = i <= s.step;
            return (
              <li key={step} className="flex flex-col items-center text-center">
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                </span>
                <span className={cn("mt-1 text-[11px]", i === s.step ? "font-semibold" : "text-muted-foreground")}>{STEP_LABEL[step]}</span>
              </li>
            );
          })}
        </ol>
      )}
      {s.events?.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-primary">Tracking history ({s.events.length})</summary>
          <ul className="mt-2 space-y-1 border-l pl-3">
            {[...s.events].reverse().map((e) => (
              <li key={e.id}><span className="font-medium">{STEP_LABEL[e.toStatus] || prettyEnum(e.toStatus)}</span> · {formatDate(e.createdAt)}{e.note ? ` · ${e.note}` : ""}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function OrderDialog({ customerId, orderId, onOpenChange, isCustomer, onChanged }) {
  const [o, setO] = useState(null);
  useEffect(() => {
    if (!orderId) return;
    setO(null);
    portalApi.order(customerId, orderId).then(setO).catch((err) => { toast.error(getErrorMessage(err)); onOpenChange(false); });
  }, [orderId, customerId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancel() {
    if (!window.confirm(`Cancel order ${o.orderNumber}?`)) return;
    try { await portalApi.cancelOrder(o.id); toast.success("Order cancelled"); onChanged(); onOpenChange(false); } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <Dialog open={!!orderId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        {!o ? <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading order" /></div> : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">{o.orderNumber} <Badge className={ORDER_STYLE[o.status]}>{prettyEnum(o.status)}</Badge></DialogTitle>
              <DialogDescription>{o.quantity} {o.unit} of {o.productName} · placed {formatDate(o.createdAt)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{o.progress}%</span></div>
                <Progress value={o.progress} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Order value</p><p className="font-semibold">{o.totalValue ? formatMoney(o.totalValue, o.currency) : "To be confirmed"}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Last update</p><p className="font-semibold">{timeAgo(o.updatedAt)}</p></div>
              </div>
              {o.notes && <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{o.notes}</p>}
              <div>
                <p className="font-medium text-sm mb-2">Shipments</p>
                {o.shipments.length ? <div className="space-y-3">{o.shipments.map((s) => <ShipmentTimeline key={s.id} s={s} />)}</div> : <p className="text-sm text-muted-foreground">Not booked on a vessel yet.</p>}
              </div>
              <div>
                <p className="font-medium text-sm mb-2">Invoices</p>
                {o.invoices.length ? (
                  <ul className="divide-y rounded-lg border">{o.invoices.map((i) => (
                    <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{i.invoiceNumber} · due {formatDate(i.dueDate)}</span>
                      <span className="flex items-center gap-2">{formatMoney(i.balance, i.currency)} due <Badge className={INVOICE_STYLE[i.status]}>{prettyEnum(i.status)}</Badge></span>
                    </li>
                  ))}</ul>
                ) : <p className="text-sm text-muted-foreground">No invoices yet.</p>}
              </div>
              <div>
                <p className="font-medium text-sm mb-2">Documents</p>
                {o.documents.length ? (
                  <ul className="divide-y rounded-lg border">{o.documents.map((f) => (
                    <li key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 min-w-0"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{f.originalName}</span></span>
                      <a href={fileHref(f, true)} className="text-primary text-xs flex items-center gap-1 shrink-0"><Download className="h-3.5 w-3.5" /> Download</a>
                    </li>
                  ))}</ul>
                ) : <p className="text-sm text-muted-foreground">Documents for this order will appear here.</p>}
              </div>
            </div>
            <DialogFooter className="gap-2">
              {isCustomer && (
                <>
                  <Button variant="outline" asChild><Link to={`/support?new=1`}><HeadphonesIcon className="h-4 w-4 mr-1" /> Get help with this order</Link></Button>
                  {o.status === "PENDING" && <Button variant="outline" className="text-destructive" onClick={cancel}>Cancel order</Button>}
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlaceOrderDialog({ product, onOpenChange, onPlaced }) {
  const [form, setForm] = useState({ quantity: "", destination: "", requestedDeliveryDate: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (product) setForm({ quantity: product.minimumOrderQuantity || "", destination: "", requestedDeliveryDate: "", notes: "" }); }, [product]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const qty = Number(form.quantity) || 0;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const order = await portalApi.placeOrder({ productId: product.id, unit: product.unit, ...form, quantity: qty });
      toast.success(`Order ${order.orderNumber} placed. We have emailed you a confirmation.`);
      onOpenChange(false);
      onPlaced(order);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>Order {product.name}</DialogTitle>
              <DialogDescription>{product.price ? `${formatMoney(product.price, product.currency)} per ${product.unit}` : "Price confirmed by Palmadex after you order"}{product.minimumOrderQuantity ? ` · minimum ${product.minimumOrderQuantity} ${product.unit}` : ""}</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="o-qty">Quantity ({product.unit})</Label><Input id="o-qty" type="number" min={product.minimumOrderQuantity || 0.001} step="any" value={form.quantity} onChange={set("quantity")} required /></div>
              <div className="space-y-1.5"><Label htmlFor="o-dest">Destination port or country</Label><Input id="o-dest" value={form.destination} onChange={set("destination")} required placeholder="e.g. Rotterdam, Netherlands" /></div>
              <div className="space-y-1.5"><Label htmlFor="o-date">Preferred delivery date (optional)</Label><Input id="o-date" type="date" value={form.requestedDeliveryDate} onChange={set("requestedDeliveryDate")} /></div>
              <div className="space-y-1.5"><Label htmlFor="o-notes">Notes (optional)</Label><Textarea id="o-notes" rows={3} value={form.notes} onChange={set("notes")} placeholder="Packaging, grade, Incoterms, documents you need..." /></div>
              {product.price > 0 && qty > 0 && <p className="text-sm">Estimated value: <strong>{formatMoney(product.price * qty, product.currency)}</strong></p>}
              <DialogFooter><Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Placing order" /> : "Place order"}</Button></DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// The portal itself. `customerId` is set when staff preview a customer's portal.
function PortalView({ customerId, isCustomer }) {
  const { user } = useAuth();
  const canOrder = isCustomer && canAccess(user, "portal", "EDIT");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const orderId = params.get("order");
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState(null);
  const [shipments, setShipments] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [q, setQ] = useState("");
  const [ordering, setOrdering] = useState(null);
  const [error, setError] = useState("");

  const setParam = (k, v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; });

  const loadSummary = useCallback(() => portalApi.summary(customerId).then((s) => { setSummary(s); setError(""); }).catch((err) => setError(getErrorMessage(err))), [customerId]);
  const loadTab = useCallback(() => {
    if (tab === "orders") portalApi.orders(customerId, { limit: 50 }).then((r) => setOrders(r.data)).catch(() => setOrders([]));
    if (tab === "shipments") portalApi.shipments(customerId).then(setShipments).catch(() => setShipments([]));
    if (tab === "invoices") portalApi.invoices(customerId).then(setInvoices).catch(() => setInvoices([]));
    if (tab === "documents") portalApi.documents(customerId).then(setDocuments).catch(() => setDocuments([]));
  }, [tab, customerId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadTab(); }, [loadTab]);
  useEffect(() => {
    if (tab !== "catalog") return undefined;
    const t = setTimeout(() => portalApi.catalog(q).then(setCatalog).catch(() => setCatalog([])), 250);
    return () => clearTimeout(t);
  }, [tab, q]);
  // Customers get live updates when Palmadex changes their orders or shipments.
  useRealtimeEvent("notification:new", (n) => { if (n.type === "portal.update") { loadSummary(); loadTab(); } });

  if (error) return <Empty icon={AlertCircle} text={error} action={isCustomer && <Button size="sm" asChild><Link to="/support?new=1">Contact support</Link></Button>} />;

  const c = summary?.counts;
  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setParam("tab", v === "overview" ? null : v)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isCustomer && <TabsTrigger value="catalog">Products & ordering</TabsTrigger>}
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {summary ? [
              ["Active orders", c.activeOrders, ShoppingCart, "orders"], ["Shipments in progress", c.activeShipments, Ship, "shipments"],
              ["Unpaid invoices", c.unpaidInvoices, DollarSign, "invoices"], ["Documents", c.documents, FileText, "documents"], ["Open tickets", c.openTickets, HeadphonesIcon, null],
            ].map(([label, value, Icon, t]) => (
              <button key={label} type="button" onClick={() => (t ? setParam("tab", t) : null)} className="surface p-4 text-left hover:border-primary/30">
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-2xl font-heading font-bold">{value}</p>
              </button>
            )) : [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          {summary?.outstanding.length > 0 && (
            <p className="text-sm rounded-lg border bg-amber-50 p-3">Outstanding balance: <strong>{summary.outstanding.map((o) => formatMoney(o.total, o.currency)).join(" + ")}</strong>{c.overdueInvoices ? `, ${c.overdueInvoices} overdue` : ""}.</p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><h3 className="font-heading font-semibold">Recent orders</h3>{isCustomer && <Button size="sm" onClick={() => setParam("tab", "catalog")}><Plus className="h-4 w-4 mr-1" /> New order</Button>}</div>
              {!summary ? <Skeleton className="h-40 rounded-xl" /> : summary.recentOrders.length === 0 ? (
                <Empty icon={ShoppingCart} text="No orders yet." action={isCustomer && <Button size="sm" onClick={() => setParam("tab", "catalog")}>Browse products</Button>} />
              ) : (
                <ul className="surface divide-y">{summary.recentOrders.map((o) => (
                  <li key={o.id}><button type="button" onClick={() => setParam("order", o.id)} className="w-full text-left px-4 py-3 hover:bg-muted/30 flex items-center justify-between gap-2">
                    <span className="min-w-0"><span className="block text-sm font-medium">{o.orderNumber}</span><span className="block text-xs text-muted-foreground truncate">{o.quantity} {o.unit} · {o.productName}</span></span>
                    <Badge className={ORDER_STYLE[o.status]}>{prettyEnum(o.status)}</Badge>
                  </button></li>
                ))}</ul>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="font-heading font-semibold">Next arrival</h3>
              {!summary ? <Skeleton className="h-40 rounded-xl" /> : summary.nextShipment ? <ShipmentTimeline s={summary.nextShipment} /> : <Empty icon={Ship} text="No shipments in progress." />}
              {isCustomer && (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" asChild><Link to="/communication"><MessageSquare className="h-4 w-4 mr-1" /> Message Palmadex</Link></Button>
                  <Button variant="outline" asChild><Link to="/support?new=1"><HeadphonesIcon className="h-4 w-4 mr-1" /> Raise a ticket</Link></Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {isCustomer && (
          <TabsContent value="catalog" className="mt-4 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a product" className="pl-9" aria-label="Find a product" />
            </div>
            {!catalog ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div> : catalog.length === 0 ? (
              <Empty icon={Package} text="No products are available right now." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalog.map((p) => (
                  <div key={p.id} className="surface p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.isNewListing && <Badge className="bg-primary/10 text-primary">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{[p.category?.name, p.originCountry && `Origin: ${p.originCountry}`, p.hsCode && `HS ${p.hsCode}`].filter(Boolean).join(" · ")}</p>
                    {p.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{p.description}</p>}
                    {p.packaging && <p className="text-xs mt-2"><span className="text-muted-foreground">Packaging:</span> {p.packaging}</p>}
                    <div className="mt-auto pt-4 flex items-end justify-between gap-2">
                      <div>
                        <p className="font-semibold">{p.price ? `${formatMoney(p.price, p.currency)} / ${p.unit}` : "Price on request"}</p>
                        <p className="text-xs text-muted-foreground">{p.minimumOrderQuantity ? `Min. ${p.minimumOrderQuantity} ${p.unit} · ` : ""}{p.inStock ? "In stock" : "Made to order"}</p>
                      </div>
                      {canOrder && <Button size="sm" onClick={() => setOrdering(p)}>Order</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="orders" className="mt-4">
          {!orders ? <Skeleton className="h-48 rounded-xl" /> : orders.length === 0 ? <Empty icon={ShoppingCart} text="No orders yet." /> : (
            <div className="surface overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/40 text-left"><th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium hidden sm:table-cell">Value</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium hidden md:table-cell">Placed</th></tr></thead>
                <tbody>{orders.map((o) => (
                  <tr key={o.id} onClick={() => setParam("order", o.id)} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3">{o.quantity} {o.unit} · {o.productName}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{o.totalValue ? formatMoney(o.totalValue, o.currency) : "To be confirmed"}</td>
                    <td className="px-4 py-3"><Badge className={ORDER_STYLE[o.status]}>{prettyEnum(o.status)}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shipments" className="mt-4 space-y-3">
          {!shipments ? <Skeleton className="h-48 rounded-xl" /> : shipments.length === 0 ? <Empty icon={Ship} text="No shipments yet. Once your order is booked on a vessel you can track it here." /> : shipments.map((s) => <ShipmentTimeline key={s.id} s={s} />)}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          {!invoices ? <Skeleton className="h-48 rounded-xl" /> : invoices.length === 0 ? <Empty icon={DollarSign} text="No invoices yet." /> : (
            <div className="surface overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/40 text-left"><th className="px-4 py-3 font-medium">Invoice</th><th className="px-4 py-3 font-medium hidden sm:table-cell">Order</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Balance</th><th className="px-4 py-3 font-medium hidden md:table-cell">Due</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
                <tbody>{invoices.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{i.invoiceNumber}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{i.exportOrder?.orderNumber || ""}</td>
                    <td className="px-4 py-3">{formatMoney(i.amount, i.currency)}</td>
                    <td className="px-4 py-3">{formatMoney(i.balance, i.currency)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{formatDate(i.dueDate)}</td>
                    <td className="px-4 py-3"><Badge className={INVOICE_STYLE[i.status]}>{prettyEnum(i.status)}</Badge></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {!documents ? <Skeleton className="h-48 rounded-xl" /> : documents.length === 0 ? <Empty icon={FileText} text="Certificates, bills of lading and other documents shared with you will appear here." /> : (
            <ul className="surface divide-y">{documents.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="min-w-0"><span className="block text-sm font-medium truncate">{f.originalName}</span><span className="block text-xs text-muted-foreground">{formatBytes(f.size)} · {formatDate(f.createdAt)}{f.exportOrder ? ` · ${f.exportOrder.orderNumber}` : ""}</span></span>
                </span>
                <span className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" asChild><a href={fileHref(f)} target="_blank" rel="noreferrer" aria-label={`Open ${f.originalName}`}><Eye className="h-4 w-4" /></a></Button>
                  <Button size="icon" variant="ghost" asChild><a href={fileHref(f, true)} aria-label={`Download ${f.originalName}`}><Download className="h-4 w-4" /></a></Button>
                </span>
              </li>
            ))}</ul>
          )}
        </TabsContent>
      </Tabs>

      <OrderDialog customerId={customerId} orderId={orderId} isCustomer={isCustomer} onOpenChange={(o) => !o && setParam("order", null)} onChanged={() => { loadSummary(); loadTab(); }} />
      <PlaceOrderDialog product={ordering} onOpenChange={(o) => !o && setOrdering(null)} onPlaced={(order) => { loadSummary(); setParams(new URLSearchParams({ tab: "orders", order: order.id })); }} />
    </>
  );
}

function CustomerFormDialog({ customer, open, onOpenChange, onSaved }) {
  const empty = { name: "", email: "", phone: "", country: "", address: "", notes: "", isActive: true };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setForm(customer ? { ...empty, ...Object.fromEntries(Object.entries(customer).filter(([k]) => k in empty).map(([k, v]) => [k, v ?? ""])) } : empty); }, [open, customer]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = customer ? await customerApi.update(customer.id, form) : await customerApi.create(form);
      toast.success(customer ? "Customer updated" : "Customer added");
      onOpenChange(false); onSaved(saved);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle><DialogDescription>Buyers you export to. Link portal users to a customer in User & Access Management.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="c-name">Company name</Label><Input id="c-name" value={form.name} onChange={set("name")} required minLength={2} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={form.email} onChange={set("email")} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-phone">Phone</Label><Input id="c-phone" value={form.phone} onChange={set("phone")} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-country">Country</Label><Input id="c-country" value={form.country} onChange={set("country")} /></div>
          <label className="flex items-center gap-2 text-sm self-end pb-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} /> Active</label>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="c-addr">Address</Label><Textarea id="c-addr" rows={2} value={form.address} onChange={set("address")} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="c-notes">Notes</Label><Textarea id="c-notes" rows={2} value={form.notes} onChange={set("notes")} /></div>
          <DialogFooter className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : "Save"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerAdmin() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const selected = params.get("customer");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const canEdit = canAccess(user, "portal", "EDIT");

  const load = useCallback(() => customerApi.list({ q: q || undefined, limit: 100 }).then(setData).catch((err) => toast.error(getErrorMessage(err))), [q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { if (selected) customerApi.get(selected).then(setCurrent).catch(() => setCurrent(null)); else setCurrent(null); }, [selected]);

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setParams({})}><ArrowLeft className="h-4 w-4 mr-1" /> All customers</Button>
          {current && canEdit && <Button size="sm" variant="outline" onClick={() => { setEditing(current); setFormOpen(true); }}><Pencil className="h-4 w-4 mr-1" /> Edit customer</Button>}
        </div>
        {current && (
          <div className="surface p-5 flex flex-wrap gap-6">
            <div className="flex-1 min-w-[200px]">
              <p className="text-lg font-heading font-bold">{current.name}</p>
              <p className="text-sm text-muted-foreground">{[current.country, current.email, current.phone].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">Portal users</p>
              {current.users.length ? current.users.map((u) => <p key={u.id}>{u.firstName} {u.lastName} <span className="text-xs text-muted-foreground">{u.email}</span></p>) : <p className="text-muted-foreground">None yet</p>}
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">Order value</p>
              {current.orderValue.length ? current.orderValue.map((v) => <p key={v.currency} className="font-semibold">{formatMoney(v.total, v.currency)}</p>) : <p>None yet</p>}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> You are viewing the portal as this customer sees it.</p>
        <PortalView customerId={selected} isCustomer={false} />
        <CustomerFormDialog customer={editing} open={formOpen} onOpenChange={setFormOpen} onSaved={(c) => { setCurrent((x) => ({ ...x, ...c })); load(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter customers by name, email or country" className="pl-9" aria-label="Filter customers" />
        </div>
        {canEdit && <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add customer</Button>}
      </div>
      {!data ? <Skeleton className="h-64 rounded-xl" /> : data.data.length === 0 ? (
        <Empty icon={Building2} text="No customers yet. Customers are created when you approve a buyer's registration, or you can add them here." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40 text-left"><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium hidden sm:table-cell">Country</th><th className="px-4 py-3 font-medium">Orders</th><th className="px-4 py-3 font-medium hidden md:table-cell">Portal users</th><th className="px-4 py-3 font-medium hidden md:table-cell">Tickets</th><th className="px-4 py-3" /></tr></thead>
            <tbody>{data.data.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3"><p className="font-medium">{c.name}{!c.isActive && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}</p><p className="text-xs text-muted-foreground">{c.email}</p></td>
                <td className="px-4 py-3 hidden sm:table-cell">{c.country}</td>
                <td className="px-4 py-3">{c._count.orders}</td>
                <td className="px-4 py-3 hidden md:table-cell">{c._count.users}</td>
                <td className="px-4 py-3 hidden md:table-cell">{c._count.tickets}</td>
                <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setParams({ customer: c.id })}>Open portal</Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <CustomerFormDialog customer={editing} open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
    </div>
  );
}

export default function CustomerPortal() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  return (
    <ModulePageShell
      title="Customer Portal"
      description={isCustomer ? `Place orders and follow them to delivery${user?.customer?.name ? ` · ${user.customer.name}` : ""}` : "Your buyers, their orders, shipments and documents"}
      icon={Globe}
    >
      {isCustomer ? <PortalView isCustomer /> : <CustomerAdmin />}
    </ModulePageShell>
  );
}
