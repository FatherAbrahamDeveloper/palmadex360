import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Printer, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart,
} from "recharts";
import { toast } from "sonner";
import ModulePageShell from "@/components/modules/ModulePageShell";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reportApi, getErrorMessage } from "@/services/api";
import { cn, formatMoney, prettyEnum } from "@/lib/utils";

const COLORS = ["hsl(200, 100%, 40%)", "hsl(168, 60%, 38%)", "hsl(38, 90%, 50%)", "hsl(262, 50%, 55%)", "hsl(0, 65%, 55%)", "hsl(173, 55%, 40%)", "hsl(220, 15%, 55%)", "hsl(330, 60%, 55%)"];
const DATASETS = [
  ["orders", "Export orders", "orders"], ["shipments", "Shipments", "shipping"], ["invoices", "Invoices", "finance"],
  ["payments", "Payments received", "finance"], ["expenses", "Expenses", "finance"], ["contacts", "CRM contacts", "crm"],
  ["tickets", "Support tickets", "support"], ["purchases", "Purchase requests", "procurement"],
];
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);
const compact = (n) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

function Change({ value }) {
  if (value == null) return <span className="text-xs text-muted-foreground">new</span>;
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return <span className={cn("inline-flex items-center gap-1 text-xs font-medium", value > 0 ? "text-primary" : value < 0 ? "text-destructive" : "text-muted-foreground")}><Icon className="h-3 w-3" aria-hidden="true" />{value > 0 ? "+" : ""}{value}%</span>;
}

function Kpi({ label, value, sub, change }) {
  return (
    <div className="surface p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-heading font-bold mt-1 truncate">{value}</p>
      <div className="flex items-center justify-between gap-2 mt-0.5">{sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}{change !== undefined && <Change value={change} />}</div>
    </div>
  );
}

function Card({ title, children, className }) {
  return <div className={cn("surface p-5", className)}><h3 className="font-heading font-bold text-base mb-4">{title}</h3>{children}</div>;
}

