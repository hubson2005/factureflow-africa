import React from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { useQRCode } from "../../../hooks/useQRCode";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export interface FneData {
  fne_status?: string | null;        // 'non_certifiee' | 'certifiee' | 'erreur' | 'simulee'
  fne_reference?: string | null;
  fne_ncc?: string | null;
  fne_qr_token?: string | null;
  fne_certified_at?: string | null;
  fne_error?: string | null;
}

// "Visuel FNE" — bloc QR code + reference, a afficher sur la fiche detail d'une
// facture et (a terme) sur le PDF genere. Le statut "simulee" est visuellement
// distinct de "certifiee" pour ne jamais laisser croire a une vraie certification
// DGI tant que la vraie cle API FNE n'est pas configuree (voir Parametres > Conformite fiscale).
export function InvoiceFneVisual({ fne }: { fne: FneData | null | undefined }) {
  const { dataUrl, loading } = useQRCode(fne?.fne_qr_token || null, { width: 140 });

  if (!fne || !fne.fne_status || fne.fne_status === "non_certifiee") return null;

  const isReal = fne.fne_status === "certifiee";
  const isError = fne.fne_status === "erreur";
  const isSimulated = fne.fne_status === "simulee";

  const statusColor = isReal ? palette.green.solid : isError ? palette.danger.solid : "#CA8A04";
  const statusBg = isReal ? palette.green[50] : isError ? palette.danger[50] : "#FEFCE8";
  const statusLabel = isReal ? "Certifiée FNE" : isError ? "Échec de certification" : "Simulation (aucune vraie certification DGI)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 14,
      borderRadius: radius.md, background: statusBg, border: "1px solid " + statusColor + "33" }}>
      <div style={{ width: 72, height: 72, flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", background: colors.white, borderRadius: radius.sm,
        border: "1px solid " + colors.gray[200] }}>
        {loading ? (
          <span style={{ fontSize: 9, color: colors.gray[400] }}>...</span>
        ) : dataUrl ? (
          <img src={dataUrl} alt="QR code FNE" style={{ width: 64, height: 64 }} />
        ) : (
          <span style={{ fontSize: 9, color: colors.gray[400], textAlign: "center", padding: 4 }}>Pas de QR</span>
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isReal ? <ShieldCheck size={14} color={statusColor} /> : <ShieldAlert size={14} color={statusColor} />}
          <span style={{ fontSize: 12.5, fontWeight: 700, color: statusColor, fontFamily: font }}>{statusLabel}</span>
        </div>
        {fne.fne_reference && (
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: colors.gray[600], fontFamily: font,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Réf : {fne.fne_reference}
          </p>
        )}
        {fne.fne_ncc && (
          <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[600], fontFamily: font }}>
            NCC : {fne.fne_ncc}
          </p>
        )}
        {fne.fne_certified_at && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.gray[400], fontFamily: font }}>
            {new Date(fne.fne_certified_at).toLocaleString("fr-FR")}
          </p>
        )}
        {isError && fne.fne_error && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: palette.danger.solid, fontFamily: font }}>
            {fne.fne_error}
          </p>
        )}
        {isSimulated && (
          <p style={{ margin: "4px 0 0", fontSize: 10.5, color: colors.gray[500], fontFamily: font, lineHeight: 1.4 }}>
            Configurez une vraie clé API dans Paramètres → Conformité fiscale pour une certification réelle.
          </p>
        )}
      </div>
    </div>
  );
}