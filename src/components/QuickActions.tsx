import React from "react";
import type { LucideIcon } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import type { PaletteColor } from "@/modules/dashboard/dashboard.types";
import { IconBadgeSquare } from "./Primitives";

export function QuickActionCard({ icon, title, subtitle, color }: { icon: LucideIcon; title: string; subtitle: string; color: PaletteColor }) {
  return (
    <button className="ff-card" style={{
      display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg,
      border: `1px solid ${colors.gray[100]}`, background: colors.white, cursor: "pointer",
      textAlign: "left", flex: 1, minWidth: 170,
    }}>
      <IconBadgeSquare icon={icon} color={color} />
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
        <p style={{ margin: 0, fontSize: 12, color: colors.gray[600] }}>{subtitle}</p>
      </div>
    </button>
  );
}

export function QuickActionCircle({ icon: Icon, title, color }: { icon: LucideIcon; title: string; color: PaletteColor }) {
  const p = palette[color];
  return (
    <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", flex: "0 0 auto", width: 64 }}>
      <div style={{ width: 48, height: 48, borderRadius: radius.full, background: p[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} color={p.solid} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: colors.gray[900] }}>{title}</span>
    </button>
  );
}