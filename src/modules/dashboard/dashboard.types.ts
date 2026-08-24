import type { LucideIcon } from "lucide-react";

export type PaletteColor = "primary" | "blue" | "green" | "danger" | "purple" | "yellow" | "gray";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path?: string;   // route react-router — à vérifier/corriger selon AppRouter.jsx
  badge?: string;
  action?: boolean;
}

export type InvoiceStatus = "Payée" | "Impayée" | "Envoyée";