function RankList({ rows, value, label, empty = "No data in this period." }) {
  if (!rows?.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map(value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i}>
          <div className="flex justify-between text-sm gap-2"><span className="truncate">{label(r)}</span><span className="font-medium shrink-0">{r.display}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(value(r) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Donut({ rows }) {
  if (!rows?.length) return <p className="text-sm text-muted-foreground">No data in this period.</p>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows.map((r) => ({ name: prettyEnum(r.key), value: r.count }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function Overview({ range }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setData(null);
    reportApi.overview(range).then((d) => { setData(d); setError(""); }).catch((err) => setError(getErrorMessage(err, "Could not load the report")));
  }, [range]);

  if (error) return <div className="surface p-8 text-center"><AlertCircle className="mx-auto h-7 w-7 text-destructive mb-2" /><p className="text-sm text-muted-foreground">{error}</p></div>;
  if (!data) return <div className="space-y-4"><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div><Skeleton className="h-80 rounded-xl" /></div>;

  const { kpis: k, trends: t, sections: s, currency: cur, breakdowns: b } = data;
  const m = (v) => formatMoney(v, cur);
  const kpis = [
    s.orders && ["Export orders", k.ordersCount, `${k.cancelledOrders} cancelled`, t.ordersCount.change],
    s.orders && ["Order value", m(k.orderValue), `Avg. ${m(k.avgOrderValue)}`, t.orderValue.change],
    s.finance && ["Revenue received", m(k.revenue), `Invoiced ${m(k.invoiced)}`, t.revenue.change],
    s.finance && ["Net (revenue minus expenses)", m(k.net), `Expenses ${m(k.expenses)}`, undefined],
    s.shipping && ["Shipments", k.shipmentsCount, k.onTimeRate != null ? `${k.onTimeRate}% arrived on time` : `${k.shipmentsArrived} arrived`, t.shipmentsCount.change],
    s.crm && ["New CRM contacts", k.newContacts, k.conversionRate != null ? `${k.conversionRate}% won` : "", t.newContacts.change],
    s.support && ["Support tickets", k.ticketsOpened, k.avgResolutionHours != null ? `Avg. ${k.avgResolutionHours} h to resolve` : `${k.ticketsResolved} resolved`, t.ticketsOpened.change],
    s.inventory && ["Low stock items", data.lowStockCount, "At or below reorder level", undefined],
  ].filter(Boolean);

  const otherCurrencies = Object.keys(k.byCurrency.orderValue).filter((c) => c !== cur);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(([label, value, sub, change]) => <Kpi key={label} label={label} value={value} sub={sub} change={change} />)}
      </div>
      <p className="text-xs text-muted-foreground">Change figures compare this month so far with last month. Money is shown in {cur}{otherCurrencies.length ? `; this period also has orders in ${otherCurrencies.join(", ")} (see the CSV export)` : ""}.</p>

      {(s.orders || s.finance) && (
        <Card title={`Monthly export performance (${cur})`}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="money" tick={{ fontSize: 11 }} tickFormatter={compact} />
                <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v, name) => (name === "Orders" ? v : m(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {s.orders && <Bar yAxisId="money" dataKey="orderValue" name="Order value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />}
                {s.finance && <Bar yAxisId="money" dataKey="revenue" name="Revenue received" fill={COLORS[1]} radius={[4, 4, 0, 0]} />}
                {s.finance && <Bar yAxisId="money" dataKey="expenses" name="Expenses" fill={COLORS[4]} radius={[4, 4, 0, 0]} />}
                {s.orders && <Line yAxisId="count" type="monotone" dataKey="orders" name="Orders" stroke={COLORS[2]} strokeWidth={2} dot={false} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(s.shipping || s.crm || s.support) && (
          <Card title="Activity by month">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {s.shipping && <Bar dataKey="shipments" name="Shipments" fill={COLORS[1]} />}
                  {s.crm && <Bar dataKey="newContacts" name="New contacts" fill={COLORS[3]} />}
                  {s.support && <Bar dataKey="tickets" name="Tickets" fill={COLORS[2]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
        <InsightsPanel insights={data.insights} title="Actions to take" empty="No issues found. Everything is on track." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {s.orders && <Card title="Top customers"><RankList rows={b.topCustomers.map((r) => ({ ...r, display: r.value ? m(r.value) : `${r.orders} orders` }))} value={(r) => r.value || r.orders} label={(r) => `${r.name} · ${r.orders} order${r.orders === 1 ? "" : "s"}`} /></Card>}
        {s.orders && <Card title="Top products"><RankList rows={b.topProducts.map((r) => ({ ...r, display: `${compact(r.quantity)} ${r.unit || ""}` }))} value={(r) => r.quantity} label={(r) => `${r.name}${r.value ? ` · ${m(r.value)}` : ""}`} /></Card>}
        {s.shipping && <Card title="Destination markets"><RankList rows={b.markets.map((r) => ({ ...r, display: `${r.shipments}` }))} value={(r) => r.shipments} label={(r) => r.destination} empty="No shipments in this period." /></Card>}
        {s.orders && <Card title="Order status"><Donut rows={b.orderStatus} /></Card>}
        {s.crm && <Card title="CRM pipeline (new contacts)"><Donut rows={b.crmPipeline} /></Card>}
        {s.crm && <Card title="Where contacts came from"><Donut rows={b.crmSources} /></Card>}
        {s.shipping && <Card title="Shipment status"><Donut rows={b.shipmentStatus} /></Card>}
        {s.finance && <Card title={`Expenses by category (${cur})`}><RankList rows={b.expenseCategories.map((r) => ({ ...r, display: m(r.amount) }))} value={(r) => r.amount} label={(r) => prettyEnum(r.key)} /></Card>}
        {s.support && <Card title="Tickets by category"><Donut rows={b.ticketCategories} /></Card>}
        {s.suppliers && <Card title="Suppliers by status"><Donut rows={data.suppliers} /></Card>}
      </div>
    </div>
  );
}

function Monthly() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setData(null);
    reportApi.monthly(month).then((d) => { setData(d); setError(""); }).catch((err) => setError(getErrorMessage(err)));
  }, [month]);

  const rows = useMemo(() => {
    if (!data) return [];
    const { sections: s, current: c, previous: p, changes: ch } = data;
    const mo = (v) => formatMoney(v, c.currency);
    return [
      s.orders && ["Export orders placed", c.ordersCount, p.ordersCount, ch.ordersCount],
      s.orders && ["Order value", mo(c.orderValue), mo(p.orderValue), ch.orderValue],
      s.finance && ["Revenue received", mo(c.revenue), mo(p.revenue), ch.revenue],
      s.finance && ["Invoiced", mo(c.invoiced), mo(p.invoiced), ch.invoiced],
      s.finance && ["Expenses", mo(c.expenses), mo(p.expenses), ch.expenses],
      s.finance && ["Net", mo(c.net), mo(p.net), ch.net],
      s.shipping && ["Shipments booked", c.shipmentsCount, p.shipmentsCount, ch.shipmentsCount],
      s.shipping && ["Shipments arrived", c.shipmentsArrived, p.shipmentsArrived, ch.shipmentsArrived],
      s.crm && ["New CRM contacts", c.newContacts, p.newContacts, ch.newContacts],
      s.support && ["Tickets opened", c.ticketsOpened, p.ticketsOpened, ch.ticketsOpened],
      s.support && ["Tickets resolved", c.ticketsResolved, p.ticketsResolved, ch.ticketsResolved],
    ].filter(Boolean);
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5"><Label htmlFor="month">Month</Label><Input id="month" type="month" value={month} max={new Date().toISOString().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} className="w-44" /></div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : !data ? <Skeleton className="h-96 rounded-xl" /> : (
        <>
          <Card title={`Monthly report: ${data.label}`}>
            <ul className="list-disc ml-5 space-y-1 text-sm">{data.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Compared with the previous month">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2 font-medium">Measure</th><th className="py-2 font-medium">This month</th><th className="py-2 font-medium">Previous</th><th className="py-2 font-medium">Change</th></tr></thead>
                <tbody>{rows.map(([label, cur, prev, ch]) => (
                  <tr key={label} className="border-b last:border-0"><td className="py-2">{label}</td><td className="py-2 font-medium">{cur}</td><td className="py-2 text-muted-foreground">{prev}</td><td className="py-2"><Change value={ch} /></td></tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Week by week">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.weekly}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="c" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis yAxisId="m" orientation="right" tick={{ fontSize: 11 }} tickFormatter={compact} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {data.sections.orders && <Bar yAxisId="c" dataKey="orders" name="Orders" fill={COLORS[0]} />}
                    {data.sections.shipping && <Bar yAxisId="c" dataKey="shipments" name="Shipments" fill={COLORS[1]} />}
                    {data.sections.finance && <Line yAxisId="m" dataKey="revenue" name={`Revenue (${data.current.currency})`} stroke={COLORS[2]} strokeWidth={2} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
            {data.sections.orders && <Card title="Top customers this month"><RankList rows={data.breakdowns.topCustomers.map((r) => ({ ...r, display: `${r.orders} order${r.orders === 1 ? "" : "s"}` }))} value={(r) => r.orders} label={(r) => r.name} /></Card>}
            {data.sections.orders && <Card title="Top products this month"><RankList rows={data.breakdowns.topProducts.map((r) => ({ ...r, display: `${compact(r.quantity)} ${r.unit || ""}` }))} value={(r) => r.quantity} label={(r) => r.name} /></Card>}
          </div>
        </>
      )}
    </div>
  );
}

export default function Reports() {
  const [preset, setPreset] = useState("12");
  const [custom, setCustom] = useState({ from: isoDate(new Date(Date.now() - 90 * 86400_000)), to: isoDate(new Date()) });
  const [dataset, setDataset] = useState("orders");
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState("overview");

  const range = useMemo(() => {
    if (preset === "custom") return { from: custom.from, to: custom.to };
    if (preset === "ytd") return { from: `${new Date().getFullYear()}-01-01` };
    return { months: Number(preset) };
  }, [preset, custom]);

  const download = useCallback(async () => {
    setDownloading(true);
    try {
      const params = range.months ? { from: isoDate(new Date(new Date().getFullYear(), new Date().getMonth() - range.months + 1, 1)) } : range;
      await reportApi.download(dataset, params);
    } catch (err) {
      toast.error(err?.response?.status === 403 ? "You do not have permission to export that data" : "Export failed");
    } finally { setDownloading(false); }
  }, [dataset, range]);

  return (
    <ModulePageShell
      title="Reports & Analytics"
      description="Live export performance, trends and monthly reports"
      icon={BarChart3}
      actions={<Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print or save as PDF</Button>}
    >
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 print:hidden">
          <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="monthly">Monthly report</TabsTrigger></TabsList>
          <div className="flex flex-wrap items-end gap-2">
            {tab === "overview" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="range">Period</Label>
                  <Select value={preset} onValueChange={setPreset}>
                    <SelectTrigger id="range" className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Last 3 months</SelectItem><SelectItem value="6">Last 6 months</SelectItem>
                      <SelectItem value="12">Last 12 months</SelectItem><SelectItem value="ytd">This year</SelectItem>
                      <SelectItem value="24">Last 24 months</SelectItem><SelectItem value="custom">Custom dates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {preset === "custom" && (
                  <>
                    <div className="space-y-1.5"><Label htmlFor="from">From</Label><Input id="from" type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label htmlFor="to">To</Label><Input id="to" type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></div>
                  </>
                )}
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="dataset">Export to CSV</Label>
              <div className="flex gap-2">
                <Select value={dataset} onValueChange={setDataset}>
                  <SelectTrigger id="dataset" className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{DATASETS.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" onClick={download} disabled={downloading} aria-label="Download CSV">{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</Button>
              </div>
            </div>
          </div>
        </div>
        <TabsContent value="overview" className="mt-4"><Overview range={range} /></TabsContent>
        <TabsContent value="monthly" className="mt-4"><Monthly /></TabsContent>
      </Tabs>
    </ModulePageShell>
  );
}
