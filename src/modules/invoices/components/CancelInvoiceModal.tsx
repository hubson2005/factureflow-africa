import React, { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { palette, colors, radius, shadow } from "../../../theme/tokens";
import { font } from "./Primitives";

export function CancelInvoiceModal({
  invoiceNumber,
  onClose,
  onConfirm,
  saving,
}: {
  invoiceNumber: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  function handleConfirm() {
    if (!trimmed || saving) return;
    onConfirm(trimmed);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,15,20,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.white, borderRadius: radius.lg, boxShadow: shadow.card,
          width: "100%", maxWidth: 380, padding: 20, fontFamily: font,
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} color={palette.danger.solid} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>
              Annuler la facture {invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}
          >
            <X size={16} color={colors.gray[400]} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[600] }}>
          Cette action est definitive. Merci d'indiquer le motif de l'annulation.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex : Erreur de saisie, demande du client, doublon..."
          rows={3}
          autoFocus
          style={{
            resize: "none", padding: 10, borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font,
            color: colors.gray[900], outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "8px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
              background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer", fontFamily: font,
            }}
          >
            Retour
          </button>
          <button
            onClick={handleConfirm}
            disabled={!trimmed || saving}
            style={{
              padding: "8px 14px", borderRadius: radius.md, border: "none",
              background: palette.danger.solid, color: colors.white, fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
              cursor: !trimmed || saving ? "not-allowed" : "pointer",
              opacity: !trimmed || saving ? 0.6 : 1, fontFamily: font,
            }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Confirmer l'annulation
          </button>
        </div>
      </div>
    </div>
  );
}