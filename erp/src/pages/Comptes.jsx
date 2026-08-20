import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const VIDE = { nom: '', type: 'caisse', solde_initial: 0 }

export default function Comptes() {
  const [comptes, setComptes] = useState([])
  const [form, setForm] = useState(VIDE)
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('comptes').select('*').order('nom')
    setComptes(data ?? [])
    setLoading(false)
  }

  async function ajouter(e) {
    e.preventDefault()
    const { error } = await supabase.from('comptes').insert(form)
    if (!error) {
      setForm(VIDE)
      charger()
    } else {
      alert(`Erreur : ${error.message}`)
    }
  }

  const soldeTotal = comptes.reduce((total, c) => total + Number(c.solde), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Module Trésorerie</div>
          <h1>Comptes</h1>
        </div>
        {!loading && comptes.length > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Solde total</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>
              {soldeTotal.toLocaleString('fr-FR')} F
            </div>
          </div>
        )}
      </div>

      <form onSubmit={ajouter} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <input placeholder="Nom du compte (ex: Caisse boutique)" required
          value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="caisse">Caisse</option>
          <option value="banque">Banque</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="autre">Autre</option>
        </select>
        <input type="number" step="0.01" placeholder="Solde initial"
          value={form.solde_initial}
          onChange={(e) => setForm({ ...form, solde_initial: Number(e.target.value) })} />
        <button className="btn" type="submit">Créer le compte</button>
      </form>

      {loading && <p>Chargement…</p>}

      {!loading && comptes.length === 0 && (
        <div className="empty-state">
          Aucun compte pour le moment. Créez au moins un compte (ex: Mobile Money)
          — c'est lui qui recevra les encaissements automatiques venant de FactureFlow.
        </div>
      )}

      {!loading && comptes.length > 0 && (
        <table>
          <thead>
            <tr><th>Compte</th><th>Type</th><th>Solde</th></tr>
          </thead>
          <tbody>
            {comptes.map((c) => (
              <tr key={c.id}>
                <td>{c.nom}</td>
                <td>{c.type}</td>
                <td>{Number(c.solde).toLocaleString('fr-FR')} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 12, fontSize: '0.85rem', color: '#6b7280' }}>
        L'id du compte utilisé pour les paiements FactureFlow doit être renseigné
        dans le secret <code>DEFAULT_COMPTE_ID</code> de l'Edge Function.
      </p>
    </div>
  )
}
