import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useAccounts() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["accounts", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateAccount() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, type, isDefault }) => {
      const { data, error } = await supabase
        .from("accounts")
        .insert({ company_id: company.company_id, name, type, is_default: !!isDefault })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useTreasuryTransactions() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["treasury-transactions", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .select("*, account:accounts(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

// Mouvement manuel (hors ventes/achats/depenses deja synchronises automatiquement).
export function useCreateTreasuryTransaction() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, type, amount, category, description }) => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .insert({
          company_id: company.company_id,
          account_id: accountId,
          type,
          amount,
          category: category || "autre",
          description: description || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

// Achats "commande" ou "receptionne" mais pas encore payes -- pour la section
// "Achats a payer" de la page Tresorerie, ferme la boucle avec le module Achats.
export function usePendingPurchasePayments() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["pending-purchase-payments", company?.company_id],
    queryFn: async () => {
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("id, reference, status, supplier:suppliers(name), items:purchase_items(quantity, unit_price)")
        .in("status", ["commande", "receptionne"]);
      if (error) throw error;

      const { data: paidTx } = await supabase
        .from("treasury_transactions")
        .select("reference_id")
        .eq("category", "achat");
      const paidIds = new Set((paidTx || []).map((t) => t.reference_id));

      return (purchases || [])
        .filter((p) => !paidIds.has(p.id))
        .map((p) => ({
          ...p,
          total: (p.items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0),
        }));
    },
    enabled: !!company?.company_id,
  });
}

export function useMarkPurchasePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ purchaseId, accountId }) => {
      const { error } = await supabase.rpc("mark_purchase_paid", { p_purchase_id: purchaseId, p_account_id: accountId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-purchase-payments"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
