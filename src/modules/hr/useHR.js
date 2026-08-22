import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useEmployees() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["employees", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateEmployee() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ firstName, lastName, position, phone, email, hireDate, monthlySalary }) => {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          company_id: company.company_id,
          first_name: firstName,
          last_name: lastName,
          position: position || null,
          phone: phone || null,
          email: email || null,
          hire_date: hireDate || null,
          monthly_salary: monthlySalary,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function usePayslips() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["payslips", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*, employee:employees(first_name, last_name, position)")
        .order("period", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreatePayslip() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, period, grossSalary, bonuses, deductions }) => {
      const { data, error } = await supabase
        .from("payslips")
        .insert({
          company_id: company.company_id,
          employee_id: employeeId,
          period,
          gross_salary: grossSalary,
          bonuses: bonuses || 0,
          deductions: deductions || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payslips"] }),
  });
}

export function usePayPayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payslipId, accountId }) => {
      const { error } = await supabase.rpc("pay_payslip", { p_payslip_id: payslipId, p_account_id: accountId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-transactions"] });
    },
  });
}
