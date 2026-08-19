import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Star, ArrowLeft, Loader2, Upload, Check, X,
} from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useCompany } from "../hooks/useCompany";
import {
  useInvoiceTemplates, useCreateInvoiceTemplate, useUpdateInvoiceTemplate,
  useDeleteInvoiceTemplate, useSetDefaultInvoiceTemplate, uploadTemplateAsset,
} from "../modules/invoiceTemplates/useInvoiceTemplates";
import { generateInvoicePDFPreviewUrl } from "../modules/invoices/pdfGenerator";
import { LayoutCanvas } from "../modules/invoiceTemplates/components/LayoutCanvas";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const THEMES = [
  { value: "minimal", label: "Minimal" },
  { value: "professionnel", label: "Professionnel" },
  { value: "premium", label: "Premium" },
  { value: "corporate", label: "Corporate" },
  { value: "moderne", label: "Moderne" },
  { value: "africain", label: "Africain" },
  { value: "luxe", label: "Luxe" },
];
const FONTS = ["Inter", "Arial", "Roboto", "Poppins", "Open Sans"];
const COLUMN_OPTIONS = [
  { key: "reference", label: "Référence" },
  { key: "description", label: "Description", locked: true },
  { key: "quantity", label: "Quantité" },
  { key: "unit", label: "Unité" },
  { key: "tva", label: "TVA" },
  { key: "discount", label: "Remise" },
  { key: "unit_price", label: "Prix unitaire", locked: true },
  { key: "total", label: "Total", locked: true },
];

const BLANK_TEMPLATE = {
  name: "",
  theme: "professionnel",
  primaryColor: "#f97316",
  secondaryColor: "#141a1a",
  accentColor: "#78827b",
  logoUrl: null,
  fontFamily: "Inter",
  headerLogoPosition: "left",
  footerMentions: "",
  footerConditions: "",
  footerCoordonnees: "",
  footerReseauxSociaux: "",
  visibleColumns: ["description", "quantity", "unit_price", "total"],
  showSignature: false,
  signatureType: "electronique",
  signatureUrl: null,
  showQrCode: false,
  qrCodeType: "paiement",
  watermarkEnabled: false,
  language: "fr",
  currency: "FCFA",
  useCustomLayout: false,
  layoutBlocks: {},
};

const DEMO_INVOICE = {
  code: "FAC-2026-DEMO",
  issueDate: "01/08/2026",
  dueDate: "31/08/2026",
  status: "en_retard",
  clientName: "Client Démo SARL",
  clientEmail: "contact@client-demo.com",
  clientPhone: "+225 07 00 00 00",
  clientCity: "Abidjan, Côte d'Ivoire",
  companyName: "Votre Entreprise",
  companyPhone: "+225 01 23 45 67",
  companyEmail: "contact@entreprise.com",
  companyAddress: "Cocody, Abidjan",
  items: [
    { description: "Prestation de conseil", qty: 2, unitPrice: 250000, reference: "PR-001", unit: "jour", tvaRate: 0.18 },
    { description: "Développement site web", qty: 1, unitPrice: 800000, reference: "PR-002", unit: "forfait", discount: 10, tvaRate: 0.18 },
  ],
  notes: "Merci de régler avant la date d'échéance.",
};

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
  fontSize: 13.5, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white,
  width: "100%", boxSizing: "border-box",
};

function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 36, border: "1px solid " + colors.gray[200], borderRadius: radius.md,
            padding: 2, cursor: "pointer", background: colors.white }} />
        <input value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
      </div>
    </Field>
  );
}

function TemplateCard({ tpl, onEdit, onDelete, onSetDefault }) {
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 16,
      border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
      display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{tpl.name}</p>
          {tpl.is_default && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: radius.full,
              background: palette.primary[50], color: palette.primary.solid, display: "flex", alignItems: "center", gap: 3 }}>
              <Star size={10} fill={palette.primary.solid} /> Par défaut
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[tpl.primary_color, tpl.secondary_color, tpl.accent_color].map((c, i) => (
          <div key={i} style={{ width: 22, height: 22, borderRadius: radius.sm, background: c, border: "1px solid " + colors.gray[100] }} />
        ))}
        <span style={{ fontSize: 11.5, color: colors.gray[500], marginLeft: 4 }}>
          {THEMES.find((t) => t.value === tpl.theme)?.label} · {tpl.font_family}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={() => onEdit(tpl)} style={{
          flex: 1, padding: "8px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
          background: colors.white, color: colors.gray[700], fontSize: 12.5, fontWeight: 700,
          cursor: "pointer", fontFamily: font }}>Modifier</button>
        {!tpl.is_default && (
          <button onClick={() => onSetDefault(tpl.id)} style={{
            padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, cursor: "pointer" }} title="Definir par defaut">
            <Star size={14} color={colors.gray[500]} />
          </button>
        )}
        <button onClick={() => onDelete(tpl.id)} disabled={tpl.is_default} style={{
          padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
          background: colors.white, cursor: tpl.is_default ? "not-allowed" : "pointer", opacity: tpl.is_default ? 0.4 : 1 }}>
          <Trash2 size={14} color={palette.danger.solid} />
        </button>
      </div>
    </div>
  );
}

