import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Pencil, Trash2, X, Loader2, AlertCircle,
  Mail, Phone, MapPin, Hash, FileText, Users, CheckCircle2,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import { validateIvorianTaxNumber } from '../utils/taxValidation';

const PAGE_SIZE = 10;

export default function Clients() {
  const { company, role } = useAuth();
  const canEdit = role === 'admin' || role === 'manager';

  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', client? }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadClients = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (!error) {
      setClients(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [company, search, page]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('clients').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadClients();
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Clients</h1>
          <p style={styles.subtitle}>{totalCount} client{totalCount !== 1 ? 's' : ''} au total</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({ mode: 'create' })} style={styles.addBtn}>
            <Plus size={16} /> Nouveau client
          </button>
        )}
      </div>

      <div style={styles.searchBar}>
        <Search size={16} color="#8b93a7" />
        <input
          type="text"
          placeholder="Rechercher par nom, entreprise, email ou téléphone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {loading ? (
        <div style={styles.loadingBox}><Loader2 size={20} className="animate-spin" color="#22c55e" /></div>
      ) : clients.length === 0 ? (
        <EmptyState canEdit={canEdit} onCreate={() => setModal({ mode: 'create' })} />
      ) : (
        <>
          <div style={styles.table}>
            <div style={styles.tableHeaderRow}>
              <span style={{ flex: 2 }}>Nom</span>
              <span style={{ flex: 1.5 }}>Contact</span>
              <span style={{ flex: 1.5 }}>Adresse</span>
              {canEdit && <span style={{ flex: 0.6, textAlign: 'right' }}>Actions</span>}
            </div>
            {clients.map((c) => (
              <div key={c.id} style={styles.tableRow}>
                <div style={{ flex: 2 }}>
                  <div style={styles.clientName}>{c.name}</div>
                  {c.company_name && <div style={styles.clientCompany}>{c.company_name}</div>}
                </div>
                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {c.email && <span style={styles.contactLine}><Mail size={12} /> {c.email}</span>}
                  {c.phone && <span style={styles.contactLine}><Phone size={12} /> {c.phone}</span>}
                </div>
                <div style={{ flex: 1.5 }}>
                  <span style={styles.addressText}>{c.address || '—'}</span>
                </div>
                {canEdit && (
                  <div style={{ flex: 0.6, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button onClick={() => setModal({ mode: 'edit', client: c })} style={styles.iconBtn}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} style={{ ...styles.iconBtn, color: '#f87171' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                style={{ ...styles.pageBtn, opacity: page === 0 ? 0.4 : 1 }}
              >
                Précédent
              </button>
              <span style={styles.pageInfo}>Page {page + 1} / {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                style={{ ...styles.pageBtn, opacity: page >= totalPages - 1 ? 0.4 : 1 }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {modal && (
        <ClientModal
          mode={modal.mode}
          client={modal.client}
          companyId={company.id}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadClients(); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          clientName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}

function EmptyState({ canEdit, onCreate }) {
  return (
    <div style={styles.emptyState}>
      <Users size={32} color="#3a4358" />
      <p style={styles.emptyText}>Aucun client pour le moment.</p>
      {canEdit && (
        <button onClick={onCreate} style={styles.addBtn}>
          <Plus size={16} /> Ajouter votre premier client
        </button>
      )}
    </div>
  );
}

function ClientModal({ mode, client, companyId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    company_name: client?.company_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    tax_number: client?.tax_number || '',
    notes: client?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const taxValidation = validateIvorianTaxNumber(form.tax_number);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (mode === 'create') {
      const { data: canCreate } = await supabase.rpc('can_create_client', { p_company_id: companyId });
      if (canCreate === false) {
        setSaving(false);
        setError('Limite du plan Gratuit atteinte (10 clients maximum). Passez à un plan supérieur pour continuer.');
        return;
      }
    }

    const payload = { ...form, company_id: companyId };
    const { error: saveError } = mode === 'create'
      ? await supabase.from('clients').insert(payload)
      : await supabase.from('clients').update(payload).eq('id', client.id);

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{mode === 'create' ? 'Nouveau client' : 'Modifier le client'}</h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.row}>
            <Field icon={<Users size={14} />} label="Nom *">
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} style={styles.input} />
            </Field>
            <Field icon={<FileText size={14} />} label="Entreprise">
              <input value={form.company_name} onChange={(e) => update('company_name', e.target.value)} style={styles.input} />
            </Field>
          </div>

          <div style={styles.row}>
            <Field icon={<Mail size={14} />} label="Email">
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} style={styles.input} />
            </Field>
            <Field icon={<Phone size={14} />} label="Téléphone">
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} style={styles.input} />
            </Field>
          </div>

          <Field icon={<MapPin size={14} />} label="Adresse">
            <input value={form.address} onChange={(e) => update('address', e.target.value)} style={styles.input} />
          </Field>

          <Field icon={<Hash size={14} />} label="Numéro fiscal (NCC ou RCCM)">
            <input
              value={form.tax_number}
              onChange={(e) => update('tax_number', e.target.value)}
              placeholder="Ex: 1234567A ou CI-ABJ-2018-B-28355"
              style={styles.input}
            />
            {taxValidation.message && (
              <span style={{ ...styles.taxHint, color: taxValidation.isValid ? '#4ade80' : '#fb923c' }}>
                {taxValidation.isValid && taxValidation.format ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {' '}{taxValidation.message}
              </span>
            )}
          </Field>

          <Field icon={<FileText size={14} />} label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              style={{ ...styles.input, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

          {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

          <button type="submit" disabled={saving} style={styles.submitBtn}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : (mode === 'create' ? 'Créer le client' : 'Enregistrer les modifications')}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ clientName, onCancel, onConfirm }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalConfirm} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Supprimer ce client ?</h3>
        <p style={styles.confirmText}>
          Voulez-vous vraiment supprimer <strong>{clientName}</strong> ? Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} style={styles.cancelBtn}>Annuler</button>
          <button onClick={onConfirm} style={styles.dangerBtn}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }) {
  return (
    <label style={styles.fieldWrapper}>
      <span style={styles.fieldLabel}>{icon} {label}</span>
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
  searchBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 12,
    padding: '11px 16px', marginBottom: 20, maxWidth: 440,
  },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14 },
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
  clientName: { color: '#fff', fontSize: 14, fontWeight: 600 },
  clientCompany: { color: '#8b93a7', fontSize: 12.5, marginTop: 2 },
  contactLine: { display: 'flex', alignItems: 'center', gap: 6, color: '#aab2c5', fontSize: 12.5 },
  addressText: { color: '#aab2c5', fontSize: 13 },
  iconBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex',
  },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 18 },
  pageBtn: {
    background: '#11172a', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
  },
  pageInfo: { color: '#8b93a7', fontSize: 13 },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
  },
  modal: {
    width: '100%', maxWidth: 560, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 28, maxHeight: '90vh', overflowY: 'auto',
  },
  modalConfirm: {
    width: '100%', maxWidth: 420, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 24,
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#8b93a7', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  fieldLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#aab2c5' },
  taxHint: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, marginTop: 4 },
  input: {
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 10,
    padding: '10px 13px', color: '#fff', fontSize: 13.5, outline: 'none',
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

