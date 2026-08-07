// src/modules/cashflow/useCashFlow.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useCashFlowSummary(days = 30) {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["cashflow_summary", company?.company_id, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cash_flow_summary", {
        p_company_id: company.company_id,
        p_days: days,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCashFlowForecast(days = 30) {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["cashflow_forecast", company?.company_id, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cash_flow_forecast", {
        p_company_id: company.company_id,
        p_days: days,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useRecurringTransactions() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["recurring_transactions", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("company_id", company.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateRecurringTransaction() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tx) => {
      const { error } = await supabase.from("recurring_transactions").insert({
        company_id: company.company_id,
        type: tx.type,
        label: tx.label,
        amount: tx.amount,
        category: tx.category || null,
        frequency: tx.frequency,
        day_of_month: tx.dayOfMonth || null,
        day_of_week: tx.dayOfWeek ?? null,
        start_date: tx.startDate || new Date().toISOString().split("T")[0],
        end_date: tx.endDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow_summary"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow_forecast"] });
    },
  });
}

export function useToggleRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow_summary"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow_forecast"] });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow_summary"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow_forecast"] });
    },
  });
}

export function useAskCashFlowAssistant() {
  const { data: company } = useCompany();
  return useMutation({
    mutationFn: async (question) => {
      const { data, error } = await supabase.functions.invoke("cashflow-assistant", {
        body: { question, companyId: company.company_id },
      });
      if (error) throw error;
      return data.answer;
    },
  });
}

export function useUpdateCashBalance() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newBalance) => {
      const { error } = await supabase
        .from("companies")
        .update({ cash_balance: newBalance, cash_balance_updated_at: new Date().toISOString() })
        .eq("id", company.company_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashflow_summary"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow_forecast"] });
    },
  });
}