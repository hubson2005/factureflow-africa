import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RegisterCompany from "./pages/RegisterCompany";
import AcceptInvite from "./pages/AcceptInvite";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Products from "./pages/Products";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import RecurringInvoices from "./pages/RecurringInvoices";
import Payments from "./pages/Payments";
import Recovery from "./pages/Recovery";
import Automation from "./pages/Automation";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import Assistant from "./pages/Assistant";
import Notifications from "./pages/Notifications";
import PlatformAdmin from "./pages/PlatformAdmin";
import DashboardLayout from "./layouts/DashboardLayout";
import CashFlowForecast from "./pages/CashFlowForecast";
import InvoiceTemplates from "./pages/InvoiceTemplates";
import {
  ProtectedRoute,
  PublicOnlyRoute,
  CompanySetupRoute,
  RoleRoute,
} from "./routes/AuthRoutes";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/register/company"
          element={
            <CompanySetupRoute>
              <RegisterCompany />
            </CompanySetupRoute>
          }
        />
        {/* Page publique d'invitation - accessible connecte ou non */}
        <Route path="/join/:token" element={<AcceptInvite />} />
        {/* Dashboard super admin plateforme - acces verifie dans le composant
            (pas de ProtectedRoute classique car un platform_admin n'a pas
            forcement d'entreprise cliente associee) */}
        <Route path="/admin" element={<PlatformAdmin />} />
        {/* Pages protegees partageant la sidebar / bottom nav (DashboardLayout) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/recurring-invoices" element={<RecurringInvoices />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/cashflow" element={<CashFlowForecast />} />
          <Route path="/invoice-templates" element={<InvoiceTemplates />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        {/* Gestion d'equipe et parametres reserves a l'admin - meme layout, garde par role */}
        <Route
          element={
            <RoleRoute allow={["admin"]}>
              <DashboardLayout />
            </RoleRoute>
          }
        >
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}