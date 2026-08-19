import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useReportsData } from "../modules/reports/useReportsData";
import { useCompany } from "../hooks/useCompany";
import { generateReportPDF } from "../modules/reports/pdfGenerator";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const PERIODS = ["Ce mois", "Ce trimestre", "Cette annee"];

export default function Reports() {
  const [period, setPeriod] = useState("Ce mois");
  const { data, isLoading, isError } = useReportsData(period);
  const { data: company } = useCompany();

  const STATS = data ? [
    { label: "CA total", value: Math.round(data.caTotal).toLocaleString("fr-FR") + " FCFA" },
    { label: "Factures emises", value: String(data.facturesCount) },
    { label: "Taux de recouvrement", value: data.tauxRecouvrement + "%" },
    { label: "Depenses totales", value: Math.round(data.depensesTotal).toLocaleString("fr-FR") + " FCFA" },
  ] : [];

  function handleExport() {
    if (!data) return;
    generateReportPDF(data, period, company?.companies?.name);
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Rapports" />
        <button onClick={handleExport} disabled={!data} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
          borderRadius: radius.md, background: data ? palette.primary.solid : colors.gray[200],
          color: data ? colors.white : colors.gray[400],
          border: "none", fontSize: 13, fontWeight: 700, cursor: data ? "pointer" : "not-allowed",
          fontFamily: font, flexShrink: 0 }}>
          <Download size={15} /> Exporter
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        {PERIODS.map((p) => {
          const isActive = period === p;
          return (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: "0 0 auto", padding: "7px 14px", borderRadius: radius.full, fontSize: 12.5, fontWeight: 600,
              border: isActive ? "none" : "1px solid " + colors.gray[200],
              background: isActive ? palette.primary.solid : colors.white,
              color: isActive ? colors.white : colors.gray[600], cursor: "pointer", fontFamily: font,
            }}>{p}</button>
          );
        })}
      </div>

     {isLoading || !data ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Calcul des statistiques...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ background: colors.white, borderRadius: radius.lg, padding: 16,
                border: "1px solid " + colors.gray[100], boxShadow: shadow.card }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: colors.gray[600] }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.gray[900] }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>
            <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20,
              border: "1px solid " + colors.gray[100], boxShadow: shadow.card }}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
                Evolution du CA (6 derniers mois)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.evolutionData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-rpt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.primary.solid} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={palette.primary.solid} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.gray[100]} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
                 <YAxis tickFormatter={(v) => v + "M"} tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v) => [Number(v).toFixed(2) + "M FCFA", "CA"]} />
                  <Area type="monotone" dataKey="ca" stroke={palette.primary.solid} strokeWidth={2.5} fill="url(#grad-rpt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20,
              border: "1px solid " + colors.gray[100], boxShadow: shadow.card }}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
                CA par categorie
              </p>
              {data.categoryData.length === 0 ? (
                <p style={{ fontSize: 13, color: colors.gray[600], padding: "40px 0", textAlign: "center" }}>
                  Aucune donnee pour cette periode.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.categoryData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={colors.gray[100]} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.gray[400] }} axisLine={false} tickLine={false} />
                 <YAxis tickFormatter={(v) => Math.round(v / 1000) + "K"} tick={{ fontSize: 11, fill: colors.gray[400] }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip formatter={(v) => [Number(v).toLocaleString("fr-FR") + " FCFA", "Montant"]} />
                    <Bar dataKey="value" fill={palette.primary.solid} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}