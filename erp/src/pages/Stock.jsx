import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Stock() {
  const [lignes, setLignes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    chargerStock()
  }, [])

  async function chargerStock() {
    setLoading(true)
    setErreur(null)

    const { data, error } = await supabase
      .from('stock')
      .select(`
        id,
        quantite,
        updated_at,
        produits ( nom, sku, seuil_alerte, unite ),
        entrepots ( nom )
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      setErreur(error.message)
    } else {
      setLignes(data)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Module Stock</div>
          <h1>Inventaire</h1>
        </div>
        <button className="btn" onClick={chargerStock}>Actualiser</button>
      </div>

      {loading && <p>Chargement…</p>}
      {erreur && <p style={{ color: 'var(--color-rust)' }}>Erreur : {erreur}</p>}

      {!loading && !erreur && lignes.length === 0 && (
        <div className="empty-state">
          Aucun mouvement de stock pour le moment.<br />
          Les quantités apparaissent ici dès qu'une facture est émise dans FactureFlow
          ou qu'un mouvement manuel est enregistré.
        </div>
      )}

      {!loading && lignes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>SKU</th>
              <th>Entrepôt</th>
              <th>Quantité</th>
              <th>Statut</th>
              <th>Dernière mise à jour</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => {
              const bas = ligne.quantite <= (ligne.produits?.seuil_alerte ?? 0)
              return (
                <tr key={ligne.id}>
                  <td>{ligne.produits?.nom}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{ligne.produits?.sku}</td>
                  <td>{ligne.entrepots?.nom}</td>
                  <td>{ligne.quantite} {ligne.produits?.unite}</td>
                  <td>
                    <span className={`badge ${bas ? 'badge-low' : 'badge-ok'}`}>
                      {bas ? 'Seuil bas' : 'OK'}
                    </span>
                  </td>
                  <td>{new Date(ligne.updated_at).toLocaleString('fr-FR')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
