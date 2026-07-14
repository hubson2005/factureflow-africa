import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

const ROLE_LABELS = {
  admin: 'Administrateur',
  manager: 'Manager',
  comptable: 'Comptable',
};

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, refreshCompanyContext } = useAuth();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPreview = async () => {
      const { data, error: previewError } = await supabase.rpc('get_invitation_preview', { p_token: token });
      if (previewError || !data || data.length === 0) {
        setError('Cette invitation est introuvable.');
      } else {
        setPreview(data[0]);
      }
      setLoading(false);
    };
    loadPreview();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    const { error: acceptError } = await supabase.rpc('accept_invitation', { p_token: token });

    if (acceptError) {
      setError(acceptError.message || "Erreur lors de l'acceptation de l'invitation.");
      setAccepting(false);
      return;
    }

    await refreshCompanyContext();
    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Loader2 size={24} className="animate-spin" color="#22c55e" />
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <AlertCircle size={36} color="#f87171" style={{ marginBottom: 14 }} />
          <h2 style={styles.title}>Invitation invalide</h2>
          <p style={styles.subtitle}>{error}</p>
          <Link to="/login" style={styles.linkBtn}>Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  if (!preview.is_valid) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <AlertCircle size={36} color="#f87171" style={{ marginBottom: 14 }} />
          <h2 style={styles.title}>Invitation expirée</h2>
          <p style={styles.subtitle}>Cette invitation a déjà été utilisée ou a expiré. Demandez à l'administrateur d'en générer une nouvelle.</p>
          <Link to="/login" style={styles.linkBtn}>Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconBadge}><Building2 size={26} color="#22c55e" /></div>
        <h2 style={styles.title}>Rejoindre {preview.company_name}</h2>
        <p style={styles.subtitle}>
          Vous avez été invité en tant que <strong style={{ color: '#22c55e' }}>{ROLE_LABELS[preview.role] || preview.role}</strong>.
        </p>

        {error && (
          <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>
        )}

        {!user ? (
          <>
            <p style={styles.hint}>
              Créez votre compte pour rejoindre cette entreprise (utilisez l'email <strong>{preview.email}</strong>).
            </p>
            <Link to={`/register?invite=${token}`} style={styles.primaryBtn}>
              Créer mon compte <ArrowRight size={16} />
            </Link>
            <Link to={`/login?invite=${token}`} style={styles.linkBtn}>J'ai déjà un compte</Link>
          </>
        ) : (
          <button onClick={handleAccept} disabled={accepting} style={styles.primaryBtn}>
            {accepting ? <Loader2 size={16} className="animate-spin" /> : <>Rejoindre l'entreprise <ArrowRight size={16} /></>}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#0a0e1a', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 20,
    fontFamily: "'Sora','Segoe UI',sans-serif",
  },
  card: {
    width: '100%', maxWidth: 420, background: '#11172a', border: '1px solid #1f2940',
    borderRadius: 16, padding: 32, textAlign: 'center',
  },
  iconBadge: {
    width: 56, height: 56, borderRadius: 16, background: 'rgba(34,197,94,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
  },
  title: { color: '#fff', fontSize: 19, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: '#aab2c5', fontSize: 13.5, lineHeight: 1.6, marginBottom: 22 },
  hint: { color: '#8b93a7', fontSize: 12.5, marginBottom: 16, lineHeight: 1.6 },
  primaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#22c55e', color: '#06150c', fontWeight: 700,
    border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14,
    cursor: 'pointer', textDecoration: 'none', width: '100%',
  },
  linkBtn: {
    display: 'block', marginTop: 14, color: '#22c55e', fontSize: 13,
    fontWeight: 600, textDecoration: 'none',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 7, textAlign: 'left',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: 10, padding: '9px 13px', fontSize: 12.5, marginBottom: 16,
  },
};
