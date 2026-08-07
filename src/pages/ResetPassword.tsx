import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { supabase } from "../supabase";

const P = {
  primary: { solid: "#F97316", text: "#D85F0A", 50: "#FFF4EC" },
  gray: { 50: "#F8FAFA", 100: "#F1F3F3", 200: "#E4E7E7", 400: "#9CA6A6", 600: "#5B6666", 900: "#14181A" },
  white: "#FFFFFF",
  danger: { solid: "#E0383E", 50: "#FBEAEA" },
  success: { solid: "#22C55E", 50: "#F0FDF4" },
};
const R = { md: 12, lg: 16 };
const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const inputStyle = {
  width: "100%", background: P.gray[50], border: "1px solid " + P.gray[200], borderRadius: R.md,
  padding: "13px 42px", color: P.gray[900], fontSize: 14, fontFamily: font, outline: "none",
  boxSizing: "border-box",
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Trois etats possibles pendant la verification du lien :
  // "checking" (on attend l'echange du code recu par email) -> "ready" (session ok) -> "invalid" (pas de session)
  const [sessionState, setSessionState] = useState("checking");

  // Evite de basculer deux fois sur l'ecran de confirmation (evenement global + promesse locale)
  const doneRef = useRef(false);

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (session) setSessionState("ready");

      // Filet de securite : si Supabase confirme que le mot de passe a bien ete change
      // (evenement global USER_UPDATED) mais que la promesse locale de handleSubmit
      // ne s'est pas resolue de son cote (observe en pratique), on affiche quand meme
      // l'ecran de confirmation plutot que de laisser le bouton tourner indefiniment.
      if (event === "USER_UPDATED" && !doneRef.current) {
        doneRef.current = true;
        setDone(true);
        setLoading(false);
      }
    });

    // Verification immediate, au cas ou une session existerait deja (ex: page rechargee).
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setSessionState("ready");
    });

    // Si apres quelques secondes aucune session n'est apparue, le lien est vraiment invalide/expire.
    const timeout = setTimeout(() => {
      if (active) setSessionState((s) => (s === "checking" ? "invalid" : s));
    }, 4000);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) return;
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      if (!doneRef.current) {
        doneRef.current = true;
        setDone(true);
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la reinitialisation du mot de passe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: P.gray[50], display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, fontFamily: font }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');"}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: R.md, background: P.primary.solid,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            color: P.white, fontWeight: 800, fontSize: 22 }}>F</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: P.gray[900] }}>
            FactureFlow <span style={{ color: P.primary.solid }}>Africa</span>
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: P.gray[600] }}>
            {done ? "Mot de passe mis a jour" : "Reinitialiser le mot de passe"}
          </p>
        </div>

        <div style={{ background: P.white, borderRadius: R.lg, padding: 28,
          boxShadow: "0 1px 2px rgba(15,18,20,0.04), 0 4px 12px rgba(15,18,20,0.06)" }}>

          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: P.success[50],
                border: "2px solid " + P.success.solid + "44", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 18px" }}>
                <CheckCircle size={32} color={P.success.solid} />
              </div>
              <h2 style={{ color: P.gray[900], fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
                Mot de passe reinitialise
              </h2>
              <p style={{ color: P.gray[600], fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
                Votre mot de passe a ete mis a jour avec succes. Vous pouvez maintenant vous connecter.
              </p>
              <button onClick={() => navigate("/login")} style={{
                width: "100%", padding: "13px", borderRadius: R.md, border: "none", background: P.primary.solid,
                color: P.white, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font }}>
                Se connecter
              </button>
            </div>
          ) : sessionState === "checking" ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <Loader2 size={22} className="animate-spin" color={P.primary.solid} />
              <p style={{ marginTop: 14, fontSize: 13, color: P.gray[600] }}>
                Verification du lien...
              </p>
            </div>
          ) : sessionState === "invalid" ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <p style={{ color: P.gray[600], fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
                Ce lien de reinitialisation est invalide ou a expire. Demandez-en un nouveau.
              </p>
              <Link to="/forgot-password" style={{
                display: "block", width: "100%", padding: "13px", borderRadius: R.md, border: "none",
                background: P.primary.solid, color: P.white, fontWeight: 700, fontSize: 14,
                textAlign: "center", textDecoration: "none", fontFamily: font, boxSizing: "border-box" }}>
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: P.gray[600], lineHeight: 1.5 }}>
                Choisissez un nouveau mot de passe pour votre compte.
              </p>

              <div style={{ position: "relative" }}>
                <Lock size={16} color={P.gray[400]} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="password" style={inputStyle} placeholder="Nouveau mot de passe"
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              <div style={{ position: "relative" }}>
                <Lock size={16} color={P.gray[400]} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="password" style={inputStyle} placeholder="Confirmer le mot de passe"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>

              {error && (
                <div style={{ background: P.danger[50], border: "1px solid " + P.danger.solid + "22",
                  borderRadius: R.md, padding: "10px 14px", fontSize: 13, color: P.danger.solid, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !password || !confirmPassword} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 20px", borderRadius: R.md, border: "none",
                background: (loading || !password || !confirmPassword) ? P.gray[200] : P.primary.solid,
                color: (loading || !password || !confirmPassword) ? P.gray[400] : P.white,
                fontSize: 15, fontWeight: 700,
                cursor: (loading || !password || !confirmPassword) ? "not-allowed" : "pointer",
                fontFamily: font,
              }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Reinitialiser le mot de passe"}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11.5, color: P.gray[400] }}>
          FactureFlow Africa · Tous droits reserves
        </p>
      </div>
    </div>
  );
}