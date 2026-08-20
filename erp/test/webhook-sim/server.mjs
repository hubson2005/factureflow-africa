// Port Node.js fidèle de supabase/functions/factureflow-webhook/index.ts
// But : tester la logique métier (vérif HMAC, traitement des events)
// en conditions réelles (vraie requête HTTP signée) sans dépendre d'un
// compte Supabase distant.
import http from 'node:http'
import crypto from 'node:crypto'
import pg from 'pg'

const WEBHOOK_SECRET = 'test-secret-factureflow'
const DEFAULT_ENTREPOT_ID = '11111111-1111-1111-1111-111111111111'
const DEFAULT_COMPTE_ID = '22222222-2222-2222-2222-222222222222'

const pool = new pg.Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'erp_test',
})

function verifierSignature(payloadBrut, signatureRecue, secret) {
  const hex = crypto.createHmac('sha256', secret).update(payloadBrut).digest('hex')
  if (hex.length !== signatureRecue.length) return false
  return crypto.timingSafeEqual(Buffer.from(hex), Buffer.from(signatureRecue))
}

async function traiterFactureCreee(body) {
  const facture = body.data ?? body
  const factureId = facture.id ?? facture.invoice_id
  const lignes = facture.lignes ?? facture.items ?? []

  for (const ligne of lignes) {
    const produitRef = ligne.produit_ref ?? ligne.sku ?? ligne.product_id
    const quantite = Number(ligne.quantite ?? ligne.quantity ?? 0)
    if (!produitRef || quantite <= 0) continue

    const { rows } = await pool.query(
      'select id from produits where factureflow_ref = $1', [produitRef]
    )
    if (rows.length === 0) {
      console.warn(`Produit introuvable pour la référence: ${produitRef}`)
      continue
    }

    await pool.query(
      `insert into mouvements_stock (produit_id, entrepot_id, type, quantite, source, reference_id, commentaire)
       values ($1, $2, 'sortie', $3, 'factureflow_webhook', $4, $5)`,
      [rows[0].id, DEFAULT_ENTREPOT_ID, quantite, factureId, `Sortie auto suite à la facture ${factureId}`]
    )
  }
}

async function traiterPaiementRecu(body) {
  const paiement = body.data ?? body
  const paiementId = paiement.id ?? paiement.payment_id
  const montant = Number(paiement.montant ?? paiement.amount ?? 0)
  const factureId = paiement.invoice_id ?? paiement.facture_id ?? null
  if (!montant || montant <= 0) return

  await pool.query(
    `insert into transactions_tresorerie (compte_id, type, montant, categorie, source, reference_id, description)
     values ($1, 'encaissement', $2, 'vente', 'factureflow_webhook', $3, $4)`,
    [DEFAULT_COMPTE_ID, montant, paiementId ?? factureId,
     factureId ? `Paiement reçu pour la facture ${factureId}` : `Paiement reçu ${paiementId ?? ''}`]
  )
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405); res.end('Method not allowed'); return
  }
  let chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', async () => {
    const payloadBrut = Buffer.concat(chunks).toString('utf8')
    const signature = req.headers['x-factureflow-signature'] ?? ''

    if (!verifierSignature(payloadBrut, signature, WEBHOOK_SECRET)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Signature invalide' }))
      return
    }

    const body = JSON.parse(payloadBrut)
    const eventType = body.event ?? body.type ?? 'unknown'

    await pool.query(
      'insert into webhook_events (event_type, payload) values ($1, $2)',
      [eventType, body]
    )

    try {
      if (eventType === 'invoice.created' || eventType === 'facture.creee') {
        await traiterFactureCreee(body)
      } else if (eventType === 'payment.received' || eventType === 'paiement.recu') {
        await traiterPaiementRecu(body)
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: String(err) }))
    }
  })
})

server.listen(8787, () => console.log('Webhook simulator listening on :8787'))
