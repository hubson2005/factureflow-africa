import React, { useMemo, useState } from "react";
import { Plus, Search, Car, ShoppingCart, Wifi, Coffee, Home, Users, Megaphone, Briefcase, MoreHorizontal, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useExpenses, useCreateExpense } from "../modules/expenses/useExpenses";
import { NewExpenseForm } from "../modules/expenses/components/NewExpenseForm";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const CATEGORY_LABELS = {
  transport: "Transport", fournitures: "Fournitures", telecom: "Telecom",
  restauration: "Restauration", loyer: "Loyer", salaires: "Salaires",
  marketing: "Marketing", services_pro: "Services pro.", autre: "Autre",
};
const CATEGORY_ICONS = {
  transport: Car, fournitures: ShoppingCart, telecom: Wifi, restauration: Coffee,
  loyer: Home, salaires: Users, marketing: Megaphone, services_pro: Briefcase, autre: MoreHorizontal,
};
const FILTERS = ["Toutes", "transport", "fournitures", "telecom", "restauration", "loyer", "salaires", "marketing", "services_pro", "autre"];

export default function Expenses() {
  const { data: expensesRaw, isLoading, isError } = useExpenses();
  const expenses = expensesRaw || [];
  const createExpense = useCreateExpense();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    if (!expenses) return [];
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchCat = category === "Toutes" || e.category === category;
      const matchSearch = !q || e.label.toLowerCase().includes(q) || (e.vendor || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [expenses, search, category]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  function handleSave(data) {
    createExpense.mutate(data, {
      onSuccess: () => setShowForm(false),
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <>
      {showForm && <NewExpenseForm onClose={() => setShowForm(false)} onSave={handleSave} saving={createExpense.isPending} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Depenses" />
        <button onClick={() => setShowForm(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
          borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, flexShrink: 0 }}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement des depenses...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <>
          <div style={{ background: palette.danger[50], borderRadius: radius.lg, padding: 16,
            border: "1px solid " + palette.danger[100], marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: palette.danger.solid }}>Total des depenses (filtre actuel)</p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: colors.gray[900] }}>
              {total.toLocaleString("fr-FR") + " FCFA"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.white,
              border: "1px solid " + colors.gray[200], borderRadius: radius.md, padding: "10px 14px" }}>
              <Search size={16} color={colors.gray[400]} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une depense..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: font,
                  background: "transparent", color: colors.gray[900] }} />
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              {FILTERS.map((c) => {
                const isActive = category === c;
                return (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    flex: "0 0 auto", padding: "7px 14px", borderRadius: radius.full, fontSize: 12.5, fontWeight: 600,
                    border: isActive ? "none" : "1px solid " + colors.gray[200],
                    background: isActive ? palette.primary.solid : colors.white,
                    color: isActive ? colors.white : colors.gray[600], cursor: "pointer", fontFamily: font,
                  }}>{c === "Toutes" ? "Toutes" : CATEGORY_LABELS[c]}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: colors.gray[600], fontSize: 13, padding: "40px 0" }}>
                {expenses.length === 0 ? "Aucune depense enregistree. Ajoutez votre premiere depense !" : "Aucun resultat."}
              </p>
            ) : filtered.map((e) => {
              const Icon = CATEGORY_ICONS[e.category] || MoreHorizontal;
              return (
                <div key={e.id} className="ff-card" style={{ background: colors.white, borderRadius: radius.lg,
                  padding: 16, border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
                  display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: radius.md, background: palette.yellow[50],
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={palette.yellow.solid} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{e.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[400] }}>
                      {CATEGORY_LABELS[e.category] + (e.vendor ? " \u00b7 " + e.vendor : "") + " \u00b7 " + new Date(e.expense_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: palette.danger.solid, flexShrink: 0 }}>
                    {"-" + Number(e.amount).toLocaleString("fr-FR") + " FCFA"}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}