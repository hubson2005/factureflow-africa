// Config statique de navigation. Les donnees chiffrees du dashboard
// (KPIs, factures recentes, top clients, paiements recents, evolution du
// CA...) viennent de useDashboardData.js (calcule a partir des vraies
// tables via useInvoices/useClients/usePayments/useQuotes), pas d'ici.
import {
  FileText, ClipboardList, Receipt, Users, Package,
  LayoutDashboard, CreditCard, BarChart3, Sparkles,
  Settings, Home, MoreHorizontal, Landmark, Plus, ShieldAlert, Zap,
  TrendingUp, Repeat, Warehouse, Truck, Contact,
} from "lucide-react";
import type { NavItem } from "./dashboard.types";

// chemins = suppositions d'après tes fichiers pages/*.jsx — à corriger si besoin
export const sidebarNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Factures", path: "/invoices" },
  { icon: Repeat, label: "Facturation récurrente", path: "/recurring-invoices" },
  { icon: ClipboardList, label: "Devis", path: "/quotes" },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: Package, label: "Produits", path: "/products" },
  { icon: Warehouse, label: "Stock", path: "/stock" },
  { icon: CreditCard, label: "Paiements", path: "/payments" },
  { icon: Truck, label: "Achats", path: "/purchases" },
  { icon: Landmark, label: "Comptes", path: "/accounts" },
  { icon: ShieldAlert, label: "Recouvrement IA", path: "/recovery", badge: "IA" },
  { icon: Zap, label: "Automatisation", path: "/automation" },
  { icon: Receipt, label: "Dépenses", path: "/expenses" },
  { icon: TrendingUp, label: "Trésorerie", path: "/cashflow", badge: "NOUVEAU" },
  { icon: Contact, label: "Ressources humaines", path: "/hr" },
  { icon: BarChart3, label: "Rapports", path: "/reports" },
  { icon: Sparkles, label: "Assistant IA", path: "/assistant", badge: "NOUVEAU" },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

export const bottomNav: NavItem[] = [
  { icon: Home, label: "Accueil", path: "/dashboard" },
  { icon: FileText, label: "Factures", path: "/invoices" },
  { icon: Plus, label: "Créer", action: true },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: MoreHorizontal, label: "Plus" },
];