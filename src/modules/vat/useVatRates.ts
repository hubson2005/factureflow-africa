import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

export const VAT_RATE_TYPE_SHORT_LABELS = {
  normal: "Normal",
  reduit: "Réduit",
  exonere: "Exonéré",
  hors_champ: "Hors champ",
};

// Taux de TVA actuellement en vigueur pour un pays donne (utilise par NewInvoiceForm)
export function useVatRates(countryCode) {
  return useQuery({
    queryKey: ["vat-rates", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vat_rates")
        .select("id, rate_type, rate_percent, label")
        .eq("country_code", countryCode)
        .lte("valid_from", new Date().toISOString().slice(0, 10))
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().slice(0, 10)}`)
        .order("rate_type", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!countryCode,
  });
}
