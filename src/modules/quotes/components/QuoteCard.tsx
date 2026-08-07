import React from "react";
import { CheckCircle2, Send, XCircle, Download } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { generateQuotePDF } from "../pdfGenerator";
import { useCompany } from "../../../hooks/useCompany";
import { STATUS_LABELS } from "../quotes.status";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

function initialsOf(name) {
  return (name || "?").substring(0, 2).toUpperCase();
}
function colorOf(name) {
  const list = ["primary", "blue", "green", "purple", "yellow", "danger"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return list[Math.abs(hash) % list.length];
}

function Avatar({ initials, color, size }) {
  size = size || 36;
  const p = palette[color || "gray"];
  return (
    <div style={{ width: size, height: size, borderRadius: radius.md, background: p[50], color: p.solid,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32,
      fontWeight: 700, flexShrink: 0, fontFamily: font }}>
      {initials}
    </div>
  );
}

// Couleurs par statut — les libellés viennent désormais de STATUS_LABELS
// (source unique, voir src/modules/quotes/quotes.status.ts)
const STATUS_STYLE = {
  brouillon: { bg: colors.gray[100], color: colors.gray[600] },
  envoye: { bg: palette.blue[50], color: palette.blue.solid },
  accepte: { bg: palette.green[50], color: palette.green.solid },
  refuse: { bg: palette.danger[50], color: palette.danger.solid },
  expire: { bg: colors.gray[100], color: colors.gray[600] },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: colors.gray[100], color: colors.gray[600] };
  const label = STATUS_LABELS[status] || status;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: radius.full,
      background: s.bg, color: s.color, fontFamily: font, whiteSpace: "nowrap", flexShrink: 0 }}>
      {label}
    </span>
  );
}

export function QuoteCard({ quote, onAccept, onSend, onRefuse }) {
  const { data: company } = useCompany();
  const clientColor = colorOf(quote.clientName);
  const canAct = quote.status === "envoye" || quote.status === "brouillon";

  function handleDownloadPDF() {
    generateQuotePDF({
      code: quote.quoteNumber,
      issueDate: new Date(quote.createdAt).toLocaleDateString("fr-FR"),
      validUntil: quote.validUntil ? new Date(quote.validUntil).toLocaleDateString("fr-FR") : null,
      status: quote.status,
      clientName: quote.clientName,
      companyName: company?.companies?.name,
      companySignatureUrl: company?.companies?.signature_url,
      items: (quote.items || []).map((i) => ({
        description: i.description, qty: i.quantity, unitPrice: Number(i.unit_price),
      })),
    });
  }

  return (
    <div className="ff-card" style={{ background: colors.white, borderRadius: radius.lg, padding: 16,
      border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
      display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initialsOf(quote.clientName)} color={clientColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900],
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{quote.clientName}</p>
          <p style={{ margin: 0, fontSize: 12, color: colors.gray[400] }}>{quote.quoteNumber}</p>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.gray[900] }}>
            {Math.round(quote.total).toLocaleString("fr-FR")} <span style={{ fontSize: 12, fontWeight: 500, color: colors.gray[600] }}>FCFA</span>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11.5, color: colors.gray[400] }}>
            {"Émis le " + new Date(quote.createdAt).toLocaleDateString("fr-FR") +
              (quote.validUntil ? " \u00b7 Valide jusqu'au " + new Date(quote.validUntil).toLocaleDateString("fr-FR") : "")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {canAct && (
            <>
              <button onClick={() => onAccept(quote.id)} title="Marquer accepté" style={{ width: 32, height: 32,
                borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <CheckCircle2 size={15} color={palette.green.solid} />
              </button>
              <button onClick={() => onSend(quote.id)} title="Envoyer" style={{ width: 32, height: 32,
                borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Send size={15} color={palette.primary.solid} />
              </button>
              <button onClick={() => onRefuse(quote.id)} title="Refuser" style={{ width: 32, height: 32,
                borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <XCircle size={15} color={palette.danger.solid} />
              </button>
            </>
          )}
          <button onClick={handleDownloadPDF} title="Télécharger PDF" style={{ width: 32, height: 32,
            borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Download size={15} color={palette.primary.solid} />
          </button>
        </div>
      </div>
    </div>
  );
}