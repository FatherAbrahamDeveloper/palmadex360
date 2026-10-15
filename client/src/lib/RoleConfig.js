import {
  Users,
  Truck,
  Package,
  ShoppingCart,
  Ship,
  FileText,
  Shield,
  Warehouse,
  DollarSign,
  Globe,
  ShoppingBag,
  MessageSquare,
  BarChart3,
  Settings,
  HeadphonesIcon,
  BookOpen,
  Camera,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Role Constants
|--------------------------------------------------------------------------
*/

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  STAFF: "STAFF",
  CLIENT: "CLIENT",
  SUPPLIER: "SUPPLIER",
};

/*
|--------------------------------------------------------------------------
| Role Labels
|--------------------------------------------------------------------------
*/

export const ROLES = {
  [USER_ROLES.SUPER_ADMIN]: {
    label: "Super Admin",
    color: "bg-primary text-white",
  },

  [USER_ROLES.STAFF]: {
    label: "Palmadex Staff",
    color: "bg-teal-600 text-white",
  },

  [USER_ROLES.CLIENT]: {
    label: "Palmadex Client",
    color: "bg-black text-white",
  },

  [USER_ROLES.SUPPLIER]: {
    label: "Supplier / Vendor",
    color: "bg-lime-600 text-white",
  },
};

/*
|--------------------------------------------------------------------------
| Modules
|--------------------------------------------------------------------------
*/

export const MODULES = [
  {
    id: "crm",
    label: "CRM",
    icon: Users,
    path: "/crm",
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF],
  },

  {
    id: "suppliers",
    label: "Supplier & Vendor Mgmt",
    icon: Truck,
    path: "/suppliers",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.SUPPLIER,
    ],
  },

  {
    id: "products",
    label: "Product Management",
    icon: Package,
    path: "/products",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.SUPPLIER,
    ],
  },

  {
    id: "orders",
    label: "Export Order Mgmt",
    icon: ShoppingCart,
    path: "/orders",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.CLIENT,
    ],
  },

  {
    id: "shipping",
    label: "Shipping & Logistics",
    icon: Ship,
    path: "/shipping",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.CLIENT,
    ],
  },

  {
    id: "documents",
    label: "Documentation Center",
    icon: FileText,
    path: "/documents",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.CLIENT,
    ],
  },

  {
    id: "compliance",
    label: "Trade Compliance",
    icon: Shield,
    path: "/compliance",
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF],
  },

  {
    id: "inventory",
    label: "Inventory & Warehouse",
    icon: Warehouse,
    path: "/inventory",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.SUPPLIER,
    ],
  },

  {
    id: "finance",
    label: "Finance & Accounting",
    icon: DollarSign,
    path: "/finance",
    roles: [USER_ROLES.SUPER_ADMIN],
  },

  {
    id: "portal",
    label: "Customer Portal",
    icon: Globe,
    path: "/portal",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.CLIENT,
    ],
  },

  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingBag,
    path: "/procurement",
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF],
  },

  {
    id: "communication",
    label: "Communication Centre",
    icon: MessageSquare,
    path: "/communication",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.CLIENT,
      USER_ROLES.SUPPLIER,
    ],
  },

  {
    id: "reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    path: "/reports",
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF],
  },

  {
    id: "access",
    label: "User & Access Mgmt",
    icon: Settings,
    path: "/access",
    roles: [USER_ROLES.SUPER_ADMIN],
  },

  {
    id: "support",
    label: "Support & Ticketing",
    icon: HeadphonesIcon,
    path: "/support",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.CLIENT,
      USER_ROLES.SUPPLIER,
    ],
  },

  {
    id: "knowledge",
    label: "Knowledge Base",
    icon: BookOpen,
    path: "/knowledge",
    roles: [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.STAFF,
      USER_ROLES.CLIENT,
      USER_ROLES.SUPPLIER,
    ],
  },

  {
    id: "media",
    label: "Media Center",
    icon: Camera,
    path: "/media",
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF],
  },
];

export function getModulesForRole(role) {
  return MODULES.filter((module) => module.roles.includes(role));
}

export function hasAccess(role, moduleId) {
  const module = MODULES.find((m) => m.id === moduleId);

  return module ? module.roles.includes(role) : false;
}