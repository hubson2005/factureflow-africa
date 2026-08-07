import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// Referentiel des regles de conformite par pays (lecture publique, pas de scoping entreprise)
export function useCountryConfigs() {
  return useQuery({
    queryKey: ["country_configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("country_configs")
        .select("*")
        .order("country_name", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

// Mise a jour des champs de conformite fiscale (country_code, fiscal_number, rccm_number, ...)
export function useUpdateCompanyCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, ...fields }) => {
      console.log("DEBUG mutationFn START", { companyId, fields });
      try {
        const { error } = await supabase
          .from("companies")
          .update({
            country_code: fields.countryCode || null,
            tax_regime: fields.taxRegime || null,
            fiscal_number: fields.fiscalNumber || null,
            rccm_number: fields.rccmNumber || null,
            capital_social: fields.capitalSocial === "" ? null : fields.capitalSocial,
          })
          .eq("id", companyId);
        console.log("DEBUG mutationFn AFTER AWAIT", { error });
        if (error) throw error;
      } catch (e) {
        console.log("DEBUG mutationFn CAUGHT EXCEPTION", e);
        throw e;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });
}

// Mise a jour de la configuration FNE (cle API, mode, URL prod)
export function useUpdateFneSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, ...fields }) => {
      const { error } = await supabase
        .from("companies")
        .update({
          fne_mode: fields.fneMode,
          fne_api_key: fields.fneApiKey || null,
          fne_api_url: fields.fneApiUrl || null,
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });
}
