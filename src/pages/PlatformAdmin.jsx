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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

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

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Revient a la page 1 quand la recherche change le nombre de resultats, pour
  // eviter de rester bloque sur une page devenue vide.
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Si des entreprises sont chargees/rechargees et que la page courante depasse
  // desormais le nombre total de pages (ex: apres une suspension qui ne change pas
  // le compte, mais par prudence), on recale sur la derniere page valide.
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

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
      <style>{`
        /* Seuil dedie a cette page admin (640px) : le tableau devient une liste de
           cartes empilees sur mobile/petit ecran, au lieu d'un tableau a 5 colonnes
           fixes qui deborderait ou s'ecraserait illisible en dessous de cette largeur.
           Flexbox + media queries standards, compatible identiquement sur Chrome,
           Firefox, Safari et Edge. */
        .ff-admin-header { flex-wrap: wrap; padding: 14px 16px; }
        .ff-admin-main { padding: 18px 16px; }
        .ff-admin-table-header { display: none; }
        .ff-admin-row { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-bottom: 1px solid #1f2940; }
        .ff-admin-cell { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .ff-admin-cell-actions { justify-content: flex-end; }
        .ff-admin-label { display: inline-block; font-size: 11px; color: #5f6878; text-transform: uppercase; font-weight: 700; }
        .ff-admin-signout-text { display: none; }

        @media (min-width: 480px) {
          .ff-admin-signout-text { display: inline; }
        }

        @media (min-width: 640px) {
          .ff-admin-header { padding: 16px 32px; flex-wrap: nowrap; }
          .ff-admin-main { padding: 28px 32px; }
          .ff-admin-table-header { display: flex; }
          .ff-admin-row { flex-direction: row; align-items: center; padding: 14px 18px; gap: 0; }
          .ff-admin-cell { display: block; }
          .ff-admin-label { display: none; }
          .ff-admin-cell-name { flex: 1.6; }
          .ff-admin-cell-plan { flex: 1; }
          .ff-admin-cell-status { flex: 1; }
          .ff-admin-cell-date { flex: 1; }
          .ff-admin-cell-actions { flex: 1.4; }
        }
      `}</style>

      <header className="ff-admin-header" style={styles.header}>
        <div style={styles.headerLeft}>
          <img src="/icon-192.png" alt="FactureFlow Africa" style={styles.logoBadge} />
          <span style={styles.headerTitle}>FactureFlow <span style={{ color: '#8b93a7' }}>Admin</span></span>
        </div>
        <button onClick={handleSignOut} style={styles.signOutBtn}>
          <LogOut size={14} /> <span className="ff-admin-signout-text">Déconnexion</span>
        </button>
      </header>

      <main className="ff-admin-main" style={styles.main}>
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
              <div className="ff-admin-table-header" style={styles.tableHeaderRow}>
                <span style={{ flex: 1.6 }}>Entreprise</span>
                <span style={{ flex: 1 }}>Plan</span>
                <span style={{ flex: 1 }}>Statut</span>
                <span style={{ flex: 1 }}>Créée le</span>
                <span style={{ flex: 1.4, textAlign: 'right' }}>Actions</span>
              </div>
              {paginatedCompanies.map((c) => {
                const statusMeta = STATUS_META[c.subscription_status] || STATUS_META.trial;
                return (
                  <div key={c.id} className="ff-admin-row">
                    <div className="ff-admin-cell ff-admin-cell-name" style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
                      {c.name}
                    </div>

                    <div className="ff-admin-cell ff-admin-cell-plan">
                      <span className="ff-admin-label">Plan</span>
                      <select
                        value={c.subscription_plan}
                        onChange={(e) => handlePlanChange(c, e.target.value)}
                        style={styles.planSelect}
                      >
                        {Object.entries(PLAN_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                    </div>

                    <div className="ff-admin-cell ff-admin-cell-status">
                      <span className="ff-admin-label">Statut</span>
                      <span style={{ ...styles.statusBadge, color: statusMeta.color, background: `${statusMeta.color}1a` }}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="ff-admin-cell ff-admin-cell-date">
                      <span className="ff-admin-label">Créée le</span>
                      <span style={{ color: '#8b93a7', fontSize: 12.5 }}>
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div className="ff-admin-cell ff-admin-cell-actions">
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

            {filteredCompanies.length > PAGE_SIZE && (
              <div style={styles.pagination}>
                <span style={styles.paginationInfo}>
                  {(currentPage - 1) * PAGE_SIZE + 1}
                  {"\u2013"}
                  {Math.min(currentPage * PAGE_SIZE, filteredCompanies.length)}
                  {" sur "}
                  {filteredCompanies.length}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Précédent
                  </button>
                  <span style={styles.pageIndicator}>Page {currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
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
    gap: 12, borderBottom: '1px solid #1f2940',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  logoBadge: {
    width: 30, height: 30, borderRadius: 9, objectFit: 'cover', flexShrink: 0,
  },
  headerTitle: { color: '#fff', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' },
  signOutBtn: {
    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
    background: 'none', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer',
  },
  main: {},
  loadingBox: { display: 'flex', justifyContent: 'center', padding: 60 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 },
  kpiCard: {
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 14,
    padding: 16, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiValue: { color: '#fff', fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap' },
  kpiLabel: { color: '#8b93a7', fontSize: 11.5, marginTop: 2 },
  searchBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 12,
    padding: '11px 16px', marginBottom: 18, maxWidth: 380, boxSizing: 'border-box',
  },
  searchInput: { flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14 },
  table: { background: '#11172a', border: '1px solid #1f2940', borderRadius: 14, overflow: 'hidden' },
  tableHeaderRow: {
    padding: '12px 18px', borderBottom: '1px solid #1f2940',
    color: '#5f6878', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase',
  },
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
  pagination: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 12, marginTop: 16,
  },
  paginationInfo: { color: '#8b93a7', fontSize: 12.5 },
  pageBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: '7px 14px', fontSize: 12.5,
  },
  pageIndicator: { color: '#fff', fontSize: 12.5, fontWeight: 600, padding: '0 4px', display: 'flex', alignItems: 'center' },
  deniedBox: { textAlign: 'center', maxWidth: 360 },
  deniedTitle: { color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 14 },
  deniedText: { color: '#8b93a7', fontSize: 13.5, marginTop: 8 },
};