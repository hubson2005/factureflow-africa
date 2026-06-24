import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, MapPin, Mail, Image as ImageIcon,
  Coins, Percent, Hash, Save, Loader2, CheckCircle, AlertCircle,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import SubscriptionPanel from '../components/SubscriptionPanel';

const CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD'];

export default function Settings() {
  const { company, refreshCompanyContext } = useAuth();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    logo_url: '',
    currency: 'XOF',
    invoice_tva_default: 18,
    invoice_format_prefix_quote: 'DEV',
    invoice_format_prefix_invoice: 'FAC',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        phone: company.phone || '',
        address: company.address || '',
        email: company.email || '',
        logo_url: company.logo_url || '',
        currency: company.currency || 'XOF',
        invoice_tva_default: company.invoice_tva_default ?? 18,
        invoice_format_prefix_quote: company.invoice_format_prefix_quote || 'DEV',
        invoice_format_prefix_invoice: company.invoice_format_prefix_invoice || 'FAC',
      });
    }
  }, [company]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setErrorMsg('');

    const { error } = await supabase
      .from('companies')
      .update({
        name: form.name,
        phone: form.phone,
        address: form.address,
        email: form.email,
        logo_url: form.logo_url || null,
        currency: form.currency,
        invoice_tva_default: Number(form.invoice_tva_default),
        invoice_format_prefix_quote: form.invoice_format_prefix_quote.toUpperCase(),
        invoice_format_prefix_invoice: form.invoice_format_prefix_invoice.toUpperCase(),
      })
      .eq('id', company.id);

    setSaving(false);

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    await refreshCompanyContext();
    setStatus('success');
    setTimeout(() => setStatus(null), 3000);
  };

  if (!company) {
    return (
      <Layout>
        <div style={styles.loadingBox}>
          <Loader2 size={20} className="animate-spin" color="#22c55e" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Paramètres</h1>
        <p style={styles.subtitle}>Informations de votre entreprise et préférences de facturation</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* ── Informations entreprise ── */}
        <Section title="Informations de l'entreprise" icon={<Building2 size={17} />}>
          <Row>
            <Field icon={<Building2 size={15} />} label="Nom de l'entreprise">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                style={styles.input}
              />
            </Field>
            <Field icon={<Phone size={15} />} label="Téléphone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                style={styles.input}
              />
            </Field>
          </Row>

          <Row>
            <Field icon={<Mail size={15} />} label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="contact@entreprise.com"
                style={styles.input}
              />
            </Field>
            <Field icon={<ImageIcon size={15} />} label="URL du logo">
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => update('logo_url', e.target.value)}
                placeholder="https://..."
                style={styles.input}
              />
            </Field>
          </Row>

          <Field icon={<MapPin size={15} />} label="Adresse">
            <input
              type="text"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              style={styles.input}
            />
          </Field>
        </Section>

        {/* ── Paramètres financiers ── */}
        <Section title="Paramètres financiers" icon={<Coins size={17} />}>
          <Row>
            <Field icon={<Coins size={15} />} label="Devise">
              <select
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                style={styles.input}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field icon={<Percent size={15} />} label="TVA par défaut (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.invoice_tva_default}
                onChange={(e) => update('invoice_tva_default', e.target.value)}
                style={styles.input}
              />
            </Field>
          </Row>

          <Row>
            <Field icon={<Hash size={15} />} label="Préfixe devis">
              <input
                type="text"
                maxLength={6}
                value={form.invoice_format_prefix_quote}
                onChange={(e) => update('invoice_format_prefix_quote', e.target.value)}
                style={styles.input}
              />
              <span style={styles.hint}>Ex: {form.invoice_format_prefix_quote || 'DEV'}-2026-00001</span>
            </Field>
            <Field icon={<Hash size={15} />} label="Préfixe facture">
              <input
                type="text"
                maxLength={6}
                value={form.invoice_format_prefix_invoice}
                onChange={(e) => update('invoice_format_prefix_invoice', e.target.value)}
                style={styles.input}
              />
              <span style={styles.hint}>Ex: {form.invoice_format_prefix_invoice || 'FAC'}-2026-00001</span>
            </Field>
          </Row>
        </Section>

        {status === 'success' && (
          <div style={styles.successBox}>
            <CheckCircle size={16} />
            <span>Paramètres enregistrés avec succès.</span>
          </div>
        )}
        {status === 'error' && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <button type="submit" disabled={saving} style={styles.submitBtn}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Enregistrer</>}
        </button>
      </form>

      <div style={{ marginTop: 22, maxWidth: 720 }}>
        <SubscriptionPanel />
      </div>
    </Layout>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{icon} {title}</div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div style={styles.row}>{children}</div>;
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
  loadingBox: { display: 'flex', justifyContent: 'center', padding: 60 },
  header: { marginBottom: 28 },
  title: { color: '#fff', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: '#8b93a7', fontSize: 14, marginTop: 6 },
  form: { display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 720 },
  section: {
    background: '#11172a',
    border: '1px solid #1f2940',
    borderRadius: 16,
    padding: 24,
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 18,
  },
  sectionBody: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'flex', gap: 16 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  fieldLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aab2c5' },
  input: {
    background: '#0a0e1a',
    border: '1px solid #1f2940',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  hint: { color: '#5f6878', fontSize: 11.5, marginTop: 2 },
  submitBtn: {
    alignSelf: 'flex-start',
    background: '#22c55e',
    color: '#06150c',
    fontWeight: 700,
    border: 'none',
    borderRadius: 10,
    padding: '12px 24px',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  successBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80', borderRadius: 10, padding: '10px 14px', fontSize: 13,
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: 10, padding: '10px 14px', fontSize: 13,
  },
};