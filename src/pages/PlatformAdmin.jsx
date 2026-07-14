import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, ShieldAlert, Building2, Users, TrendingUp,
  PauseCircle, PlayCircle, LogOut, Search,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useIsPlatformAdmin } from '../hooks/useIsPlatformAdmin';
import { supabase } from '../supabase';

const PLAN_LABELS = { free: 'Gratuit', starter: 'Starter', pro: 'Pro', business: 'Business' };
const STATUS_META = {
  active: { label: 'Actif', color: '#22c55e' },
  trial: { label: 'Essai', color: '#3b82f6' },
  suspended: { label: 'Suspendu', color: '#ef4444' },
};

export default function PlatformAdmin() {
  const { signOut } = useAuth();
  const { isPlatformAdmin, loading: checkingAccess } = useIsPlatformAdmin();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [actionError, setActionError] = useState('');

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [metricsRes, companiesRes] = await Promise.all([
      supabase.from('platform_metrics').select('*').single(),
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
    ]);
    setMetrics(metricsRes.data);
    setCompanies(companiesRes.data || []);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (isPlatformAdmin) loadData();
  }, [isPlatformAdmin, loadData]);

  const handleSuspend = async (company) => {
    setActionError('');
    const newStatus = company.subscription_status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_status: newStatus,
        suspended_at: newStatus === 'suspended' ? new Date().toISOString() : null,
      })
      .eq('id', company.id);

    if (error) {
      setActionError(error.message);
      return;
    }

    await supabase.from('subscription_events').insert({
      company_id: company.id,
      event_type: newStatus === 'suspended' ? 'suspended' : 'reactivated',
      notes: `Changement effectué depuis le dashboard super admin`,
    });

    loadData();
  };

  const handlePlanChange = async (company, newPlan) => {
    setActionError('');
    const { error } = await supabase
      .from('companies')
      .update({ subscription_plan: newPlan })
      .eq('id', company.id);

    if (error) {
      setActionError(error.message);
      return;
    }

    await supabase.from('subscription_events').insert({
      company_id: company.id,
      event_type: 'plan_changed',
      old_plan: company.subscription_plan,
      new_plan: newPlan,
      notes: 'Changement effectué depuis le dashboard super admin',
    });

    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const filteredCompanies = companies.filter((c) =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (checkingAccess) {
    return (
      <div style={styles.page}>
        <Loader2 size={22} className="animate-spin" color="#22c55e" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div style={styles.page}>
        <div style={styles.deniedBox}>
          <ShieldAlert size={32} color="#ef4444" />
          <h2 style={styles.deniedTitle}>Accès refusé</h2>
          <p style={styles.deniedText}>Cette section est réservée aux administrateurs de la plateforme.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>F</div>
          <span style={styles.headerTitle}>FactureFlow <span style={{ color: '#8b93a7' }}>Admin</span></span>
        </div>
        <button onClick={handleSignOut} style={styles.signOutBtn}>
          <LogOut size={14} /> Déconnexion
        </button>
      </header>

      <main style={styles.main}>
        {loadingData ? (
          <div style={styles.loadingBox}><Loader2 size={20} className="animate-spin" color="#22c55e" /></div>
        ) : (
          <>
            <div style={styles.kpiGrid}>
              <KpiCard icon={<Building2 size={18} />} label="Entreprises" value={metrics?.total_companies ?? 0} color="#3b82f6" />
              <KpiCard icon={<TrendingUp size={18} />} label="Actives" value={metrics?.active_companies ?? 0} color="#22c55e" />
              <KpiCard icon={<PauseCircle size={18} />} label="Suspendues" value={metrics?.suspended_companies ?? 0} color="#ef4444" />
              <KpiCard icon={<Users size={18} />} label="Utilisateurs actifs" value={metrics?.active_users ?? 0} color="#a78bfa" />
              <KpiCard icon={<TrendingUp size={18} />} label="MRR" value={`${Number(metrics?.monthly_recurring_revenue ?? 0).toLocaleString('fr-FR')} FCFA`} color="#f7c948" />
            </div>

            {actionError && <div style={styles.errorBox}>{actionError}</div>}

            <div style={styles.searchBar}>
              <Search size={16} color="#8b93a7" />
              <input
                type="text"
                placeholder="Rechercher une entreprise…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.table}>
              <div style={styles.tableHeaderRow}>
                <span style={{ flex: 1.6 }}>Entreprise</span>
                <span style={{ flex: 1 }}>Plan</span>
                <span style={{ flex: 1 }}>Statut</span>
                <span style={{ flex: 1 }}>Créée le</span>
                <span style={{ flex: 1.4, textAlign: 'right' }}>Actions</span>
              </div>
              {filteredCompanies.map((c) => {
                const statusMeta = STATUS_META[c.subscription_status] || STATUS_META.trial;
                return (
                  <div key={c.id} style={styles.tableRow}>
                    <span style={{ flex: 1.6, color: '#fff', fontWeight: 600, fontSize: 13.5 }}>{c.name}</span>
                    <span style={{ flex: 1 }}>
                      <select
                        value={c.subscription_plan}
                        onChange={(e) => handlePlanChange(c, e.target.value)}
                        style={styles.planSelect}
                      >
                        {Object.entries(PLAN_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ ...styles.statusBadge, color: statusMeta.color, background: `${statusMeta.color}1a` }}>
                        {statusMeta.label}
                      </span>
                    </span>
                    <span style={{ flex: 1, color: '#8b93a7', fontSize: 12.5 }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <div style={{ flex: 1.4, display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleSuspend(c)} style={styles.actionBtn}>
                        {c.subscription_status === 'suspended' ? (
                          <><PlayCircle size={13} /> Réactiver</>
                        ) : (
                          <><PauseCircle size={13} /> Suspendre</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
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

const styles = {
  page: { minHeight: '100vh', background: '#0a0e1a', fontFamily: "'Sora','Segoe UI',sans-serif" },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px', borderBottom: '1px solid #1f2940',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 30, height: 30, borderRadius: 9, background: '#22c55e', color: '#06150c',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14,
  },
  headerTitle: { color: '#fff', fontWeight: 700, fontSize: 16 },
  signOutBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer',
  },
  main: { padding: '28px 32px' },
  loadingBox: { display: 'flex', justifyContent: 'center', padding: 60 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 },
  kpiCard: {
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 14,
    padding: 16, display: 'flex', alignItems: 'center', gap: 12,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiValue: { color: '#fff', fontSize: 17, fontWeight: 800 },
  kpiLabel: { color: '#8b93a7', fontSize: 11.5, marginTop: 2 },
  searchBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 12,
    padding: '11px 16px', marginBottom: 18, maxWidth: 380,
  },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14 },
  table: { background: '#11172a', border: '1px solid #1f2940', borderRadius: 14, overflow: 'hidden' },
  tableHeaderRow: {
    display: 'flex', padding: '12px 18px', borderBottom: '1px solid #1f2940',
    color: '#5f6878', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase',
  },
  tableRow: { display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #1f2940' },
  planSelect: {
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 8,
    padding: '5px 9px', color: '#fff', fontSize: 12.5,
  },
  statusBadge: { fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 100 },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, marginBottom: 16,
  },
  deniedBox: { textAlign: 'center', maxWidth: 360 },
  deniedTitle: { color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 14 },
  deniedText: { color: '#8b93a7', fontSize: 13.5, marginTop: 8 },
};