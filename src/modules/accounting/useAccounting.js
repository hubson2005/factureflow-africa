import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useChartOfAccounts() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["chart-of-accounts", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("chart_of_accounts").select("*").order("account_number");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useInitializeAccounting() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("initialize_accounting", { p_company_id: company.company_id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-journals"] });
    },
  });
}

export function useAccountingJournals() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["accounting-journals", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounting_journals").select("*").order("code");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useJournalEntries() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["journal-entries", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*, journal:accounting_journals(code, label), lines:journal_entry_lines(id, debit, credit, label, account:chart_of_accounts(account_number, label))")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

// Balance generale (solde par compte, calculee cote client a partir des
// lignes d'ecriture -- suffisant pour le volume attendu en Phase 1).
export function useTrialBalance() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["trial-balance", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entry_lines")
        .select("debit, credit, account:chart_of_accounts(account_number, label, class)");
      if (error) throw error;
      const byAccount = {};
      for (const line of data) {
        const key = line.account.account_number;
        if (!byAccount[key]) byAccount[key] = { ...line.account, totalDebit: 0, totalCredit: 0 };
        byAccount[key].totalDebit += Number(line.debit);
        byAccount[key].totalCredit += Number(line.credit);
      }
      return Object.values(byAccount).sort((a, b) => a.account_number.localeCompare(b.account_number));
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateManualJournalEntry() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journalCode, entryDate, label, lines }) => {
      const { data, error } = await supabase.rpc("create_manual_journal_entry", {
        p_company_id: company.company_id,
        p_journal_code: journalCode,
        p_entry_date: entryDate,
        p_label: label,
        p_lines: lines,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
    },
  });
}
