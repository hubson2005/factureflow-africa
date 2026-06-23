import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Loader2, Plus, X, Trash2, Copy, Check,
  AlertCircle, ShieldCheck, ShieldAlert, ShieldQuestion,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

const ROLE_LABELS = {
  admin: 'Administrateur',
  manager: 'Manager',
  comptable: 'Comptable',
};

const ROLE_ICONS = {
  admin: <ShieldCheck size={14} color="#22c55e" />,
  manager: <ShieldAlert size={14} color="#3b82f6" />,
  comptable: <ShieldQuestion size={14} color="#a78bfa" />,
};

export default function Team() {
  const { user, company } = useAuth();

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from('company_users')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('invitations')
        .select('*')
        .eq('company_id', company.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
    ]);

    setMembers(membersRes.data || []);
    setInvitations(invitesRes.data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancelInvite = async (id) => {
    await supabase.from('invitations').delete().eq('id', id);
    loadData();
  };

  const handleToggleActive = async (member) => {
    if (member.user_id === user.id) return; // ne peut pas se désactiver soi-même
    await supabase
      .from('company_users')
      .update({ is_active: !member.is_active })
      .eq('id', member.id);
    loadData();
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Équipe</h1>
          <p style={styles.subtitle}>Gérez les membres et les invitations de votre entreprise</p>
        </div>
        <button onClick={() => setShowInviteModal(true)} style={styles.inviteBtn}>
          <Plus size={16} /> Inviter un membre
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingBox}><Loader2 size={20} className="animate-spin" color="#22c55e" /></div>
      ) : (
        <>
          <Section title={`Membres (${members.length})`}>
            <Table>
              {members.map((m) => (
                <Row key={m.id}>
                  <Cell flex={2}>
                    <div style={styles.avatarSmall}>{(m.full_name || m.email || '?')[0].toUpperCase()}</div>
                    <div>
                      <div style={styles.memberName}>{m.full_name || '—'}</div>
                      <div style={styles.memberEmail}>{m.email}</div>
                    </div>
                  </Cell>
                  <Cell flex={1}>
                    <span style={styles.roleBadge}>{ROLE_ICONS[m.role]} {ROLE_LABELS[m.role] || m.role}</span>
                  </Cell>
                  <Cell flex={1}>
                    <span style={{ ...styles.statusBadge, ...(m.is_active ? styles.statusActive : styles.statusInactive) }}>
                      {m.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </Cell>
                  <Cell flex={1} align="right">
                    {m.user_id !== user.id && m.role !== 'admin' && (
                      <button onClick={() => handleToggleActive(m)} style={styles.linkAction}>
                        {m.is_active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    )}
                  </Cell>
                </Row>
              ))}
            </Table>
          </Section>

          {invitations.length > 0 && (
            <Section title={`Invitations en attente (${invitations.length})`}>
              <Table>
                {invitations.map((inv) => (
                  <Row key={inv.id}>
                    <Cell flex={2}>
                      <Mail size={14} color="#8b93a7" />
                      <span style={styles.memberEmail}>{inv.email}</span>
                    </Cell>
                    <Cell flex={1}>
                      <span style={styles.roleBadge}>{ROLE_ICONS[inv.role]} {ROLE_LABELS[inv.role]}</span>
                    </Cell>
                    <Cell flex={1}>
                      <InviteLinkCopy token={inv.token} />
                    </Cell>
                    <Cell flex={1} align="right">
                      <button onClick={() => handleCancelInvite(inv.id)} style={styles.deleteAction}>
                        <Trash2 size={14} />
                      </button>
                    </Cell>
                  </Row>
                ))}
              </Table>
            </Section>
          )}
        </>
      )}

      {showInviteModal && (
        <InviteModal
          companyId={company.id}
          invitedBy={user.id}
          onClose={() => setShowInviteModal(false)}
          onCreated={() => { setShowInviteModal(false); loadData(); }}
        />
      )}
    </Layout>
  );
}

function InviteLinkCopy({ token }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/join/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} style={styles.copyBtn}>
      {copied ? <><Check size={13} color="#22c55e" /> Copié</> : <><Copy size={13} /> Copier le lien</>}
    </button>
  );
}

