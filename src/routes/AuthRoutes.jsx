import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Routes sans auth requise — accessibles sans connexion
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ['/preview'];

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GUARD 1 — Route protégée : utilisateur connecté ET entreprise créée requis
// Usage : <ProtectedRoute><Dashboard /></ProtectedRoute>
// ─────────────────────────────────────────────────────────────────────────────
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

  // Connecté mais étape 2 (création entreprise) pas terminée
  if (!hasCompany) {
    return <Navigate to="/register/company" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GUARD 2 — Route par rôle : un des rôles autorisés requis (company_users.role)
// Usage : <RoleRoute allow={['admin']}><Team /></RoleRoute>
// Usage : <RoleRoute allow={['admin', 'manager']}><Invoices /></RoleRoute>
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GUARD 3 — Route publique uniquement (login, register étape 1)
// Redirige vers /dashboard si déjà connecté ET déjà une entreprise,
// vers /register/company si connecté mais sans entreprise.
// Usage : <PublicOnlyRoute><Login /></PublicOnlyRoute>
// ─────────────────────────────────────────────────────────────────────────────
export function PublicOnlyRoute({ children }) {
  const { user, hasCompany, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (user) {
    if (!hasCompany) {
      return <Navigate to="/register/company" replace />;
    }
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GUARD 4 — Étape 2 inscription : connecté requis, mais PAS encore d'entreprise
// Empêche d'accéder à /register/company si l'entreprise existe déjà.
// Usage : <CompanySetupRoute><RegisterCompany /></CompanySetupRoute>
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Écran de chargement pendant la vérification de session
// ─────────────────────────────────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
    }}>
      <div style={{
        fontSize: 22,
        fontWeight: 700,
        color: '#22c55e',
        letterSpacing: '-0.02em',
      }}>
        FactureFlow
      </div>
      <Loader2 size={22} color="#22c55e" className="animate-spin" />
    </div>
  );
}