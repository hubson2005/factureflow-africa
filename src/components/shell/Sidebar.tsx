import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { sidebarNav } from "@/modules/dashboard/dashboard.data";
import { Avatar } from "@/components/Primitives";
import { supabase } from "@/supabase";

const SIDEBAR_BG = "#F97316"; // orange
const SIDEBAR_BORDER = "rgba(255,255,255,0.18)";
const TEXT_ON_ORANGE = "#111111";
const TEXT_ON_ORANGE_MUTED = "rgba(17,17,17,0.75)";
const ACTIVE_BG = "#FFFFFF";
const HOVER_BG = "rgba(255,255,255,0.18)";
const SECTION_TITLE_COLOR = "rgba(255,255,255,0.85)"; // lisible sur fond orange
const SCROLLBAR_THUMB = "rgba(255,255,255,0.35)";
const SCROLLBAR_THUMB_HOVER = "rgba(255,255,255,0.55)";

// Meme logique fiable que BottomNav.tsx : ne depend d'aucune classe CSS externe
// pour decider si on doit s'afficher ou non.
//
// Seuil a 1367px : couvre telephones ET tablettes (portrait et paysage, jusqu'aux
// plus grandes comme iPad Pro 12.9" en paysage a 1366px), qui utilisent toutes le
// bottom nav plutot que la sidebar. Meme seuil que BottomNav.tsx - les deux ne
// doivent jamais coexister ni laisser de zone morte entre eux.
function useIsCompactLayout() {
  const [isCompact, setIsCompact] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1367 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsCompact(window.innerWidth < 1367);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isCompact;
}

// Doit correspondre a la forme reelle des items exportes par dashboard.data.
// Ajuste les champs optionnels si dashboard.data.ts en definit d'autres.
interface NavItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  badge?: string | number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Regroupement visuel des items existants (base sur le label fourni par dashboard.data)
const NAV_SECTIONS: { title: string; labels: string[] }[] = [
  { title: "Général", labels: ["Dashboard"] },
  { title: "Facturation", labels: ["Factures", "Facturation récurrente", "Devis"] },
  { title: "Relations", labels: ["Clients", "Produits"] },
  { title: "Finances", labels: ["Paiements", "Recouvrement IA", "Dépenses", "Trésorerie"] },
  { title: "Pilotage", labels: ["Rapports", "Automatisation", "Assistant IA"] },
  { title: "Système", labels: ["Paramètres"] },
];

// Libellés affiches différemment de ceux de dashboard.data
const LABEL_OVERRIDES: Record<string, string> = { Dashboard: "Tableau de bord" };

function groupNav(items: NavItem[]): NavGroup[] {
  const byLabel = new Map(items.map((item) => [item.label, item]));
  const used = new Set<string>();
  const groups = NAV_SECTIONS.map((section) => {
    const sectionItems = section.labels
      .map((label) => byLabel.get(label))
      .filter((item): item is NavItem => Boolean(item));
    sectionItems.forEach((item) => used.add(item.label));
    return { title: section.title, items: sectionItems };
  }).filter((g) => g.items.length > 0);

  const rest = items.filter((item) => !used.has(item.label));
  if (rest.length) groups.push({ title: "Autres", items: rest });
  return groups;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCompact = useIsCompactLayout();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  }

  // La sidebar (ecrans larges, >=1367px) ne doit jamais coexister avec BottomNav
  // (telephones + tablettes, <1367px) - meme seuil que BottomNav.tsx, verifie
  // cote JS uniquement.
  if (isCompact) return null;

  return (
    <aside
      className="ff-sidebar"
      style={{
        width: 240,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        padding: "20px 14px 0",
        borderRight: `1px solid ${SIDEBAR_BORDER}`,
        background: SIDEBAR_BG,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <style>{`
        html, body, #root { margin: 0; padding: 0; height: 100%; }
        .ff-sidebar-nav::-webkit-scrollbar { width: 6px; }
        .ff-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .ff-sidebar-nav::-webkit-scrollbar-thumb { background: ${SCROLLBAR_THUMB}; border-radius: 10px; }
        .ff-sidebar-nav::-webkit-scrollbar-thumb:hover { background: ${SCROLLBAR_THUMB_HOVER}; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", margin: "0 -14px 16px", background: colors.white }}>
        <div style={{ padding: "0 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/icon-192.png" alt="FactureFlow Africa" style={{ width: 36, height: 36, borderRadius: radius.md, flexShrink: 0, objectFit: "cover" }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900], lineHeight: "16px" }}>FactureFlow</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.gray[600] }}>Africa</p>
          </div>
        </div>
      </div>

      <div
        className="ff-sidebar-nav"
        style={{
          display: "flex", flexDirection: "column", gap: 14, flex: 1, overflowY: "auto",
          paddingRight: 8,
          scrollbarWidth: "thin", scrollbarColor: `${SCROLLBAR_THUMB} transparent`,
        }}
      >
        {groupNav(sidebarNav).map((group) => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{
              margin: "0 0 2px", padding: "0 12px", fontSize: 10.5, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase", color: SECTION_TITLE_COLOR,
            }}>{group.title}</p>
            {group.items.map((item) => {
              const isActive = item.path ? pathname.startsWith(item.path) : false;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path ?? "#"}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: radius.md,
                    background: isActive ? ACTIVE_BG : "transparent",
                    color: isActive ? SIDEBAR_BG : TEXT_ON_ORANGE,
                    boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.18)" : "none",
                    fontSize: 13.5, fontWeight: 600, textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = HOVER_BG; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {Icon && <Icon size={17} color={isActive ? SIDEBAR_BG : "#FFFFFF"} />}
                  {LABEL_OVERRIDES[item.label] ?? item.label}
                  {item.badge && <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 700, color: palette.green.solid, background: colors.white, padding: "2px 6px", borderRadius: radius.full }}>{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div ref={menuRef} style={{ position: "relative", background: SIDEBAR_BG, margin: "8px -14px 0", padding: "0 14px 20px" }}>
        <div
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "14px 0 4px",
            borderTop: `1px solid ${SIDEBAR_BORDER}`, cursor: "pointer",
            borderRadius: radius.md,
          }}
        >
          <Avatar initials="HK" color="gray" size={34} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT_ON_ORANGE }}>Hubert K.</p>
            <p style={{ margin: 0, fontSize: 11, color: TEXT_ON_ORANGE_MUTED }}>Administrateur</p>
          </div>
          <ChevronDown
            size={14}
            color={TEXT_ON_ORANGE}
            style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}
          />
        </div>

        {menuOpen && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: 8, right: 8,
            background: colors.white, border: `1px solid ${colors.gray[200]}`, borderRadius: radius.md,
            boxShadow: "0 10px 28px rgba(0,0,0,0.22)", overflow: "hidden", zIndex: 20,
          }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
                border: "none", background: "none", cursor: "pointer", textAlign: "left",
                fontSize: 13, fontWeight: 600, color: palette.danger.solid,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.gray[50]; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <LogOut size={15} /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}