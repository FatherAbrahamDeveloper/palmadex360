import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleGuard from "@/components/guards/ModuleGuard";
import AppLayout from "@/components/layout/AppLayout";

// Authentication
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import NotFound from "@/pages/NotFound";
import Account from "@/pages/Account";

// Modules
import Dashboard from "@/pages/modules/Dashboard";
import CRM from "@/pages/modules/CRM";
import CRMContactDetails from "@/pages/modules/CRMContactDetails";
import CRMContactEdit from "@/pages/modules/CRMContactEdit";
import SupplierManagement from "@/pages/modules/SupplierManagement";
import SupplierContactDetails from "@/pages/modules/SupplierContactDetails";
import SupplierContactEdit from "@/pages/modules/SupplierContactEdit";
import SupplierApplicationForm from "@/pages/modules/SupplierApplicationForm";
import ProductManagement from "@/pages/modules/ProductManagement";
import ProductDetail from "@/pages/modules/ProductDetail";
import ExportOrders from "@/pages/modules/ExportOrders";
import Shipping from "@/pages/modules/Shipping";
import Documents from "@/pages/modules/Documents";
import Compliance from "@/pages/modules/Compliance";
import Inventory from "@/pages/modules/Inventory";
import Finance from "@/pages/modules/Finance";
import CustomerPortal from "@/pages/modules/CustomerPortal";
import Procurement from "@/pages/modules/Procurement";
import Communication from "@/pages/modules/Communication";
import Reports from "@/pages/modules/Reports";
import AccessManagement from "@/pages/modules/AccessManagement";
import Support from "@/pages/modules/Support";
import KnowledgeBase from "@/pages/modules/KnowledgeBase";

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h2 className="text-xl font-semibold">Loading Palmadex 360...</h2>
    </div>
  );
}

// [path, module, page, level]
const MODULE_ROUTES = [
  ["/crm", "crm", <CRM />],
  ["/crm/:id/edit", "crm", <CRMContactEdit />, "EDIT"],
  ["/crm/:id", "crm", <CRMContactDetails />],
  ["/suppliers", "suppliers", <SupplierManagement />],
  ["/suppliers/new", "suppliers", <SupplierContactEdit />, "EDIT"],
  ["/suppliers/:id/edit", "suppliers", <SupplierContactEdit />, "EDIT"],
  ["/suppliers/:id", "suppliers", <SupplierContactDetails />],
  ["/products", "products", <ProductManagement />],
  ["/products/:id", "products", <ProductDetail />],
  ["/orders", "orders", <ExportOrders />],
  ["/shipping", "shipping", <Shipping />],
  ["/documents", "documents", <Documents />],
  ["/compliance", "compliance", <Compliance />],
  ["/inventory", "inventory", <Inventory />],
  ["/finance", "finance", <Finance />],
  ["/portal", "portal", <CustomerPortal />],
  ["/procurement", "procurement", <Procurement />],
  ["/communication", "communication", <Communication />],
  ["/reports", "reports", <Reports />],
  ["/access", "access", <AccessManagement />],
  ["/support", "support", <Support />],
  ["/knowledge", "knowledge", <KnowledgeBase />],
  ["/knowledge/:slug", "knowledge", <KnowledgeBase />],
];

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      {/* Public supplier application — no login required */}
      <Route path="/supplier-application" element={<SupplierApplicationForm />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/account" element={<Account />} />
          {MODULE_ROUTES.map(([path, module, page, level]) => (
            <Route key={path} path={path} element={<ModuleGuard module={module} level={level}>{page}</ModuleGuard>} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
