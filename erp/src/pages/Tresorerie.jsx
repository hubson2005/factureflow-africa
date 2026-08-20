import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const VIDE = { compte_id: '', type: 'encaissement', montant: '', categorie: 'autre', description: '' }

export default function Tresorerie() {
  const [transactions, setTransactions] = useState([])
  const [comptes, setComptes] = useState([])
  const [form, setForm] = useState(VIDE)
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const [txRes, comptesRes] = await Promise.all([
      supabase
        .from('transactions_tresorerie')
        .select('*, comptes(nom)')
        .order('date_transaction', { ascending: false })
        .limit(100),
      supabase.from('comptes').select('id, nom').order('nom'),
    ])
    setTransactions(txRes.data ?? [])
    setComptes(comptesRes.data ?? [])
    setLoading(false)
  }

  async function ajouter(e) {
    e.preventDefault()
    if (!form.compte_id || !form.montant) {
      alert('Choisissez un compte et un montant.')
      return
    }
    const { error } = await supabase.from('transactions_tresorerie').insert({
      ...form,
      montant: Number(form.montant),
      source: 'manuel',
    })
    if (!error) {
      setForm(VIDE)
      charger()
    } else {
      alert(`Erreur : ${error.message}`)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Module Trésorerie</div>
          <h1>Journal des transactions</h1>
        </div>
      </div>

      <form onSubmit={ajouter} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <select required value={form.compte_id} onChange={(e) => setForm({ ...form, compte_id: e.target.value })}>
          <option value="">Compte…</option>
          {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="encaissement">Encaissement</option>
          <option value="decaissement">Décaissement</option>
        </select>
        <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
          <option value="vente">Vente</option>
          <option value="achat">Achat</option>
          <option value="salaire">Salaire</option>
          <option value="charge">Charge</option>
          <option value="autre">Autre</option>
        </select>
        <input type="number" step="0.01" placeholder="Montant" required
          value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
        <input placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn" type="submit">Enregistrer</button>
      </form>

      {loading && <p>Chargement…</p>}

      {!loading && transactions.length === 0 && (
        <div className="empty-state">
          Aucune transaction pour le moment. Elles apparaissent ici automatiquement
          quand un paiement client arrive de FactureFlow, ou qu'un achat fournisseur
          est marqué payé.
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Compte</th><th>Type</th><th>Catégorie</th>
              <th>Montant</th><th>Source</th><th>Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date_transaction).toLocaleDateString('fr-FR')}</td>
                <td>{t.comptes?.nom}</td>
                <td>
                  <span className={`badge ${t.type === 'encaissement' ? 'badge-ok' : 'badge-low'}`}>
                    {t.type === 'encaissement' ? '+ Encaissement' : '- Décaissement'}
                  </span>
                </td>
                <td>{t.categorie}</td>
                <td>{Number(t.montant).toLocaleString('fr-FR')} F</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{t.source}</td>
                <td>{t.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
