// Single source of truth for modules, roles and default permissions.
// Super Admin can override any role's access per module in User & Access Management;
// overrides are stored in RolePermission. SUPER_ADMIN always has FULL access.

export const ACCESS_LEVELS = ["NONE", "VIEW", "EDIT", "FULL"];
export const LEVEL_RANK = { NONE: 0, VIEW: 1, EDIT: 2, FULL: 3 };

export const MODULES = [
  { id: "crm", label: "Client Mgmt (CRM)" },
  { id: "suppliers", label: "Supplier & Vendor Mgmt" },
  { id: "products", label: "Product Management" },
  { id: "orders", label: "Export Order Management" },
  { id: "shipping", label: "Shipping & Logistics" },
  { id: "documents", label: "Documents" },
  { id: "compliance", label: "Trade Compliance" },
  { id: "inventory", label: "Inventory & Warehouse" },
  { id: "finance", label: "Finance & Accounting" },
  { id: "portal", label: "Customer Portal" },
  { id: "procurement", label: "Procurement" },
  { id: "communication", label: "Communication Centre" },
  { id: "reports", label: "Reports & Analytics" },
  { id: "access", label: "User & Access Management" },
  { id: "support", label: "Support & Ticketing" },
  { id: "knowledge", label: "Knowledge Base" },
];
export const MODULE_IDS = MODULES.map((m) => m.id);

export const ROLES = [
  { id: "SUPER_ADMIN", label: "Super Admin", description: "Full control of every module, user and permission." },
  { id: "ADMIN", label: "Administrator", description: "Runs daily operations and manages users. Cannot change Super Admins or the permission matrix." },
  { id: "EXPORT_MANAGER", label: "Export Manager", description: "Owns export orders and shipping end to end." },
  { id: "SALES", label: "Sales", description: "Works clients, leads and orders." },
  { id: "LOGISTICS", label: "Logistics", description: "Shipments, freight and stock movements." },
  { id: "DOCUMENTATION", label: "Documentation", description: "Export documents and trade compliance." },
  { id: "CUSTOMER_SUPPORT", label: "Customer Support", description: "Handles tickets, enquiries and the knowledge base." },
  { id: "FINANCE", label: "Finance", description: "Invoices, payments, expenses and financial reports." },
  { id: "PROCUREMENT", label: "Procurement", description: "Purchase requests and supplier sourcing." },
  { id: "WAREHOUSE", label: "Warehouse", description: "Warehouses, stock levels and movements." },
  { id: "VIEWER", label: "Viewer", description: "Read-only access for auditors and management." },
  { id: "CUSTOMER", label: "Customer", description: "External buyer. Customer Portal, messages, support and help articles only." },
];
export const ROLE_IDS = ROLES.map((r) => r.id);
export const INTERNAL_ROLES = ROLE_IDS.filter((r) => r !== "CUSTOMER");

const all = (level) => Object.fromEntries(MODULE_IDS.map((m) => [m, level]));

// Every internal role can raise its own support tickets, message colleagues and read help articles.
const BASE_INTERNAL = { communication: "EDIT", support: "VIEW", knowledge: "VIEW" };

export const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: all("FULL"),
  ADMIN: all("FULL"),
  EXPORT_MANAGER: {
    ...all("NONE"), ...BASE_INTERNAL,
    crm: "EDIT", suppliers: "EDIT", products: "EDIT", orders: "FULL", shipping: "FULL",
    documents: "EDIT", compliance: "EDIT", inventory: "EDIT", finance: "VIEW", portal: "EDIT",
    procurement: "EDIT", reports: "VIEW", support: "EDIT",
  },
  SALES: {
    ...all("NONE"), ...BASE_INTERNAL,
    crm: "EDIT", suppliers: "VIEW", products: "VIEW", orders: "EDIT", shipping: "VIEW",
    documents: "EDIT", portal: "VIEW", reports: "VIEW",
  },
  LOGISTICS: {
    ...all("NONE"), ...BASE_INTERNAL,
    products: "VIEW", orders: "VIEW", shipping: "EDIT", documents: "EDIT", compliance: "VIEW",
    inventory: "EDIT", procurement: "VIEW",
  },
  DOCUMENTATION: {
    ...all("NONE"), ...BASE_INTERNAL,
    suppliers: "VIEW", products: "VIEW", orders: "VIEW", shipping: "VIEW", documents: "FULL",
    compliance: "EDIT", knowledge: "EDIT",
  },
  CUSTOMER_SUPPORT: {
    ...all("NONE"), ...BASE_INTERNAL,
    crm: "VIEW", orders: "VIEW", shipping: "VIEW", documents: "VIEW", portal: "VIEW",
    support: "FULL", knowledge: "EDIT",
  },
  FINANCE: {
    ...all("NONE"), ...BASE_INTERNAL,
    crm: "VIEW", orders: "VIEW", documents: "VIEW", finance: "FULL", procurement: "VIEW", reports: "VIEW",
  },
  PROCUREMENT: {
    ...all("NONE"), ...BASE_INTERNAL,
    suppliers: "EDIT", products: "VIEW", documents: "VIEW", inventory: "VIEW", procurement: "FULL",
  },
  WAREHOUSE: {
    ...all("NONE"), ...BASE_INTERNAL,
    products: "VIEW", shipping: "VIEW", inventory: "FULL", procurement: "VIEW",
  },
  VIEWER: { ...all("VIEW"), access: "NONE", communication: "EDIT" },
  CUSTOMER: { ...all("NONE"), portal: "EDIT", communication: "EDIT", support: "VIEW", knowledge: "VIEW" },
};

export const atLeast = (level, required) => (LEVEL_RANK[level] ?? 0) >= (LEVEL_RANK[required] ?? 0);

// Activity log entity -> module that must be viewable to see the event.
export const ENTITY_MODULE = {
  CRMContact: "crm",
  Supplier: "suppliers",
  SupplierApplication: "suppliers",
  Product: "products",
  ExportOrder: "orders",
  Shipment: "shipping",
  File: "documents",
  ComplianceRequirement: "compliance",
  Warehouse: "inventory",
  StockLevel: "inventory",
  Invoice: "finance",
  Expense: "finance",
  PurchaseRequest: "procurement",
  QaInspection: "procurement",
  QaTemplate: "procurement",
  Customer: "portal",
  User: "access",
  SupportTicket: "support",
  KnowledgeArticle: "knowledge",
};
