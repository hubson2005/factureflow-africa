// supabase/functions/send-notification-email/index.ts
//
// Traite les lignes "pending" de la table email_queue et les envoie via Resend.
// Applique un template HTML soigné (charte FactureFlow Africa) autour du contenu
// brut stocké dans email_queue.body, quelle que soit son origine
// (automation_rules, payment_reminders, etc.).
//
// Déclenchée toutes les 5 min par un cron pg_cron (voir migration associée).
//
// Secrets requis :
//   RESEND_API_KEY, CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const FROM_EMAIL = "facturation@socialapp.work";
const FROM_NAME = "FactureFlow Africa";
const BATCH_SIZE = 20;

// Charte FactureFlow Africa (palette orange, thème clair pour l'email — les clients
// email gèrent mal le dark mode, on reste sur fond blanc pour la lisibilité)
const BRAND_ORANGE = "#ee7217";
const BRAND_DARK = "#2c2f31";
const LOGO_URL = "https://pufeqrduffcgneaxhuix.supabase.co/storage/v1/object/public/branding/icon-512.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface EmailQueueRow {
  id: string;
  company_id: string;
  to_email: string;
  subject: string;
  body: string;
  related_type: string | null;
  related_id: string | null;
  status: string;
}

function wrapInTemplate(subject: string, bodyHtml: string): string {
  const year = new Date().getFullYear();
  // Aperçu texte caché (preheader) : améliore le rendu dans la liste de messages
  // (Gmail/Outlook affichent ce texte à côté du sujet)
  const preheaderSource = bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const preheader = preheaderSource.slice(0, 130);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; }
    a { color:${BRAND_ORANGE}; }
    .content a { font-weight:600; text-decoration:underline; }
    .btn { display:inline-block; background-color:${BRAND_ORANGE}; color:#ffffff !important;
      text-decoration:none !important; font-weight:700; font-size:14px; padding:12px 24px;
      border-radius:8px; margin-top:8px; }
    .content p { margin:0 0 14px; }
    .content p:last-child { margin-bottom:0; }
    .content strong { color:${BRAND_DARK}; }
    @media (max-width:600px) {
      .wrapper { padding:20px 12px !important; }
      .card-padding { padding:24px 20px !important; }
    }
  </style>
</head>
<body style="background-color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <!-- Preheader (invisible, améliore l'aperçu dans la boîte de réception) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wrapper" style="background-color:#f4f4f5; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Liseré d'accent -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, ${BRAND_ORANGE}, #f7a35c); border-radius:12px 12px 0 0; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Carte principale -->
          <tr>
            <td style="background-color:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);">

              <!-- Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="card-padding" style="padding:28px 32px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px; height:36px; vertical-align:middle;">
                          <img src="${LOGO_URL}" alt="FactureFlow Africa" width="36" height="36" style="display:block; border-radius:8px;" />
                        </td>
                        <td style="padding-left:11px; vertical-align:middle;">
                          <span style="color:${BRAND_DARK}; font-size:16px; font-weight:700; letter-spacing:-0.2px;">
                            FactureFlow <span style="color:${BRAND_ORANGE};">Africa</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Séparateur fin -->
              <div style="border-top:1px solid #f0f0f1; margin:0 32px;"></div>

              <!-- Corps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="card-padding" style="padding:28px 32px 8px;">
                    <div class="content" style="color:#3f3f46; font-size:15px; line-height:1.65;">
                      ${bodyHtml}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="card-padding" style="padding:24px 32px 28px;">
                    <div style="border-top:1px solid #f0f0f1; padding-top:18px;">
                      <p style="margin:0 0 4px; color:#a1a1aa; font-size:12px; line-height:1.5;">
                        Cet email a été envoyé automatiquement dans le cadre de la gestion de votre facturation.
                      </p>
                      <p style="margin:0; color:#c4c4c8; font-size:11px;">
                        © ${year} FactureFlow Africa — OPTINOV Agence
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pied de page hors carte -->
          <tr>
            <td style="padding:18px 8px 0; text-align:center;">
              <p style="margin:0; color:#b4b4b8; font-size:11px;">
                Propulsé par FactureFlow Africa
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const providedSecret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur incomplète" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: pendingEmails, error: fetchError } = await supabase
    .from("email_queue")
    .select("id, company_id, to_email, subject, body, related_type, related_id, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("Erreur lecture email_queue:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results = { sent: 0, failed: 0 };

  for (const row of pendingEmails as EmailQueueRow[]) {
    try {
      const htmlContent = wrapInTemplate(row.subject, row.body);

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [row.to_email],
          subject: row.subject,
          html: htmlContent,
        }),
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        throw new Error(
          resendData?.message ?? `Erreur Resend (HTTP ${resendResponse.status})`,
        );
      }

      await supabase
        .from("email_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);

      results.sent++;
    } catch (err) {
      console.error(`Échec envoi email_queue.id=${row.id}:`, err);

      await supabase
        .from("email_queue")
        .update({
          status: "failed",
          error_message: (err as Error).message ?? "Erreur inconnue",
        })
        .eq("id", row.id);

      results.failed++;
    }
  }

  return new Response(
    JSON.stringify({ processed: pendingEmails.length, ...results }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});