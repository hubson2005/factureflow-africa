import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Receipt, Users, Loader2,
  CheckCircle2, Clock, Send,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

export default function Dashboard() {
  const { company, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenueMonth: 0,
    revenueYear: 0,
    invoicesIssued: 0,
    invoicesPaid: 0,
    invoicesUnpaid: 0,
    quotesSent: 0,
    quotesAccepted: 0,
    totalClients: 0,
  });
  const [salesChart, setSalesChart] = useState([]);
  const [paymentsChart, setPaymentsChart] = useState([]);

  const loadDashboard = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const [
      invoicesRes,
      quotesRes,
      clientsCountRes,
      paymentsRes,
    ] = await Promise.all([
      supabase.from('invoices').select('total, status, created_at').eq('company_id', company.id),
      supabase.from('quotes').select('status, created_at').eq('company_id', company.id),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
      supabase.from('payments').select('amount, payment_date').eq('company_id', company.id).gte('payment_date', sixMonthsAgo),
    ]);

    const invoices = invoicesRes.data || [];
    const quotes = quotesRes.data || [];
    const payments = paymentsRes.data || [];

    const revenueMonth = invoices
      .filter((inv) => inv.created_at >= startOfMonth && inv.status === 'payee')
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    const revenueYear = invoices
      .filter((inv) => inv.created_at >= startOfYear && inv.status === 'payee')
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    const invoicesPaid = invoices.filter((inv) => inv.status === 'payee').length;
    const invoicesUnpaid = invoices.filter((inv) => ['envoyee', 'partiellement_payee', 'en_retard'].includes(inv.status)).length;
    const quotesSent = quotes.filter((q) => q.status === 'envoye').length;
    const quotesAccepted = quotes.filter((q) => q.status === 'accepte').length;

    const monthBuckets = buildLastSixMonths();
    invoices.forEach((inv) => {
      const key = monthKey(inv.created_at);
      if (monthBuckets[key]) monthBuckets[key].ventes += Number(inv.total);
    });

    payments.forEach((p) => {
      const key = monthKey(p.payment_date);
      if (monthBuckets[key]) monthBuckets[key].paiements += Number(p.amount);
    });

    const chartData = Object.values(monthBuckets);

    setStats({
      revenueMonth,
      revenueYear,
      invoicesIssued: invoices.length,
      invoicesPaid,
      invoicesUnpaid,
      quotesSent,
      quotesAccepted,
      totalClients: clientsCountRes.count || 0,
    });
    setSalesChart(chartData.map((m) => ({ month: m.label, ventes: Math.round(m.ventes) })));
    setPaymentsChart(chartData.map((m) => ({ month: m.label, paiements: Math.round(m.paiements) })));
    setLoading(false);
  }, [company]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingBox}><Loader2 size={20} className="animate-spin" color="#22c55e" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Bonjour{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''} 👋</h1>
        <p style={styles.subtitle}>Voici un aperçu de l'activité de {company?.name}</p>
      </div>

      <div style={styles.kpiGrid}>
        <KpiCard icon={<TrendingUp size={18} />} label="CA du mois" value={`${stats.revenueMonth.toLocaleString('fr-FR')} ${company?.currency}`} color="#22c55e" />
        <KpiCard icon={<TrendingUp size={18} />} label="CA annuel" value={`${stats.revenueYear.toLocaleString('fr-FR')} ${company?.currency}`} color="#3b82f6" />
        <KpiCard icon={<Receipt size={18} />} label="Factures émises" value={stats.invoicesIssued} color="#a78bfa" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Factures payées" value={stats.invoicesPaid} color="#22c55e" />
        <KpiCard icon={<Clock size={18} />} label="Factures impayées" value={stats.invoicesUnpaid} color="#f97316" />
        <KpiCard icon={<Send size={18} />} label="Devis envoyés" value={stats.quotesSent} color="#3b82f6" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Devis acceptés" value={stats.quotesAccepted} color="#22c55e" />
        <KpiCard icon={<Users size={18} />} label="Total clients" value={stats.totalClients} color="#f7c948" />
      </div>

      <div style={styles.chartsGrid}>
        <ChartCard title="Évolution des ventes (6 derniers mois)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2940" />
              <XAxis dataKey="month" stroke="#8b93a7" fontSize={12} />
              <YAxis stroke="#8b93a7" fontSize={12} />
              <Tooltip contentStyle={{ background: '#11172a', border: '1px solid #1f2940', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="ventes" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Paiements mensuels reçus">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={paymentsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2940" />
              <XAxis dataKey="month" stroke="#8b93a7" fontSize={12} />
              <YAxis stroke="#8b93a7" fontSize={12} />
              <Tooltip contentStyle={{ background: '#11172a', border: '1px solid #1f2940', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="paiements" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </Layout>
  );
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiIcon, color, background: `${color}1a` }}>{icon}</div>
      <div>
        <div style={styles.kpiValue}>{value}</div>
        <div style={styles.kpiLabel}>{label}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={styles.chartCard}>
      <div style={styles.chartTitle}>{title}</div>
      {children}
    </div>
  );
}

function buildLastSixMonths() {
  const buckets = {};
  const now = new Date();
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets[key] = { label: monthNames[d.getMonth()], ventes: 0, paiements: 0 };
  }
  return buckets;
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

const styles = {
  loadingBox: { display: 'flex', justifyContent: 'center', padding: 60 },
  header: { marginBottom: 26 },
  title: { color: '#fff', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: '#8b93a7', fontSize: 14, marginTop: 6 },
  kpiGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28,
  },
  kpiCard: {
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 14,
    padding: 18, display: 'flex', alignItems: 'center', gap: 13,
  },
  kpiIcon: {
    width: 38, height: 38, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  kpiValue: { color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.2 },
  kpiLabel: { color: '#8b93a7', fontSize: 12, marginTop: 2 },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 },
  chartCard: { background: '#11172a', border: '1px solid #1f2940', borderRadius: 16, padding: 20 },
  chartTitle: { color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 14 },
};