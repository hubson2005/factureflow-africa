import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const PRODUIT_VIDE = {
  nom: '', sku: '', factureflow_ref: '',
  prix_achat: 0, prix_vente: 0, seuil_alerte: 0, unite: 'piece',
}

export default function Produits() {
  const [produits, setProduits] = useState([])
  const [form, setForm] = useState(PRODUIT_VIDE)
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('produits').select('*').order('nom')
    setProduits(data ?? [])
    setLoading(false)
  }

  async function ajouterProduit(e) {
    e.preventDefault()
    const { error } = await supabase.from('produits').insert(form)
    if (!error) {
      setForm(PRODUIT_VIDE)
      charger()
    } else {
      alert(`Erreur : ${error.message}`)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Module Stock</div>
          <h1>Catalogue produits</h1>
        </div>
      </div>

      <form onSubmit={ajouterProduit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <input placeholder="Nom du produit" required
          value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input placeholder="SKU" required
          value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input placeholder="Réf. FactureFlow"
          value={form.factureflow_ref} onChange={(e) => setForm({ ...form, factureflow_ref: e.target.value })} />
        <input type="number" placeholder="Seuil alerte"
          value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: Number(e.target.value) })} />
        <button className="btn" type="submit">Ajouter</button>
      </form>

      {loading && <p>Chargement…</p>}

      {!loading && (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>SKU</th>
              <th>Réf. FactureFlow</th>
              <th>Seuil alerte</th>
              <th>Unité</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => (
              <tr key={p.id}>
                <td>{p.nom}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{p.sku}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{p.factureflow_ref || '—'}</td>
                <td>{p.seuil_alerte}</td>
                <td>{p.unite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 12, fontSize: '0.85rem', color: '#6b7280' }}>
        La "Réf. FactureFlow" doit correspondre à l'identifiant du produit envoyé
        dans les lignes de facture par le webhook, pour que la sortie de stock
        se fasse automatiquement.
      </p>
    </div>
  )
}
