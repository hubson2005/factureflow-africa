import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useProducts() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["products", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", company.company_id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateProduct() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          company_id: company.company_id,
          name: product.name,
          description: product.description || null,
          category: product.category || null,
          unit_price: product.unitPrice,
          tax_rate: product.taxRate ?? 18,
          track_stock: product.trackStock || false,
          sku: product.sku || null,
          stock_alert_threshold: product.stockAlertThreshold || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}