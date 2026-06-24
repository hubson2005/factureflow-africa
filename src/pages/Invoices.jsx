import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Pencil, Trash2, X, Loader2, AlertCircle, Receipt, Download,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import { generateDocumentPdf, downloadDocumentPdf } from '../utils/pdfGenerator';

const STATUS_META = {
  brouillon: { label: 'Brouillon', color: '#8b93a7', bg: 'rgba(139,147,167,0.12)' },
  envoyee: { label: 'Envoyée', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  partiellement_payee: { label: 'Partiellement payée', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  payee: { label: 'Payée', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  en_retard: { label: 'En retard', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};
const STATUS_ORDER = ['brouillon', 'envoyee', 'partiellement_payee', 'payee', 'en_retard'];
const MANUAL_STATUSES = ['brouillon', 'envoyee'];

export default function Invoices() {
  const { company, role } = useAuth();
  const canEdit = role === 'admin' || role === 'manager';

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('toutes');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadData = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    const [invoicesRes, clientsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, clients(name, company_name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id, name, company_name')
        .eq('company_id', company.id)
        .order('name'),
    ]);

    setInvoices(invoicesRes.data || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'toutes' || inv.status === statusFilter;
      const matchSearch = !search.trim() ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (inv.clients?.name || '').toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [invoices, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('invoices').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadData();
  };

  const handleStatusChange = async (invoice, newStatus) => {
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoice.id);
    loadData();
  };

  const handleDownloadPdf = async (invoice) => {
    setPdfLoadingId(invoice.id);
    setActionError('');
    try {
      const [{ data: items }, { data: clientData }] = await Promise.all([
        supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('sort_order'),
        supabase.from('clients').select('*').eq('id', invoice.client_id).single(),
      ]);

      const doc = await generateDocumentPdf({
        type: 'facture',
        company,
        client: clientData || {},
        document: {
          number: invoice.invoice_number,
          date: invoice.created_at,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          tax_total: invoice.tax_total,
          total: invoice.total,
          notes: invoice.notes,
        },
        items: items || [],
        paymentSummary: {
          amountPaid: invoice.amount_paid,
          amountDue: invoice.amount_due,
        },
      });

      downloadDocumentPdf(doc, `${invoice.invoice_number}.pdf`);
    } catch (err) {
      setActionError('Erreur lors de la génération du PDF.');
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Factures</h1>
          <p style={styles.subtitle}>{invoices.length} facture{invoices.length !== 1 ? 's' : ''} au total</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({ mode: 'create' })} style={styles.addBtn}>
            <Plus size={16} /> Nouvelle facture
          </button>
        )}
      </div>

      {actionError && (
        <div style={{ ...styles.errorBox, marginBottom: 16 }}><AlertCircle size={14} /> {actionError}</div>
      )}

      <div style={styles.filtersRow}>
        <div style={styles.searchBar}>
          <Search size={16} color="#8b93a7" />
          <input
            type="text"
            placeholder="Rechercher par numéro ou client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.categorySelect}>
          <option value="toutes">Tous les statuts</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={styles.loadingBox}><Loader2 size={20} className="animate-spin" color="#22c55e" /></div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <Receipt size={32} color="#3a4358" />
          <p style={styles.emptyText}>Aucune facture trouvée.</p>
        </div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeaderRow}>
            <span style={{ flex: 1.2 }}>N° Facture</span>
            <span style={{ flex: 1.4 }}>Client</span>
            <span style={{ flex: 1 }}>Total</span>
            <span style={{ flex: 1 }}>Reste à payer</span>
            <span style={{ flex: 1.2 }}>Statut</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Actions</span>
          </div>
          {filtered.map((inv) => (
            <div key={inv.id} style={styles.tableRow}>
              <span style={{ flex: 1.2, color: '#fff', fontWeight: 600, fontSize: 13.5 }}>{inv.invoice_number}</span>
              <span style={{ flex: 1.4, color: '#aab2c5', fontSize: 13.5 }}>{inv.clients?.name || '—'}</span>
              <span style={{ flex: 1, color: '#fff', fontSize: 13.5 }}>{Number(inv.total).toLocaleString('fr-FR')} {company?.currency}</span>
              <span style={{ flex: 1, fontSize: 13.5, color: Number(inv.amount_due) > 0 ? '#f97316' : '#4ade80', fontWeight: 600 }}>
                {Number(inv.amount_due).toLocaleString('fr-FR')} {company?.currency}
              </span>
              <span style={{ flex: 1.2 }}>
                {canEdit && MANUAL_STATUSES.includes(inv.status) ? (
                  <StatusDropdown current={inv.status} onChange={(s) => handleStatusChange(inv, s)} />
                ) : (
                  <StatusBadge status={inv.status} />
                )}
              </span>
              {canEdit && (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button onClick={() => handleDownloadPdf(inv)} style={styles.iconBtn} title="Télécharger PDF" disabled={pdfLoadingId === inv.id}>
                    {pdfLoadingId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                  <button onClick={() => setModal({ mode: 'edit', invoice: inv })} style={styles.iconBtn} title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(inv)} style={{ ...styles.iconBtn, color: '#f87171' }} title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              {!canEdit && (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleDownloadPdf(inv)} style={styles.iconBtn} title="Télécharger PDF" disabled={pdfLoadingId === inv.id}>
                    {pdfLoadingId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <InvoiceModal
          mode={modal.mode}
          invoice={modal.invoice}
          company={company}
          clients={clients}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadData(); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          label={deleteTarget.invoice_number}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.brouillon;
  return <span style={{ ...styles.statusBadge, color: meta.color, background: meta.bg }}>{meta.label}</span>;
}

function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[current] || STATUS_META.brouillon;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} style={{ ...styles.statusBadge, color: meta.color, background: meta.bg, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none' }}>
        {meta.label}
      </button>
      {open && (
        <div style={styles.statusMenu}>
          {MANUAL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              style={{ ...styles.statusMenuItem, color: STATUS_META[s].color }}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceModal({ mode, invoice, company, clients, onClose, onSaved }) {
  const [clientId, setClientId] = useState(invoice?.client_id || '');
  const [dueDate, setDueDate] = useState(invoice?.due_date || '');
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingItems, setLoadingItems] = useState(mode === 'edit');
  const fromQuote = !!invoice?.quote_id;

  useEffect(() => {
    const load = async () => {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', company.id);
      setProducts(prods || []);

      if (mode === 'edit' && invoice) {
        const { data: existingItems } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('sort_order');
        setItems((existingItems || []).map((it) => ({ ...it, _key: it.id })));
        setLoadingItems(false);
      } else {
        setItems([emptyLine()]);
      }
    };
    load();
  }, [mode, invoice, company.id]);

  function emptyLine() {
    return { _key: Math.random().toString(36), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: company.invoice_tva_default || 18 };
  }

  const addLine = () => setItems((prev) => [...prev, emptyLine()]);
  const removeLine = (key) => setItems((prev) => prev.filter((it) => it._key !== key));
  const updateLine = (key, patch) => setItems((prev) => prev.map((it) => (it._key === key ? { ...it, ...patch } : it)));

  const selectProduct = (key, productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) { updateLine(key, { product_id: '' }); return; }
    updateLine(key, {
      product_id: product.id,
      description: product.name,
      unit_price: product.unit_price,
      tax_rate: product.tax_rate,
    });
  };

  const totals = useMemo(() => {
    let subtotal = 0, taxTotal = 0;
    items.forEach((it) => {
      const lineSub = Number(it.quantity || 0) * Number(it.unit_price || 0);
      subtotal += lineSub;
      taxTotal += lineSub * (Number(it.tax_rate || 0) / 100);
    });
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clientId) { setError('Sélectionnez un client.'); return; }
    if (items.length === 0 || items.every((it) => !it.description)) {
      setError('Ajoutez au moins une ligne de produit/service.');
      return;
    }

    setSaving(true);
    let invoiceId = invoice?.id;

    if (mode === 'create') {
      const { data: canCreate } = await supabase.rpc('can_create_invoice', { p_company_id: company.id });
      if (canCreate === false) {
        setSaving(false);
        setError('Limite du plan Gratuit atteinte (10 factures par mois). Passez à un plan supérieur pour continuer.');
        return;
      }

      const { data: number } = await supabase.rpc('generate_invoice_number', { p_company_id: company.id });
      const { data: newInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          company_id: company.id,
          client_id: clientId,
          invoice_number: number,
          due_date: dueDate || null,
          notes,
        })
        .select()
        .single();

      if (insertError) { setError(insertError.message); setSaving(false); return; }
      invoiceId = newInvoice.id;
    } else {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ client_id: clientId, due_date: dueDate || null, notes })
        .eq('id', invoiceId);
      if (updateError) { setError(updateError.message); setSaving(false); return; }

      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    }

    const itemsPayload = items
      .filter((it) => it.description)
      .map((it, idx) => ({
        invoice_id: invoiceId,
        product_id: it.product_id || null,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        tax_rate: Number(it.tax_rate) || 0,
        sort_order: idx,
      }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsPayload);
    setSaving(false);

    if (itemsError) { setError(itemsError.message); return; }
    onSaved();
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{mode === 'create' ? 'Nouvelle facture' : `Modifier ${invoice?.invoice_number}`}</h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        {fromQuote && (
          <div style={styles.infoBox}>Cette facture provient d'un devis converti.</div>
        )}

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.row}>
            <Field label="Client *">
              <select required value={clientId} onChange={(e) => setClientId(e.target.value)} style={styles.input}>
                <option value="">Sélectionner un client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` — ${c.company_name}` : ''}</option>)}
              </select>
            </Field>
            <Field label="Échéance">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={styles.input} />
            </Field>
          </div>

          <div style={styles.itemsSection}>
            <div style={styles.itemsSectionLabel}>Lignes de facture</div>

            {loadingItems ? (
              <Loader2 size={18} className="animate-spin" color="#22c55e" />
            ) : (
              items.map((it, idx) => {
                const lineTotal = Number(it.quantity || 0) * Number(it.unit_price || 0) * (1 + Number(it.tax_rate || 0) / 100);
                return (
                  <div key={it._key} style={styles.lineCard}>
                    <div style={styles.lineCardHeader}>
                      <span style={styles.lineCardNumber}>Ligne {idx + 1}</span>
                      <button type="button" onClick={() => removeLine(it._key)} style={styles.removeLineBtn}>
                        <X size={14} /> Retirer
                      </button>
                    </div>

                    <div style={styles.lineRowTop}>
                      <Field label="Article">
                        <select
                          value={it.product_id || ''}
                          onChange={(e) => selectProduct(it._key, e.target.value)}
                          style={styles.input}
                        >
                          <option value="">Article libre…</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Description">
                        <input
                          value={it.description}
                          onChange={(e) => updateLine(it._key, { description: e.target.value })}
                          placeholder="Description de la ligne"
                          style={styles.input}
                        />
                      </Field>
                    </div>

                    <div style={styles.lineRowBottom}>
                      <Field label="Quantité">
                        <input
                          type="number" min="0" step="0.01"
                          value={it.quantity}
                          onChange={(e) => updateLine(it._key, { quantity: e.target.value })}
                          style={styles.input}
                        />
                      </Field>
                      <Field label="Prix unitaire">
                        <input
                          type="number" min="0" step="0.01"
                          value={it.unit_price}
                          onChange={(e) => updateLine(it._key, { unit_price: e.target.value })}
                          style={styles.input}
                        />
                      </Field>
                      <Field label="TVA %">
                        <input
                          type="number" min="0" max="100" step="0.01"
                          value={it.tax_rate}
                          onChange={(e) => updateLine(it._key, { tax_rate: e.target.value })}
                          style={styles.input}
                        />
                      </Field>
                      <Field label="Total ligne">
                        <div style={styles.lineTotalBox}>
                          {lineTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                        </div>
                      </Field>
                    </div>
                  </div>
                );
              })
            )}

            <button type="button" onClick={addLine} style={styles.addLineBtn}>
              <Plus size={13} /> Ajouter une ligne
            </button>
          </div>

          <div style={styles.totalsBox}>
            <div style={styles.totalRow}><span>Sous-total</span><span>{totals.subtotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {company.currency}</span></div>
            <div style={styles.totalRow}><span>TVA</span><span>{totals.taxTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {company.currency}</span></div>
            <div style={{ ...styles.totalRow, fontWeight: 800, fontSize: 15, color: '#22c55e' }}>
              <span>Total</span><span>{totals.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {company.currency}</span>
            </div>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...styles.input, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} />
          </Field>

          {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

          <button type="submit" disabled={saving} style={styles.submitBtn}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : (mode === 'create' ? 'Créer la facture' : 'Enregistrer les modifications')}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ label, onCancel, onConfirm }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Supprimer cette facture ?</h3>
        <p style={styles.confirmText}>Voulez-vous vraiment supprimer <strong>{label}</strong> ? Cette action est irréversible et supprimera aussi les paiements associés.</p>
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
  statusBadge: { fontSize: 11.5, fontWeight: 600, padding: '4px 11px', borderRadius: 100, display: 'inline-block' },
  statusMenu: {
    position: 'absolute', top: '110%', left: 0, background: '#1a2238', border: '1px solid #2a3550',
    borderRadius: 10, padding: 6, zIndex: 50, minWidth: 130, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  statusMenuItem: {
    display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
    padding: '7px 10px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: 6,
  },
  iconBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
  },
  modal: {
    width: '100%', maxWidth: 420, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 24,
  },
  modalLarge: {
    width: '100%', maxWidth: 860, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 28, maxHeight: '92vh', overflowY: 'auto', overflowX: 'hidden',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#8b93a7', cursor: 'pointer' },
  infoBox: {
    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa',
    borderRadius: 10, padding: '9px 13px', fontSize: 12.5, marginBottom: 16,
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'flex', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  fieldLabel: { fontSize: 12.5, color: '#aab2c5' },
  input: {
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 10,
    padding: '10px 13px', color: '#fff', fontSize: 13.5, outline: 'none',
  },
  itemsSection: { background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 12, padding: 16 },
  itemsSectionLabel: {
    color: '#5f6878', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.04em', marginBottom: 12,
  },
  lineCard: {
    background: '#11172a', border: '1px solid #1f2940', borderRadius: 10,
    padding: 14, marginBottom: 10,
  },
  lineCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  lineCardNumber: { color: '#8b93a7', fontSize: 12, fontWeight: 600 },
  removeLineBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer',
  },
  lineRowTop: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, marginBottom: 12 },
  lineRowBottom: { display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1fr', gap: 12 },
  lineTotalBox: {
    background: '#0a0e1a', border: '1px solid #1f2940', borderRadius: 10,
    padding: '10px 13px', color: '#22c55e', fontSize: 13.5, fontWeight: 700,
  },
  addLineBtn: {
    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed #2a3550',
    color: '#22c55e', fontSize: 12.5, fontWeight: 600, padding: '8px 12px', borderRadius: 8,
    cursor: 'pointer', marginTop: 4,
  },
  totalsBox: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', padding: '4px 4px' },
  totalRow: { display: 'flex', gap: 24, color: '#aab2c5', fontSize: 13 },
  submitBtn: {
    background: '#22c55e', color: '#06150c', fontWeight: 700, border: 'none',
    borderRadius: 10, padding: '13px 0', fontSize: 14, cursor: 'pointer',
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

