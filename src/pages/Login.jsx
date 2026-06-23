import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', ...style }} />;
}

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // mode: 'login' | 'forgot' | 'forgot-success'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    import('../supabase').then((mod) => setSupabase(mod.supabase));
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  // ── Connexion ────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const { error: loginError } = await signIn(email, password);
      if (loginError) throw loginError;
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.message?.includes('Invalid login')) setError('Email ou mot de passe incorrect.');
      else if (err.message?.includes('Email not confirmed')) setError('Confirmez votre email avant de vous connecter.');
      else setError(err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ── Mot de passe oublié ──────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }
    if (!supabase) return;
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (resetError) throw resetError;
      setSuccessEmail(email);
      setMode('forgot-success');
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi de l'email.");
    } finally {
      setLoading(false);
    }
  };

  // ── Connexion Google ─────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Erreur via Google.');
    }
  };

  const modeTitle = {
    login: 'Connectez-vous à votre espace',
    forgot: 'Réinitialisez votre mot de passe',
    'forgot-success': 'Email envoyé !',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden', fontFamily: "'Sora','Segoe UI',sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .auth-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:14px 16px 14px 46px; color:white; font-size:14px; font-family:'Sora',sans-serif; outline:none; transition:border-color 0.2s,background 0.2s; }
        .auth-input::placeholder { color:rgba(255,255,255,0.25); }
        .auth-input:focus { border-color:rgba(34,197,94,0.6); background:rgba(34,197,94,0.06); }
        .auth-btn-primary { width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:#06150c; background:#22c55e; box-shadow:0 8px 32px rgba(34,197,94,0.35); transition:transform 0.15s,box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .auth-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 40px rgba(34,197,94,0.45); }
        .auth-btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
        .link-btn { background:none; border:none; cursor:pointer; color:#22c55e; font-size:12px; font-weight:600; font-family:'Sora',sans-serif; padding:0; text-decoration:none; }
        .link-btn:hover { text-decoration:underline; }
        .social-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 8px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); cursor:pointer; font-size:13px; font-weight:500; color:rgba(255,255,255,0.8); font-family:'Sora',sans-serif; transition:all 0.15s; width:100%; }
        .social-btn:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes checkPop { 0%{transform:scale(0) rotate(-10deg)} 70%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0deg)} }
        .fade-up { animation:fadeUp 0.4s ease both; }
        .scale-in { animation:scaleIn 0.35s ease both; }
        .check-pop { animation:checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <FloatingOrb style={{ width: '400px', height: '400px', background: 'rgba(34,197,94,0.10)', top: '-100px', left: '-100px' }} />
      <FloatingOrb style={{ width: '300px', height: '300px', background: 'rgba(20,120,255,0.08)', bottom: '-80px', right: '-80px' }} />

      <div className="scale-in" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '28px', padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' }}>

        {/* Logo + Titre */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#22c55e', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(34,197,94,0.4)' }}>
            <span style={{ color: '#06150c', fontSize: 24, fontWeight: 900 }}>F</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            FactureFlow <span style={{ color: '#22c55e' }}>Africa</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>{modeTitle[mode]}</p>
        </div>

        {/* ── SUCCÈS MOT DE PASSE OUBLIÉ ── */}
        {mode === 'forgot-success' && (
          <div className="fade-up" style={{ textAlign: 'center' }}>
            <div className="check-pop" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="#22c55e" />
            </div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Email envoyé !</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
              Un lien de réinitialisation a été envoyé à<br />
              <strong style={{ color: 'rgba(34,197,94,0.9)' }}>{successEmail}</strong>.<br />
              Cliquez le lien pour créer un nouveau mot de passe.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px', marginBottom: '24px', textAlign: 'left' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, lineHeight: 1.7 }}>
                📧 Vérifiez vos <strong style={{ color: 'rgba(255,255,255,0.7)' }}>spams</strong> si vous ne voyez pas l'email.<br />
                ⏰ Le lien expire après quelques minutes.
              </p>
            </div>
            <button onClick={() => switchMode('login')} className="auth-btn-primary">
              Retour à la connexion <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── FORMULAIRES ── */}
        {mode !== 'forgot-success' && (
          <>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              {mode === 'login' && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>
                  Pas encore de compte ?{' '}
                  <Link to="/register" className="link-btn">S'inscrire gratuitement</Link>
                </p>
              )}
              {mode === 'forgot' && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>
                  <button className="link-btn" onClick={() => switchMode('login')}>← Retour à la connexion</button>
                </p>
              )}
            </div>

            {/* ── CONNEXION ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="fade-up" autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="email" className="auth-input" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required style={{ paddingRight: '46px' }} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex', alignItems: 'center' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                  <button type="button" className="link-btn" style={{ fontSize: '11px' }} onClick={() => switchMode('forgot')}>
                    Mot de passe oublié ?
                  </button>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                    <p style={{ color: '#f87171', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>{error}</p>
                  </div>
                )}

                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Se connecter <ArrowRight size={16} /></>}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>ou</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <button type="button" className="social-btn" onClick={handleGoogleAuth}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continuer avec Google
                </button>
              </form>
            )}

            {/* ── MOT DE PASSE OUBLIÉ ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 4px', lineHeight: 1.6 }}>
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="email" className="auth-input" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                    <p style={{ color: '#f87171', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>{error}</p>
                  </div>
                )}
                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Envoyer le lien <ArrowRight size={16} /></>}
                </button>
              </form>
            )}
          </>
        )}

        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>FactureFlow Africa · Tous droits réservés</p>
      </div>
    </div>
  );
}