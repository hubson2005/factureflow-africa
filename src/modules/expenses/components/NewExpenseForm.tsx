import React, { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const CATEGORIES = [
  { value: "transport", label: "Transport" },
  { value: "fournitures", label: "Fournitures" },
  { value: "telecom", label: "Telecom" },
  { value: "restauration", label: "Restauration" },
  { value: "loyer", label: "Loyer" },
  { value: "salaires", label: "Salaires" },
  { value: "marketing", label: "Marketing" },
  { value: "services_pro", label: "Services pro." },
  { value: "autre", label: "Autre" },
];

const PAYMENT_METHODS = [
  { value: "especes", label: "Especes" },
  { value: "virement", label: "Virement" },
  { value: "carte", label: "Carte" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "autre", label: "Autre" },
];

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[600] }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
  fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
  width: "100%", boxSizing: "border-box",
};

export function NewExpenseForm({ onClose, onSave, saving }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("autre");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendor, setVendor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("especes");
  const [notes, setNotes] = useState("");

  const isValid = label.trim() !== "" && Number(amount) > 0;

  function handleSubmit() {
    onSave({ label, amount: Number(amount), category, date, vendor, paymentMethod, notes });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: colors.gray[50], borderRadius: radius.lg, width: "100%", maxWidth: 460,
        maxHeight: "90vh", overflowY: "auto", boxShadow: shadow.hover }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: colors.white, borderBottom: "1px solid " + colors.gray[100],
          position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6,
            border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: colors.gray[600], fontFamily: font }}>
            <ArrowLeft size={15} /> Annuler
          </button>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouvelle depense</p>
          <div style={{ width: 80 }} />
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Libelle *">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Carburant vehicule"
              style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Montant (FCFA) *">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0}
                placeholder="45000" style={inputStyle} />
            </Field>
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <Field label="Categorie">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Fournisseur (optionnel)">
              <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Total CI"
                style={inputStyle} />
            </Field>
            <Field label="Mode de paiement">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Notes (optionnel)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Details..." style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200], fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white, resize: "vertical", width: "100%", boxSizing: "border-box" }} />
          </Field>
        </div>

        <div style={{ display: "flex", padding: "16px 20px", background: colors.white,
          borderTop: "1px solid " + colors.gray[100], position: "sticky", bottom: 0 }}>
          <button onClick={handleSubmit} disabled={!isValid || saving} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "12px 16px", borderRadius: radius.md, border: "none",
            background: isValid && !saving ? palette.primary.solid : colors.gray[200],
            color: isValid && !saving ? colors.white : colors.gray[400],
            fontSize: 14, fontWeight: 700, cursor: isValid && !saving ? "pointer" : "not-allowed", fontFamily: font,
          }}>
            {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><Check size={15} /> Enregistrer la depense</>}
          </button>
        </div>
      </div>
    </div>
  );
}