// =========================================================
// Edge Function: factureflow-webhook
// Reçoit les webhooks envoyés par FactureFlow Africa,
// vérifie la signature HMAC-SHA256, puis met à jour le stock.
//
// Header attendu: X-FactureFlow-Signature
// Secret partagé:  FACTUREFLOW_WEBHOOK_SECRET (à définir dans les
//                  secrets de la fonction, PAS dans le code)
// =========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("FACTUREFLOW_WEBHOOK_SECRET")!;

// Entrepôt par défaut utilisé pour les mouvements issus des factures.
// A terme, faire correspondre un entrepôt par point de vente si besoin.
const DEFAULT_ENTREPOT_ID = Deno.env.get("DEFAULT_ENTREPOT_ID")!;

// Compte de trésorerie par défaut sur lequel enregistrer les encaissements
// venant de FactureFlow (ex: compte "Mobile Money" ou "Banque principale").
const DEFAULT_COMPTE_ID = Deno.env.get("DEFAULT_COMPTE_ID")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// --- Vérification de signature HMAC-SHA256 ---
async function verifierSignature(
  payloadBrut: string,
  signatureRecue: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const cle = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureCalculee = await crypto.subtle.sign(
    "HMAC",
    cle,
    encoder.encode(payloadBrut)
  );
  const hex = Array.from(new Uint8Array(signatureCalculee))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparaison en temps constant pour éviter les attaques par timing
  if (hex.length !== signatureRecue.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ signatureRecue.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payloadBrut = await req.text();
  const signature = req.headers.get("x-factureflow-signature") ?? "";

  const signatureValide = await verifierSignature(
    payloadBrut,
    signature,
    WEBHOOK_SECRET
  );

  if (!signatureValide) {
    return new Response(JSON.stringify({ error: "Signature invalide" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = JSON.parse(payloadBrut);
  const eventType: string = body.event ?? body.type ?? "unknown";

  // Log brut de l'événement (traçabilité + idempotence future)
  const { data: logged, error: logError } = await supabase
    .from("webhook_events")
    .insert({ event_type: eventType, payload: body })
    .select()
    .single();

  if (logError) {
    console.error("Erreur log webhook_events:", logError);
  }

  try {
    switch (eventType) {
      case "invoice.created":
      case "facture.creee": {
        await traiterFactureCreee(body);
        break;
      }

      case "invoice.updated":
      case "facture.modifiee": {
        // A implémenter selon vos besoins: recalcul si les lignes changent
        break;
      }

      case "payment.received":
      case "paiement.recu": {
        await traiterPaiementRecu(body);
        break;
      }

      default:
        console.log(`Événement non géré: ${eventType}`);
    }

    if (logged) {
      await supabase
        .from("webhook_events")
        .update({ processed: true })
        .eq("id", logged.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur traitement webhook:", err);
    if (logged) {
      await supabase
        .from("webhook_events")
        .update({ error: String(err) })
        .eq("id", logged.id);
    }
    // On renvoie 200 quand même pour éviter les retries en boucle sur une
    // erreur métier définitive; passer à 500 si vous voulez forcer le retry
    // côté FactureFlow.
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ---------------------------------------------------------
// Traite un événement "paiement reçu": crée un encaissement
// en trésorerie sur le compte par défaut.
// ---------------------------------------------------------
async function traiterPaiementRecu(body: any) {
  const paiement = body.data ?? body;
  const paiementId: string = paiement.id ?? paiement.payment_id;
  const montant = Number(paiement.montant ?? paiement.amount ?? 0);
  const factureId = paiement.invoice_id ?? paiement.facture_id ?? null;

  if (!montant || montant <= 0) {
    console.warn("Paiement reçu avec un montant invalide, ignoré.", paiement);
    return;
  }

  await supabase.from("transactions_tresorerie").insert({
    compte_id: DEFAULT_COMPTE_ID,
    type: "encaissement",
    montant,
    categorie: "vente",
    source: "factureflow_webhook",
    reference_id: paiementId ?? factureId,
    description: factureId
      ? `Paiement reçu pour la facture ${factureId}`
      : `Paiement reçu ${paiementId ?? ""}`,
  });
}

// ---------------------------------------------------------
// Traite un événement "facture créée": décrémente le stock
// pour chaque ligne de la facture.
// ---------------------------------------------------------
async function traiterFactureCreee(body: any) {
  const facture = body.data ?? body;
  const factureId: string = facture.id ?? facture.invoice_id;
  const lignes: Array<{ produit_ref: string; quantite: number }> =
    facture.lignes ?? facture.items ?? [];

  for (const ligne of lignes) {
    const produitRef = ligne.produit_ref ?? ligne.sku ?? ligne.product_id;
    const quantite = Number(ligne.quantite ?? ligne.quantity ?? 0);

    if (!produitRef || quantite <= 0) continue;

    // Retrouver le produit correspondant côté ERP via sa référence FactureFlow
    const { data: produit } = await supabase
      .from("produits")
      .select("id")
      .eq("factureflow_ref", produitRef)
      .maybeSingle();

    if (!produit) {
      console.warn(`Produit introuvable pour la référence: ${produitRef}`);
      continue;
    }

    await supabase.from("mouvements_stock").insert({
      produit_id: produit.id,
      entrepot_id: DEFAULT_ENTREPOT_ID,
      type: "sortie",
      quantite,
      source: "factureflow_webhook",
      reference_id: factureId,
      commentaire: `Sortie auto suite à la facture ${factureId}`,
    });
  }
}
