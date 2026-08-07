import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Building2, Phone, MapPin, Globe2, Coins, AlertCircle } from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";

const P = {
  primary: { solid: "#F97316", text: "#D85F0A", 50: "#FFF4EC" },
  gray: { 50: "#F8FAFA", 100: "#F1F3F3", 200: "#E4E7E7", 400: "#9CA6A6", 600: "#5B6666", 900: "#14181A" },
  white: "#FFFFFF",
  danger: { solid: "#E0383E", 50: "#FBEAEA" },
};
const R = { md: 12, lg: 16, full: 9999 };
const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const PAYS_OPTIONS = [
  { value: "Côte d'Ivoire", currency: "XOF" },
  { value: "Sénégal", currency: "XOF" },
  { value: "Bénin", currency: "XOF" },
  { value: "Togo", currency: "XOF" },
  { value: "Burkina Faso", currency: "XOF" },
  { value: "Mali", currency: "XOF" },
  { value: "Cameroun", currency: "XAF" },
  { value: "Gabon", currency: "XAF" },
  { value: "Congo", currency: "XAF" },
  { value: "Autre", currency: "XOF" },
];

function Field({ icon: Icon, label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: P.gray[600] }}>
        <Icon size={14} /> {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: P.gray[50], border: "1px solid " + P.gray[200], borderRadius: R.md,
  padding: "11px 14px", color: P.gray[900], fontSize: 14, fontFamily: font, outline: "none",
};

export default function RegisterCompany() {
  const { refreshCompanyContext } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState(PAYS_OPTIONS[0].value);
  const [currency, setCurrency] = useState(PAYS_OPTIONS[0].currency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleCountryChange(value) {
    setCountry(value);
    const match = PAYS_OPTIONS.find((p) => p.value === value);
    if (match) setCurrency(match.currency);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: rpcError } = await supabase.rpc("create_company_with_admin", {
      p_name: name,
      p_phone: phone,
      p_address: address,
      p_country: country,
      p_currency: currency,
    });

    if (rpcError) {
      setError(rpcError.message || "Une erreur est survenue lors de la creation de l'entreprise.");
      setLoading(false);
      return;
    }

    await refreshCompanyContext();
    setLoading(false);
    navigate("/dashboard", { replace: true });
  }

  return (
    <div style={{ minHeight: "100vh", background: P.gray[50], display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, fontFamily: font }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');"}</style>
      <div style={{ width: "100%", maxWidth: 460 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: R.md, background: P.primary.solid,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            color: P.white, fontWeight: 800, fontSize: 22 }}>F</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: P.gray[900] }}>
            {"Creez votre "}<span style={{ color: P.primary.solid }}>entreprise</span>
          </h1>
          <p style={{ margin: "0 0 14px", fontSize: 14, color: P.gray[600] }}>
            Ces informations apparaitront sur vos devis et factures
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: R.full, background: P.primary.solid }} />
            <div style={{ width: 24, height: 1, background: P.primary.solid }} />
            <div style={{ width: 8, height: 8, borderRadius: R.full, background: P.primary.solid }} />
          </div>
        </div>

        <div style={{ background: P.white, borderRadius: R.lg, padding: 28,
          boxShadow: "0 1px 2px rgba(15,18,20,0.04), 0 4px 12px rgba(15,18,20,0.06)" }}>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: P.danger[50],
              border: "1px solid " + P.danger.solid + "22", color: P.danger.solid, borderRadius: R.md,
              padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field icon={Building2} label="Nom de l'entreprise">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ma Petite Entreprise SARL" style={inputStyle} />
            </Field>

            <Field icon={Phone} label="Telephone">
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00 00" style={inputStyle} />
            </Field>

            <Field icon={MapPin} label="Adresse">
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Cocody, Abidjan" style={inputStyle} />
            </Field>

            <div style={{ display: "flex", gap: 12 }}>
              <Field icon={Globe2} label="Pays">
                <select value={country} onChange={(e) => handleCountryChange(e.target.value)} style={inputStyle}>
                  {PAYS_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
                </select>
              </Field>
              <Field icon={Coins} label="Devise">
                <input type="text" value={currency} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
              </Field>
            </div>

            <button type="submit" disabled={loading} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 20px", borderRadius: R.md, border: "none",
              background: loading ? P.gray[200] : P.primary.solid,
              color: loading ? P.gray[400] : P.white,
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: font, marginTop: 6,
            }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Continuer vers le tableau de bord"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11.5, color: P.gray[400] }}>
          FactureFlow Africa · Tous droits reserves
        </p>
      </div>
    </div>
  );
}