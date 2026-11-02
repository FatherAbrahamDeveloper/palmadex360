import React, { useCallback, useEffect, useState } from "react";
import { Warehouse, Plus, AlertCircle, Pencil } from "lucide-react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import StockCard from "@/components/modules/inventory/StockCard";
import StockFormDialog from "@/components/modules/inventory/StockFormDialog";
import StockDetailDialog from "@/components/modules/inventory/StockDetailDialog";
import WarehouseDialog from "@/components/modules/inventory/WarehouseDialog";
import { inventoryApi, warehouseApi, getErrorMessage } from "@/services/api"; // adjust path

const PAGE_SIZE = 24;
const ALL = "all";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState(ALL);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadWarehouses = useCallback(async () => {
    try {
      const res = await warehouseApi.list();
      setWarehouses(res.data);
    } catch {
      /* the stock list below surfaces connection errors */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.list({
        page,
        limit: PAGE_SIZE,
        warehouseId: warehouseId === ALL ? undefined : warehouseId,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load inventory"));
    } finally {
      setLoading(false);
    }
  }, [page, warehouseId]);

  useEffect(() => { loadWarehouses(); }, [loadWarehouses]);
  useEffect(() => { load(); }, [load]);

  const refreshAll = () => { loadWarehouses(); load(); };

  const openNewWarehouse = () => { setEditingWarehouse(null); setWarehouseDialogOpen(true); };
  const openEditWarehouse = () => {
    setEditingWarehouse(warehouses.find((w) => w.id === warehouseId) || null);
    setWarehouseDialogOpen(true);
  };
  const openDetail = (item) => { setSelected(item); setDetailOpen(true); };

  const handleStockDeleted = () => {
    if (items.length === 1 && page > 1) setPage(page - 1);
    else refreshAll();
  };

  const handleWarehouseDeleted = () => {
    setWarehouseId(ALL);
    setPage(1);
    loadWarehouses();
  };

  return (
    <ModulePageShell
      title="Inventory & Warehouse"
      description="Monitor stock levels and warehouse operations"
      icon={Warehouse}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={openNewWarehouse}>
            <Plus className="w-4 h-4 mr-1" /> Warehouse
          </Button>
          <Button size="sm" onClick={() => setStockFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Stock
          </Button>
        </div>
      }
    >
      {warehouses.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Select value={warehouseId} onValueChange={(v) => { setWarehouseId(v); setPage(1); }}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All warehouses</SelectItem>
              {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {warehouseId !== ALL && (
            <Button size="sm" variant="outline" onClick={openEditWarehouse}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit warehouse
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl border p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center space-y-3">
          <Warehouse className="w-8 h-8 mx-auto text-muted-foreground" />
          {warehouses.length === 0 ? (
            <>
              <h3 className="font-semibold">No warehouses yet</h3>
              <p className="text-sm text-muted-foreground">Add your first warehouse, then start adding stock to it.</p>
              <Button size="sm" onClick={openNewWarehouse}><Plus className="w-4 h-4 mr-1" /> Add Warehouse</Button>
            </>
          ) : (
            <>
              <h3 className="font-semibold">No stock items here yet</h3>
              <p className="text-sm text-muted-foreground">Add a product to start tracking its stock levels.</p>
              <Button size="sm" onClick={() => setStockFormOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Stock</Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <StockCard key={item.id} item={item} onClick={() => openDetail(item)} />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      <StockFormDialog
        open={stockFormOpen}
        onOpenChange={setStockFormOpen}
        warehouses={warehouses}
        defaultWarehouseId={warehouseId === ALL ? "" : warehouseId}
        onSaved={refreshAll}
      />
      <StockDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={selected}
        onChanged={load}
        onDeleted={handleStockDeleted}
      />
      <WarehouseDialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
        warehouse={editingWarehouse}
        onSaved={refreshAll}
        onDeleted={handleWarehouseDeleted}
      />
    </ModulePageShell>
  );
}