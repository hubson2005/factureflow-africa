import { useState } from 'react';

// Libellés FR pour les clés de champs renvoyées par calculate_invoice_compliance_score()
const FIELD_LABELS: Record<string, string> = {
  company_name: 'Raison sociale de l\'entreprise',
  company_address: 'Adresse de l\'entreprise',
  company_phone: 'Téléphone de l\'entreprise',
  fiscal_number: 'Numéro fiscal (NCC/NINEA/IFU)',
  rccm_number: 'Numéro RCCM',
  capital_social: 'Capital social',
  client_name: 'Nom du client',
  client_tax_number: 'Numéro fiscal du client',
  due_date: 'Date d\'échéance',
  line_items: 'Lignes de facturation',
};

// Thème clair — aligné visuellement sur les cartes InvoiceCard (fond blanc, gray[...]).
// Remplace ces couleurs par les tokens exacts de theme/tokens.js si tu préfères
// une cohérence stricte (palette.green.solid, palette.yellow.solid, palette.danger.solid...).
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  conforme: { label: 'Conforme', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✓' },
  incomplet: { label: 'Incomplet', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: '!' },
  non_conforme: { label: 'Non conforme', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '✕' },
  pays_non_configure: { label: 'Pays non configuré', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: '?' },
};

const EINVOICING_LABELS: Record<string, string> = {
  obligatoire: 'Facturation électronique obligatoire',
  en_deploiement: 'Facturation électronique en déploiement',
  non_requis: 'Facturation électronique non requise',
};

interface ComplianceStatus {
  score: number;
  status: keyof typeof STATUS_CONFIG;
  missing_fields: string[];
  country_code: string | null;
  e_invoicing_system: string | null;
  e_invoicing_status: keyof typeof EINVOICING_LABELS | null;
  computed_at: string;
}

interface ComplianceScoreBadgeProps {
  complianceStatus: ComplianceStatus | null | undefined;
}

const FONT = "'Inter',-apple-system,sans-serif";

export default function ComplianceScoreBadge({ complianceStatus }: ComplianceScoreBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!complianceStatus) return null;

  const { score, status, missing_fields, e_invoicing_system, e_invoicing_status } = complianceStatus;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pays_non_configure;
  const hasMissing = missing_fields && missing_fields.length > 0;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, fontFamily: FONT }}>
      <button
        onClick={() => hasMissing && setExpanded(!expanded)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px',
          borderRadius: 999,
          border: `1px solid ${config.border}`,
          background: config.bg,
          color: config.color,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: hasMissing ? 'pointer' : 'default',
          fontFamily: FONT,
        }}
      >
        <span style={{ fontSize: 10 }}>{config.icon}</span>
        {config.label} · {score}%
        {hasMissing && (
          <span style={{ fontSize: 9, opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>
        )}
      </button>

      {e_invoicing_system && e_invoicing_status && e_invoicing_status !== 'non_requis' && (
        <span
          style={{
            fontSize: 10.5,
            color: e_invoicing_status === 'obligatoire' ? '#ea580c' : '#94a3b8',
          }}
        >
          {e_invoicing_system} · {EINVOICING_LABELS[e_invoicing_status]}
        </span>
      )}

      {expanded && hasMissing && (
        <ul
          style={{
            margin: 0,
            padding: '6px 10px',
            borderRadius: 8,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: 11.5,
            color: '#475569',
            listStyle: 'none',
          }}
        >
          {missing_fields.map((field) => (
            <li key={field} style={{ padding: '1px 0' }}>
              — {FIELD_LABELS[field] || field}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}