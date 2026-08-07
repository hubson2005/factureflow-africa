import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useExpenses() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["expenses", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", company.company_id)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateExpense() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          company_id: company.company_id,
          label: expense.label,
          amount: expense.amount,
          category: expense.category,
          expense_date: expense.date || new Date().toISOString().split("T")[0],
          vendor: expense.vendor || null,
          payment_method: expense.paymentMethod || null,
          notes: expense.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}