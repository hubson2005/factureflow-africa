import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useSuppliers() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["suppliers", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateSupplier() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, contact, phone, email, address }) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({ company_id: company.company_id, name, contact: contact || null, phone: phone || null, email: email || null, address: address || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function usePurchases() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["purchases", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, supplier:suppliers(name), warehouse:warehouses(name), items:purchase_items(id, quantity, unit_price, quantity_received, product:products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreatePurchase() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ supplierId, warehouseId, reference, items }) => {
      const { data: purchase, error } = await supabase
        .from("purchases")
        .insert({
          company_id: company.company_id,
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          reference: reference || null,
          status: "commande",
          order_date: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      const validItems = items.filter((i) => i.productId && i.quantity > 0);
      const { error: itemsError } = await supabase.from("purchase_items").insert(
        validItems.map((i) => ({
          company_id: company.company_id,
          purchase_id: purchase.id,
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice || 0,
        }))
      );
      if (itemsError) throw itemsError;
      return purchase;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

// Reception (totale ou partielle repetee) : cree les mouvements de stock 'entree'
// correspondants via la fonction SQL receive_purchase().
export function useReceivePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (purchaseId) => {
      const { error } = await supabase.rpc("receive_purchase", { p_purchase_id: purchaseId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
    },
  });
}
