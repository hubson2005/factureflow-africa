import React from "react";
import { Search } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import type { ClientStatus } from "../clients.types";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
export type ClientFilter = "Tous"|ClientStatus;
const FILTERS: ClientFilter[] = ["Tous","Actif","Inactif"];

export function ClientsToolbar({ search, onSearchChange, filter, onFilterChange, total, filteredCount }: {
  search:string; onSearchChange:(v:string)=>void;
  filter:ClientFilter; onFilterChange:(v:ClientFilter)=>void;
  total:number; filteredCount:number;
}) {
  const isFiltered = search.trim() !== "" || filter !== "Tous";
  const countLabel = filteredCount + (filteredCount !== 1 ? " clients" : " client") + (isFiltered ? " sur " + total : " au total");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <p style={{ margin:0, fontSize:12.5, color:colors.gray[600] }}>{countLabel}</p>
      <div style={{ display:"flex", alignItems:"center", gap:8, background:colors.white,
        border:"1px solid " + colors.gray[200], borderRadius:radius.md, padding:"10px 14px" }}>
        <Search size={16} color={colors.gray[400]} />
        <input value={search} onChange={(e)=>onSearchChange(e.target.value)}
          placeholder="Rechercher un client..."
          style={{ flex:1, border:"none", outline:"none", fontSize:14, fontFamily:font,
            background:"transparent", color:colors.gray[900] }} />
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {FILTERS.map((f)=>{
          const isActive = filter===f;
          return (
            <button key={f} onClick={()=>onFilterChange(f)} style={{
              flex:"0 0 auto", padding:"7px 14px", borderRadius:radius.full, fontSize:12.5, fontWeight:600,
              border: isActive ? "none" : "1px solid " + colors.gray[200],
              background: isActive ? palette.primary.solid : colors.white,
              color: isActive ? colors.white : colors.gray[600], cursor:"pointer", fontFamily:font,
            }}>{f}</button>
          );
        })}
      </div>
    </div>
  );
}