import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

export default function Register() {
  const { signUp, refreshCompanyContext } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, fullName);
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Un compte existe déjà avec cet email.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // Si l'inscription vient d'un lien d'invitation, on rejoint directement
    // l'entreprise existante au lieu de créer une nouvelle entreprise.
    if (inviteToken) {
      const { error: acceptError } = await supabase.rpc('accept_invitation', { p_token: inviteToken });
      if (acceptError) {
        setError(acceptError.message || "Erreur lors de l'acceptation de l'invitation.");
        return;
      }
      await refreshCompanyContext();
      navigate('/dashboard', { replace: true });
      return;
    }

    // Sinon, parcours normal : l'utilisateur crée sa propre entreprise.
    navigate('/register/company');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>FactureFlow <span style={{ color: '#22c55e' }}>Africa</span></div>
        <p style={styles.subtitle}>Créez votre compte en quelques secondes</p>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field icon={<User size={16} />} label="Nom complet">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aïcha Koné"
              style={styles.input}
            />
          </Field>

          <Field icon={<Mail size={16} />} label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              style={styles.input}
            />
          </Field>

          <Field icon={<Lock size={16} />} label="Mot de passe">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </Field>

          <Field icon={<Lock size={16} />} label="Confirmer le mot de passe">
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </Field>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Créer mon compte'}
          </button>
        </form>

        <p style={styles.footerText}>
          Déjà inscrit ? <Link to="/login" style={styles.link}>Se connecter</Link>
        </p>
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
    maxWidth: 420,
    background: '#11172a',
    border: '1px solid #1f2940',
    borderRadius: 16,
    padding: 32,
  },
  logo: {
    fontSize: 24,
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
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
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
  footerText: {
    textAlign: 'center',
    color: '#8b93a7',
    fontSize: 13,
    marginTop: 22,
  },
  link: {
    color: '#22c55e',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
