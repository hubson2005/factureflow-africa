import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Pencil, Trash2, Copy, X, Loader2, AlertCircle,
  Package, Tag, Coins, Percent, AlignLeft,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

export default function Products() {
  const { company, role } = useAuth();
  const canEdit = role === 'admin' || role === 'manager';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadProducts = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['Toutes', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'Toutes' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('products').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadProducts();
  };

  const handleDuplicate = async (product) => {
    const { id, created_at, updated_at, ...rest } = product;
    await supabase.from('products').insert({ ...rest, name: `${product.name} (copie)` });
    loadProducts();
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Produits & Services</h1>
          <p style={styles.subtitle}>{products.length} article{products.length !== 1 ? 's' : ''} au catalogue</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({ mode: 'create' })} style={styles.addBtn}>
            <Plus size={16} /> Nouvel article
          </button>
        )}
      </div>

      <div style={styles.filtersRow}>
        <div style={styles.searchBar}>
          <Search size={16} color="#8b93a7" />
          <input
            type="text"
            placeholder="Rechercher un produit ou service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={styles.categorySelect}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={styles.loadingBox}><Loader2 size={20} className="animate-spin" color="#22c55e" /></div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={32} color="#3a4358" />
          <p style={styles.emptyText}>Aucun produit trouvé.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardName}>{p.name}</div>
                  {p.category && <span style={styles.categoryBadge}>{p.category}</span>}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleDuplicate(p)} style={styles.iconBtn} title="Dupliquer">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => setModal({ mode: 'edit', product: p })} style={styles.iconBtn} title="Modifier">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} style={{ ...styles.iconBtn, color: '#f87171' }} title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              {p.description && <p style={styles.cardDescription}>{p.description}</p>}
              <div style={styles.cardFooter}>
                <span style={styles.priceText}>{Number(p.unit_price).toLocaleString('fr-FR')} {company?.currency}</span>
                <span style={styles.tvaText}>TVA {p.tax_rate}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProductModal
          mode={modal.mode}
          product={modal.product}
          companyId={company.id}
          defaultTva={company.invoice_tva_default}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadProducts(); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}

function ProductModal({ mode, product, companyId, defaultTva, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    unit_price: product?.unit_price ?? '',
    tax_rate: product?.tax_rate ?? defaultTva ?? 18,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      unit_price: Number(form.unit_price),
      tax_rate: Number(form.tax_rate),
      company_id: companyId,
    };

    const { error: saveError } = mode === 'create'
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', product.id);

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
          <h3 style={styles.modalTitle}>{mode === 'create' ? 'Nouvel article' : "Modifier l'article"}</h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <Field icon={<Package size={14} />} label="Nom *">
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} style={styles.input} />
          </Field>

          <Field icon={<AlignLeft size={14} />} label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              style={{ ...styles.input, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

          <Field icon={<Tag size={14} />} label="Catégorie">
            <input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="Ex: Services, Matériel…" style={styles.input} />
          </Field>

          <div style={styles.row}>
            <Field icon={<Coins size={14} />} label="Prix unitaire *">
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.unit_price}
                onChange={(e) => update('unit_price', e.target.value)}
                style={styles.input}
              />
            </Field>
            <Field icon={<Percent size={14} />} label="TVA (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.tax_rate}
                onChange={(e) => update('tax_rate', e.target.value)}
                style={styles.input}
              />
            </Field>
          </div>

          {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

          <button type="submit" disabled={saving} style={styles.submitBtn}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : (mode === 'create' ? "Créer l'article" : 'Enregistrer les modifications')}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ productName, onCancel, onConfirm }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Supprimer cet article ?</h3>
        <p style={styles.confirmText}>
          Voulez-vous vraiment supprimer <strong>{productName}</strong> ? Cette action est irréversible.
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  card: { background: '#11172a', border: '1px solid #1f2940', borderRadius: 14, padding: 18 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { color: '#fff', fontSize: 14.5, fontWeight: 700 },
  categoryBadge: {
    display: 'inline-block', marginTop: 4, fontSize: 11, color: '#a78bfa',
    background: 'rgba(167,139,250,0.12)', padding: '2px 8px', borderRadius: 100,
  },
  cardDescription: { color: '#8b93a7', fontSize: 12.5, lineHeight: 1.5, margin: '8px 0' },
  cardFooter: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  priceText: { color: '#22c55e', fontSize: 15, fontWeight: 700 },
  tvaText: { color: '#8b93a7', fontSize: 12 },
  iconBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2940', color: '#aab2c5',
    borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
  },
  modal: {
    width: '100%', maxWidth: 480, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 24, maxHeight: '90vh', overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#8b93a7', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  fieldLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#aab2c5' },
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