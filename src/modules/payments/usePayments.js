import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function usePayments() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["payments", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, invoices(invoice_number, clients(name))")
        .eq("company_id", company.company_id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}