import crypto from 'node:crypto'
import pg from 'pg'

const WEBHOOK_SECRET = 'test-secret-factureflow'
const URL = 'http://localhost:8787'

const pool = new pg.Pool({
  host: 'localhost', user: 'postgres', password: 'postgres', database: 'erp_test',
})

function signer(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function envoyer(event, data, { signatureValide = true } = {}) {
  const body = JSON.stringify({ event, data })
  const signature = signer(body, signatureValide ? WEBHOOK_SECRET : 'mauvais-secret')
  const res = await fetch(`${URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-FactureFlow-Signature': signature },
    body,
  })
  return { status: res.status, json: await res.json() }
}

let echecs = 0
function assert(label, condition, detail = '') {
  const ok = !!condition
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) echecs++
}

async function main() {
  const { rows: baseline } = await pool.query('select count(*)::int as n from webhook_events')
  const eventsAvant = baseline[0].n

  console.log('\n=== TEST WEBHOOK 1 : signature invalide doit être rejetée (401) ===')
  const rejet = await envoyer('invoice.created', { id: 'INV-BAD' }, { signatureValide: false })
  assert('Statut 401 sur signature invalide', rejet.status === 401, `reçu ${rejet.status}`)

  console.log('\n=== TEST WEBHOOK 2 : invoice.created avec signature valide -> sortie de stock ===')
  const { rows: avant } = await pool.query(
    "select quantite from stock where produit_id = '33333333-3333-3333-3333-333333333333'"
  )
  const stockAvant = Number(avant[0].quantite)

  const facture = await envoyer('invoice.created', {
    id: 'INV-1001',
    lignes: [{ produit_ref: 'ff-prod-riz25', quantite: 3 }],
  })
  assert('Statut 200 sur invoice.created', facture.status === 200, JSON.stringify(facture.json))

  const { rows: apres } = await pool.query(
    "select quantite from stock where produit_id = '33333333-3333-3333-3333-333333333333'"
  )
  const stockApres = Number(apres[0].quantite)
  assert(
    `Stock décrémenté de 3 (avant=${stockAvant}, après=${stockApres})`,
    stockApres === stockAvant - 3
  )

  console.log('\n=== TEST WEBHOOK 3 : payment.received avec signature valide -> encaissement ===')
  const { rows: soldeAvant } = await pool.query(
    "select solde from comptes where id = '22222222-2222-2222-2222-222222222222'"
  )
  const s0 = Number(soldeAvant[0].solde)

  const paiement = await envoyer('payment.received', {
    id: 'PAY-5001', invoice_id: 'INV-1001', montant: 36000,
  })
  assert('Statut 200 sur payment.received', paiement.status === 200, JSON.stringify(paiement.json))

  const { rows: soldeApres } = await pool.query(
    "select solde from comptes where id = '22222222-2222-2222-2222-222222222222'"
  )
  const s1 = Number(soldeApres[0].solde)
  assert(`Compte crédité de 36000 (avant=${s0}, après=${s1})`, s1 === s0 + 36000)

  console.log('\n=== TEST WEBHOOK 4 : événement inconnu -> accepté sans crash (ignoré proprement) ===')
  const inconnu = await envoyer('client.supprime', { id: 'C-1' })
  assert('Statut 200 sur événement non géré', inconnu.status === 200, JSON.stringify(inconnu.json))

  console.log('\n=== TEST WEBHOOK 5 : traçabilité dans webhook_events ===')
  const { rows: events } = await pool.query('select event_type from webhook_events order by received_at')
  const nouveaux = events.length - eventsAvant
  assert(
    "3 nouveaux événements loggés dans webhook_events (la requête à signature invalide n'est pas loggée, comme prévu)",
    nouveaux === 3,
    `+${nouveaux} événements sur cette exécution`
  )

  console.log(`\n${echecs === 0 ? '🎉 Tous les tests webhook sont passés.' : `⚠️  ${echecs} test(s) en échec.`}`)
  await pool.end()
  process.exit(echecs === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
