// Données de démonstration — à remplacer par tes hooks react-query / Supabase
import {
  Wallet, FileText, ClipboardList, UserPlus, PackagePlus, Receipt, Users, Package,
  AlertCircle, CheckCircle2, Clock, LayoutDashboard, CreditCard, BarChart3, Sparkles,
  Settings, Home, MoreHorizontal, Smartphone, Landmark, Banknote, Plus, ShieldAlert, Zap,
  TrendingUp, Palette, Repeat, Warehouse,
} from "lucide-react";
import type {
  Kpi, QuickAction, NavItem, RecentInvoice, TopClient, RecentPayment,
  AssistantInsight, TodayTask, EvolutionPoint,
} from "./dashboard.types";

export const evolutionData: EvolutionPoint[] = [
  { date: "1 Mai", value: 1.0 },
  { date: "8 Mai", value: 1.6 },
  { date: "15 Mai", value: 1.3 },
  { date: "22 Mai", value: 2.0 },
  { date: "29 Mai", value: 2.45 },
];

export const kpis: Kpi[] = [
  { icon: Wallet, color: "primary", label: "Chiffre d'affaires", value: "2 450 000", unit: "FCFA", changeLabel: "↑ 12% vs Mai", data: [8, 10, 9, 13, 15, 14, 18, 22, 24], type: "spark" },
  { icon: FileText, color: "blue", label: "Factures", value: "125", changeLabel: "↑ 8% cette semaine", data: [4, 5, 5, 6, 7, 7, 8, 9, 10], type: "spark" },
  { icon: Users, color: "green", label: "Clients", value: "58", changeLabel: "↑ 3 aujourd'hui", data: [3, 3, 4, 4, 5, 5, 6, 6, 7], type: "spark" },
  { icon: AlertCircle, color: "danger", label: "Impayés", value: "420 000", unit: "FCFA", changeLabel: "7 factures", data: [9, 8, 9, 7, 8, 6, 7, 5, 6], type: "spark" },
  { icon: Wallet, color: "green", label: "Encaissements", value: "1 850 000", unit: "FCFA", changeLabel: "75% de l'objectif", type: "progress", progress: 75 },
];

export const quickActions: QuickAction[] = [
  { icon: FileText, title: "Facture", subtitle: "Créer une facture", color: "primary" },
  { icon: ClipboardList, title: "Devis", subtitle: "Nouveau devis", color: "blue" },
  { icon: UserPlus, title: "Client", subtitle: "Ajouter un client", color: "green" },
  { icon: PackagePlus, title: "Produit", subtitle: "Ajouter un produit", color: "purple" },
  { icon: Receipt, title: "Dépense", subtitle: "Enregistrer", color: "yellow" },
];

export const assistantInsights: AssistantInsight[] = [
  { color: "green", text: "Vos ventes ont augmenté de 12% ce mois 🎉" },
  { color: "blue", text: "3 devis en attente de validation" },
  { color: "yellow", text: "Pensez à enregistrer vos dépenses" },
];

export const todayTasks: TodayTask[] = [
  { icon: Clock, label: "8 factures à relancer", count: 8, tone: "danger" },
  { icon: AlertCircle, label: "4 échéances demain", count: 4, tone: "yellow" },
  { icon: ClipboardList, label: "2 devis en attente", count: 2, tone: "blue" },
  { icon: CheckCircle2, label: "3 paiements à confirmer", count: 3, tone: "green" },
];

export const recentInvoices: RecentInvoice[] = [
  { name: "Orange Côte d'Ivoire", code: "FACT-00254", amount: "150 000", status: "Payée", date: "22 Juin 2026", initials: "OR", color: "primary" },
  { name: "MTN CI", code: "FACT-00253", amount: "250 000", status: "Impayée", date: "21 Juin 2026", initials: "MTN", color: "yellow" },
  { name: "SOTRA", code: "FACT-00252", amount: "125 000", status: "Impayée", date: "20 Juin 2026", initials: "ST", color: "blue" },
  { name: "CNPS", code: "FACT-00251", amount: "350 000", status: "Payée", date: "20 Juin 2026", initials: "C", color: "green" },
  { name: "AGETU", code: "FACT-00250", amount: "145 000", status: "Envoyée", date: "19 Juin 2026", initials: "AG", color: "purple" },
];

export const topClients: TopClient[] = [
  { name: "Orange Côte d'Ivoire", amount: "620 000", percent: 25, initials: "OR", color: "primary" },
  { name: "MTN CI", amount: "450 000", percent: 18, initials: "MTN", color: "yellow" },
  { name: "SOTRA", amount: "310 000", percent: 12, initials: "ST", color: "blue" },
  { name: "CNPS", amount: "210 000", percent: 9, initials: "C", color: "green" },
  { name: "AGETU", amount: "180 000", percent: 7, initials: "AG", color: "purple" },
];

export const recentPayments: RecentPayment[] = [
  { method: "Wave", amount: "150 000", date: "Aujourd'hui", icon: Smartphone, color: "blue" },
  { method: "Orange Money", amount: "85 000", date: "Hier", icon: Smartphone, color: "primary" },
  { method: "MTN Money", amount: "250 000", date: "22 Juin 2026", icon: Smartphone, color: "yellow" },
  { method: "Virement bancaire", amount: "500 000", date: "22 Juin 2026", icon: Landmark, color: "purple" },
  { method: "Espèces", amount: "75 000", date: "20 Juin 2026", icon: Banknote, color: "green" },
];

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
  { icon: ShieldAlert, label: "Recouvrement IA", path: "/recovery", badge: "IA" },
  { icon: Zap, label: "Automatisation", path: "/automation" },
  { icon: Receipt, label: "Dépenses", path: "/expenses" },
  { icon: TrendingUp, label: "Trésorerie", path: "/cashflow", badge: "NOUVEAU" },
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