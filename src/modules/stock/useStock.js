import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

// Niveaux de stock actuels, avec le produit et l'entrepot associes.
// RLS filtre deja par entreprise (user_role_in_company), pas besoin de .eq
// explicite sur company_id ici -- contrairement aux hooks plus anciens du
// projet qui filtrent manuellement, on peut s'appuyer sur RLS pour ce module.
export function useStockLevels() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["stock-levels", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_levels")
        .select("id, quantity, updated_at, product:products(id, name, sku, stock_alert_threshold, unit), warehouse:warehouses(id, name)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useWarehouses() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["warehouses", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateWarehouse() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, address, isDefault }) => {
      const { data, error } = await supabase
        .from("warehouses")
        .insert({ company_id: company.company_id, name, address: address || null, is_default: !!isDefault })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

// Mouvement manuel (entree/ajustement/sortie hors facture) -- le trigger
// trg_apply_stock_movement met a jour stock_levels automatiquement.
export function useCreateStockMovement() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, warehouseId, type, quantity, comment }) => {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          company_id: company.company_id,
          product_id: productId,
          warehouse_id: warehouseId,
          type,
          quantity,
          source: "manuel",
          comment: comment || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
    },
  });
}
