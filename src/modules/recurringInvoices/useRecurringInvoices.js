import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useRecurringInvoices() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["recurring_invoices", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select(
          "*, clients(name, company_name), recurring_invoice_items(id, description, quantity, unit_price, tax_rate, sort_order)"
        )
        .eq("company_id", company.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

// Liste de produits pour pre-remplir une ligne d'abonnement (nom, prix, TVA)
export function useProductsForPicker() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["products_picker", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit_price, tax_rate")
        .eq("company_id", company.company_id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateRecurringInvoice() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ...rec }) => {
      const { data: created, error } = await supabase
        .from("recurring_invoices")
        .insert({
          company_id: company.company_id,
          client_id: rec.clientId,
          label: rec.label,
          frequency: rec.frequency,
          interval_count: rec.intervalCount,
          start_date: rec.startDate,
          end_date: rec.endDate || null,
          max_occurrences: rec.maxOccurrences || null,
          next_generation_date: rec.startDate,
          due_days: rec.dueDays,
          notes: rec.notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      const rows = (items || [])
        .filter((i) => i.description.trim() !== "" && Number(i.unitPrice) > 0)
        .map((i, idx) => ({
          recurring_invoice_id: created.id,
          product_id: i.productId || null,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          tax_rate: i.taxRate,
          sort_order: idx,
        }));

      if (rows.length > 0) {
        const { error: itemsErr } = await supabase.from("recurring_invoice_items").insert(rows);
        if (itemsErr) throw itemsErr;
      }
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_invoices"] }),
  });
}

// Changer le statut : active <-> en_pause, ou annulee
export function useUpdateRecurringInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from("recurring_invoices")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_invoices"] }),
  });
}

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("recurring_invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_invoices"] }),
  });
}