function TemplateEditor({ initial, onBack, onSave, saving, companyId }) {
  const [form, setForm] = useState(initial);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleColumn(key) {
    setForm((f) => {
      const has = f.visibleColumns.includes(key);
      return { ...f, visibleColumns: has ? f.visibleColumns.filter((c) => c !== key) : [...f.visibleColumns, key] };
    });
  }

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const url = await generateInvoicePDFPreviewUrl({ ...DEMO_INVOICE, template: form });
        setPreviewUrl(url);
      } catch (err) {
        console.error("Erreur aperçu PDF:", err);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [form]);

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadTemplateAsset(companyId, file, "logo");
      set("logoUrl", url);
    } catch (err) {
      alert("Erreur upload logo: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSignatureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSig(true);
    try {
      const url = await uploadTemplateAsset(companyId, file, "signature");
      set("signatureUrl", url);
    } catch (err) {
      alert("Erreur upload signature: " + err.message);
    } finally {
      setUploadingSig(false);
    }
  }

  const isValid = form.name.trim().length > 0;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, border: "none",
        background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: colors.gray[600],
        fontFamily: font, marginBottom: 12, padding: 0 }}>
        <ArrowLeft size={15} /> Retour aux modèles
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16 }}>
        {/* Formulaire */}
        <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20,
          border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
          display: "flex", flexDirection: "column", gap: 16, maxHeight: "80vh", overflowY: "auto" }}>

          <Field label="Nom du modèle">
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Ex: Facture Export" style={inputStyle} />
          </Field>

          <Field label="Thème">
            <select value={form.theme} onChange={(e) => set("theme", e.target.value)} style={inputStyle}>
              {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ColorField label="Couleur primaire" value={form.primaryColor} onChange={(v) => set("primaryColor", v)} />
            <ColorField label="Couleur secondaire" value={form.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
          </div>
          <ColorField label="Couleur d'accent" value={form.accentColor} onChange={(v) => set("accentColor", v)} />

          <Field label="Logo">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {form.logoUrl && (
                <img src={form.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: radius.md,
                  objectFit: "cover", border: "1px solid " + colors.gray[200] }} />
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
                borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white,
                fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: colors.gray[700], fontFamily: font }}>
                {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {form.logoUrl ? "Changer" : "Importer"} (PNG, SVG, JPG)
                <input type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={handleLogoUpload} style={{ display: "none" }} />
              </label>
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Police">
              <select value={form.fontFamily} onChange={(e) => set("fontFamily", e.target.value)} style={inputStyle}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Position logo (en-tête)">
              <select value={form.headerLogoPosition} onChange={(e) => set("headerLogoPosition", e.target.value)} style={inputStyle}>
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </Field>
          </div>

          <Field label="Colonnes visibles">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COLUMN_OPTIONS.map((c) => {
                const active = form.visibleColumns.includes(c.key);
                return (
                  <button key={c.key} disabled={c.locked} onClick={() => toggleColumn(c.key)} style={{
                    padding: "6px 11px", borderRadius: radius.full, fontSize: 11.5, fontWeight: 700,
                    cursor: c.locked ? "default" : "pointer", fontFamily: font,
                    border: "1px solid " + (active ? palette.primary.solid : colors.gray[200]),
                    background: active ? palette.primary[50] : colors.white,
                    color: active ? palette.primary.solid : colors.gray[500],
                    opacity: c.locked ? 0.7 : 1,
                  }}>{c.label}{c.locked ? " 🔒" : ""}</button>
                );
              })}
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Langue">
              <select value={form.language} onChange={(e) => set("language", e.target.value)} style={inputStyle}>
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="bilingue">Bilingue</option>
              </select>
            </Field>
            <Field label="Devise">
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)} style={inputStyle}>
                <option value="FCFA">FCFA</option>
                <option value="XAF">XAF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
          </div>

          <Field label="Filigrane automatique (brouillon / payée / annulée / en retard)">
            <button onClick={() => set("watermarkEnabled", !form.watermarkEnabled)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: radius.md,
              border: "1px solid " + colors.gray[200], background: colors.white, cursor: "pointer",
              width: "fit-content", fontFamily: font }}>
              <div style={{ width: 34, height: 19, borderRadius: radius.full,
                background: form.watermarkEnabled ? palette.primary.solid : colors.gray[200], position: "relative" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: colors.white, position: "absolute",
                  top: 2.5, left: form.watermarkEnabled ? 17 : 3, transition: "left 150ms ease" }} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[700] }}>
                {form.watermarkEnabled ? "Activé" : "Désactivé"}
              </span>
            </button>
          </Field>

          <Field label="Signature">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => set("showSignature", !form.showSignature)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: radius.md,
                border: "1px solid " + colors.gray[200], background: colors.white, cursor: "pointer",
                width: "fit-content", fontFamily: font }}>
                <div style={{ width: 34, height: 19, borderRadius: radius.full,
                  background: form.showSignature ? palette.primary.solid : colors.gray[200], position: "relative" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: colors.white, position: "absolute",
                    top: 2.5, left: form.showSignature ? 17 : 3, transition: "left 150ms ease" }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[700] }}>
                  {form.showSignature ? "Activée" : "Désactivée"}
                </span>
              </button>
              {form.showSignature && (
                <>
                  <select value={form.signatureType} onChange={(e) => set("signatureType", e.target.value)} style={inputStyle}>
                    <option value="dirigeant">Signature du dirigeant</option>
                    <option value="cachet">Cachet</option>
                    <option value="tampon">Tampon</option>
                    <option value="electronique">Signature électronique</option>
                  </select>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
                    borderRadius: radius.md, border: "1px solid " + colors.gray[200], background: colors.white,
                    fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: colors.gray[700], fontFamily: font,
                    width: "fit-content" }}>
                    {uploadingSig ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {form.signatureUrl ? "Changer l'image" : "Importer une image"}
                    <input type="file" accept="image/png,image/jpeg" onChange={handleSignatureUpload} style={{ display: "none" }} />
                  </label>
                </>
              )}
            </div>
          </Field>

          <Field label="QR Code">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => set("showQrCode", !form.showQrCode)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: radius.md,
                border: "1px solid " + colors.gray[200], background: colors.white, cursor: "pointer",
                width: "fit-content", fontFamily: font }}>
                <div style={{ width: 34, height: 19, borderRadius: radius.full,
                  background: form.showQrCode ? palette.primary.solid : colors.gray[200], position: "relative" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: colors.white, position: "absolute",
                    top: 2.5, left: form.showQrCode ? 17 : 3, transition: "left 150ms ease" }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[700] }}>
                  {form.showQrCode ? "Activé" : "Désactivé"}
                </span>
              </button>
              {form.showQrCode && (
                <select value={form.qrCodeType} onChange={(e) => set("qrCodeType", e.target.value)} style={inputStyle}>
                  <option value="paiement">Lien de paiement</option>
                  <option value="telechargement">Téléchargement</option>
                  <option value="verification">Vérification</option>
                </select>
              )}
            </div>
          </Field>

          <Field label="Mentions légales (pied de page)">
            <textarea value={form.footerMentions} onChange={(e) => set("footerMentions", e.target.value)}
              rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <Field label="Coordonnées (pied de page)">
            <input value={form.footerCoordonnees} onChange={(e) => set("footerCoordonnees", e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Mise en page libre (glisser-déposer)">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => set("useCustomLayout", !form.useCustomLayout)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: radius.md,
                border: "1px solid " + colors.gray[200], background: colors.white, cursor: "pointer",
                width: "fit-content", fontFamily: font }}>
                <div style={{ width: 34, height: 19, borderRadius: radius.full,
                  background: form.useCustomLayout ? palette.primary.solid : colors.gray[200], position: "relative" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: colors.white, position: "absolute",
                    top: 2.5, left: form.useCustomLayout ? 17 : 3, transition: "left 150ms ease" }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[700] }}>
                  {form.useCustomLayout ? "Activée" : "Désactivée"}
                </span>
              </button>

              {form.useCustomLayout && (
                <LayoutCanvas
                  value={form.layoutBlocks || {}}
                  onChange={(v) => set("layoutBlocks", v)}
                  visibleBlocks={[
                    "logo", "company_info", "items_table", "totals",
                    ...(form.showQrCode ? ["qr_code"] : []),
                    ...(form.showSignature ? ["signature"] : []),
                  ]}
                />
              )}
            </div>
          </Field>
        </div>

        {/* Aperçu */}
        <div style={{ position: "sticky", top: 0, alignSelf: "flex-start" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 700, color: colors.gray[600] }}>
            Aperçu en temps réel
          </p>
          <div style={{ background: colors.gray[100], borderRadius: radius.lg, padding: 8, height: "78vh" }}>
            {previewUrl ? (
              <iframe src={previewUrl} title="Aperçu facture" style={{ width: "100%", height: "100%", border: "none", borderRadius: radius.md }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Loader2 size={20} color={palette.primary.solid} className="animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button onClick={onBack} style={{ padding: "10px 18px", borderRadius: radius.md,
          border: "1px solid " + colors.gray[200], background: colors.white, color: colors.gray[600],
          fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: font }}>Annuler</button>
        <button onClick={() => onSave(form)} disabled={!isValid || saving} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: radius.md, border: "none",
          background: isValid && !saving ? palette.primary.solid : colors.gray[200],
          color: isValid && !saving ? colors.white : colors.gray[400],
          fontSize: 13.5, fontWeight: 700, cursor: isValid && !saving ? "pointer" : "not-allowed", fontFamily: font }}>
          {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><Check size={15} /> Enregistrer</>}
        </button>
      </div>
    </div>
  );
}

