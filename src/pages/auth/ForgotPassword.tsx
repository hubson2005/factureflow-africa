import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "../../supabase";

const LOGO_URL = "https://pufeqrduffcgneaxhuix.supabase.co/storage/v1/object/public/branding/icon-512.png";

const palette = {
  primary: { solid: "#F97316", text: "#D85F0A", 50: "#FFF4EC" },
  gray: { 50: "#F8FAFA", 100: "#F1F3F3", 200: "#E4E7E7", 400: "#9CA6A6", 600: "#5B6666", 900: "#14181A" },
  white: "#FFFFFF",
  danger: { solid: "#E0383E", 50: "#FBEAEA" },
  success: { solid: "#22C55E", 50: "#F0FDF4" },
};
const radius = { md: 12, lg: 16 };
const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: palette.gray[50], display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO_URL} alt="FactureFlow Africa" style={{ width: 52, height: 52, borderRadius: radius.md, margin: "0 auto 16px", objectFit: "cover", display: "block" }} />
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: palette.gray[900] }}>
            FactureFlow <span style={{ color: palette.primary.solid }}>Africa</span>
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: palette.gray[600] }}>
            {sent ? "Vérifiez votre boîte mail" : "Mot de passe oublié"}
          </p>
        </div>

        <div style={{ background: palette.white, borderRadius: radius.lg, padding: 28, boxShadow: "0 1px 2px rgba(15,18,20,0.04), 0 4px 12px rgba(15,18,20,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>

          {sent ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: palette.success[50], border: `2px solid ${palette.success.solid}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={28} color={palette.success.solid} />
              </div>
              <p style={{ fontSize: 14, color: palette.gray[600], lineHeight: 1.6, marginBottom: 20 }}>
                Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient de vous être envoyé. Pensez à vérifier vos spams.
              </p>
              <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: palette.primary.solid, textDecoration: "none" }}>
                <ArrowLeft size={16} /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: palette.gray[600] }}>
                Entrez votre adresse email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div style={{ background: palette.danger[50], border: `1px solid ${palette.danger.solid}22`, borderRadius: radius.md, padding: "10px 14px", fontSize: 13, color: palette.danger.solid, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 12, background: palette.gray[50], border: `1px solid ${palette.gray[200]}`, borderRadius: radius.md, padding: "13px 14px" }}>
                <Mail size={17} color={palette.gray[400]} />
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: font, color: palette.gray[900] }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 20px", borderRadius: radius.md, border: "none",
                  background: loading || !email ? palette.gray[200] : palette.primary.solid,
                  color: loading || !email ? palette.gray[400] : palette.white,
                  fontSize: 15, fontWeight: 700, cursor: loading || !email ? "not-allowed" : "pointer",
                  fontFamily: font,
                }}
              >
                {loading ? "Envoi..." : <>Envoyer le lien <ArrowRight size={16} /></>}
              </button>

              <Link to="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, color: palette.gray[600], textDecoration: "none", marginTop: 4 }}>
                <ArrowLeft size={14} /> Retour à la connexion
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}