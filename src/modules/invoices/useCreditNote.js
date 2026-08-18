import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// Cree un avoir sur une facture existante via la fonction SQL create_credit_note().
// Lignes et montants negatifs generes automatiquement cote serveur, meme sequence
// de numerotation que les factures, journalise dans audit_log.
export function useCreateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, reason }) => {
      const { data, error } = await supabase.rpc("create_credit_note", {
        p_invoice_id: invoiceId,
        p_reason: reason,
      });
      if (error) throw error;
      return data; // id du nouvel avoir
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}