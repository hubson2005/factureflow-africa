import React from "react";
import type { LucideIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import type { PaletteColor, InvoiceStatus } from "@/modules/dashboard/dashboard.types";

const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function Button({
  children, variant = "primary", icon: Icon, full, onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
  full?: boolean;
  onClick?: () => void;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "9px 14px", borderRadius: radius.md, fontSize: 13, fontWeight: 700,
    border: "1px solid transparent", cursor: "pointer", fontFamily, transition: "all 150ms ease",
    width: full ? "100%" : "auto",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: palette.primary.solid, color: colors.white },
    secondary: { background: colors.white, color: colors.gray[900], border: `1px solid ${colors.gray[200]}` },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export function Avatar({ initials, color = "gray", size = 36 }: { initials: string; color?: PaletteColor; size?: number }) {
  const p = palette[color];
  return (
    <div style={{
      width: size, height: size, borderRadius: radius.md, background: p[50], color: p.solid,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32,
      fontWeight: 700, flexShrink: 0, fontFamily,
    }}>{initials}</div>
  );
}

export function IconBadgeSquare({ icon: Icon, color, size = 40 }: { icon: LucideIcon; color: PaletteColor; size?: number }) {
  const p = palette[color];
  return (
    <div style={{
      width: size, height: size, borderRadius: radius.md, background: p[50],
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={size * 0.45} color={p.solid} />
    </div>
  );
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, typeof palette.green> = {
    "Payée": palette.green, "Impayée": palette.danger, "Envoyée": palette.gray,
  };
  const p = map[status] ?? palette.gray;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: radius.full, background: p[50], color: p.solid, fontFamily, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

export function CountBadge({ count, color }: { count: number; color: PaletteColor }) {
  const p = palette[color];
  return (
    <span style={{
      minWidth: 22, height: 22, padding: "0 6px", borderRadius: radius.full, background: p.solid,
      color: colors.white, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily,
    }}>{count}</span>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="ff-card" style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadow.card, border: `1px solid ${colors.gray[100]}`, ...style }}>
      {children}
    </div>
  );
}

export function ProgressBar({ percent, color }: { percent: number; color: PaletteColor }) {
  const p = palette[color];
  return (
    <div style={{ height: 6, borderRadius: radius.full, background: colors.gray[100], overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${percent}%`, background: p.solid, borderRadius: radius.full }} />
    </div>
  );
}

export function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const id = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}