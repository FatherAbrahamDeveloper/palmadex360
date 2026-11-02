import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Package, Plus, Search, Pencil, Check, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { productApi, getErrorMessage, formatPrice, formatStock, STATUS_STYLES } from "@/api/productApi";

const selectCls =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
function formatPriceUpdated(date) {
  if (!date) return "Never";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProductManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => setPage(1), [debouncedSearch, categoryId, status]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productApi.list({ search: debouncedSearch, categoryId, status, page, limit: 20 });
      setProducts(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (p) => {
  setEditingId(p.id);

  setDraft({
    name: p.name,
    categoryId: p.categoryId || "",
    price: p.price ?? "",
    priceUpdatedAt: p.priceUpdatedAt
      ? p.priceUpdatedAt.slice(0, 10)
      : "",
    stockQuantity: p.stockQuantity,
    isActive: p.isActive,
  });
};

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

 const saveEdit = async (id) => {
  if (!draft.name?.trim()) {
    return setError("Product name is required");
  }

  setSaving(true);
  setError("");

  try {
    const updated = await productApi.update(id, {
      name: draft.name,
      categoryId: draft.categoryId || null,
      price: draft.price === "" ? null : Number(draft.price),
      priceUpdatedAt: draft.priceUpdatedAt
        ? new Date(`${draft.priceUpdatedAt}T12:00:00.000Z`).toISOString()
        : null,
      stockQuantity: Number(draft.stockQuantity || 0),
      isActive: draft.isActive,
    });

    setProducts((list) =>
      list.map((p) => (p.id === id ? updated : p))
    );

    cancelEdit();
  } catch (e) {
    setError(getErrorMessage(e));
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await productApi.remove(p.id);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const th = "text-left px-4 py-3 font-medium text-muted-foreground";

  return (
    <ModulePageShell
      title="Product Management"
      description="Manage your export product catalog"
      icon={Package}
      actions={
        <Button size="sm" onClick={() => navigate("/products/new")}>
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={selectCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>Product</th>
                <th className={th}>SKU</th>
                <th className={th}>Category</th>
                <th className={th}>FOB Price (USD)</th>
                    <th className={th}>Price Last Updated</th>
                <th className={th}>Stock</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
  {loading && (
    <tr>
      <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
        Loading products...
      </td>
    </tr>
  )}

  {!loading && products.length === 0 && (
    <tr>
      <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
        No products found.
      </td>
    </tr>
  )}

  {!loading &&
    products.map((p) => {
      const editing = editingId === p.id;
      const st = STATUS_STYLES[p.status] || {
        cls: "",
        label: p.status || "Unknown",
      };

      return (
        <tr
          key={p.id}
          className={`transition-colors ${
            editing
              ? "bg-muted/30"
              : "hover:bg-muted/30 cursor-pointer"
          }`}
          onClick={() => !editing && navigate(`/products/${p.id}`)}
        >
          {editing ? (
            <>
              {/* Product Name */}
              <td
                className="px-4 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({ ...draft, name: e.target.value })
                  }
                />
              </td>

              {/* SKU */}
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                {p.sku || "—"}
              </td>

              {/* Category */}
              <td
                className="px-4 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  className={selectCls}
                  value={draft.categoryId}
                  onChange={(e) =>
                    setDraft({ ...draft, categoryId: e.target.value })
                  }
                >
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>

              {/* FOB Price */}
              <td
                className="px-4 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft({ ...draft, price: e.target.value })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    /{p.unit || "unit"}
                  </span>
                </div>
              </td>

              {/* Price Last Updated */}
              <td
  className="px-4 py-2"
  onClick={(e) => e.stopPropagation()}
>
  <Input
    type="date"
    className="min-w-[145px]"
    value={draft.priceUpdatedAt || ""}
    onChange={(e) =>
      setDraft({
        ...draft,
        priceUpdatedAt: e.target.value,
      })
    }
  />
</td>

              {/* Stock */}
              <td
                className="px-4 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    className="w-28"
                    value={draft.stockQuantity}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        stockQuantity: e.target.value,
                      })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {p.unit || "unit"}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td
                className="px-4 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  className={selectCls}
                  value={draft.isActive ? "1" : "0"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      isActive: e.target.value === "1",
                    })
                  }
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </td>

              {/* Actions */}
              <td
                className="px-4 py-2 text-right whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => saveEdit(p.id)}
                  title="Save"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  disabled={saving}
                  onClick={cancelEdit}
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </td>
            </>
          ) : (
            <>
              {/* Product Name */}
              <td className="px-4 py-3 font-medium">
                {p.name}
                {p.isNewListing && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-primary/10 text-primary"
                  >
                    New
                  </Badge>
                )}
              </td>

              {/* SKU */}
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                {p.sku || "—"}
              </td>

              {/* Category */}
              <td className="px-4 py-3 text-muted-foreground">
                {p.category?.name || "—"}
              </td>

              {/* FOB Price */}
              <td className="px-4 py-3 font-medium whitespace-nowrap">
                {formatPrice(p)}
              </td>

              {/* Price Last Updated */}
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatPriceUpdated(p.priceUpdatedAt)}
              </td>

              {/* Stock */}
              <td className="px-4 py-3 text-muted-foreground">
                {formatStock(p)}
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <Badge variant="secondary" className={st.cls}>
                  {st.label}
                </Badge>
              </td>

              {/* Actions */}
              <td
                className="px-4 py-3 text-right whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => startEdit(p)}
                  title="Quick edit"
                >
                  <Pencil className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(p)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </td>
            </>
          )}
        </tr>
      );
    })}
</tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>{meta.total} product{meta.total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {meta.page} of {meta.totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </ModulePageShell>
  );
}
