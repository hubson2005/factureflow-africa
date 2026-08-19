import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useQuotes() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["quotes", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name, email), quote_items(id, description, quantity, unit_price, line_total)")
        .eq("company_id", company.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

function buildQuoteNumber(format, year, number) {
  return format.replace("{year}", String(year)).replace("{number}", String(number).padStart(5, "0"));
}

export function useCreateQuote() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, validUntil, notes, items }) => {
      const companyId = company.company_id;
      const format = company.companies?.quote_format || "DEV-{year}-{number}";
      const { data: comp, error: compErr } = await supabase
        .from("companies")
        .select("next_quote_number")
        .eq("id", companyId)
        .single();
      if (compErr) throw compErr;
      const number = comp.next_quote_number;
      const year = new Date().getFullYear();
      const quoteNumber = buildQuoteNumber(format, year, number);
      const { data: quote, error: quoteErr } = await supabase
        .from("quotes")
        .insert({
          company_id: companyId,
          client_id: clientId,
          quote_number: quoteNumber,
          status: "brouillon", // corrigé : un devis nait en brouillon, "Envoyer" le fait passer à "envoye"
          subtotal: 0,
          tax_total: 0,
          total: 0,
          valid_until: validUntil || null,
          notes: notes || null,
        })
        .select()
        .single();
      if (quoteErr) throw quoteErr;
      const taxRate = Number(company.companies?.tax_rate || 18);
      const rows = items
        .filter((i) => i.description.trim() !== "" && i.unitPrice > 0)
        .map((i) => ({
          quote_id: quote.id,
          description: i.description,
          quantity: i.qty,
          unit_price: i.unitPrice,
          tax_rate: taxRate,
          line_total: i.qty * i.unitPrice,
        }));
      const { error: itemsErr } = await supabase.from("quote_items").insert(rows);
      if (itemsErr) throw itemsErr;
      await supabase
        .from("companies")
        .update({ next_quote_number: number + 1 })
        .eq("id", companyId);
      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}

// Accepter / refuser : simple changement de statut, pas d'email (le client a déjà répondu)
export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

// Envoyer un devis : envoie réellement un email au client (via email_queue) et passe le statut à "envoye"
export function useSendQuote() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId) => {
      const { data: quote, error: quoteErr } = await supabase
        .from("quotes")
        .select("id, quote_number, total, valid_until, notes, client_id, clients(name, email)")
        .eq("id", quoteId)
        .single();
      if (quoteErr) throw quoteErr;

      const clientEmail = quote.clients?.email;
      if (!clientEmail) {
        throw new Error("Ce client n'a pas d'adresse email renseignée. Ajoutez-en une avant d'envoyer le devis.");
      }

      const validUntilText = quote.valid_until
        ? new Date(quote.valid_until).toLocaleDateString("fr-FR")
        : null;

      const body = `
        <p>Bonjour ${quote.clients?.name || ""},</p>
        <p>Veuillez trouver ci-dessous le récapitulatif de votre devis <strong>${quote.quote_number}</strong>.</p>
        <p><strong>Montant total : ${Math.round(quote.total).toLocaleString("fr-FR")} FCFA</strong></p>
        ${validUntilText ? `<p>Ce devis est valable jusqu'au ${validUntilText}.</p>` : ""}
        ${quote.notes ? `<p>Notes : ${quote.notes}</p>` : ""}
        <p>N'hésitez pas à nous contacter pour toute question.</p>
      `.trim();

      const { error: emailErr } = await supabase.from("email_queue").insert({
        company_id: company.company_id,
        to_email: clientEmail,
        subject: `Votre devis ${quote.quote_number}`,
        body,
        related_type: "quote",
        related_id: quoteId,
      });
      if (emailErr) throw emailErr;

      const { error: statusErr } = await supabase
        .from("quotes")
        .update({ status: "envoye" })
        .eq("id", quoteId);
      if (statusErr) throw statusErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}