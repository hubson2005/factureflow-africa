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
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });
}

// Mise a jour du mode/URL FNE (colonnes normales, non sensibles). La cle API
// elle-meme ne transite JAMAIS par cette mutation ni par une simple update
// de table -- voir useSetFneApiKey/useClearFneApiKey ci-dessous, qui passent
// par des RPC dediees (set_fne_api_key/clear_fne_api_key) stockant la cle
// chiffree dans Supabase Vault, jamais en clair, jamais renvoyee au client.
export function useUpdateFneSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, ...fields }) => {
      const { error } = await supabase
        .from("companies")
        .update({
          fne_mode: fields.fneMode,
          fne_api_url: fields.fneApiUrl || null,
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });
}

// Definit/remplace la cle API FNE. Ne renvoie et ne recoit jamais la cle en
// clair depuis/vers une colonne de table -- passe par la RPC set_fne_api_key
// qui la stocke chiffree dans Supabase Vault (reserve aux admins).
export function useSetFneApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, apiKey }) => {
      const { error } = await supabase.rpc("set_fne_api_key", {
        p_company_id: companyId,
        p_api_key: apiKey,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });
}

// Retire la cle API FNE configuree (repasse l'entreprise en mode simulation).
export function useClearFneApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companyId) => {
      const { error } = await supabase.rpc("clear_fne_api_key", { p_company_id: companyId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });
}
