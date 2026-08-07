import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../AuthContext";

const PUBLIC_ROUTES = ["/preview"];

export function ProtectedRoute({ children }) {
  const { user, hasCompany, loading } = useAuth();
  const location = useLocation();

  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return children;
  }

  if (loading) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasCompany) {
    return <Navigate to="/register/company" replace />;
  }

  return children;
}

export function RoleRoute({ children, allow = [] }) {
  const { user, role, hasCompany, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasCompany) {
    return <Navigate to="/register/company" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to="/dashboard?error=unauthorized" replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, hasCompany, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (user) {
    if (!hasCompany) {
      return <Navigate to="/register/company" replace />;
    }
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return children;
}

export function CompanySetupRoute({ children }) {
  const { user, hasCompany, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (hasCompany) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AuthLoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFA",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "14px",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
     <img
  src="/icon-192.png"
  alt="FactureFlow Africa"
  style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover" }}
/>
      <div style={{
        fontSize: 16,
        fontWeight: 700,
        color: "#14181A",
      }}>
        FactureFlow <span style={{ color: "#F97316" }}>Africa</span>
      </div>
      <Loader2 size={20} color="#F97316" className="animate-spin" />
    </div>
  );
}