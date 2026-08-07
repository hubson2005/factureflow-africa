import { useMemo } from "react";
import { useInvoices } from "../invoices/useInvoices";
import { useClients } from "../clients/useClients";
import { usePayments } from "../payments/usePayments";
import { useQuotes } from "../quotes/useQuotes";

export function useDashboardData() {
  const { data: invoicesRaw, isLoading: l1 } = useInvoices();
  const { data: clientsRaw, isLoading: l2 } = useClients();
  const { data: paymentsRaw, isLoading: l3 } = usePayments();
  const { data: quotesRaw, isLoading: l4 } = useQuotes();

  const invoices = invoicesRaw || [];
  const clients = clientsRaw || [];
  const payments = paymentsRaw || [];
  const quotes = quotesRaw || [];
  const isLoading = l1 || l2 || l3 || l4;

  const data = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const invThisMonth = invoices.filter((i) => new Date(i.created_at) >= startOfMonth);
    const invLastMonth = invoices.filter((i) => {
      const d = new Date(i.created_at);
      return d >= startOfLastMonth && d < startOfMonth;
    });

    const caThisMonth = invThisMonth.reduce((s, i) => s + Number(i.total), 0);
    const caLastMonth = invLastMonth.reduce((s, i) => s + Number(i.total), 0);
    const caChange = caLastMonth > 0 ? Math.round(((caThisMonth - caLastMonth) / caLastMonth) * 100) : (caThisMonth > 0 ? 100 : 0);

    const impayes = invoices.filter((i) => i.status !== "payee");
    const totalImpaye = impayes.reduce((s, i) => s + Number(i.amount_due || 0), 0);

    const paymentsThisMonth = payments.filter((p) => new Date(p.payment_date) >= startOfMonth);
    const encaisseThisMonth = paymentsThisMonth.reduce((s, p) => s + Number(p.amount), 0);

    const months = [];
    for (let i = 5; i >= 0; i--) months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const evolutionData = months.map((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const total = invoices.filter((inv) => {
        const cd = new Date(inv.created_at);
        return cd >= d && cd < next;
      }).reduce((s, inv) => s + Number(inv.total), 0);
      return { date: d.toLocaleDateString("fr-FR", { month: "short" }), value: total / 1000000 };
    });
    const sparkValues = evolutionData.map((e) => e.value);

    const enRetard = invoices.filter((i) => i.status === "en_retard").length;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const echeancesDemain = invoices.filter((i) => {
      if (!i.due_date) return false;
      return new Date(i.due_date).toDateString() === tomorrow.toDateString();
    }).length;
    const devisEnAttente = quotes.filter((q) => q.status === "envoye").length;

    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((inv) => ({
        code: inv.invoice_number,
        clientName: inv.clients ? inv.clients.name : "Client",
        amount: Math.round(Number(inv.total)).toLocaleString("fr-FR"),
        status: inv.status,
        date: new Date(inv.created_at).toLocaleDateString("fr-FR"),
      }));

    const byClient = {};
    invoices.forEach((inv) => {
      const name = inv.clients ? inv.clients.name : "Client";
      byClient[name] = (byClient[name] || 0) + Number(inv.total);
    });
    const topClientsArr = Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total]) => ({ name, raw: total }));
    const maxClientTotal = topClientsArr.length ? topClientsArr[0].raw : 1;
    const topClients = topClientsArr.map((c) => ({
      name: c.name,
      amount: Math.round(c.raw).toLocaleString("fr-FR"),
      percent: Math.round((c.raw / maxClientTotal) * 100),
    }));

    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
      .slice(0, 5)
      .map((p) => ({
        method: p.method,
        clientName: p.invoices && p.invoices.clients ? p.invoices.clients.name : "Client",
        amount: Math.round(Number(p.amount)).toLocaleString("fr-FR"),
        date: new Date(p.payment_date).toLocaleDateString("fr-FR"),
      }));

    return {
      caThisMonth, caChange, sparkValues, evolutionData,
      facturesCount: invoices.length,
      clientsCount: clients.length,
      totalImpaye, impayesCount: impayes.length,
      encaisseThisMonth,
      enRetard, echeancesDemain, devisEnAttente,
      recentInvoices, topClients, recentPayments,
    };
  }, [invoices, clients, payments, quotes]);

  return { ...data, isLoading };
}