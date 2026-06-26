import React from "react";
import { Search, Bell, MessageSquare, Plus, Menu } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { Button } from "@/components/Primitives";

export function Header({ title }: { title?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="ff-hamburger-wrap">
          <button style={{ display: "inline-flex", alignItems: "center", border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <Menu size={22} color={colors.gray[900]} />
          </button>
        </div>
        <div>
          {title ? (
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.gray[900] }}>Bonjour Hubert 👋</p>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: colors.gray[600] }}>FactureFlow Africa</p>
            </>
          )}
        </div>
      </div>

      <div className="ff-search-wrap" style={{ flex: 1, maxWidth: 420, margin: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.gray[50], border: `1px solid ${colors.gray[200]}`, borderRadius: radius.md, padding: "9px 14px" }}>
          <Search size={15} color={colors.gray[400]} />
          <span style={{ fontSize: 13, color: colors.gray[400], flex: 1 }}>Rechercher (facture, client, produit...)</span>
          <span style={{ fontSize: 11, color: colors.gray[400], border: `1px solid ${colors.gray[200]}`, borderRadius: radius.sm, padding: "1px 6px" }}>⌘K</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="ff-search-icon-wrap">
          <button style={{ width: 36, height: 36, borderRadius: radius.full, background: colors.white, border: `1px solid ${colors.gray[200]}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Search size={16} color={colors.gray[600]} />
          </button>
        </div>
        <button style={{ position: "relative", width: 36, height: 36, borderRadius: radius.full, background: colors.white, border: `1px solid ${colors.gray[200]}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Bell size={16} color={colors.gray[600]} />
          <span style={{ position: "absolute", top: -2, right: -2, background: palette.danger.solid, color: colors.white, fontSize: 9, fontWeight: 700, borderRadius: radius.full, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
        </button>
        <div className="ff-chat-wrap">
          <button style={{ width: 36, height: 36, borderRadius: radius.full, background: colors.white, border: `1px solid ${colors.gray[200]}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <MessageSquare size={16} color={colors.gray[600]} />
          </button>
        </div>
        <div className="ff-new-invoice-wrap">
          <Button variant="primary" icon={Plus}>Nouvelle facture</Button>
        </div>
      </div>
    </div>
  );
}