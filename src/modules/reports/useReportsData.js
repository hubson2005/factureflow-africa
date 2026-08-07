import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

function getPeriodRange(period) {
  const now = new Date();
  if (period === "Ce mois") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
  if (period === "Ce trimestre") {
    const q = Math.floor(now.getMonth() / 3);
    return { start: new Date(now.getFullYear(), q * 3, 1), end: now };
  }
  return { start: new Date(now.getFullYear(), 0, 1), end: now };
}

export function useReportsData(period) {
  const { data: company } = useCompany();
  const { start, end } = getPeriodRange(period);

  return useQuery({
    queryKey: ["reports", company?.company_id, period],
    queryFn: async () => {
      const companyId = company.company_id;
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      const [invRes, expRes, itemsRes] = await Promise.all([
        supabase.from("invoices").select("id, total, amount_paid, created_at")
          .eq("company_id", companyId).gte("created_at", startIso).lte("created_at", endIso),
        supabase.from("expenses").select("amount, expense_date")
          .eq("company_id", companyId)
          .gte("expense_date", start.toISOString().split("T")[0])
          .lte("expense_date", end.toISOString().split("T")[0]),
        supabase.from("invoice_items").select("line_total, products(category), invoices!inner(company_id, created_at)")
          .eq("invoices.company_id", companyId).gte("invoices.created_at", startIso).lte("invoices.created_at", endIso),
      ]);
      if (invRes.error) throw invRes.error;
      if (expRes.error) throw expRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const invoices = invRes.data || [];
      const expenses = expRes.data || [];
      const items = itemsRes.data || [];

      const caTotal = invoices.reduce((s, i) => s + Number(i.total), 0);
      const facturesCount = invoices.length;
      const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
      const tauxRecouvrement = caTotal > 0 ? Math.round((totalPaid / caTotal) * 100) : 0;
      const depensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

      const catLabels = { transport:"Transport", fournitures:"Fournitures", telecom:"Telecom",
        restauration:"Restauration", loyer:"Loyer", salaires:"Salaires", marketing:"Marketing",
        services_pro:"Services pro.", autre:"Autre", Service:"Service", Produit:"Produit", Abonnement:"Abonnement" };
      const catMap = {};
      items.forEach((it) => {
        const raw = (it.products && it.products.category) ? it.products.category : "Sans categorie";
        const label = catLabels[raw] || raw;
        catMap[label] = (catMap[label] || 0) + Number(it.line_total);
      });
      const categoryData = Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const now2 = new Date();
      const monthsAgo = new Date(now2.getFullYear(), now2.getMonth() - 5, 1);
      const { data: trendInvoices, error: trendErr } = await supabase
        .from("invoices").select("total, created_at")
        .eq("company_id", companyId).gte("created_at", monthsAgo.toISOString());
      if (trendErr) throw trendErr;

      const months = [];
      for (let i = 5; i >= 0; i--) months.push(new Date(now2.getFullYear(), now2.getMonth() - i, 1));
      const evolutionData = months.map((d) => {
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const total = (trendInvoices || []).filter((inv) => {
          const cd = new Date(inv.created_at);
          return cd >= d && cd < next;
        }).reduce((s, inv) => s + Number(inv.total), 0);
        return { mois: d.toLocaleDateString("fr-FR", { month: "short" }), ca: total / 1000000 };
      });

      return { caTotal, facturesCount, tauxRecouvrement, depensesTotal, categoryData, evolutionData };
    },
    enabled: !!company?.company_id,
  });
}