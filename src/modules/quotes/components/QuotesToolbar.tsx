import React from "react";
import { palette, colors, radius } from "@/theme/tokens";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export function QuotesToolbar({ search, onSearchChange, status, onStatusChange, total, filteredCount }) {
  const FILTERS = [
    { value: "Tous", label: "Tous" },
    { value: "brouillon", label: "Brouillon" },
    { value: "envoye", label: "Envoye" },
    { value: "accepte", label: "Accepte" },
    { value: "refuse", label: "Refuse" },
    { value: "expire", label: "Expire" },
  ];
  const isFiltered = search.trim() !== "" || status !== "Tous";
  const countLabel = filteredCount + " devis" + (isFiltered ? " sur " + total : " au total");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600] }}>{countLabel}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.white,
        border: "1px solid " + colors.gray[200], borderRadius: radius.md, padding: "10px 14px" }}>
        <input value={search} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un devis, un client..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: font,
            background: "transparent", color: colors.gray[900] }} />
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {FILTERS.map((f) => {
          const isActive = status === f.value;
          return (
            <button key={f.value} onClick={() => onStatusChange(f.value)} style={{
              flex: "0 0 auto", padding: "7px 14px", borderRadius: radius.full, fontSize: 12.5, fontWeight: 600,
              border: isActive ? "none" : "1px solid " + colors.gray[200],
              background: isActive ? palette.primary.solid : colors.white,
              color: isActive ? colors.white : colors.gray[600], cursor: "pointer", fontFamily: font,
            }}>{f.label}</button>
          );
        })}
      </div>
    </div>
  );
}
