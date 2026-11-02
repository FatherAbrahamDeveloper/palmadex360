import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Package, Pencil, Save, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { productApi, getErrorMessage, formatPrice, formatStock, STATUS_STYLES } from "@/api/productApi";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const textareaCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const EMPTY = {
  name: "", sku: "", categoryId: "", description: "", unit: "ton", price: "", currency: "USD",
  stockQuantity: 0, minimumOrderQuantity: "", hsCode: "", originCountry: "Nigeria",
  packaging: "", specifications: "", isNewListing: false, isActive: true,
};

const toForm = (p) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.entries(p).filter(([k]) => k in EMPTY).map(([k, v]) => [k, v ?? ""])),
  categoryId: p.categoryId || "",
});

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function ReadValue({ children }) {
  return <div className="text-sm min-h-[2.25rem] flex items-center whitespace-pre-wrap">{children || "—"}</div>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    productApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    productApi
      .get(id)
      .then((p) => {
        setProduct(p);
        setForm(toForm(p));
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setBool = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  const buildPayload = () => ({
    ...form,
    categoryId: form.categoryId || null,
    sku: form.sku || null,
    stockQuantity: Number(form.stockQuantity || 0),
    price: form.price === "" ? null : Number(form.price),
    minimumOrderQuantity: form.minimumOrderQuantity === "" ? null : Number(form.minimumOrderQuantity),
  });

  const handleSave = async () => {
    if (!form.name.trim()) return setError("Product name is required");
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        const created = await productApi.create(buildPayload());
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        const updated = await productApi.update(id, buildPayload());
        setProduct(updated);
        setForm(toForm(updated));
        setEditing(false);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isNew) return navigate("/products");
    setForm(toForm(product));
    setError("");
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await productApi.remove(id);
      navigate("/products");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const actions = editing ? (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
        <X className="w-4 h-4 mr-1" /> Cancel
      </Button>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
        {isNew ? "Create Product" : "Save Changes"}
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleDelete}>
        <Trash2 className="w-4 h-4 mr-1 text-destructive" /> Delete
      </Button>
      <Button size="sm" onClick={() => setEditing(true)}>
        <Pencil className="w-4 h-4 mr-1" /> Edit
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ModulePageShell title="Product" description="Loading..." icon={Package}>
        <div className="py-16 text-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading product...
        </div>
      </ModulePageShell>
    );
  }

  if (!isNew && !product) {
    return (
      <ModulePageShell title="Product not found" description="" icon={Package}>
        <div className="py-10 text-destructive">{error || "This product does not exist."}</div>
        <Button variant="outline" onClick={() => navigate("/products")}>Back to products</Button>
      </ModulePageShell>
    );
  }

  const st = product && STATUS_STYLES[product.status];
  const categoryName = categories.find((c) => c.id === form.categoryId)?.name;

  return (
    <ModulePageShell
      title={isNew ? "New Product" : product.name}
      description={isNew ? "Add a product to your export catalog" : `SKU ${product.sku || "—"}`}
      icon={Package}
      actions={actions}
    >
      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isNew && !editing && (
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className={st.cls}>{st.label}</Badge>
          {product.isNewListing && <Badge variant="secondary" className="bg-primary/10 text-primary">Newly listed</Badge>}
          <span className="text-sm text-muted-foreground">
            {formatPrice(product)} · {formatStock(product)} in stock
          </span>
        </div>
      )}

      <div className="bg-card rounded-xl border p-6 space-y-6">
        <section>
          <h3 className="font-semibold mb-3">General</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name *">
              {editing ? <Input value={form.name} onChange={set("name")} /> : <ReadValue>{form.name}</ReadValue>}
            </Field>
            <Field label="SKU">
              {editing ? (
                <Input value={form.sku} onChange={set("sku")} placeholder="Auto-generated if left blank" />
              ) : (
                <ReadValue>{form.sku}</ReadValue>
              )}
            </Field>
            <Field label="Category">
              {editing ? (
                <select className={selectCls} value={form.categoryId} onChange={set("categoryId")}>
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <ReadValue>{categoryName}</ReadValue>
              )}
            </Field>
            <Field label="Origin country">
              {editing ? <Input value={form.originCountry} onChange={set("originCountry")} /> : <ReadValue>{form.originCountry}</ReadValue>}
            </Field>
            <Field label="Description" className="md:col-span-2">
              {editing ? (
                <textarea rows={3} className={textareaCls} value={form.description} onChange={set("description")} />
              ) : (
                <ReadValue>{form.description}</ReadValue>
              )}
            </Field>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-3">Pricing & Stock</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Price">
              {editing ? <Input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} /> : <ReadValue>{form.price}</ReadValue>}
            </Field>
            <Field label="Currency">
              {editing ? <Input value={form.currency} onChange={set("currency")} /> : <ReadValue>{form.currency}</ReadValue>}
            </Field>
            <Field label="Unit (ton, kg, m3, service...)">
              {editing ? <Input value={form.unit} onChange={set("unit")} /> : <ReadValue>{form.unit}</ReadValue>}
            </Field>
            <Field label="Stock quantity">
              {editing ? <Input type="number" min="0" step="0.001" value={form.stockQuantity} onChange={set("stockQuantity")} /> : <ReadValue>{String(form.stockQuantity)}</ReadValue>}
            </Field>
            <Field label="Minimum order quantity">
              {editing ? <Input type="number" min="0" step="0.001" value={form.minimumOrderQuantity} onChange={set("minimumOrderQuantity")} /> : <ReadValue>{form.minimumOrderQuantity}</ReadValue>}
            </Field>
            <Field label="HS code">
              {editing ? <Input value={form.hsCode} onChange={set("hsCode")} /> : <ReadValue>{form.hsCode}</ReadValue>}
            </Field>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-3">Specifications & Packaging</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Specifications">
              {editing ? <textarea rows={4} className={textareaCls} value={form.specifications} onChange={set("specifications")} /> : <ReadValue>{form.specifications}</ReadValue>}
            </Field>
            <Field label="Packaging">
              {editing ? <textarea rows={4} className={textareaCls} value={form.packaging} onChange={set("packaging")} /> : <ReadValue>{form.packaging}</ReadValue>}
            </Field>
          </div>
        </section>

        {editing && (
          <section className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={setBool("isActive")} /> Active (visible in catalog)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isNewListing} onChange={setBool("isNewListing")} /> Mark as newly listed
            </label>
          </section>
        )}
      </div>
    </ModulePageShell>
  );
}
