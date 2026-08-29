import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

// Recupere l'entreprise (et le role) de l'utilisateur actuellement connecte
export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifie");

      const { data, error } = await supabase
        .from("company_users")
        .select(
          "company_id, role, full_name, companies(" +
          "id, name, phone, address, currency, tax_rate, invoice_format, quote_format, " +
          "subscription_plan, signature_url, " +
          "country_code, tax_regime, fiscal_number, rccm_number, capital_social, " +
          "fne_mode, fne_api_key_secret_id, fne_api_url, fne_balance_sticker, accounting_system" +
          ")"
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}