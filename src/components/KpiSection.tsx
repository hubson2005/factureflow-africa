import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { FileText, ClipboardList, UserPlus, PackagePlus, MoreHorizontal } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import type { Kpi } from "@/modules/dashboard/dashboard.types";
import { Card, Sparkline, ProgressBar } from "./Primitives";
import { QuickActionCard, QuickActionCircle } from "./QuickActions";
import { kpis, quickActions } from "@/modules/dashboard/dashboard.data";

function KpiCard({ icon: Icon, color, label, value, unit, changeLabel, data, type = "spark", progress }: Kpi) {
  const p = palette[color];
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600], fontWeight: 600 }}>{label}</p>
        <div style={{ width: 32, height: 32, borderRadius: radius.md, background: p[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={p.solid} />
        </div>
      </div>
      <div>
        <span style={{ fontSize: 21, fontWeight: 700, color: colors.gray[900] }}>{value}</span>
        {unit && <span style={{ fontSize: 12, fontWeight: 500, color: colors.gray[600] }}> {unit}</span>}
      </div>
      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: p.solid }}>{changeLabel}</p>
      {type === "spark" ? <Sparkline data={data ?? []} color={p.solid} height={30} /> : <ProgressBar percent={progress ?? 0} color={color} />}
    </Card>
  );
}

function CaHeroMobile({ kpi }: { kpi: Kpi }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${palette.primary.solid}, #FF9D4D)`, borderRadius: radius.lg, padding: 20, color: colors.white }}>
      <p style={{ margin: 0, fontSize: 12.5, opacity: 0.9, fontWeight: 600 }}>Chiffre d'affaires</p>
      <p style={{ margin: "4px 0 6px", fontSize: 24, fontWeight: 700 }}>{kpi.value} {kpi.unit}</p>
      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, opacity: 0.95 }}>{kpi.changeLabel}</p>
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={(kpi.data ?? []).map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-hero" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={2} fill="url(#grad-hero)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniStatsRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", background: colors.white, borderRadius: radius.lg, border: `1px solid ${colors.gray[100]}`, padding: "14px 4px" }}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>{it.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.gray[600] }}>{it.label}</p>
          </div>
          {i < items.length - 1 && <div style={{ width: 1, background: colors.gray[100] }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export function KpiSection() {
  return (
    <>
      <div className="ff-mobile-only">
        <CaHeroMobile kpi={kpis[0]} />
        <div style={{ height: 12 }} />
        <MiniStatsRow items={[
          { value: "125", label: "Factures" },
          { value: "58", label: "Clients" },
          { value: "420K", label: "Impayés" },
          { value: "18", label: "Devis" },
        ]} />
        <div style={{ height: 16 }} />
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>Actions rapides</p>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
          <QuickActionCircle icon={FileText} title="Facture" color="primary" />
          <QuickActionCircle icon={ClipboardList} title="Devis" color="blue" />
          <QuickActionCircle icon={UserPlus} title="Client" color="green" />
          <QuickActionCircle icon={PackagePlus} title="Produit" color="purple" />
          <QuickActionCircle icon={MoreHorizontal} title="Plus" color="gray" />
        </div>
      </div>

      <div className="ff-desktop-only">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          {quickActions.map((a) => <QuickActionCard key={a.title} {...a} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>
      </div>
    </>
  );
}