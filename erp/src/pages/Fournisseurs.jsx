import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const VIDE = { nom: '', contact: '', telephone: '', email: '', adresse: '' }

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([])
  const [form, setForm] = useState(VIDE)
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('fournisseurs').select('*').order('nom')
    setFournisseurs(data ?? [])
    setLoading(false)
  }

  async function ajouter(e) {
    e.preventDefault()
    const { error } = await supabase.from('fournisseurs').insert(form)
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
          <div className="eyebrow">Module Achats</div>
          <h1>Fournisseurs</h1>
        </div>
      </div>

      <form onSubmit={ajouter} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <input placeholder="Nom" required
          value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input placeholder="Contact"
          value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <input placeholder="Téléphone"
          value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        <input placeholder="Email"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="btn" type="submit">Ajouter</button>
      </form>

      {loading && <p>Chargement…</p>}

      {!loading && fournisseurs.length === 0 && (
        <div className="empty-state">Aucun fournisseur enregistré pour l'instant.</div>
      )}

      {!loading && fournisseurs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Téléphone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.map((f) => (
              <tr key={f.id}>
                <td>{f.nom}</td>
                <td>{f.contact || '—'}</td>
                <td>{f.telephone || '—'}</td>
                <td>{f.email || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
