import React, { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Wallet, FileText, Users, AlertCircle } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { useDashboardData } from "../useDashboardData";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

// Hook local autonome (n'ecrase pas src/hooks/useMediaQuery.js — si ce hook expose
// deja une API equivalente, on peut le rebrancher plus tard, mais celui-ci ne depend
// d'aucune classe CSS externe et ne peut donc pas se retrouver desynchronise comme
// ff-mobile-only / ff-desktop-only l'etaient, qui s'affichaient tous les deux en meme
// temps sur mobile).
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function CaHeroMobile({ value, change, sparkValues }) {
  const positive = change >= 0;
  return (
    <div style={{ background: "linear-gradient(135deg, " + palette.primary.solid + ", #FF9D4D)",
      borderRadius: radius.lg, padding: 20, color: colors.white }}>
      <p style={{ margin: 0, fontSize: 12.5, opacity: 0.9, fontWeight: 600 }}>Chiffre d'affaires (ce mois)</p>
      <p style={{ margin: "4px 0 6px", fontSize: 24, fontWeight: 700 }}>
        {Math.round(value).toLocaleString("fr-FR")} FCFA
      </p>
      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, opacity: 0.95 }}>
        {(positive ? "\u2191 " : "\u2193 ") + Math.abs(change) + "% vs mois dernier"}
      </p>
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={sparkValues.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
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

function MiniStatsRow({ items }) {
  return (
    <div style={{ display: "flex", background: colors.white, borderRadius: radius.lg, border: "1px solid " + colors.gray[100], padding: "14px 4px" }}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>{it.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.gray[600] }}>{it.label}</p>
          </div>
          {i < items.length - 1 && <div style={{ width: 1, background: colors.gray[100], flexShrink: 0 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value, unit }) {
  const p = palette[color];
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 18,
      boxShadow: "0 1px 2px rgba(15,18,20,0.04), 0 4px 12px rgba(15,18,20,0.05)",
      border: "1px solid " + colors.gray[100], display: "flex", flexDirection: "column", gap: 10,
      minWidth: 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: radius.md, background: p[50],
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={p.solid} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600], fontWeight: 600,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 21, fontWeight: 700, color: colors.gray[900],
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}{unit && <span style={{ fontSize: 12, fontWeight: 500, color: colors.gray[600] }}>{" " + unit}</span>}
        </p>
      </div>
    </div>
  );
}

export function KpiSection() {
  const d = useDashboardData();
  const breakpoint = useBreakpoint();

  if (d.isLoading) {
    return <p style={{ fontSize: 13, color: colors.gray[600], padding: "20px 0" }}>Chargement...</p>;
  }

  // < 768px : carte "hero" CA + bandeau de mini-stats compact (pas de defilement horizontal possible,
  // tout tient sur une seule ligne grace a flex + minWidth:0 + ellipsis)
  if (breakpoint === "mobile") {
    return (
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <CaHeroMobile value={d.caThisMonth} change={d.caChange} sparkValues={d.sparkValues} />
        <div style={{ height: 12 }} />
        <MiniStatsRow items={[
          { value: String(d.facturesCount), label: "Factures" },
          { value: String(d.clientsCount), label: "Clients" },
          { value: Math.round(d.totalImpaye / 1000) + "K", label: "Impayes" },
          { value: String(d.devisEnAttente), label: "Devis" },
        ]} />
      </div>
    );
  }

  // 768-1023px (tablette) : grille 2x2 de cartes completes, plus lisible qu'un bandeau
  // compact mais sans forcer 4 colonnes etroites sur un ecran encore limite en largeur
  if (breakpoint === "tablet") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, width: "100%", boxSizing: "border-box" }}>
        <StatCard icon={Wallet} color="primary" label="Chiffre d'affaires (mois)" value={Math.round(d.caThisMonth).toLocaleString("fr-FR")} unit="FCFA" />
        <StatCard icon={FileText} color="blue" label="Factures" value={String(d.facturesCount)} />
        <StatCard icon={Users} color="green" label="Clients" value={String(d.clientsCount)} />
        <StatCard icon={AlertCircle} color="danger" label="Impayes" value={Math.round(d.totalImpaye).toLocaleString("fr-FR")} unit="FCFA" />
      </div>
    );
  }

  // >= 1024px (desktop) : grille 4 colonnes, comportement d'origine
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, width: "100%", boxSizing: "border-box" }}>
      <StatCard icon={Wallet} color="primary" label="Chiffre d'affaires (mois)" value={Math.round(d.caThisMonth).toLocaleString("fr-FR")} unit="FCFA" />
      <StatCard icon={FileText} color="blue" label="Factures" value={String(d.facturesCount)} />
      <StatCard icon={Users} color="green" label="Clients" value={String(d.clientsCount)} />
      <StatCard icon={AlertCircle} color="danger" label="Impayes" value={Math.round(d.totalImpaye).toLocaleString("fr-FR")} unit="FCFA" />
    </div>
  );
}