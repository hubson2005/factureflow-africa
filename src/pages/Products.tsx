import React, { useMemo, useState } from "react";
import { PackagePlus, Tag, Package, Repeat, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useProducts, useCreateProduct } from "../modules/products/useProducts";
import { NewProductForm } from "../modules/products/components/NewProductForm";
import { useAutoOpenCreate } from "@/hooks/useAutoOpenCreate";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const FILTERS = ["Tous", "Service", "Produit", "Abonnement"];
const CATEGORY_ICONS = { "Service": Tag, "Produit": Package, "Abonnement": Repeat };
const CATEGORY_COLORS = { "Service": "primary", "Produit": "purple", "Abonnement": "green" };

export default function Products() {
  const { data: products = [], isLoading, isError } = useProducts();
  const createProduct = useCreateProduct();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [showForm, setShowForm] = useState(false);

  // Ouvre automatiquement ce formulaire si on arrive ici via le bouton "+" -> "Produit"
  // du menu de creation rapide mobile (BottomNav).
  useAutoOpenCreate(setShowForm);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchFilter = filter === "Tous" || p.category === filter;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [products, search, filter]);

  function handleSave(data) {
    createProduct.mutate(data, {
      onSuccess: () => setShowForm(false),
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <>
      {showForm && <NewProductForm onClose={() => setShowForm(false)} onSave={handleSave} saving={createProduct.isPending} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Produits" />
        <button onClick={() => setShowForm(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
          borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, flexShrink: 0 }}>
          <PackagePlus size={15} /> Ajouter
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement des produits...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600] }}>
              {filtered.length + " produit" + (filtered.length !== 1 ? "s" : "") + ((search || filter !== "Tous") ? " sur " + products.length : " au total")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.white,
              border: "1px solid " + colors.gray[200], borderRadius: radius.md, padding: "10px 14px" }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit ou service..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: font,
                  background: "transparent", color: colors.gray[900] }} />
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              {FILTERS.map((f) => {
                const isActive = filter === f;
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    flex: "0 0 auto", padding: "7px 14px", borderRadius: radius.full, fontSize: 12.5, fontWeight: 600,
                    border: isActive ? "none" : "1px solid " + colors.gray[200],
                    background: isActive ? palette.primary.solid : colors.white,
                    color: isActive ? colors.white : colors.gray[600], cursor: "pointer", fontFamily: font,
                  }}>{f}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: colors.gray[600], fontSize: 13, padding: "40px 0", gridColumn: "1/-1" }}>
                {products.length === 0 ? "Aucun produit pour le moment. Ajoutez votre premier produit !" : "Aucun resultat."}
              </p>
            ) : filtered.map((p) => {
              const catColor = CATEGORY_COLORS[p.category] || "gray";
              const pal = palette[catColor];
              const Icon = CATEGORY_ICONS[p.category] || Package;
              return (
                <div key={p.id} className="ff-card" style={{ background: colors.white, borderRadius: radius.lg,
                  padding: 18, border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
                  display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: radius.md, background: pal[50],
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={20} color={pal.solid} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{p.name}</p>
                      {p.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[400] }}>{p.description}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.gray[900] }}>
                      {Number(p.unit_price).toLocaleString("fr-FR")} <span style={{ fontSize: 11, fontWeight: 500, color: colors.gray[600] }}>FCFA</span>
                    </p>
                    {p.category && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: radius.full,
                      background: pal[50], color: pal.solid }}>{p.category}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}