import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, Phone, MapPin, Globe2, Coins, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

const PAYS_OPTIONS = [
  { value: 'Côte d\'Ivoire', currency: 'XOF' },
  { value: 'Sénégal', currency: 'XOF' },
  { value: 'Bénin', currency: 'XOF' },
  { value: 'Togo', currency: 'XOF' },
  { value: 'Burkina Faso', currency: 'XOF' },
  { value: 'Mali', currency: 'XOF' },
  { value: 'Cameroun', currency: 'XAF' },
  { value: 'Gabon', currency: 'XAF' },
  { value: 'Congo', currency: 'XAF' },
  { value: 'Autre', currency: 'XOF' },
];

export default function RegisterCompany() {
  const { refreshCompanyContext } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState(PAYS_OPTIONS[0].value);
  const [currency, setCurrency] = useState(PAYS_OPTIONS[0].currency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCountryChange = (value) => {
    setCountry(value);
    const match = PAYS_OPTIONS.find((p) => p.value === value);
    if (match) setCurrency(match.currency);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: rpcError } = await supabase.rpc('create_company_with_admin', {
      p_name: name,
      p_phone: phone,
      p_address: address,
      p_country: country,
      p_currency: currency,
    });

    if (rpcError) {
      setError(rpcError.message || "Une erreur est survenue lors de la création de l'entreprise.");
      setLoading(false);
      return;
    }

    await refreshCompanyContext();
    setLoading(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.stepIndicator}>
          <span style={styles.stepDone}>1</span>
          <span style={styles.stepLine} />
          <span style={styles.stepActive}>2</span>
          <span style={styles.stepLine} />
          <span style={styles.stepPending}>3</span>
        </div>

        <div style={styles.logo}>Créez votre <span style={{ color: '#22c55e' }}>entreprise</span></div>
        <p style={styles.subtitle}>Ces informations apparaîtront sur vos devis et factures</p>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field icon={<Building2 size={16} />} label="Nom de l'entreprise">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ma Petite Entreprise SARL"
              style={styles.input}
            />
          </Field>

          <Field icon={<Phone size={16} />} label="Téléphone">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              style={styles.input}
            />
          </Field>

          <Field icon={<MapPin size={16} />} label="Adresse">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Cocody, Abidjan"
              style={styles.input}
            />
          </Field>

          <div style={styles.row}>
            <Field icon={<Globe2 size={16} />} label="Pays">
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                style={styles.input}
              >
                {PAYS_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.value}</option>
                ))}
              </select>
            </Field>

            <Field icon={<Coins size={16} />} label="Devise">
              <input type="text" value={currency} readOnly style={{ ...styles.input, opacity: 0.7 }} />
            </Field>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuer vers le tableau de bord'}
          </button>
        </form>
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
  page: {
    minHeight: '100vh',
    background: '#0a0e1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#11172a',
    border: '1px solid #1f2940',
    borderRadius: 16,
    padding: 32,
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  stepDone: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#22c55e', color: '#06150c',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  stepActive: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#22c55e', color: '#06150c',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
    boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
  },
  stepPending: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#1f2940', color: '#8b93a7',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  stepLine: { width: 28, height: 2, background: '#1f2940' },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#8b93a7',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#aab2c5',
  },
  input: {
    background: '#0a0e1a',
    border: '1px solid #1f2940',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  submitBtn: {
    background: '#22c55e',
    color: '#06150c',
    fontWeight: 700,
    border: 'none',
    borderRadius: 10,
    padding: '13px 0',
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 18,
  },
};