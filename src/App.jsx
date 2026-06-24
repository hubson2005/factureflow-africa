import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterCompany from "./pages/RegisterCompany";
import AcceptInvite from "./pages/AcceptInvite";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import PlatformAdmin from "./pages/PlatformAdmin";

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

        <Route
          path="/register/company"
          element={
            <CompanySetupRoute>
              <RegisterCompany />
            </CompanySetupRoute>
          }
        />

        {/* Page publique d'invitation — accessible connecté ou non */}
        <Route path="/join/:token" element={<AcceptInvite />} />

        {/* Dashboard super admin plateforme — accès vérifié dans le composant
            (pas de ProtectedRoute classique car un platform_admin n'a pas
            forcément d'entreprise cliente associée) */}
        <Route path="/admin" element={<PlatformAdmin />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />

        {/* Gestion d'équipe et paramètres réservés à l'admin (gestion utilisateurs/abonnements) */}
        <Route
          path="/team"
          element={
            <RoleRoute allow={["admin"]}>
              <Team />
            </RoleRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleRoute allow={["admin"]}>
              <Settings />
            </RoleRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}