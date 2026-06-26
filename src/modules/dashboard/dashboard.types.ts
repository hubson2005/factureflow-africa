import type { LucideIcon } from "lucide-react";

export type PaletteColor = "primary" | "blue" | "green" | "danger" | "purple" | "yellow" | "gray";

export interface Kpi {
  icon: LucideIcon;
  color: PaletteColor;
  label: string;
  value: string;
  unit?: string;
  changeLabel: string;
  data?: number[];
  type?: "spark" | "progress";
  progress?: number;
}

export interface QuickAction {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: PaletteColor;
}

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path?: string;   // route react-router — à vérifier/corriger selon AppRouter.jsx
  badge?: string;
  action?: boolean;
}

export type InvoiceStatus = "Payée" | "Impayée" | "Envoyée";

export interface RecentInvoice {
  name: string;
  code: string;
  amount: string;
  status: InvoiceStatus;
  date: string;
  initials: string;
  color: PaletteColor;
}

export interface TopClient {
  name: string;
  amount: string;
  percent: number;
  initials: string;
  color: PaletteColor;
}

export interface RecentPayment {
  method: string;
  amount: string;
  date: string;
  icon: LucideIcon;
  color: PaletteColor;
}

export interface AssistantInsight {
  color: PaletteColor;
  text: string;
}

export interface TodayTask {
  icon: LucideIcon;
  label: string;
  count: number;
  tone: PaletteColor;
}

export interface EvolutionPoint {
  date: string;
  value: number;
}