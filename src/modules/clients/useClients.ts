import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useClients() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["clients", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("company_id", company.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

// Fiche d'un client precis (page detail /clients/:id)
export function useClient(clientId) {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .eq("company_id", company.company_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id && !!clientId,
  });
}

// Historique des factures d'un client (page detail /clients/:id)
export function useClientInvoices(clientId) {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["client-invoices", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, total, amount_due, due_date, created_at")
        .eq("client_id", clientId)
        .eq("company_id", company.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id && !!clientId,
  });
}

export function useCreateClient() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          company_id: company.company_id,
          name: client.name,
          company_name: client.company || null,
          email: client.email || null,
          phone: client.phone || null,
          address: client.address || null,
          notes: client.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// Mise a jour d'un client existant (bouton "Modifier")
export function useUpdateClient() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...client }) => {
      const { data, error } = await supabase
        .from("clients")
        .update({
          name: client.name,
          company_name: client.company || null,
          email: client.email || null,
          phone: client.phone || null,
          address: client.address || null,
          notes: client.notes || null,
        })
        .eq("id", id)
        .eq("company_id", company.company_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", data.id] });
    },
  });
}