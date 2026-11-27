import {
  Users, Truck, Package, ShoppingCart, Ship, FileText, Shield, Warehouse, DollarSign, Globe,
  ShoppingBag, MessageSquare, BarChart3, Settings, HeadphonesIcon, BookOpen,
} from "lucide-react";

// Permissions come from the API (user.permissions: { moduleId: "NONE" | "VIEW" | "EDIT" | "FULL" }).
// Super Admin edits them in User & Access Management. This file only holds labels and icons.

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EXPORT_MANAGER: "EXPORT_MANAGER",
  SALES: "SALES",
  LOGISTICS: "LOGISTICS",
  DOCUMENTATION: "DOCUMENTATION",
  CUSTOMER_SUPPORT: "CUSTOMER_SUPPORT",
  FINANCE: "FINANCE",
  PROCUREMENT: "PROCUREMENT",
  WAREHOUSE: "WAREHOUSE",
  VIEWER: "VIEWER",
  CUSTOMER: "CUSTOMER",
};

export const ROLES = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-emerald-700 text-white" },
  ADMIN: { label: "Administrator", color: "bg-emerald-600 text-white" },
  EXPORT_MANAGER: { label: "Export Manager", color: "bg-teal-600 text-white" },
  SALES: { label: "Sales", color: "bg-sky-600 text-white" },
  LOGISTICS: { label: "Logistics", color: "bg-indigo-600 text-white" },
  DOCUMENTATION: { label: "Documentation", color: "bg-violet-600 text-white" },
  CUSTOMER_SUPPORT: { label: "Customer Support", color: "bg-fuchsia-600 text-white" },
  FINANCE: { label: "Finance", color: "bg-amber-600 text-white" },
  PROCUREMENT: { label: "Procurement", color: "bg-orange-600 text-white" },
  WAREHOUSE: { label: "Warehouse", color: "bg-stone-600 text-white" },
  VIEWER: { label: "Viewer", color: "bg-slate-500 text-white" },
  CUSTOMER: { label: "Customer", color: "bg-lime-600 text-white" },
};

export const roleLabel = (role) => ROLES[role]?.label || String(role || "").replace(/_/g, " ");

const RANK = { NONE: 0, VIEW: 1, EDIT: 2, FULL: 3 };

export function canAccess(user, moduleId, level = "VIEW") {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return (RANK[user.permissions?.[moduleId]] || 0) >= RANK[level];
}

export const MODULES = [
  { id: "crm", label: "Client Mgmt (CRM)", icon: Users, path: "/crm", desc: "Leads, contacts, follow-ups and WhatsApp history", keywords: ["clients", "contacts", "leads", "customers"] },
  { id: "suppliers", label: "Supplier & Vendor Mgmt", icon: Truck, path: "/suppliers", desc: "Supplier onboarding, verification and records", keywords: ["vendors", "farmers", "aggregators"] },
  { id: "products", label: "Product Management", icon: Package, path: "/products", desc: "Catalogue, pricing, HS codes and stock", keywords: ["catalog", "sku", "commodities"] },
  { id: "orders", label: "Export Order Management", icon: ShoppingCart, path: "/orders", desc: "Track export orders from request to delivery", keywords: ["sales orders", "purchase orders"] },
  { id: "shipping", label: "Shipping & Logistics", icon: Ship, path: "/shipping", desc: "Vessels, containers, ETAs and shipment status", keywords: ["freight", "vessel", "container", "tracking"] },
  { id: "documents", label: "Documents & Media Center", icon: FileText, path: "/documents", desc: "Export documents, certificates and media", keywords: ["files", "uploads", "certificates", "media"] },
  { id: "compliance", label: "Trade Compliance", icon: Shield, path: "/compliance", desc: "Permits, certificates and regulatory deadlines", keywords: ["nafdac", "nepc", "permits", "regulations"] },
  { id: "inventory", label: "Inventory & Warehouse", icon: Warehouse, path: "/inventory", desc: "Warehouses, stock levels and movements", keywords: ["stock", "warehouse"] },
  { id: "finance", label: "Finance & Accounting", icon: DollarSign, path: "/finance", desc: "Invoices, payments and expenses", keywords: ["invoices", "payments", "expenses", "accounting"] },
  { id: "portal", label: "Customer Portal", icon: Globe, path: "/portal", desc: "Buyers place orders and track shipments", keywords: ["buyers", "customers", "portal"] },
  { id: "procurement", label: "Procurement", icon: ShoppingBag, path: "/procurement", desc: "Purchase requests, sourcing and quality checks", keywords: ["purchase requests", "sourcing", "quality", "qa", "qc", "checklist", "inspection"] },
  { id: "communication", label: "Communication Centre", icon: MessageSquare, path: "/communication", desc: "Real-time messages with the team and customers", keywords: ["messages", "chat", "inbox"] },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3, path: "/reports", desc: "Monthly reports, trends and export performance", keywords: ["analytics", "statistics", "charts"] },
  { id: "access", label: "User & Access Management", icon: Settings, path: "/access", desc: "Users, approvals, roles and permissions", keywords: ["users", "roles", "permissions", "rbac"] },
  { id: "support", label: "Support & Ticketing", icon: HeadphonesIcon, path: "/support", desc: "Raise and resolve support tickets", keywords: ["tickets", "complaints", "help desk"] },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, path: "/knowledge", desc: "Guides, FAQs and tutorials", keywords: ["help", "faq", "guides", "tutorials"] },
];

export const getModulesForUser = (user) => MODULES.filter((m) => canAccess(user, m.id, "VIEW"));
export const getModule = (id) => MODULES.find((m) => m.id === id);
