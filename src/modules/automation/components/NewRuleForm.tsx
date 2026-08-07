import React, { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const TRIGGERS = [
  { value: "nouvelle_facture", label: "Nouvelle facture", field: null },
  { value: "nouveau_paiement", label: "Nouveau paiement", field: null },
  { value: "nouveau_devis", label: "Nouveau devis", field: null },
  { value: "depense_importante", label: "Depense importante", field: "seuil_montant" },
  { value: "client_inactif", label: "Client inactif", field: "jours_inactivite" },
  { value: "seuil_tresorerie", label: "Seuil de tresorerie atteint", field: "seuil_tresorerie" },
];
const ACTIONS = [
  { value: "notification", label: "Envoyer une notification" },
  { value: "tache", label: "Creer une tache" },
  { value: "email", label: "Envoyer un email" },
];

const FIELD_LABELS = {
  seuil_montant: "Seuil de montant (FCFA) *",
  jours_inactivite: "Jours sans facture *",
  seuil_tresorerie: "Seuil de tresorerie (FCFA) *",
};
const FIELD_PLACEHOLDERS = {
  seuil_montant: "100000",
  jours_inactivite: "30",
  seuil_tresorerie: "50000",
};

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

export function NewRuleForm({ onClose, onSave, saving }) {
  const [triggerType, setTriggerType] = useState("nouvelle_facture");
  const [actionType, setActionType] = useState("notification");
  const [fieldValue, setFieldValue] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  const trigger = TRIGGERS.find((t) => t.value === triggerType);
  const isValid = !trigger.field || (fieldValue && Number(fieldValue) > 0);

  function handleSubmit() {
    onSave({
      triggerType,
      actionType,
      conditions: trigger.field ? { [trigger.field]: Number(fieldValue) } : {},
      actionConfig: {
        ...(title ? { title } : {}),
        ...(message ? { message } : {}),
        ...(actionType === "email" && email ? { email } : {}),
      },
    });
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
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouvelle regle</p>
          <div style={{ width: 80 }} />
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Declencheur">
            <select value={triggerType} onChange={(e) => { setTriggerType(e.target.value); setFieldValue(""); }} style={inputStyle}>
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          {trigger.field && (
            <Field label={FIELD_LABELS[trigger.field]}>
              <input type="number" value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} min={0}
                placeholder={FIELD_PLACEHOLDERS[trigger.field]} style={inputStyle} />
            </Field>
          )}

          {(triggerType === "client_inactif" || triggerType === "seuil_tresorerie") && (
            <p style={{ margin: 0, fontSize: 12, color: colors.gray[600], fontStyle: "italic" }}>
              Ce declencheur est evalue manuellement via le bouton "Actualiser" sur cette page (pas en temps reel).
            </p>
          )}

          <Field label="Action">
            <select value={actionType} onChange={(e) => setActionType(e.target.value)} style={inputStyle}>
              {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>

          {actionType === "email" && (
            <Field label="Adresse email destinataire (optionnel)">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Laisser vide pour envoyer à l'administrateur" style={inputStyle} />
            </Field>
          )}

          <Field label="Titre personnalise (optionnel)">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Laisser vide pour le titre par defaut" style={inputStyle} />
          </Field>

          <Field label="Message personnalise (optionnel)">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
              placeholder="Laisser vide pour le message par defaut"
              style={{ padding: "11px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 14, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
                resize: "vertical", width: "100%", boxSizing: "border-box" }} />
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
            {saving ? <><Loader2 size={15} className="animate-spin" /> Creation...</> : <><Check size={15} /> Creer la regle</>}
          </button>
        </div>
      </div>
    </div>
  );
}