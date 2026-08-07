// supabase/functions/send-payment-reminders/index.ts
// Envoie les relances "pending" dont l'échéance est passée.
// Génère le message via Groq (même modèle que assistant-ai) avec un ton adapté,
// puis envoie via WhatsApp / SMS / Email selon le canal choisi.
// Déclenché par pg_cron toutes les heures.
//
// MISE À JOUR : le canal "email" insère désormais réellement dans email_queue
// (traité ensuite par send-notification-email via Resend), au lieu du stub console.log.
// WhatsApp et SMS restent des stubs en attendant une intégration réelle.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const TONE_INSTRUCTIONS: Record<string, string> = {
  fidele: "Ton chaleureux et reconnaissant, rappel amical car c'est un client fidèle et de confiance.",
  nouveau: "Ton courtois et pédagogique, expliquer clairement les modalités car c'est un nouveau client.",
  difficile: "Ton ferme mais professionnel et poli, sans agressivité, en rappelant les conséquences du non-paiement.",
  grand_compte: "Ton très professionnel et respectueux, discret, orienté solution (proposer un appel si besoin).",
};

const STAGE_INSTRUCTIONS: Record<string, string> = {
  "J+1": "Premier rappel léger, ton informatif, comme un simple rappel de routine.",
  "J+3": "Deuxième rappel, un peu plus insistant mais toujours courtois.",
  "J+7": "Rappel plus ferme, mentionner le retard clairement.",
  "J+15": "Rappel urgent, mentionner les éventuelles pénalités ou conséquences.",
  "J+30": "Dernier rappel avant escalade, ton sérieux, proposer un geste (échéancier) ou avertir d'une action à venir.",
};

async function generateReminderMessage(
  clientName: string,
  invoiceNumber: string,
  amount: number,
  daysLate: number,
  tone: string,
  stage: string
): Promise<string> {
  const prompt = `Rédige un message court (3-4 phrases max) de relance de paiement en français pour ${clientName}.
Facture n°${invoiceNumber}, montant ${amount} FCFA, en retard de ${daysLate} jours.
${TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.fidele}
${STAGE_INSTRUCTIONS[stage] ?? ""}
Le message doit être prêt à envoyer tel quel, sans formule d'introduction du type "Voici le message".`;

  const fallback = `Bonjour ${clientName}, nous vous rappelons que la facture n°${invoiceNumber} d'un montant de ${amount} FCFA est en retard de ${daysLate} jours. Merci de bien vouloir régulariser dans les meilleurs délais.`;

  if (!GROQ_API_KEY) return fallback;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return fallback;

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? fallback;
  } catch {
    return fallback;
  }
}

// deno-lint-ignore no-explicit-any
async function sendViaChannel(
  channel: string,
  clientContact: { phone?: string; email?: string },
  message: string,
  subjectContext: { companyId: string; invoiceNumber: string; relatedId: string },
  supabase: any
): Promise<boolean> {
  switch (channel) {
    case "whatsapp": {
      if (!clientContact.phone) return false;
      // TODO: aucune intégration WhatsApp déployée sur factureflow-africa pour l'instant.
      console.log(`[WHATSAPP - STUB] to ${clientContact.phone}: ${message}`);
      return true;
    }
    case "sms": {
      if (!clientContact.phone) return false;
      // TODO: aucune intégration SMS déployée pour l'instant.
      console.log(`[SMS - STUB] to ${clientContact.phone}: ${message}`);
      return true;
    }
    case "email": {
      if (!clientContact.email) return false;

      const { error } = await supabase.from("email_queue").insert({
        company_id: subjectContext.companyId,
        to_email: clientContact.email,
        subject: `Rappel de paiement — Facture ${subjectContext.invoiceNumber}`,
        body: `<p>${message.replace(/\n/g, "</p><p>")}</p>`,
        related_type: "invoice",
        related_id: subjectContext.relatedId,
        // status par défaut "pending" -> traité par le cron send-notification-email
      });

      if (error) {
        console.error("Erreur insertion email_queue:", error);
        return false;
      }
      return true;
    }
    default:
      return false;
  }
}

Deno.serve(async (req: Request) => {
  const providedSecret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: pending, error } = await supabase
      .from("payment_reminders")
      .select("id, company_id, client_id, invoice_id, reminder_stage, channel, tone")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(100);

    if (error) throw error;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ message: "Aucune relance à envoyer", sent: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of pending) {
      try {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("invoice_number, total, amount_due, due_date")
          .eq("id", reminder.invoice_id)
          .maybeSingle();

        const { data: client } = await supabase
          .from("clients")
          .select("name, phone, email")
          .eq("id", reminder.client_id)
          .maybeSingle();

        if (!invoice || !client) {
          await supabase
            .from("payment_reminders")
            .update({ status: "failed", error_message: "Facture ou client introuvable" })
            .eq("id", reminder.id);
          failedCount++;
          continue;
        }

        const daysLate = Math.floor(
          (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        const message = await generateReminderMessage(
          client.name,
          invoice.invoice_number,
          invoice.amount_due,
          daysLate,
          reminder.tone,
          reminder.reminder_stage
        );

        const success = await sendViaChannel(
          reminder.channel,
          { phone: client.phone, email: client.email },
          message,
          {
            companyId: reminder.company_id,
            invoiceNumber: invoice.invoice_number,
            relatedId: reminder.invoice_id,
          },
          supabase
        );

        await supabase
          .from("payment_reminders")
          .update({
            status: success ? "sent" : "failed",
            message_content: message,
            sent_at: success ? new Date().toISOString() : null,
            error_message: success ? null : "Échec envoi via " + reminder.channel,
          })
          .eq("id", reminder.id);

        if (success) sentCount++;
        else failedCount++;
      } catch (innerErr) {
        console.error(`Erreur relance ${reminder.id}:`, innerErr);
        await supabase
          .from("payment_reminders")
          .update({ status: "failed", error_message: String(innerErr) })
          .eq("id", reminder.id);
        failedCount++;
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, failed: failedCount }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-payment-reminders error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});