import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/guards/RoleGuard";
import AppLayout from "@/components/layout/AppLayout";
import { USER_ROLES } from "@/lib/RoleConfig";

// Authentication Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

// General Modules
import Dashboard from "@/pages/modules/Dashboard";
import CRM from "@/pages/modules/CRM";
import CRMContactDetails from "@/pages/modules/CRMContactDetails";
import CRMContactEdit from "@/pages/modules/CRMContactEdit";

import SupplierManagement from "@/pages/modules/SupplierManagement";
import SupplierContactDetails from "@/pages/modules/SupplierContactDetails";
import SupplierContactEdit from "@/pages/modules/SupplierContactEdit";
import SupplierApplicationForm from "@/pages/modules/SupplierApplicationForm";

import ProductManagement from "@/pages/modules/ProductManagement";
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
import MediaCenter from "@/pages/modules/MediaCenter";

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h2 className="text-xl font-semibold">
        Loading Palmadex 360...
      </h2>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public supplier application — no login required */}
      <Route
        path="/supplier-application"
        element={<SupplierApplicationForm />}
      />

      {/* Protected application */}
      <Route
        element={
          <ProtectedRoute
            unauthenticatedElement={<Navigate to="/login" replace />}
          />
        }
      >
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />

          {/* CRM */}
          <Route
            path="/crm"
            element={
              <RoleGuard
                allowedRoles={[
                  USER_ROLES.SUPER_ADMIN,
                  USER_ROLES.STAFF,
                ]}
              >
                <CRM />
              </RoleGuard>
            }
          />

          <Route
            path="/crm/:id/edit"
            element={
              <RoleGuard
                allowedRoles={[
                  USER_ROLES.SUPER_ADMIN,
                  USER_ROLES.STAFF,
                ]}
              >
                <CRMContactEdit />
              </RoleGuard>
            }
          />

          <Route
            path="/crm/:id"
            element={<CRMContactDetails />}
          />

          {/* Supplier Management */}
          <Route
            path="/suppliers"
            element={<SupplierManagement />}
          />

          <Route
            path="/suppliers/new"
            element={
              <RoleGuard
                allowedRoles={[
                  USER_ROLES.SUPER_ADMIN,
                  USER_ROLES.ADMIN,
                ]}
              >
                <SupplierContactEdit />
              </RoleGuard>
            }
          />

          <Route
            path="/suppliers/:id/edit"
            element={
              <RoleGuard
                allowedRoles={[
                  USER_ROLES.SUPER_ADMIN,
                  USER_ROLES.ADMIN,
                ]}
              >
                <SupplierContactEdit />
              </RoleGuard>
            }
          />

          <Route
            path="/suppliers/:id"
            element={<SupplierContactDetails />}
          />

          {/* Other Modules */}
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/orders" element={<ExportOrders />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/inventory" element={<Inventory />} />

          <Route
            path="/finance"
            element={
              <RoleGuard allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
                <Finance />
              </RoleGuard>
            }
          />

          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/reports" element={<Reports />} />

          <Route
            path="/access"
            element={
              <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
                <AccessManagement />
              </RoleGuard>
            }
          />

          <Route path="/support" element={<Support />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/media" element={<MediaCenter />} />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}