// src/modules/invoices/useInvoicePdfContext.js
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

// Récupère l'entreprise + son modèle de facture par défaut (ou un template_id spécifique),
// prêts à être passés à generateInvoicePDF.
export function useInvoicePdfContext(templateId) {
  const { data: companyRef } = useCompany();

  return useQuery({
    queryKey: ["invoice_pdf_context", companyRef?.company_id, templateId],
    queryFn: async () => {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("name, phone, address, logo_url, signature_url, currency")
        .eq("id", companyRef.company_id)
        .single();
      if (companyError) throw companyError;

      let templateQuery = supabase
        .from("invoice_templates")
        .select("*")
        .eq("company_id", companyRef.company_id);

      templateQuery = templateId
        ? templateQuery.eq("id", templateId)
        : templateQuery.eq("is_default", true);

      const { data: template } = await templateQuery.maybeSingle();

      const { data: adminUser } = await supabase
        .from("company_users")
        .select("email")
        .eq("company_id", companyRef.company_id)
        .eq("role", "admin")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      return {
        company: {
          name: company?.name,
          phone: company?.phone,
          address: company?.address,
          email: adminUser?.email,
        },
        template: template
          ? {
              theme: template.theme,
              primaryColor: template.primary_color,
              secondaryColor: template.secondary_color,
              accentColor: template.accent_color,
              logoUrl: template.logo_url || company?.logo_url || null,
              fontFamily: template.font_family,
              headerLogoPosition: template.header_logo_position,
              footerMentions: template.footer_mentions,
              footerConditions: template.footer_conditions,
              footerCoordonnees: template.footer_coordonnees,
              footerReseauxSociaux: template.footer_reseaux_sociaux,
              visibleColumns: template.visible_columns,
              showSignature: template.show_signature,
              signatureUrl: template.signature_url || company?.signature_url || null,
              showQrCode: template.show_qr_code,
              qrCodeType: template.qr_code_type,
              watermarkEnabled: template.watermark_enabled,
              language: template.language,
              currency: template.currency || company?.currency || "FCFA",
            }
          : null,
      };
    },
    enabled: !!companyRef?.company_id,
  });
}