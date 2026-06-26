import React from "react";
import { Link, useLocation } from "react-router-dom";
import { colors, palette, radius, shadow } from "@/theme/tokens";
import { bottomNav } from "@/modules/dashboard/dashboard.data";

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="ff-bottomnav" style={{ justifyContent: "space-around", alignItems: "center", background: colors.white, borderTop: `1px solid ${colors.gray[100]}`, padding: "10px 8px", zIndex: 20 }}>
      {bottomNav.map((item) => {
        const Icon = item.icon;
        if (item.action) {
          return (
            <Link key={item.label} to={item.path ?? "/invoices/new"} style={{
              width: 52, height: 52, borderRadius: radius.full, background: palette.primary.solid,
              display: "flex", alignItems: "center", justifyContent: "center", transform: "translateY(-14px)",
              boxShadow: shadow.hover,
            }}>
              <Icon size={22} color={colors.white} />
            </Link>
          );
        }
        const isActive = item.path ? pathname.startsWith(item.path) : false;
        return (
          <Link key={item.label} to={item.path ?? "#"} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: isActive ? palette.primary.solid : colors.gray[400], textDecoration: "none",
          }}>
            <Icon size={20} />
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}