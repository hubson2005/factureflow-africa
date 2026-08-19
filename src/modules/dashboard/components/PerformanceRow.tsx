import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChevronRight, Bot, Clock, AlertCircle, ClipboardList } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { useDashboardData } from "../useDashboardData";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

function EvolutionCard({ d }) {
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadow.card,
      border: "1px solid " + colors.gray[100], display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
        Evolution du chiffre d'affaires (6 mois)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={d.evolutionData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-evo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.primary.solid} stopOpacity={0.18} />
              <stop offset="100%" stopColor={palette.primary.solid} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={colors.gray[100]} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
         <YAxis tickFormatter={(v) => v + "M"} tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} width={44} />
          <Area type="monotone" dataKey="value" stroke={palette.primary.solid} strokeWidth={2.5} fill="url(#grad-evo)" />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", borderTop: "1px solid " + colors.gray[100], paddingTop: 14 }}>
        {[
          { l: "Ce mois", v: Math.round(d.caThisMonth).toLocaleString("fr-FR") + " FCFA" },
          { l: "Evolution", v: (d.caChange >= 0 ? "+" : "") + d.caChange + "%", c: d.caChange >= 0 ? palette.green.solid : palette.danger.solid },
          { l: "Encaisse", v: Math.round(d.encaisseThisMonth).toLocaleString("fr-FR") + " FCFA" },
        ].map((s) => (
          <div key={s.l} style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: s.c || colors.gray[900] }}>{s.v}</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.gray[600] }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssistantCard({ d }) {
  const insights = [];
  if (d.impayesCount > 0) insights.push({ color: "danger", text: d.impayesCount + " facture" + (d.impayesCount > 1 ? "s" : "") + " impayee" + (d.impayesCount > 1 ? "s" : "") + " pour " + Math.round(d.totalImpaye).toLocaleString("fr-FR") + " FCFA" });
  if (d.caChange > 0) insights.push({ color: "green", text: "Vos ventes ont progresse de " + d.caChange + "% ce mois" });
  if (d.devisEnAttente > 0) insights.push({ color: "blue", text: d.devisEnAttente + " devis en attente de validation" });
  if (insights.length === 0) insights.push({ color: "gray", text: "Aucune alerte pour le moment. Tout est a jour !" });

  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadow.card,
      border: "1px solid " + colors.gray[100], display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: radius.full, background: colors.gray[900],
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bot size={18} color={colors.white} />
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Assistant FactureFlow</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {insights.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette[it.color].solid, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: colors.gray[600] }}>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodayTasksCard({ d }) {
  const tasks = [
    { icon: Clock, label: d.impayesCount + " facture" + (d.impayesCount !== 1 ? "s" : "") + " impayee" + (d.impayesCount !== 1 ? "s" : ""), count: d.impayesCount, tone: "danger" },
    { icon: AlertCircle, label: d.enRetard + " facture" + (d.enRetard !== 1 ? "s" : "") + " en retard", count: d.enRetard, tone: "yellow" },
    { icon: ClipboardList, label: d.devisEnAttente + " devis en attente", count: d.devisEnAttente, tone: "blue" },
  ];
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadow.card,
      border: "1px solid " + colors.gray[100], height: "100%", display: "flex", flexDirection: "column" }}>
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>A faire aujourd'hui</p>
      <div style={{ flex: 1 }}>
        {tasks.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 0", borderBottom: i < tasks.length - 1 ? "1px solid " + colors.gray[100] : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Icon size={15} color={palette[t.tone].solid} />
                <span style={{ fontSize: 13, fontWeight: 500, color: colors.gray[900] }}>{t.label}</span>
              </div>
              <span style={{ minWidth: 22, height: 22, padding: "0 6px", borderRadius: radius.full,
                background: palette[t.tone].solid, color: colors.white, fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center" }}>{t.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PerformanceRow() {
  const d = useDashboardData();
  if (d.isLoading) return null;
  return (
    <div className="ff-row3">
      <div style={{ flex: 1.4, minWidth: 0 }}><EvolutionCard d={d} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><AssistantCard d={d} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><TodayTasksCard d={d} /></div>
    </div>
  );
}