function InviteModal({ companyId, invitedBy, onClose, onCreated }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdToken, setCreatedToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: insertError } = await supabase
      .from('invitations')
      .insert({ company_id: companyId, email, role, invited_by: invitedBy })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message.includes('déjà membre') ? insertError.message : "Erreur lors de la création de l'invitation.");
      return;
    }

    setCreatedToken(data.token);
  };

  const link = createdToken ? `${window.location.origin}/join/${createdToken}` : '';

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Inviter un membre</h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        {!createdToken ? (
          <form onSubmit={handleSubmit} style={styles.modalForm}>
            <label style={styles.fieldWrapper}>
              <span style={styles.fieldLabel}>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@exemple.com"
                style={styles.input}
              />
            </label>

            <label style={styles.fieldWrapper}>
              <span style={styles.fieldLabel}>Rôle</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                <option value="manager">Manager — gère clients, devis, factures, paiements</option>
                <option value="comptable">Comptable — consulte et enregistre les paiements</option>
              </select>
            </label>

            {error && (
              <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>
            )}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Générer le lien d'invitation"}
            </button>
          </form>
        ) : (
          <div style={styles.modalForm}>
            <p style={styles.successText}>
              Invitation créée pour <strong>{email}</strong>. Partagez ce lien (WhatsApp, email…) :
            </p>
            <div style={styles.linkBox}>
              <span style={styles.linkText}>{link}</span>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(link); }}
              style={styles.submitBtn}
            >
              <Copy size={15} /> Copier le lien
            </button>
            <button onClick={onCreated} style={styles.doneBtn}>Terminé</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Table({ children }) {
  return <div style={styles.table}>{children}</div>;
}

function Row({ children }) {
  return <div style={styles.tableRow}>{children}</div>;
}

function Cell({ children, flex = 1, align = 'left' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {children}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { color: '#fff', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: '#8b93a7', fontSize: 14, marginTop: 6 },
  inviteBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: '#22c55e', color: '#06150c', fontWeight: 700,
    border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 14, cursor: 'pointer',
  },
  loadingBox: { display: 'flex', justifyContent: 'center', padding: 60 },
  section: { marginBottom: 28 },
  sectionTitle: { color: '#aab2c5', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 },
  table: { background: '#11172a', border: '1px solid #1f2940', borderRadius: 14, overflow: 'hidden' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #1f2940', gap: 8 },
  avatarSmall: {
    width: 30, height: 30, borderRadius: '50%', background: '#1f2940', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  memberName: { color: '#fff', fontSize: 13.5, fontWeight: 600 },
  memberEmail: { color: '#8b93a7', fontSize: 12.5 },
  roleBadge: { display: 'flex', alignItems: 'center', gap: 6, color: '#aab2c5', fontSize: 13 },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 100 },
  statusActive: { background: 'rgba(34,197,94,0.12)', color: '#4ade80' },
  statusInactive: { background: 'rgba(239,68,68,0.1)', color: '#f87171' },
  linkAction: { background: 'none', border: 'none', color: '#22c55e', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  deleteAction: { background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 },
  copyBtn: { display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #1f2940', color: '#aab2c5', fontSize: 12, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    width: '100%', maxWidth: 420, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 24,
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#8b93a7', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 13, color: '#aab2c5' },
  input: {
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 10,
    padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none',
  },
  submitBtn: {
    background: '#22c55e', color: '#06150c', fontWeight: 700, border: 'none',
    borderRadius: 10, padding: '12px 0', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  doneBtn: {
    background: 'transparent', color: '#aab2c5', fontWeight: 600, border: '1px solid #1f2940',
    borderRadius: 10, padding: '12px 0', fontSize: 14, cursor: 'pointer',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: 10, padding: '9px 13px', fontSize: 12.5,
  },
  successText: { color: '#aab2c5', fontSize: 13.5, lineHeight: 1.6 },
  linkBox: {
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 10,
    padding: '12px 14px', wordBreak: 'break-all',
  },
  linkText: { color: '#22c55e', fontSize: 12.5, fontFamily: 'monospace' },
};
