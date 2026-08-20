import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const VIDE = { nom: '', prenom: '', poste: '', telephone: '', email: '', date_embauche: '', salaire_mensuel: 0 }

export default function Employes() {
  const [employes, setEmployes] = useState([])
  const [form, setForm] = useState(VIDE)
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('employes').select('*').order('nom')
    setEmployes(data ?? [])
    setLoading(false)
  }

  async function ajouter(e) {
    e.preventDefault()
    const { error } = await supabase.from('employes').insert(form)
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
          <div className="eyebrow">Module RH</div>
          <h1>Employés</h1>
        </div>
      </div>

      <form onSubmit={ajouter} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <input placeholder="Nom" required
          value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input placeholder="Prénom" required
          value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        <input placeholder="Poste"
          value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
        <input placeholder="Téléphone"
          value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        <input type="date" placeholder="Date d'embauche"
          value={form.date_embauche} onChange={(e) => setForm({ ...form, date_embauche: e.target.value })} />
        <input type="number" step="0.01" placeholder="Salaire mensuel"
          value={form.salaire_mensuel}
          onChange={(e) => setForm({ ...form, salaire_mensuel: Number(e.target.value) })} />
        <button className="btn" type="submit">Ajouter</button>
      </form>

      {loading && <p>Chargement…</p>}

      {!loading && employes.length === 0 && (
        <div className="empty-state">Aucun employé enregistré pour le moment.</div>
      )}

      {!loading && employes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nom</th><th>Poste</th><th>Téléphone</th>
              <th>Embauché le</th><th>Salaire mensuel</th><th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {employes.map((e) => (
              <tr key={e.id}>
                <td>{e.prenom} {e.nom}</td>
                <td>{e.poste || '—'}</td>
                <td>{e.telephone || '—'}</td>
                <td>{e.date_embauche ? new Date(e.date_embauche).toLocaleDateString('fr-FR') : '—'}</td>
                <td>{Number(e.salaire_mensuel).toLocaleString('fr-FR')} F</td>
                <td>
                  <span className={`badge ${e.statut === 'actif' ? 'badge-ok' : 'badge-low'}`}>{e.statut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
