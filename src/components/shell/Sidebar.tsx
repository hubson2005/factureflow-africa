import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Plus, Zap } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { sidebarNav } from "@/modules/dashboard/dashboard.data";
import { Button, Avatar } from "@/components/Primitives";

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="ff-sidebar" style={{ width: 240, flexDirection: "column", padding: "20px 14px", borderRight: `1px solid ${colors.gray[100]}`, background: colors.white, position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 20px" }}>
        <div style={{ width: 36, height: 36, borderRadius: radius.md, background: palette.primary.solid, display: "flex", alignItems: "center", justifyContent: "center", color: colors.white, fontWeight: 800, fontSize: 16, flexShrink: 0 }}>F</div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900], lineHeight: "16px" }}>FactureFlow</p>
          <p style={{ margin: 0, fontSize: 11, color: colors.gray[600] }}>Africa</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {sidebarNav.map((item) => {
          const isActive = item.path ? pathname.startsWith(item.path) : false;
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path ?? "#"} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: radius.md,
              background: isActive ? palette.primary[50] : "transparent", color: isActive ? palette.primary.text : colors.gray[600],
              fontSize: 13.5, fontWeight: 600, textDecoration: "none",
            }}>
              <Icon size={17} />
              {item.label}
              {item.badge && <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 700, color: palette.green.solid, background: palette.green[50], padding: "2px 6px", borderRadius: radius.full }}>{item.badge}</span>}
            </Link>
          );
        })}
      </div>
      <div style={{ background: palette.primary[50], borderRadius: radius.lg, padding: 16, marginTop: 12 }}>
        <Zap size={18} color={palette.primary.solid} style={{ marginBottom: 8 }} />
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: colors.gray[900], lineHeight: "16px" }}>Créez et envoyez une facture en moins de 3 minutes</p>
        <Button variant="primary" icon={Plus} full>Nouvelle facture</Button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 8px 4px", marginTop: 8, borderTop: `1px solid ${colors.gray[100]}` }}>
        <Avatar initials="HK" color="gray" size={34} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>Hubert K.</p>
          <p style={{ margin: 0, fontSize: 11, color: colors.gray[600] }}>Administrateur</p>
        </div>
        <ChevronDown size={14} color={colors.gray[400]} />
      </div>
    </aside>
  );
}