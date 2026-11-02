import React, { useCallback, useEffect, useState } from "react";
import { ShoppingCart, Plus, AlertCircle } from "lucide-react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ExportOrderCard from "@/components/modules/export-orders/ExportOrderCard";
import ExportOrderFormDialog from "@/components/modules/export-orders/ExportOrderFormDialog";
import { exportOrderApi, getErrorMessage } from "@/services/api"; // adjust path

const PAGE_SIZE = 20;

export default function ExportOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await exportOrderApi.list({ page, limit: PAGE_SIZE });
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load export orders"));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (order) => { setEditing(order); setDialogOpen(true); };

  const handleDeleted = () => {
    if (orders.length === 1 && page > 1) setPage(page - 1);
    else load();
  };

  return (
    <ModulePageShell
      title="Export Order Management"
      description="Track and manage all export orders"
      icon={ShoppingCart}
      actions={
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Order
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl border p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center space-y-3">
          <ShoppingCart className="w-8 h-8 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">No export orders yet</h3>
          <p className="text-sm text-muted-foreground">Create your first order to start tracking shipments.</p>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Order</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <ExportOrderCard key={o.id} order={o} onClick={() => openEdit(o)} />
          ))}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      <ExportOrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={editing}
        onSaved={load}
        onDeleted={handleDeleted}
      />
    </ModulePageShell>
  );
}