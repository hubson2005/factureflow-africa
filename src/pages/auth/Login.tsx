import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../AuthContext";

const palette = {
  primary: { solid: "#F97316", text: "#D85F0A", 50: "#FFF4EC" },
  gray: { 50: "#F8FAFA", 100: "#F1F3F3", 200: "#E4E7E7", 400: "#9CA6A6", 600: "#5B6666", 900: "#14181A" },
  white: "#FFFFFF",
  danger: { solid: "#E0383E", 50: "#FBEAEA" },
};
const radius = { md: 12, lg: 16, full: 9999 };
const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Remplace ce chemin par le nom réel du fichier dans public/
const BG_IMAGE = "/login-bg.jpg";

function InputField({ icon: Icon, type = "text", placeholder, value, onChange, right }: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: palette.gray[50], border: `1px solid ${palette.gray[200]}`, borderRadius: radius.md, padding: "13px 14px" }}>
      <Icon size={17} color={palette.gray[400]} />
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: font, color: palette.gray[900] }}
      />
      {right}
    </div>
  );
}

export default function Login() {
  const { signIn } = useAuth() as any;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root" style={{ fontFamily: font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .login-root::before {
          content: "";
          position: absolute;
          inset: -20px;
          background-image: url(${BG_IMAGE});
          background-size: cover;
          background-position: center;
          filter: blur(6px);
          transform: scale(1.05);
          pointer-events: none;
        }

        .login-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(20, 24, 26, 0.55);
          pointer-events: none;
        }

        .login-card-wrap {
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="login-card-wrap" style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Logo + titre */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/logo-full.png" alt="FactureFlow Africa" style={{ width: 72, height: 72, borderRadius: radius.md, margin: "0 auto 16px", display: "block", objectFit: "contain" }} />
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: palette.white }}>
            FactureFlow <span style={{ color: palette.primary.solid }}>Africa</span>
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: palette.gray[100] }}>Connectez-vous à votre espace</p>
        </div>

        {/* Card */}
        <div style={{ background: palette.white, borderRadius: radius.lg, padding: 28, boxShadow: "0 8px 30px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ background: palette.danger[50], border: `1px solid ${palette.danger.solid}22`, borderRadius: radius.md, padding: "10px 14px", fontSize: 13, color: palette.danger.solid, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <InputField icon={Mail} type="email" placeholder="votre@email.com" value={email} onChange={setEmail} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <InputField
              icon={Lock} type={showPwd ? "text" : "password"} placeholder="Mot de passe"
              value={password} onChange={setPassword}
              right={
                <button type="button" onClick={() => setShowPwd((p) => !p)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  {showPwd ? <EyeOff size={17} color={palette.gray[400]} /> : <Eye size={17} color={palette.gray[400]} />}
                </button>
              }
            />
            <div style={{ textAlign: "right" }}>
              <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: palette.primary.solid, textDecoration: "none" }}>
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <button
            onClick={handleSubmit as any} disabled={loading || !email || !password}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 20px", borderRadius: radius.md, border: "none",
              background: loading || !email || !password ? palette.gray[200] : palette.primary.solid,
              color: loading || !email || !password ? palette.gray[400] : palette.white,
              fontSize: 15, fontWeight: 700, cursor: loading || !email || !password ? "not-allowed" : "pointer",
              fontFamily: font, transition: "all 150ms ease",
            }}
          >
            {loading ? "Connexion..." : <>Se connecter <ArrowRight size={16} /></>}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: palette.gray[100] }} />
            <span style={{ fontSize: 12, color: palette.gray[400] }}>ou</span>
            <div style={{ flex: 1, height: 1, background: palette.gray[100] }} />
          </div>

          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 20px", borderRadius: radius.md, border: `1px solid ${palette.gray[200]}`, background: palette.white, fontSize: 14, fontWeight: 600, color: palette.gray[900], cursor: "pointer", fontFamily: font }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.805.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            Continuer avec Google
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: palette.gray[100] }}>
          Pas encore de compte ?{" "}
          <Link to="/register" style={{ fontWeight: 700, color: palette.primary.solid, textDecoration: "none" }}>
            S'inscrire gratuitement
          </Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11.5, color: palette.gray[200] }}>
          FactureFlow Africa · Tous droits réservés
        </p>
      </div>
    </div>
  );
}