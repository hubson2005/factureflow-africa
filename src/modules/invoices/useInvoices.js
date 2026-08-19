import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useInvoices() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["invoices", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name, email, phone), invoice_items(id, description, quantity, unit_price, line_total)")
        .eq("company_id", company.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

function buildInvoiceNumber(format, year, number) {
  return format.replace("{year}", String(year)).replace("{number}", String(number).padStart(5, "0"));
}

export function useCreateInvoice() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, dueDate, notes, items, templateId }) => {
      const companyId = company.company_id;
      const format = company.companies?.invoice_format || "FAC-{year}-{number}";

      // 1. Lire et incrementer le compteur de facture (non atomique mais suffisant pour un solo-dev)
      const { data: comp, error: compErr } = await supabase
        .from("companies")
        .select("next_invoice_number")
        .eq("id", companyId)
        .single();
      if (compErr) throw compErr;

      const number = comp.next_invoice_number;
      const year = new Date().getFullYear();
      const invoiceNumber = buildInvoiceNumber(format, year, number);

      // 2. Creer la facture (subtotal/tax_total/total = 0, seront recalcules par le trigger)
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          company_id: companyId,
          client_id: clientId,
          invoice_number: invoiceNumber,
          status: "envoyee",
          subtotal: 0,
          tax_total: 0,
          total: 0,
          amount_paid: 0,
          amount_due: 0,
          due_date: dueDate || null,
          notes: notes || null,
          template_id: templateId || null,
        })
        .select()
        .single();
      if (invErr) throw invErr;

      // 3. Inserer les lignes (le trigger recalcule les totaux automatiquement)
      const taxRate = Number(company.companies?.tax_rate || 18);
      const rows = items
        .filter((i) => i.description.trim() !== "" && i.unitPrice > 0)
        .map((i) => ({
          invoice_id: invoice.id,
          description: i.description,
          quantity: i.qty,
          unit_price: i.unitPrice,
          tax_rate: taxRate,
          line_total: i.qty * i.unitPrice,
        }));

      const { error: itemsErr } = await supabase.from("invoice_items").insert(rows);
      if (itemsErr) throw itemsErr;

      // 4. Incrementer le compteur pour la prochaine facture
      await supabase
        .from("companies")
        .update({ next_invoice_number: number + 1 })
        .eq("id", companyId);

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}

export function useRecordPayment() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, amount, method = "mobile_money" }) => {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          company_id: company.company_id,
          invoice_id: invoiceId,
          amount,
          method,
          payment_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
      // trg_recalc_invoice_payments met a jour amount_paid/amount_due/status automatiquement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: "annulee" })
        .eq("id", invoiceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useSendInvoiceEmail() {
  const { data: company } = useCompany();
  return useMutation({
    mutationFn: async ({ invoiceId, clientEmail, invoiceNumber, total, dueDate }) => {
      if (!clientEmail) throw new Error("Ce client n'a pas d'adresse email enregistree.");

      const subject = `Facture ${invoiceNumber}`;
      const body =
        `<p>Bonjour,</p>` +
        `<p>Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong> d'un montant de ` +
        `${Number(total).toLocaleString("fr-FR")} FCFA` +
        (dueDate ? `, a regler avant le ${new Date(dueDate).toLocaleDateString("fr-FR")}` : "") +
        `.</p><p>Merci de votre confiance.</p>`;

      // 1. Mettre l'email en file d'attente
      const { data, error } = await supabase
        .from("email_queue")
        .insert({
          company_id: company.company_id,
          to_email: clientEmail,
          subject,
          body,
          related_type: "invoice",
          related_id: invoiceId,
        })
        .select()
        .single();
      if (error) throw error;

      // 2. Declencher l'envoi immediatement (le queueing seul ne suffit pas, rien ne le traitait avant)
      const { data: sendResult, error: sendErr } = await supabase.functions.invoke(
        "send-queued-emails",
        { body: {} }
      );
      if (sendErr) {
        throw new Error("La facture a ete mise en file mais l'envoi a echoue : " + sendErr.message);
      }
      if (sendResult?.failed > 0) {
        throw new Error("L'envoi de l'email a echoue cote serveur. Verifiez la configuration Resend.");
      }

      return { ...data, sendResult };
    },
  });
}