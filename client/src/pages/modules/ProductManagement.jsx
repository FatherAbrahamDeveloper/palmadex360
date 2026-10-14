import React from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const products = [
  { name: "Organic Cocoa Beans", sku: "CB-001", category: "Agricultural", price: "$3,200/ton", stock: "450 tons", status: "Active" },
  { name: "Raw Shea Butter", sku: "SB-014", category: "Agricultural", price: "$1,800/ton", stock: "220 tons", status: "Active" },
  { name: "Dried Hibiscus Flowers", sku: "HF-023", category: "Botanical", price: "$2,500/ton", stock: "180 tons", status: "Active" },
  { name: "Cashew Nuts (Raw)", sku: "CN-007", category: "Agricultural", price: "$4,100/ton", stock: "0 tons", status: "Out of Stock" },
  { name: "Sesame Seeds", sku: "SS-019", category: "Agricultural", price: "$1,950/ton", stock: "300 tons", status: "Active" },
];

export default function ProductManagement() {
  return (
    <ModulePageShell
      title="Product Management"
      description="Manage your export product catalog"
      icon={Package}
      actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" />
        </div>
      </div>
      <div className="bg-card rounded-xl border border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 font-medium">{p.price}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.stock}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={p.status === "Active" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModulePageShell>
  );
}