import React, { useState } from "react";
import { Loader2, ShieldAlert, FileText, User, CreditCard, Building2, FileMinus } from "lucide-react";
import { palette, colors, radius, shadow } from "../theme/tokens";
import { Header } from "../components/shell/Header";
import { useCompany } from "../hooks/useCompany";
import { useAuditLog } from "../modules/settings/useAuditLog";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const ENTITY_META: Record<string, { icon: any; label: string }> = {
  invoice: { icon: FileText, label: "Facture" },
  credit_note: { icon: FileMinus, label: "Avoir" },
  client: { icon: User, label: "Client" },
  payment: { icon: CreditCard, label: "Paiement" },
  company: { icon: Building2, label: "Entreprise" },
};

const ACTION_LABELS: Record<string, string> = {
  FACTURE_CREEE: "Facture créée",
  FACTURE_ANNULEE: "Facture annulée",
  FACTURE_PAYEE: "Facture payée",
  FACTURE_STATUT_MODIFIE: "Statut de facture modifié",
  AVOIR_CREE: "Avoir créé",
  PAIEMENT_ENREGISTRE: "Paiement enregistré",
  CLIENT_CREE: "Client créé",
  CLIENT_MODIFIE: "Client modifié",
  ENTREPRISE_CONFIG_MODIFIEE: "Configuration entreprise modifiée",
};

const ACTION_COLORS: Record<string, string> = {
  FACTURE_ANNULEE: palette.danger.solid,
  AVOIR_CREE: palette.danger.solid,
  FACTURE_PAYEE: palette.green.solid,
  PAIEMENT_ENREGISTRE: palette.green.solid,
};

const ENTITY_FILTERS = [
  { value: "", label: "Tous" },
  { value: "invoice", label: "Factures" },
  { value: "credit_note", label: "Avoirs" },
  { value: "client", label: "Clients" },
  { value: "payment", label: "Paiements" },
  { value: "company", label: "Entreprise" },
];

export default function AuditLog() {
  const { data: company } = useCompany();
  const [entityType, setEntityType] = useState("");
  const { data: logs, isLoading } = useAuditLog(company?.company_id, { entityType: entityType || undefined });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Journal d'audit" />
      </div>

      <p style={{ margin: "0 0 16px", fontSize: 12.5, color: colors.gray[600] }}>
        Historique immuable de toutes les actions importantes : création/annulation de factures, avoirs,
        paiements, modifications de clients et de la configuration entreprise.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {ENTITY_FILTERS.map((f) => {
          const active = entityType === f.value;
          return (
            <button key={f.value} onClick={() => setEntityType(f.value)} style={{
              padding: "7px 14px", borderRadius: radius.full,
              border: "1px solid " + (active ? palette.primary.solid : colors.gray[200]),
              background: active ? palette.primary[50] : colors.white,
              color: active ? palette.primary.text : colors.gray[600],
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement...</span>
        </div>
      ) : !logs || logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <ShieldAlert size={28} color={colors.gray[300]} style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 13, color: colors.gray[500] }}>Aucun événement pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log: any) => {
            const meta = ENTITY_META[log.entity_type] || { icon: ShieldAlert, label: log.entity_type };
            const Icon = meta.icon;
            const actionColor = ACTION_COLORS[log.action] || colors.gray[700];
            return (
              <div key={log.id} style={{ display: "flex", gap: 12, background: colors.white, borderRadius: radius.md,
                padding: "12px 14px", border: "1px solid " + colors.gray[100] }}>
                <div style={{ width: 32, height: 32, borderRadius: radius.md, background: colors.gray[50],
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color={colors.gray[500]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: actionColor }}>
                      {ACTION_LABELS[log.action] || log.action}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: colors.gray[400] }}>
                      {new Date(log.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[500] }}>{meta.label}</p>
                  {log.details && (
                    <pre style={{ margin: "6px 0 0", fontSize: 11, color: colors.gray[600], fontFamily: "monospace",
                      whiteSpace: "pre-wrap", wordBreak: "break-word", background: colors.gray[50],
                      padding: "6px 8px", borderRadius: 6 }}>
                      {JSON.stringify(log.details, null, 0)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}