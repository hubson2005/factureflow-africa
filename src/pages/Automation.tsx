import React, { useState } from "react";
import { Zap, Plus, Trash2, Bell, ClipboardCheck, Mail, Loader2, RefreshCw, Send } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import {
  useAutomationRules,
  useCreateRule,
  useToggleRule,
  useDeleteRule,
  useEvaluateRules,
  useSendQueuedEmails,
} from "../modules/automation/useAutomation";
import { NewRuleForm } from "../modules/automation/components/NewRuleForm";


const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";


const TRIGGER_LABELS = {
  nouvelle_facture: "Nouvelle facture",
  nouveau_paiement: "Nouveau paiement",
  nouveau_devis: "Nouveau devis",
  depense_importante: "Depense importante",
  client_inactif: "Client inactif",
  seuil_tresorerie: "Seuil de tresorerie atteint",
};
const PERIODIC_TRIGGERS = ["client_inactif", "seuil_tresorerie"];
const ACTION_LABELS = { notification: "Notification", tache: "Creation de tache", email: "Email" };
const ACTION_ICONS = { notification: Bell, tache: ClipboardCheck, email: Mail };


function conditionLabel(r) {
  if (!r.conditions) return "";
  if (r.conditions.seuil_montant) return " (seuil : " + Number(r.conditions.seuil_montant).toLocaleString("fr-FR") + " FCFA)";
  if (r.conditions.jours_inactivite) return " (" + r.conditions.jours_inactivite + " jours)";
  if (r.conditions.seuil_tresorerie) return " (seuil : " + Number(r.conditions.seuil_tresorerie).toLocaleString("fr-FR") + " FCFA)";
  return "";
}


function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: radius.full, border: "none", cursor: "pointer",
      background: value ? palette.primary.solid : colors.gray[200],
      position: "relative", transition: "background 200ms ease", flexShrink: 0,
    }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: colors.white,
        position: "absolute", top: 3, left: value ? 21 : 3, transition: "left 200ms ease" }} />
    </button>
  );
}


export default function Automation() {
  const { data: rules, isLoading, isError } = useAutomationRules();
  const createRule = useCreateRule();
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();
  const evaluateRules = useEvaluateRules();
  const sendQueuedEmails = useSendQueuedEmails();
  const [showForm, setShowForm] = useState(false);
  const [evalMessage, setEvalMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");


  const hasPeriodicRules = (rules || []).some((r) => PERIODIC_TRIGGERS.includes(r.trigger_type) && r.is_active);
  const hasEmailRules = (rules || []).some((r) => r.action_type === "email" && r.is_active);


  function handleSave(data) {
    createRule.mutate(data, {
      onSuccess: () => setShowForm(false),
      onError: (err) => alert("Erreur : " + err.message),
    });
  }


  function handleDelete(id) {
    if (confirm("Supprimer cette regle ?")) deleteRule.mutate(id);
  }


  function handleEvaluate() {
    setEvalMessage("");
    evaluateRules.mutate(undefined, {
      onSuccess: (count) => {
        setEvalMessage(count > 0 ? count + " nouvelle(s) alerte(s) creee(s)." : "Aucune nouvelle alerte pour le moment.");
      },
      onError: (err) => alert("Erreur : " + err.message),
    });
  }


  function handleSendEmails() {
    setEmailMessage("");
    sendQueuedEmails.mutate(undefined, {
      onSuccess: (result) => {
        const { sent = 0, failed = 0, total = 0 } = result || {};
        setEmailMessage(
          total === 0
            ? "Aucun email en attente."
            : sent + " email(s) envoye(s)" + (failed ? ", " + failed + " echec(s)" : "")
        );
      },
      onError: (err) => alert("Erreur : " + err.message),
    });
  }


  return (
    <>
      {showForm && <NewRuleForm onClose={() => setShowForm(false)} onSave={handleSave} saving={createRule.isPending} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <Header title="Automatisation" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {hasEmailRules && (
            <button onClick={handleSendEmails} disabled={sendQueuedEmails.isPending} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: colors.white, color: colors.gray[700],
              border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 700,
              cursor: sendQueuedEmails.isPending ? "not-allowed" : "pointer", fontFamily: font }}>
              {sendQueuedEmails.isPending
                ? <Loader2 size={15} className="animate-spin" />
                : <Send size={15} />}
              Envoyer les emails
            </button>
          )}
          {hasPeriodicRules && (
            <button onClick={handleEvaluate} disabled={evaluateRules.isPending} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: colors.white, color: colors.gray[700],
              border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 700,
              cursor: evaluateRules.isPending ? "not-allowed" : "pointer", fontFamily: font }}>
              {evaluateRules.isPending
                ? <Loader2 size={15} className="animate-spin" />
                : <RefreshCw size={15} />}
              Actualiser
            </button>
          )}
          <button onClick={() => setShowForm(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
            border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
            <Plus size={15} /> Nouvelle regle
          </button>
        </div>
      </div>


      <div style={{ background: palette.primary[50], borderRadius: radius.lg, padding: 16,
        border: "1px solid " + palette.primary[100], display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <Zap size={20} color={palette.primary.solid} />
        <p style={{ margin: 0, fontSize: 13, color: colors.gray[700] }}>
          Automatisez vos notifications et taches en fonction des evenements de votre entreprise. Les regles "Client inactif" et "Seuil de tresorerie" s'evaluent via le bouton Actualiser.
        </p>
      </div>


      {evalMessage && (
        <p style={{ margin: "0 0 4px", fontSize: 13, color: palette.green.solid, fontWeight: 600 }}>{evalMessage}</p>
      )}
      {emailMessage && (
        <p style={{ margin: "0 0 4px", fontSize: 13, color: palette.green.solid, fontWeight: 600 }}>{emailMessage}</p>
      )}


      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {(!rules || rules.length === 0) ? (
            <p style={{ textAlign: "center", color: colors.gray[600], fontSize: 13, padding: "40px 0" }}>
              Aucune regle configuree. Creez votre premiere automatisation !
            </p>
          ) : rules.map((r) => {
            const Icon = ACTION_ICONS[r.action_type] || Bell;
            const isPeriodic = PERIODIC_TRIGGERS.includes(r.trigger_type);
            return (
              <div key={r.id} className="ff-card" style={{ background: colors.white, borderRadius: radius.lg,
                padding: 16, border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
                display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: radius.md, background: palette.primary[50],
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={palette.primary.solid} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
                      {TRIGGER_LABELS[r.trigger_type] || r.trigger_type}
                    </p>
                    {isPeriodic && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: radius.full,
                        background: colors.gray[100], color: colors.gray[600] }}>MANUEL</span>
                    )}
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[600] }}>
                    {"\u2192 " + (ACTION_LABELS[r.action_type] || r.action_type) + conditionLabel(r)}
                  </p>
                </div>
                <Toggle value={r.is_active} onChange={(v) => toggleRule.mutate({ id: r.id, isActive: v })} />
                <button onClick={() => handleDelete(r.id)} style={{
                  border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                  <Trash2 size={16} color={palette.danger.solid} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
