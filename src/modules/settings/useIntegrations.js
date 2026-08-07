import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// --- Cles API ---

export function useApiKeys(companyId) {
  return useQuery({
    queryKey: ["api_keys", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, scopes, revoked, last_used_at, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

// Retourne { id, plain_key } — plain_key ne sera plus jamais recuperable ensuite
export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, name, scopes }) => {
      const { data, error } = await supabase.rpc("generate_api_key", {
        p_company_id: companyId,
        p_name: name,
        p_scopes: scopes || null,
      });
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("api_keys").update({ revoked: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}

// --- Webhooks ---

export function useWebhookEndpoints(companyId) {
  return useQuery({
    queryKey: ["webhook_endpoints", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .select("id, url, events, active, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateWebhookEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, url, events }) => {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .insert({ company_id: companyId, url, events })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhook_endpoints"] }),
  });
}

export function useToggleWebhookEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }) => {
      const { error } = await supabase.from("webhook_endpoints").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhook_endpoints"] }),
  });
}

export function useDeleteWebhookEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhook_endpoints"] }),
  });
}