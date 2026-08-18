import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, LogOut } from "lucide-react";
import { colors, palette, radius, shadow } from "@/theme/tokens";
import { bottomNav, sidebarNav } from "@/modules/dashboard/dashboard.data";
import { supabase } from "@/supabase";

// Meme logique fiable que KpiSection.tsx : ne depend d'aucune classe CSS externe
// pour decider si on doit s'afficher ou non.
//
// Seuil a 1367px : couvre telephones ET tablettes (portrait et paysage, jusqu'aux
// plus grandes comme iPad Pro 12.9" en paysage a 1366px). La sidebar est donc
// reservee aux ecrans plus larges (laptop/desktop). Meme seuil que Sidebar.tsx -
// les deux ne doivent jamais coexister ni laisser de zone morte entre eux.
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

// Raccourcis de creation rapide ouverts par le bouton central "+".
// Chaque entree renvoie vers la page de liste correspondante, ou se trouve deja
// le bouton "Nouveau/Ajouter" pour ce type d'element.
const QUICK_CREATE_LINKS = [
  { label: "Facture", path: "/invoices", color: "primary" },
  { label: "Devis", path: "/quotes", color: "blue" },
  { label: "Client", path: "/clients", color: "green" },
  { label: "Produit", path: "/products", color: "purple" },
  { label: "Dépense", path: "/expenses", color: "yellow" },
];

// Elements de sidebarNav qui n'ont pas leur place dans la barre du bas (5 max) -
// affiches dans le menu "Plus". Calcule automatiquement pour rester synchronise
// si sidebarNav ou bottomNav changent.
function useOverflowNavItems() {
  const bottomLabels = new Set(bottomNav.map((i) => i.label));
  return sidebarNav.filter((i) => !bottomLabels.has(i.label));
}

function SheetOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.white, width: "100%", maxWidth: 480,
          borderRadius: "20px 20px 0 0", boxShadow: shadow.hover,
          maxHeight: "75vh", overflowY: "auto",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px 12px", position: "sticky", top: 0, background: colors.white,
    }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
      <button onClick={onClose} style={{ border: "none", background: colors.gray[100], borderRadius: radius.full, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <X size={15} color={colors.gray[600]} />
      </button>
    </div>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isCompact = useIsCompactLayout();
  const [showCreate, setShowCreate] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const overflowItems = useOverflowNavItems();

  if (!isCompact) return null;

  async function handleLogout() {
    setShowMore(false);
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <>
      <nav
        className="ff-bottomnav"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "100vw",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          background: colors.white,
          borderTop: `1px solid ${colors.gray[100]}`,
          padding: "10px 8px",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          zIndex: 20,
        }}
      >
        {bottomNav.map((item) => {
          const Icon = item.icon;

          // Bouton central "+" : ouvre le menu de creation rapide (pas de navigation directe,
          // il n'existe pas de route dediee du type /invoices/new).
          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={() => setShowCreate(true)}
                style={{
                  width: 52, height: 52, borderRadius: radius.full, background: palette.primary.solid,
                  display: "flex", alignItems: "center", justifyContent: "center", transform: "translateY(-14px)",
                  boxShadow: shadow.hover, flexShrink: 0, border: "none", cursor: "pointer",
                }}
              >
                <Icon size={22} color={colors.white} />
              </button>
            );
          }

          // "Plus" : pas de path defini -> ouvre le menu contenant le reste de la navigation.
          if (!item.path) {
            return (
              <button
                key={item.label}
                onClick={() => setShowMore(true)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  color: colors.gray[400], background: "none", border: "none", cursor: "pointer",
                  flex: "1 1 0", minWidth: 0, maxWidth: 72, padding: 0,
                }}
              >
                <Icon size={20} />
                <span style={{ fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}>{item.label}</span>
              </button>
            );
          }

          const isActive = pathname.startsWith(item.path);
          return (
            <Link key={item.label} to={item.path} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: isActive ? palette.primary.solid : colors.gray[400], textDecoration: "none",
              flex: "1 1 0", minWidth: 0, maxWidth: 72,
            }}>
              <Icon size={20} />
              <span style={{ fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showCreate && (
        <SheetOverlay onClose={() => setShowCreate(false)}>
          <SheetHeader title="Créer" onClose={() => setShowCreate(false)} />
          <div style={{ padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {QUICK_CREATE_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  setShowCreate(false);
                  // openCreate=true est lu par la page cible (voir useAutoOpenCreate)
                  // pour ouvrir directement son formulaire de creation, plutot que
                  // de se contenter d'afficher la liste.
                  navigate(link.path, { state: { openCreate: true } });
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 12px",
                  borderRadius: radius.md, border: "none", background: "none", cursor: "pointer",
                  textAlign: "left", color: colors.gray[900], fontSize: 14, fontWeight: 600, width: "100%",
                }}
              >
                <span style={{
                  width: 34, height: 34, borderRadius: radius.md,
                  background: (palette as any)[link.color]?.[50] ?? colors.gray[100],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: (palette as any)[link.color]?.solid ?? colors.gray[600],
                  fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>+</span>
                {link.label}
              </button>
            ))}
          </div>
        </SheetOverlay>
      )}

      {showMore && (
        <SheetOverlay onClose={() => setShowMore(false)}>
          <SheetHeader title="Plus" onClose={() => setShowMore(false)} />
          <div style={{ padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            {overflowItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path ? pathname.startsWith(item.path) : false;
              return (
                <Link
                  key={item.label}
                  to={item.path ?? "#"}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px",
                    borderRadius: radius.md, textDecoration: "none",
                    color: isActive ? palette.primary.solid : colors.gray[900],
                    background: isActive ? palette.primary[50] : "transparent",
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  {Icon && <Icon size={18} />}
                  {item.label}
                  {item.badge && (
                    <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 700, color: palette.green.solid, background: palette.green[50], padding: "2px 6px", borderRadius: radius.full }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px",
                borderRadius: radius.md, border: "none", background: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, color: palette.danger.solid, textAlign: "left",
                marginTop: 6, borderTop: `1px solid ${colors.gray[100]}`, paddingTop: 16,
              }}
            >
              <LogOut size={18} /> Déconnexion
            </button>
          </div>
        </SheetOverlay>
      )}
    </>
  );
}