export default function InvoiceTemplates() {
  const { data: companyRef } = useCompany();
  const { data: templates, isLoading } = useInvoiceTemplates();
  const createTemplate = useCreateInvoiceTemplate();
  const updateTemplate = useUpdateInvoiceTemplate();
  const deleteTemplate = useDeleteInvoiceTemplate();
  const setDefault = useSetDefaultInvoiceTemplate();

  const [editing, setEditing] = useState(null); // null = liste, "new" = création, objet = édition

  function openNew() {
    setEditing({ mode: "new", data: BLANK_TEMPLATE });
  }

  function openEdit(tpl) {
    setEditing({
      mode: "edit",
      id: tpl.id,
      data: {
        name: tpl.name,
        theme: tpl.theme,
        primaryColor: tpl.primary_color,
        secondaryColor: tpl.secondary_color,
        accentColor: tpl.accent_color,
        logoUrl: tpl.logo_url,
        fontFamily: tpl.font_family,
        headerLogoPosition: tpl.header_logo_position,
        footerMentions: tpl.footer_mentions || "",
        footerConditions: tpl.footer_conditions || "",
        footerCoordonnees: tpl.footer_coordonnees || "",
        footerReseauxSociaux: tpl.footer_reseaux_sociaux || "",
        visibleColumns: tpl.visible_columns,
        showSignature: tpl.show_signature,
        signatureType: tpl.signature_type || "electronique",
        signatureUrl: tpl.signature_url,
        showQrCode: tpl.show_qr_code,
        qrCodeType: tpl.qr_code_type || "paiement",
        watermarkEnabled: tpl.watermark_enabled,
        language: tpl.language,
        currency: tpl.currency,
        useCustomLayout: tpl.use_custom_layout || false,
        layoutBlocks: tpl.layout_blocks || {},
      },
    });
  }

  function handleSave(form) {
    if (editing.mode === "new") {
      createTemplate.mutate(form, { onSuccess: () => setEditing(null) });
    } else {
      updateTemplate.mutate({ id: editing.id, ...form }, { onSuccess: () => setEditing(null) });
    }
  }

  if (editing) {
    return (
      <>
        <Header title="Modèles de factures" />
        <TemplateEditor
          initial={editing.data}
          onBack={() => setEditing(null)}
          onSave={handleSave}
          saving={createTemplate.isPending || updateTemplate.isPending}
          companyId={companyRef?.company_id}
        />
      </>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Modèles de factures" />
        <button onClick={openNew} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
          borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
          <Plus size={15} /> Nouveau modèle
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
          {(templates || []).map((tpl) => (
            <TemplateCard key={tpl.id} tpl={tpl} onEdit={openEdit}
              onDelete={(id) => confirm("Supprimer ce modèle ?") && deleteTemplate.mutate(id)}
              onSetDefault={(id) => setDefault.mutate(id)} />
          ))}
        </div>
      )}
    </>
  );
}