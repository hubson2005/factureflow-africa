// src/modules/invoiceTemplates/useInvoiceTemplates.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useInvoiceTemplates() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["invoice_templates", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_templates")
        .select("*")
        .eq("company_id", company.company_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

function toDbPayload(tpl) {
  return {
    name: tpl.name,
    theme: tpl.theme,
    primary_color: tpl.primaryColor,
    secondary_color: tpl.secondaryColor,
    accent_color: tpl.accentColor,
    logo_url: tpl.logoUrl || null,
    font_family: tpl.fontFamily,
    header_logo_position: tpl.headerLogoPosition,
    footer_mentions: tpl.footerMentions || null,
    footer_conditions: tpl.footerConditions || null,
    footer_coordonnees: tpl.footerCoordonnees || null,
    footer_reseaux_sociaux: tpl.footerReseauxSociaux || null,
    visible_columns: tpl.visibleColumns,
    show_signature: tpl.showSignature,
    signature_type: tpl.signatureType || null,
    signature_url: tpl.signatureUrl || null,
    show_qr_code: tpl.showQrCode,
    qr_code_type: tpl.qrCodeType || null,
    watermark_enabled: tpl.watermarkEnabled,
    language: tpl.language,
    currency: tpl.currency,
    use_custom_layout: tpl.useCustomLayout || false,
    layout_blocks: tpl.layoutBlocks && Object.keys(tpl.layoutBlocks).length > 0 ? tpl.layoutBlocks : null,
  };
}

export function useCreateInvoiceTemplate() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tpl) => {
      const { error } = await supabase.from("invoice_templates").insert({
        company_id: company.company_id,
        ...toDbPayload(tpl),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoice_templates"] }),
  });
}

export function useUpdateInvoiceTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...tpl }) => {
      const { error } = await supabase
        .from("invoice_templates")
        .update(toDbPayload(tpl))
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice_templates"] });
      queryClient.invalidateQueries({ queryKey: ["invoice_pdf_context"] });
    },
  });
}

export function useDeleteInvoiceTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("invoice_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoice_templates"] }),
  });
}

export function useSetDefaultInvoiceTemplate() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      // Retire le statut par défaut de tous les modèles, puis l'attribue au bon
      await supabase
        .from("invoice_templates")
        .update({ is_default: false })
        .eq("company_id", company.company_id);
      const { error } = await supabase
        .from("invoice_templates")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice_templates"] });
      queryClient.invalidateQueries({ queryKey: ["invoice_pdf_context"] });
    },
  });
}

// Upload d'un fichier (logo ou signature) vers le bucket public "branding",
// organisé par entreprise : branding/{company_id}/{prefix}-{timestamp}.{ext}
export async function uploadTemplateAsset(companyId, file, prefix) {
  const ext = file.name.split(".").pop();
  const path = `${companyId}/${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("branding").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("branding").getPublicUrl(path);
  return data.publicUrl;
}