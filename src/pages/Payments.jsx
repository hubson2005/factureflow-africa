import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Trash2, X, Loader2, AlertCircle, Wallet,
  Banknote, Landmark, CreditCard, Smartphone, MoreHorizontal,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

const METHOD_META = {
  especes: { label: 'Espèces', icon: Banknote, color: '#22c55e' },
  virement: { label: 'Virement', icon: Landmark, color: '#3b82f6' },
  carte: { label: 'Carte', icon: CreditCard, color: '#a78bfa' },
  mobile_money: { label: 'Mobile Money', icon: Smartphone, color: '#f97316' },
  autre: { label: 'Autre', icon: MoreHorizontal, color: '#8b93a7' },
};
const METHOD_ORDER = ['especes', 'virement', 'carte', 'mobile_money', 'autre'];

export default function Payments() {
  const { company, role } = useAuth();
  const canCreate = role === 'admin' || role === 'manager' || role === 'comptable';
  const canManage = role === 'admin' || role === 'manager';

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('toutes');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    const [paymentsRes, invoicesRes] = await Promise.all([
      supabase
        .from('payments')
        .select('*, invoices(invoice_number, client_id, clients(name))')
        .eq('company_id', company.id)
        .order('payment_date', { ascending: false }),
      supabase
        .from('invoices')
        .select('id, invoice_number, total, amount_due, clients(name)')
        .eq('company_id', company.id)
        .gt('amount_due', 0)
        .order('created_at', { ascending: false }),
    ]);

    setPayments(paymentsRes.data || []);
    setInvoices(invoicesRes.data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchMethod = methodFilter === 'toutes' || p.method === methodFilter;
      const matchSearch = !search.trim() ||
        (p.invoices?.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.invoices?.clients?.name || '').toLowerCase().includes(search.toLowerCase());
      return matchMethod && matchSearch;
    });
  }, [payments, search, methodFilter]);

  const totalReceived = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount), 0), [payments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('payments').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadData();
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Paiements</h1>
          <p style={styles.subtitle}>
            {payments.length} paiement{payments.length !== 1 ? 's' : ''} · {totalReceived.toLocaleString('fr-FR')} {company?.currency} reçus au total
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)} style={styles.addBtn}>
            <Plus size={16} /> Enregistrer un paiement
          </button>
        )}
      </div>

      <div style={styles.filtersRow}>
        <div style={styles.searchBar}>
          <Search size={16} color="#8b93a7" />
          <input
            type="text"
            placeholder="Rechercher par facture ou client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} style={styles.categorySelect}>
          <option value="toutes">Toutes les méthodes</option>
          {METHOD_ORDER.map((m) => <option key={m} value={m}>{METHOD_META[m].label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={styles.loadingBox}><Loader2 size={20} className="animate-spin" color="#22c55e" /></div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <Wallet size={32} color="#3a4358" />
          <p style={styles.emptyText}>Aucun paiement enregistré.</p>
        </div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeaderRow}>
            <span style={{ flex: 1.2 }}>Facture</span>
            <span style={{ flex: 1.3 }}>Client</span>
            <span style={{ flex: 1 }}>Montant</span>
            <span style={{ flex: 1.2 }}>Méthode</span>
            <span style={{ flex: 1 }}>Date</span>
            {canManage && <span style={{ flex: 0.6, textAlign: 'right' }}>Actions</span>}
          </div>
          {filtered.map((p) => {
            const meta = METHOD_META[p.method] || METHOD_META.autre;
            const Icon = meta.icon;
            return (
              <div key={p.id} style={styles.tableRow}>
                <span style={{ flex: 1.2, color: '#fff', fontWeight: 600, fontSize: 13.5 }}>{p.invoices?.invoice_number || '—'}</span>
                <span style={{ flex: 1.3, color: '#aab2c5', fontSize: 13.5 }}>{p.invoices?.clients?.name || '—'}</span>
                <span style={{ flex: 1, color: '#4ade80', fontWeight: 700, fontSize: 13.5 }}>+{Number(p.amount).toLocaleString('fr-FR')} {company?.currency}</span>
                <span style={{ flex: 1.2, display: 'flex', alignItems: 'center', gap: 6, color: meta.color, fontSize: 13 }}>
                  <Icon size={14} /> {meta.label}
                </span>
                <span style={{ flex: 1, color: '#8b93a7', fontSize: 13 }}>{new Date(p.payment_date).toLocaleDateString('fr-FR')}</span>
                {canManage && (
                  <div style={{ flex: 0.6, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setDeleteTarget(p)} style={{ ...styles.iconBtn, color: '#f87171' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <PaymentModal
          companyId={company.id}
          currency={company.currency}
          invoices={invoices}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadData(); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          amount={`${Number(deleteTarget.amount).toLocaleString('fr-FR')} ${company?.currency}`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}

function PaymentModal({ companyId, currency, invoices, onClose, onSaved }) {
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('especes');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!invoiceId) { setError('Sélectionnez une facture.'); return; }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) { setError('Montant invalide.'); return; }
    if (selectedInvoice && amountNum > Number(selectedInvoice.amount_due)) {
      setError(`Le montant dépasse le reste à payer (${Number(selectedInvoice.amount_due).toLocaleString('fr-FR')} ${currency}).`);
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('payments').insert({
      company_id: companyId,
      invoice_id: invoiceId,
      amount: amountNum,
      method,
      payment_date: paymentDate,
      notes: notes || null,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Enregistrer un paiement</h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <Field label="Facture *">
            <select required value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} style={styles.input}>
              <option value="">Sélectionner une facture impayée…</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {inv.clients?.name} (reste {Number(inv.amount_due).toLocaleString('fr-FR')} {currency})
                </option>
              ))}
            </select>
            {invoices.length === 0 && (
              <span style={styles.hint}>Aucune facture avec un solde restant à payer.</span>
            )}
          </Field>

          <div style={styles.row}>
            <Field label="Montant *">
              <input
                type="number" required min="0" step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
              />
            </Field>
            <Field label="Date">
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={styles.input} />
            </Field>
          </div>

          <Field label="Méthode de paiement">
            <div style={styles.methodGrid}>
              {METHOD_ORDER.map((m) => {
                const meta = METHOD_META[m];
                const Icon = meta.icon;
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    style={{
                      ...styles.methodBtn,
                      borderColor: active ? meta.color : '#1f2940',
                      background: active ? `${meta.color}1a` : '#0a0e1a',
                      color: active ? meta.color : '#aab2c5',
                    }}
                  >
                    <Icon size={15} /> {meta.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Notes">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} style={styles.input} placeholder="Référence, remarque…" />
          </Field>

          {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

          <button type="submit" disabled={saving} style={styles.submitBtn}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer le paiement'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ amount, onCancel, onConfirm }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Supprimer ce paiement ?</h3>
        <p style={styles.confirmText}>
          Voulez-vous vraiment supprimer ce paiement de <strong>{amount}</strong> ? Le solde de la facture sera recalculé automatiquement.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} style={styles.cancelBtn}>Annuler</button>
          <button onClick={onConfirm} style={styles.dangerBtn}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.fieldWrapper}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  title: { color: '#fff', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: '#8b93a7', fontSize: 14, marginTop: 6 },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: '#22c55e', color: '#06150c', fontWeight: 700,
    border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 14, cursor: 'pointer',
  },
  filtersRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  searchBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 12,
    padding: '11px 16px', maxWidth: 380, flex: 1, minWidth: 240,
  },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14 },
  categorySelect: {
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 12,
    padding: '11px 14px', color: '#fff', fontSize: 13.5, outline: 'none',
  },
  loadingBox: { display: 'flex', justifyContent: 'center', padding: 60 },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    padding: '60px 0', background: '#11172a', border: '1px dashed #1f2940', borderRadius: 16,
  },
  emptyText: { color: '#8b93a7', fontSize: 14 },
  table: { background: '#11172a', border: '1px solid #1f2940', borderRadius: 14, overflow: 'hidden' },
  tableHeaderRow: {
    display: 'flex', padding: '12px 18px', borderBottom: '1px solid #1f2940',
    color: '#5f6878', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  tableRow: { display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #1f2940' },
  iconBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
  },
  modal: {
    width: '100%', maxWidth: 460, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 24, maxHeight: '90vh', overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#8b93a7', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  fieldLabel: { fontSize: 12.5, color: '#aab2c5' },
  hint: { color: '#f97316', fontSize: 11.5, marginTop: 4 },
  input: {
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 10,
    padding: '10px 13px', color: '#fff', fontSize: 13.5, outline: 'none',
  },
  methodGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  methodBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    border: '1px solid', borderRadius: 10, padding: '10px 6px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  },
  submitBtn: {
    background: '#22c55e', color: '#06150c', fontWeight: 700, border: 'none',
    borderRadius: 10, padding: '12px 0', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: 10, padding: '9px 13px', fontSize: 12.5,
  },
  confirmText: { color: '#aab2c5', fontSize: 13.5, lineHeight: 1.6 },
  cancelBtn: {
    flex: 1, background: 'transparent', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 10, padding: '11px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
  },
  dangerBtn: {
    flex: 1, background: '#ef4444', border: 'none', color: '#fff',
    borderRadius: 10, padding: '11px 0', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
  },
};