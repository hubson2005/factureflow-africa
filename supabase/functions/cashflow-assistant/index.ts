// supabase/functions/cashflow-assistant/index.ts
//
// Répond en langage naturel à des questions sur la trésorerie de l'entreprise,
// en s'appuyant sur get_cash_flow_summary / get_cash_flow_forecast et Groq.
//
// Déployée AVEC vérification JWT (appelée directement depuis le frontend authentifié) :
//   supabase functions deploy cashflow-assistant --project-ref pufeqrduffcgneaxhuix
//
// Secrets requis : GROQ_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY (déjà présents)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatFCFA(n: number): string {
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, companyId } = await req.json();

    if (!question || !companyId) {
      return new Response(JSON.stringify({ error: "question et companyId requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client scopé à l'utilisateur authentifié : respecte les policies RLS existantes
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Récupère le contexte financier (résumé + prévision détaillée sur 90 jours)
    const { data: summary, error: summaryError } = await supabase.rpc("get_cash_flow_summary", {
      p_company_id: companyId,
      p_days: 90,
    });
    if (summaryError) throw summaryError;

    const { data: forecast, error: forecastError } = await supabase.rpc("get_cash_flow_forecast", {
      p_company_id: companyId,
      p_days: 90,
    });
    if (forecastError) throw forecastError;

    // Factures en retard, avec le client concerné (pour "quel client retarde le plus mes encaissements ?")
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("invoice_number, amount_due, due_date, clients(name)")
      .eq("company_id", companyId)
      .gt("amount_due", 0)
      .lt("due_date", new Date().toISOString().split("T")[0])
      .order("amount_due", { ascending: false })
      .limit(10);

    const { data: recurring } = await supabase
      .from("recurring_transactions")
      .select("type, label, amount, frequency, category")
      .eq("company_id", companyId)
      .eq("is_active", true);

    // Points clés de la courbe (échantillon pour ne pas saturer le prompt)
    const keyPoints = (forecast || []).filter((_: any, i: number) => i % 7 === 0).map((f: any) => ({
      date: f.forecast_date,
      solde: Math.round(f.projected_balance),
    }));

    const context = `
Données financières actuelles de l'entreprise (devise : FCFA) :

RESUME (90 jours) :
- Solde actuel : ${formatFCFA(summary.solde_actuel)}
- Entrées prévues (90j) : ${formatFCFA(summary.entrees_prevues)}
- Sorties prévues (90j) : ${formatFCFA(summary.sorties_prevues)}
- Solde prévisionnel (90j) : ${formatFCFA(summary.solde_previsionnel)}
- Première date de solde négatif : ${summary.premiere_date_negative || "aucune prévue"}
- Montant récupérable (factures en retard) : ${formatFCFA(summary.montant_recuperable)}
- Nombre de clients en retard : ${summary.clients_en_retard}

FACTURES EN RETARD (triées par montant décroissant) :
${(overdueInvoices || []).map((inv: any) =>
  `- ${inv.clients?.name || "Client"} : ${formatFCFA(inv.amount_due)} (facture ${inv.invoice_number}, échue le ${inv.due_date})`
).join("\n") || "Aucune"}

TRANSACTIONS RECURRENTES ACTIVES :
${(recurring || []).map((r: any) =>
  `- ${r.type === "income" ? "Revenu" : "Dépense"} : ${r.label} (${formatFCFA(r.amount)}, ${r.frequency})`
).join("\n") || "Aucune"}

COURBE DE SOLDE PROJETE (echantillon tous les 7 jours) :
${keyPoints.map((p: any) => `${p.date} : ${formatFCFA(p.solde)}`).join("\n")}
`.trim();

    const fallbackAnswer =
      "Je n'ai pas pu générer de réponse détaillée pour le moment, mais voici les chiffres clés : " +
      `solde actuel ${formatFCFA(summary.solde_actuel)}, solde prévisionnel à 90 jours ${formatFCFA(summary.solde_previsionnel)}.`;

    let answer = fallbackAnswer;

    if (GROQ_API_KEY) {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 400,
          messages: [
            {
              role: "system",
              content:
                "Tu es un assistant financier pour une PME africaine utilisant FactureFlow Africa. " +
                "Réponds en français, de façon concise et concrète (3-5 phrases maximum), en te basant " +
                "uniquement sur les données fournies. Utilise des montants en FCFA. Si l'information " +
                "demandée n'est pas dans les données, dis-le clairement plutôt que d'inventer.",
            },
            {
              role: "user",
              content: `${context}\n\nQuestion de l'utilisateur : ${question}`,
            },
          ],
        }),
      });

      if (groqResponse.ok) {
        const groqData = await groqResponse.json();
        answer = groqData.choices?.[0]?.message?.content?.trim() || fallbackAnswer;
      } else {
        console.error("Erreur Groq:", await groqResponse.text());
      }
    }

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cashflow-assistant error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});