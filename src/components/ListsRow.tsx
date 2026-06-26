import React from "react";
import { ChevronDown } from "lucide-react";
import { colors, radius } from "@/theme/tokens";
import { recentInvoices, topClients, recentPayments } from "@/modules/dashboard/dashboard.data";
import { Card, Avatar, StatusBadge, ProgressBar, IconBadgeSquare } from "./Primitives";

function InvoicesCard() {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Dernières factures</p>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[600], cursor: "pointer" }}>Voir tout</span>
      </div>
      {recentInvoices.map((inv, i) => (
        <div key={inv.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < recentInvoices.length - 1 ? `1px solid ${colors.gray[100]}` : "none" }}>
          <Avatar initials={inv.initials} color={inv.color} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.gray[400] }}>{inv.code}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>{inv.amount} <span style={{ fontSize: 10, fontWeight: 500, color: colors.gray[600] }}>FCFA</span></p>
            <StatusBadge status={inv.status} />
          </div>
        </div>
      ))}
    </Card>
  );
}

function TopClientsCard() {
  const maxPercent = Math.max(...topClients.map((c) => c.percent));
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Top clients</p>
        <button style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${colors.gray[200]}`, borderRadius: radius.md, padding: "5px 9px", background: colors.white, fontSize: 11.5, fontWeight: 600, color: colors.gray[600], cursor: "pointer" }}>
          Ce mois <ChevronDown size={12} />
        </button>
      </div>
      {topClients.map((c, i) => (
        <div key={c.name} style={{ padding: "11px 0", borderBottom: i < topClients.length - 1 ? `1px solid ${colors.gray[100]}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Avatar initials={c.initials} color={c.color} size={30} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.gray[900], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>{c.amount}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.gray[600], width: 30, textAlign: "right" }}>{c.percent}%</span>
          </div>
          <ProgressBar percent={(c.percent / maxPercent) * 100} color={c.color} />
        </div>
      ))}
    </Card>
  );
}

function PaymentsCard() {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Paiements récents</p>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[600], cursor: "pointer" }}>Voir tout</span>
      </div>
      {recentPayments.map((p, i) => (
        <div key={p.method} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < recentPayments.length - 1 ? `1px solid ${colors.gray[100]}` : "none" }}>
          <IconBadgeSquare icon={p.icon} color={p.color} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{p.method}</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.gray[400] }}>{p.date}</p>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>{p.amount} <span style={{ fontSize: 10, fontWeight: 500, color: colors.gray[600] }}>FCFA</span></p>
        </div>
      ))}
    </Card>
  );
}

export function ListsRow() {
  return (
    <div className="ff-row3">
      <div style={{ flex: 1, minWidth: 0 }}><InvoicesCard /></div>
      <div style={{ flex: 1, minWidth: 0 }}><TopClientsCard /></div>
      <div style={{ flex: 1, minWidth: 0 }}><PaymentsCard /></div>
    </div>
  );
}