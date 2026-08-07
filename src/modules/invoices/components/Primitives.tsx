import React from "react";
import { palette, colors, radius } from "@/theme/tokens";
import type { PaletteColor } from "../invoices.types";
import { STATUS_LABELS } from "../invoices.status";

export const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export function Avatar({ initials, color="gray", size=36 }: { initials:string; color?:PaletteColor; size?:number }) {
  const p = palette[color];
  return (
    <div style={{ width:size, height:size, borderRadius:radius.md, background:p[50], color:p.solid,
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32,
      fontWeight:700, flexShrink:0, fontFamily:font }}>
      {initials}
    </div>
  );
}

// Couleurs par statut — les libellés viennent désormais de STATUS_LABELS
// (source unique, voir src/modules/invoices/invoices.status.ts)
const STATUS_STYLE: Record<string,{bg:string;color:string}> = {
  brouillon:            { bg:colors.gray[100],   color:colors.gray[600] },
  envoyee:              { bg:palette.blue[50],   color:palette.blue.solid },
  partiellement_payee:  { bg:palette.yellow[50], color:palette.yellow.solid },
  payee:                { bg:palette.green[50],  color:palette.green.solid },
  en_retard:            { bg:palette.danger[50], color:palette.danger.solid },
};

export function StatusBadge({ status }: { status:string }) {
  const s = STATUS_STYLE[status] ?? { bg:colors.gray[100], color:colors.gray[600] };
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:radius.full,
      background:s.bg, color:s.color, fontFamily:font, whiteSpace:"nowrap", flexShrink:0 }}>
      {label}
    </span>
  );
}