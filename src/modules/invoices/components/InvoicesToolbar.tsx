import React from "react";
import { Search } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { font } from "./Primitives";
import { STATUS_LABELS } from "../invoices.status";

export type StatusFilter = "Toutes"|"brouillon"|"envoyee"|"partiellement_payee"|"payee"|"en_retard";

// Ordre d'affichage des filtres — les libellés viennent de STATUS_LABELS
// (source unique, voir src/modules/invoices/invoices.status.ts) pour rester
// synchronisés avec les badges affichés sur les cartes de facture.
const FILTER_ORDER: StatusFilter[] = ["Toutes", "envoyee", "partiellement_payee", "payee", "en_retard"];
const FILTERS: { value:StatusFilter; label:string }[] = FILTER_ORDER.map((value) => ({
  value,
  label: value === "Toutes" ? "Toutes" : STATUS_LABELS[value],
}));

export function InvoicesToolbar({ search, onSearchChange, status, onStatusChange, total, filteredCount }: {
  search:string; onSearchChange:(v:string)=>void;
  status:StatusFilter; onStatusChange:(v:StatusFilter)=>void;
  total:number; filteredCount:number;
}) {
  const isFiltered = search.trim() !== "" || status !== "Toutes";
  const countLabel = filteredCount + (filteredCount !== 1 ? " factures" : " facture") + (isFiltered ? " sur " + total : " au total");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <p style={{ margin:0, fontSize:12.5, color:colors.gray[600] }}>{countLabel}</p>
      <div style={{ display:"flex", alignItems:"center", gap:8, background:colors.white,
        border:"1px solid " + colors.gray[200], borderRadius:radius.md, padding:"10px 14px" }}>
        <Search size={16} color={colors.gray[400]} />
        <input value={search} onChange={(e)=>onSearchChange(e.target.value)}
          placeholder="Rechercher une facture, un client..."
          style={{ flex:1, border:"none", outline:"none", fontSize:14, fontFamily:font,
            background:"transparent", color:colors.gray[900] }} />
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
        {FILTERS.map((f)=>{
          const isActive = status===f.value;
          return (
            <button key={f.value} onClick={()=>onStatusChange(f.value)} style={{
              flex:"0 0 auto", padding:"7px 14px", borderRadius:radius.full, fontSize:12.5, fontWeight:600,
              border: isActive ? "none" : "1px solid " + colors.gray[200],
              background: isActive ? palette.primary.solid : colors.white,
              color: isActive ? colors.white : colors.gray[600], cursor:"pointer", fontFamily:font,
            }}>{f.label}</button>
          );
        })}
      </div>
    </div>
  );
}