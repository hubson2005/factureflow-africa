// supabase/functions/schedule-payment-reminders/index.ts
// Détecte les factures en retard et planifie les relances automatiques
// (J+1, J+3, J+7, J+15, J+30) selon le profil de risque du client.
// Déclenché par pg_cron une fois par jour.
//
// SÉCURITÉ : requiert le header x-cron-secret (même valeur que CRON_SECRET
// utilisé par send-notification-email), pour éviter tout déclenchement public.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const REMINDER_STAGES = [
  { stage: "J+1", days: 1 },
  { stage: "J+3", days: 3 },
  { stage: "J+7", days: 7 },
  { stage: "J+15", days: 15 },
  { stage: "J+30", days: 30 },
];

function pickChannel(stage: string, riskLevel: string): string {
  if (stage === "J+1") return "email";
  if (stage === "J+3") return riskLevel === "risque" ? "whatsapp" : "email";
  if (stage === "J+7") return "whatsapp";
  if (stage === "J+15") return "whatsapp";
  return "sms";
}

function pickTone(riskLevel: string, isNewClient: boolean, isBigAccount: boolean): string {
  if (isBigAccount) return "grand_compte";
  if (isNewClient) return "nouveau";
  if (riskLevel === "risque") return "difficile";
  return "fidele";
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

    const { data: overdueInvoices, error: invError } = await supabase
      .from("invoices")
      .select("id, company_id, client_id, total, amount_due, due_date, status")
      .gt("amount_due", 0)
      .lt("due_date", new Date().toISOString().split("T")[0])
      .not("status", "in", "(brouillon)");

    if (invError) throw invError;
    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(JSON.stringify({ message: "Aucune facture en retard", scheduled: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let scheduledCount = 0;

    for (const invoice of overdueInvoices) {
      const dueDate = new Date(invoice.due_date);
      const daysLate = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const { data: scoreData } = await supabase
        .from("client_scores")
        .select("risk_level, client_since, total_revenue_generated")
        .eq("company_id", invoice.company_id)
        .eq("client_id", invoice.client_id)
        .maybeSingle();

      const riskLevel = scoreData?.risk_level ?? "moyen";
      const isNewClient = scoreData?.client_since
        ? (Date.now() - new Date(scoreData.client_since).getTime()) / (1000 * 60 * 60 * 24) < 60
        : true;
      const isBigAccount = (scoreData?.total_revenue_generated ?? 0) > 500000;

      for (const { stage, days } of REMINDER_STAGES) {
        if (daysLate < days) continue;

        const { data: existing } = await supabase
          .from("payment_reminders")
          .select("id")
          .eq("invoice_id", invoice.id)
          .eq("reminder_stage", stage)
          .maybeSingle();

        if (existing) continue;

        const channel = pickChannel(stage, riskLevel);
        const tone = pickTone(riskLevel, isNewClient, isBigAccount);

        const { error: insertError } = await supabase.from("payment_reminders").insert({
          company_id: invoice.company_id,
          client_id: invoice.client_id,
          invoice_id: invoice.id,
          reminder_stage: stage,
          channel,
          tone,
          scheduled_for: new Date().toISOString(),
          status: "pending",
        });

        if (!insertError) scheduledCount++;
      }
    }

    return new Response(
      JSON.stringify({ message: "Relances planifiées", scheduled: scheduledCount }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("schedule-payment-reminders error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});