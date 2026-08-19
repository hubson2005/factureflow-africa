import React from "react";
import { Smartphone, Landmark, Banknote, CreditCard } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { useDashboardData } from "../useDashboardData";
import { STATUS_LABELS } from "@/modules/invoices/invoices.status";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

// Couleurs par statut — les libellés viennent désormais de STATUS_LABELS
// (source unique, voir src/modules/invoices/invoices.status.ts)
const STATUS_STYLE = {
  brouillon: { bg: colors.gray[100], color: colors.gray[600] },
  envoyee: { bg: palette.blue[50], color: palette.blue.solid },
  partiellement_payee: { bg: palette.yellow[50], color: palette.yellow.solid },
  payee: { bg: palette.green[50], color: palette.green.solid },
  en_retard: { bg: palette.danger[50], color: palette.danger.solid },
};

const METHOD_LABELS = { especes: "Espèces", virement: "Virement", carte: "Carte", mobile_money: "Mobile Money", autre: "Autre" };
const METHOD_ICONS = { especes: Banknote, virement: Landmark, carte: CreditCard, mobile_money: Smartphone, autre: CreditCard };
const METHOD_COLORS = { especes: "green", virement: "purple", carte: "blue", mobile_money: "primary", autre: "gray" };

function initialsOf(name) { return (name || "?").substring(0, 2).toUpperCase(); }
function colorOf(name) {
  const list = ["primary", "blue", "green", "purple", "yellow", "danger"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return list[Math.abs(hash) % list.length];
}

function Card({ title, children }) {
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadow.card,
      border: "1px solid " + colors.gray[100] }}>
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
      {children}
    </div>
  );
}

function InvoicesCard({ invoices }) {
  return (
    <Card title="Dernières factures">
      {invoices.length === 0 ? (
        <p style={{ fontSize: 13, color: colors.gray[600], padding: "16px 0" }}>Aucune facture pour le moment.</p>
      ) : invoices.map((inv, i) => {
        const s = STATUS_STYLE[inv.status] || STATUS_STYLE.brouillon;
        const label = STATUS_LABELS[inv.status] || STATUS_LABELS.brouillon;
        const color = colorOf(inv.clientName);
        const p = palette[color];
        return (
          <div key={inv.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0",
            borderBottom: i < invoices.length - 1 ? "1px solid " + colors.gray[100] : "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: radius.md, background: p[50], color: p.solid,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {initialsOf(inv.clientName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900],
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.clientName}</p>
              <p style={{ margin: 0, fontSize: 11, color: colors.gray[400] }}>{inv.code}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
                {inv.amount} <span style={{ fontSize: 10, fontWeight: 500, color: colors.gray[600] }}>FCFA</span>
              </p>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: radius.full,
                background: s.bg, color: s.color }}>{label}</span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function TopClientsCard({ clients }) {
  return (
    <Card title="Top clients">
      {clients.length === 0 ? (
        <p style={{ fontSize: 13, color: colors.gray[600], padding: "16px 0" }}>Aucune donnée pour le moment.</p>
      ) : clients.map((c, i) => {
        const color = colorOf(c.name);
        const p = palette[color];
        return (
          <div key={c.name} style={{ padding: "11px 0", borderBottom: i < clients.length - 1 ? "1px solid " + colors.gray[100] : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: radius.md, background: p[50], color: p.solid,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {initialsOf(c.name)}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.gray[900],
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>{c.amount}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600], width: 30, textAlign: "right" }}>{c.percent}%</span>
            </div>
            <div style={{ height: 6, borderRadius: radius.full, background: colors.gray[100], overflow: "hidden" }}>
              <div style={{ height: "100%", width: c.percent + "%", background: p.solid, borderRadius: radius.full }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function PaymentsCard({ payments }) {
  return (
    <Card title="Paiements récents">
      {payments.length === 0 ? (
        <p style={{ fontSize: 13, color: colors.gray[600], padding: "16px 0" }}>Aucun paiement pour le moment.</p>
      ) : payments.map((p, i) => {
        const colorKey = METHOD_COLORS[p.method] || "gray";
        const pal = palette[colorKey];
        const Icon = METHOD_ICONS[p.method] || CreditCard;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0",
            borderBottom: i < payments.length - 1 ? "1px solid " + colors.gray[100] : "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: radius.md, background: pal[50],
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} color={pal.solid} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{METHOD_LABELS[p.method] || p.method}</p>
              <p style={{ margin: 0, fontSize: 11, color: colors.gray[400] }}>{p.clientName + " \u00b7 " + p.date}</p>
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
              {p.amount} <span style={{ fontSize: 10, fontWeight: 500, color: colors.gray[600] }}>FCFA</span>
            </p>
          </div>
        );
      })}
    </Card>
  );
}

export function ListsRow() {
  const d = useDashboardData();
  if (d.isLoading) return null;
  return (
    <div className="ff-row3">
      <div style={{ flex: 1, minWidth: 0 }}><InvoicesCard invoices={d.recentInvoices} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><TopClientsCard clients={d.topClients} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><PaymentsCard payments={d.recentPayments} /></div>
    </div>
  );
}