import React, { useMemo, useState } from "react";
import { Smartphone, Landmark, Banknote, CreditCard, Search, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { usePayments } from "../modules/payments/usePayments";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const METHOD_LABELS = {
  especes: "Especes",
  virement: "Virement",
  carte: "Carte",
  mobile_money: "Mobile Money",
  autre: "Autre",
};
const METHOD_ICONS = {
  especes: Banknote,
  virement: Landmark,
  carte: CreditCard,
  mobile_money: Smartphone,
  autre: CreditCard,
};
const METHOD_COLORS = {
  especes: "green",
  virement: "purple",
  carte: "blue",
  mobile_money: "primary",
  autre: "gray",
};

const FILTERS = ["Tous", "especes", "virement", "carte", "mobile_money", "autre"];

export default function Payments() {
  const { data: payments, isLoading, isError } = usePayments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");

  const mapped = useMemo(() => {
    if (!payments) return [];
    return payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      date: p.payment_date,
      clientName: p.invoices?.clients?.name ?? "Client",
      invoiceNumber: p.invoices?.invoice_number ?? "—",
    }));
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mapped.filter((p) => {
      const matchFilter = filter === "Tous" || p.method === filter;
      const matchSearch = !q || p.clientName.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [mapped, search, filter]);

  const total = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <Header title="Paiements" />

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement des paiements...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <>
          <div style={{ background: palette.primary[50], borderRadius: radius.lg, padding: 16,
            border: "1px solid " + palette.primary[100], marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: palette.primary.text }}>Total encaisse (filtre actuel)</p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: colors.gray[900] }}>
              {total.toLocaleString("fr-FR") + " FCFA"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600] }}>
              {filtered.length + " paiement" + (filtered.length !== 1 ? "s" : "")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.white,
              border: "1px solid " + colors.gray[200], borderRadius: radius.md, padding: "10px 14px" }}>
              <Search size={16} color={colors.gray[400]} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par facture ou client..."
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
                  }}>{f === "Tous" ? "Tous" : METHOD_LABELS[f]}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: colors.gray[600], fontSize: 13, padding: "40px 0" }}>
                {mapped.length === 0 ? "Aucun paiement enregistre. Marquez une facture comme payee pour en voir ici." : "Aucun resultat."}
              </p>
            ) : filtered.map((p) => {
              const colorKey = METHOD_COLORS[p.method] || "gray";
              const pal = palette[colorKey];
              const Icon = METHOD_ICONS[p.method] || CreditCard;
              return (
                <div key={p.id} className="ff-card" style={{ background: colors.white, borderRadius: radius.lg,
                  padding: 16, border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
                  display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: radius.md, background: pal[50],
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={pal.solid} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
                      {METHOD_LABELS[p.method] || p.method}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[400] }}>
                      {p.clientName + " \u00b7 " + p.invoiceNumber}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[400] }}>
                      {new Date(p.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900], flexShrink: 0 }}>
                    {p.amount.toLocaleString("fr-FR") + " FCFA"}
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
