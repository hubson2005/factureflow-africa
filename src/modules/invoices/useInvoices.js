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

      const { data: comp, error: compErr } = await supabase
        .from("companies")
        .select("next_invoice_number")
        .eq("id", companyId)
        .single();
      if (compErr) throw compErr;

      const number = comp.next_invoice_number;
      const year = new Date().getFullYear();
      const invoiceNumber = buildInvoiceNumber(format, year, number);

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

      // tax_rate est explicitement mis a null (et non omis) : en PostgreSQL, une
      // colonne omise recoit sa valeur DEFAULT (18.00 ici) AVANT que le trigger
      // BEFORE INSERT trg_auto_fill_vat_rate ne s'execute, donc son check
      // "if new.tax_rate is null" ne se declenche jamais si on omet la colonne.
      // Verifie empiriquement en base le 19/08 (voir commentaire commit).
      const rows = items
        .filter((i) => i.description.trim() !== "" && i.unitPrice > 0)
        .map((i) => ({
          invoice_id: invoice.id,
          description: i.description,
          quantity: i.qty,
          unit_price: i.unitPrice,
          tax_rate: null,
          vat_rate_type: i.vatRateType || "normal",
          vat_exemption_reason: i.vatExemptionReason || null,
          line_total: i.qty * i.unitPrice,
        }));

      const { error: itemsErr } = await supabase.from("invoice_items").insert(rows);
      if (itemsErr) throw itemsErr;

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, cancellationReason }) => {
      const reason = (cancellationReason || "").trim();
      if (!reason) {
        throw new Error("Un motif d'annulation est requis.");
      }

      const { data, error } = await supabase
        .from("invoices")
        .update({ status: "annulee", cancellation_reason: reason })
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

export function useSendInvoiceReminder() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, clientId, clientEmail, invoiceNumber, amountDue, dueDate }) => {
      if (!clientEmail) throw new Error("Ce client n'a pas d'adresse email enregistree.");
      const companyId = company.company_id;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recent, error: recentErr } = await supabase
        .from("payment_reminders")
        .select("id")
        .eq("invoice_id", invoiceId)
        .eq("reminder_stage", "manuelle")
        .eq("status", "sent")
        .gte("sent_at", oneHourAgo)
        .limit(1);
      if (recentErr) throw recentErr;
      if (recent && recent.length > 0) {
        throw new Error("Une relance a deja ete envoyee recemment pour cette facture.");
      }

      const daysLate = dueDate
        ? Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      const subject = `Rappel - Facture ${invoiceNumber}`;
      const body =
        `<p>Bonjour,</p>` +
        `<p>Nous n'avons pas encore recu le reglement de la facture <strong>${invoiceNumber}</strong> ` +
        `d'un montant restant de ${Number(amountDue).toLocaleString("fr-FR")} FCFA` +
        (dueDate ? `, echue le ${new Date(dueDate).toLocaleDateString("fr-FR")}` : "") +
        (daysLate > 0 ? ` (retard de ${daysLate} jour${daysLate > 1 ? "s" : ""})` : "") +
        `.</p><p>Merci de bien vouloir regulariser votre situation dans les meilleurs delais. ` +
        `Si le paiement a deja ete effectue, merci d'ignorer ce message.</p>`;

      const { data: reminderRow, error: reminderErr } = await supabase
        .from("payment_reminders")
        .insert({
          company_id: companyId,
          client_id: clientId,
          invoice_id: invoiceId,
          reminder_stage: "manuelle",
          channel: "email",
          tone: "standard",
          scheduled_for: new Date().toISOString(),
          status: "pending",
          message_content: body,
        })
        .select()
        .single();
      if (reminderErr) throw reminderErr;

      try {
        const { error: queueErr } = await supabase.from("email_queue").insert({
          company_id: companyId,
          to_email: clientEmail,
          subject,
          body,
          related_type: "invoice_reminder",
          related_id: invoiceId,
        });
        if (queueErr) throw queueErr;

        const { data: sendResult, error: sendErr } = await supabase.functions.invoke(
          "send-queued-emails",
          { body: {} }
        );
        if (sendErr) throw new Error("L'envoi a echoue : " + sendErr.message);
        if (sendResult?.failed > 0) throw new Error("L'envoi a echoue cote serveur (verifiez Resend).");

        await supabase
          .from("payment_reminders")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", reminderRow.id);

        return sendResult;
      } catch (err) {
        await supabase
          .from("payment_reminders")
          .update({ status: "failed", error_message: String(err) })
          .eq("id", reminderRow.id);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// Declenche la certification FNE (Cote d'Ivoire) d'une facture via l'Edge Function
// fne-certify-invoice. Si l'entreprise n'a pas encore de cle API FNE configuree
// (Parametres > Conformite fiscale), la fonction bascule automatiquement en mode
// simulation (statut "simulee", jamais confondu avec une vraie certification DGI).
export function useCertifyInvoiceFne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId) => {
      const { data, error } = await supabase.functions.invoke("fne-certify-invoice", {
        body: { invoice_id: invoiceId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

