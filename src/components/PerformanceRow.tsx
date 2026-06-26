import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronRight, Bot } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { evolutionData, assistantInsights, todayTasks } from "@/modules/dashboard/dashboard.data";
import { Card, Button, CountBadge } from "./Primitives";

function EvolutionCard() {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Évolution du chiffre d'affaires</p>
        <button style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${colors.gray[200]}`, borderRadius: radius.md, padding: "6px 10px", background: colors.white, fontSize: 12, fontWeight: 600, color: colors.gray[600], cursor: "pointer" }}>
          Ce mois <ChevronDown size={13} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={evolutionData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-evo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.primary.solid} stopOpacity={0.18} />
              <stop offset="100%" stopColor={palette.primary.solid} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={colors.gray[100]} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `${v}M`} tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} width={36} />
          <Area type="monotone" dataKey="value" stroke={palette.primary.solid} strokeWidth={2.5} fill="url(#grad-evo)" />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", borderTop: `1px solid ${colors.gray[100]}`, paddingTop: 14 }}>
        {[{ l: "Total", v: "2 450 000 FCFA" }, { l: "Évolution", v: "+12%", c: palette.green.solid }, { l: "Mois dernier", v: "1 120 000 FCFA" }].map((s) => (
          <div key={s.l} style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: s.c ?? colors.gray[900] }}>{s.v}</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.gray[600] }}>{s.l}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AssistantCard() {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: radius.full, background: colors.gray[900], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bot size={18} color={colors.white} />
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Assistant FactureFlow</p>
        <span style={{ fontSize: 10, fontWeight: 700, color: palette.purple.solid, background: palette.purple[50], padding: "2px 8px", borderRadius: radius.full }}>BETA</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: colors.gray[600] }}>
        Vous avez 8 factures impayées pour un montant de <strong style={{ color: colors.gray[900] }}>420 000 FCFA</strong>.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="primary">Relancer les impayés</Button>
        <Button variant="secondary">Voir les factures</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${colors.gray[100]}`, paddingTop: 12, flex: 1 }}>
        {assistantInsights.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette[it.color].solid, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: colors.gray[600] }}>{it.text}</span>
          </div>
        ))}
      </div>
      <button style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "none", background: "none", padding: 0, cursor: "pointer" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: palette.primary.solid }}>Discuter avec l'IA</span>
        <ChevronRight size={14} color={palette.primary.solid} />
      </button>
    </Card>
  );
}

function TodayTasksCard() {
  return (
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>À faire aujourd'hui</p>
      <div style={{ flex: 1 }}>
        {todayTasks.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < todayTasks.length - 1 ? `1px solid ${colors.gray[100]}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Icon size={15} color={palette[t.tone].solid} />
                <span style={{ fontSize: 13, fontWeight: 500, color: colors.gray[900] }}>{t.label}</span>
              </div>
              <CountBadge count={t.count} color={t.tone} />
            </div>
          );
        })}
      </div>
      <button style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", padding: "10px 0 0", cursor: "pointer" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.gray[600] }}>Voir tout</span>
        <ChevronRight size={13} color={colors.gray[600]} />
      </button>
    </Card>
  );
}

export function PerformanceRow() {
  return (
    <div className="ff-row3">
      <div style={{ flex: 1.4, minWidth: 0 }}><EvolutionCard /></div>
      <div style={{ flex: 1, minWidth: 0 }}><AssistantCard /></div>
      <div style={{ flex: 1, minWidth: 0 }}><TodayTasksCard /></div>
    </div>
  );
}