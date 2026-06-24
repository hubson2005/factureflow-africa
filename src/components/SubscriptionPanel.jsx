import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

const PLAN_META = {
  free: { label: 'Gratuit', color: '#8b93a7', price: '0 FCFA' },
  starter: { label: 'Starter', color: '#3b82f6', price: '2 500 FCFA/mois' },
  pro: { label: 'Pro', color: '#a78bfa', price: '5 500 FCFA/mois' },
  business: { label: 'Business', color: '#22c55e', price: '10 000 FCFA/mois' },
};

const PLAN_FEATURES = {
  free: ['10 clients', '10 factures/mois', 'Devis illimités', '1 utilisateur'],
  starter: ['Clients illimités', 'Factures illimitées', 'Devis illimités', '1 utilisateur'],
  pro: ["Tout Starter", "Jusqu'à 5 utilisateurs", 'Statistiques avancées', 'Export complet'],
  business: ['Tout Pro', 'Utilisateurs illimités', 'WhatsApp & Mobile Money', 'Automatisations'],
};

export default function SubscriptionPanel() {
  const { company } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUsage = useCallback(async () => {
    if (!company) return;
    const { data } = await supabase.rpc('get_subscription_usage', { p_company_id: company.id });
    setUsage(data?.[0] || null);
    setLoading(false);
  }, [company]);

  useEffect(() => { loadUsage(); }, [loadUsage]);

  if (loading || !usage) {
    return (
      <div style={styles.section}>
        <Loader2 size={18} className="animate-spin" color="#22c55e" />
      </div>
    );
  }

  const planMeta = PLAN_META[usage.plan] || PLAN_META.free;
  const isTrial = usage.status === 'trial';

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}><Crown size={17} /> Abonnement</div>

      <div style={styles.currentPlanBox}>
        <div>
          <div style={styles.currentPlanLabel}>Plan actuel</div>
          <div style={{ ...styles.currentPlanName, color: planMeta.color }}>{planMeta.label}</div>
        </div>
        <div style={styles.currentPlanPrice}>{planMeta.price}</div>
      </div>

      {isTrial && usage.trial_ends_at && (
        <div style={styles.trialBanner}>
          <AlertTriangle size={14} />
          Période d'essai active jusqu'au {new Date(usage.trial_ends_at).toLocaleDateString('fr-FR')}
        </div>
      )}

      {usage.plan === 'free' && (
        <div style={styles.usageGrid}>
          <UsageBar label="Clients" current={usage.clients_count} limit={usage.clients_limit} />
          <UsageBar label="Factures ce mois" current={usage.invoices_this_month} limit={usage.invoices_limit} />
        </div>
      )}

      <div style={styles.plansGrid}>
        {Object.entries(PLAN_META).map(([key, meta]) => (
          <div key={key} style={{ ...styles.planCard, borderColor: key === usage.plan ? meta.color : '#1f2940' }}>
            <div style={{ ...styles.planCardName, color: meta.color }}>{meta.label}</div>
            <div style={styles.planCardPrice}>{meta.price}</div>
            <ul style={styles.planCardFeatures}>
              {PLAN_FEATURES[key].map((f) => (
                <li key={f} style={styles.planCardFeature}><CheckCircle2 size={11} color={meta.color} /> {f}</li>
              ))}
            </ul>
            {key === usage.plan ? (
              <div style={styles.currentBadge}>Plan actuel</div>
            ) : (
              <button style={{ ...styles.chooseBtn, borderColor: meta.color, color: meta.color }}>
                Choisir {meta.label}
              </button>
            )}
          </div>
        ))}
      </div>

      <p style={styles.upgradeNote}>
        Le paiement Mobile Money pour le changement de plan sera disponible prochainement.
        Contactez le support pour activer un plan supérieur dès maintenant.
      </p>
    </div>
  );
}

function UsageBar({ label, current, limit }) {
  const pct = limit ? Math.min(100, (current / limit) * 100) : 0;
  const isNearLimit = pct >= 80;

  return (
    <div style={styles.usageBarWrapper}>
      <div style={styles.usageBarHeader}>
        <span style={styles.usageBarLabel}>{label}</span>
        <span style={styles.usageBarCount}>{current} / {limit}</span>
      </div>
      <div style={styles.usageBarTrack}>
        <div style={{
          ...styles.usageBarFill,
          width: `${pct}%`,
          background: isNearLimit ? '#f97316' : '#22c55e',
        }} />
      </div>
    </div>
  );
}

const styles = {
  section: {
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 16, padding: 24,
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 18,
  },
  currentPlanBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 12, padding: '16px 20px', marginBottom: 16,
  },
  currentPlanLabel: { color: '#8b93a7', fontSize: 12 },
  currentPlanName: { fontSize: 20, fontWeight: 800, marginTop: 2 },
  currentPlanPrice: { color: '#aab2c5', fontSize: 14, fontWeight: 600 },
  trialBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c',
    borderRadius: 10, padding: '10px 14px', fontSize: 12.5, marginBottom: 16,
  },
  usageGrid: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 },
  usageBarWrapper: { display: 'flex', flexDirection: 'column', gap: 6 },
  usageBarHeader: { display: 'flex', justifyContent: 'space-between' },
  usageBarLabel: { color: '#aab2c5', fontSize: 12.5 },
  usageBarCount: { color: '#fff', fontSize: 12.5, fontWeight: 600 },
  usageBarTrack: { height: 6, background: '#1f2940', borderRadius: 100, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 100, transition: 'width 0.3s' },
  plansGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16,
  },
  planCard: {
    border: '1.5px solid', borderRadius: 12, padding: 16, background: '#0a0e1a',
    display: 'flex', flexDirection: 'column',
  },
  planCardName: { fontSize: 15, fontWeight: 800 },
  planCardPrice: { color: '#8b93a7', fontSize: 12, marginTop: 2, marginBottom: 12 },
  planCardFeatures: { listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  planCardFeature: { display: 'flex', alignItems: 'center', gap: 6, color: '#aab2c5', fontSize: 11.5 },
  currentBadge: {
    marginTop: 14, textAlign: 'center', color: '#5f6878', fontSize: 11.5, fontWeight: 600,
    border: '1px solid #1f2940', borderRadius: 8, padding: '7px 0',
  },
  chooseBtn: {
    marginTop: 14, background: 'transparent', border: '1.5px solid', borderRadius: 8,
    padding: '8px 0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  },
  upgradeNote: { color: '#5f6878', fontSize: 11.5, lineHeight: 1.6, margin: 0 },
};

