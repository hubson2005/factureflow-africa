import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const LIGNE_VIDE = { produit_id: '', quantite: 1, prix_unitaire: 0 }

export default function Achats() {
  const [achats, setAchats] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [entrepots, setEntrepots] = useState([])
  const [produits, setProduits] = useState([])
  const [comptes, setComptes] = useState([])
  const [compteChoisi, setCompteChoisi] = useState({})
  const [loading, setLoading] = useState(true)

  const [fournisseurId, setFournisseurId] = useState('')
  const [entrepotId, setEntrepotId] = useState('')
  const [reference, setReference] = useState('')
  const [lignes, setLignes] = useState([{ ...LIGNE_VIDE }])

  useEffect(() => { chargerTout() }, [])

  async function chargerTout() {
    setLoading(true)
    const [achatsRes, fournisseursRes, entrepotsRes, produitsRes, comptesRes] = await Promise.all([
      supabase
        .from('achats')
        .select('*, fournisseurs(nom), entrepots(nom), achat_lignes(*, produits(nom))')
        .order('created_at', { ascending: false }),
      supabase.from('fournisseurs').select('id, nom').order('nom'),
      supabase.from('entrepots').select('id, nom').order('nom'),
      supabase.from('produits').select('id, nom').order('nom'),
      supabase.from('comptes').select('id, nom').order('nom'),
    ])
    setAchats(achatsRes.data ?? [])
    setFournisseurs(fournisseursRes.data ?? [])
    setEntrepots(entrepotsRes.data ?? [])
    setProduits(produitsRes.data ?? [])
    setComptes(comptesRes.data ?? [])
    setLoading(false)
  }

  function majLigne(index, champ, valeur) {
    const copie = [...lignes]
    copie[index] = { ...copie[index], [champ]: valeur }
    setLignes(copie)
  }

  function ajouterLigne() {
    setLignes([...lignes, { ...LIGNE_VIDE }])
  }

  function retirerLigne(index) {
    setLignes(lignes.filter((_, i) => i !== index))
  }

  async function creerAchat(e) {
    e.preventDefault()
    if (!fournisseurId || !entrepotId) {
      alert('Choisissez un fournisseur et un entrepôt.')
      return
    }

    const { data: achat, error } = await supabase
      .from('achats')
      .insert({
        fournisseur_id: fournisseurId,
        entrepot_id: entrepotId,
        reference,
        statut: 'commande',
        date_commande: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      alert(`Erreur : ${error.message}`)
      return
    }

    const lignesValides = lignes.filter((l) => l.produit_id && l.quantite > 0)
    const { error: erreurLignes } = await supabase.from('achat_lignes').insert(
      lignesValides.map((l) => ({
        achat_id: achat.id,
        produit_id: l.produit_id,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
      }))
    )

    if (erreurLignes) {
      alert(`Achat créé mais erreur sur les lignes : ${erreurLignes.message}`)
    }

    setFournisseurId('')
    setEntrepotId('')
    setReference('')
    setLignes([{ ...LIGNE_VIDE }])
    chargerTout()
  }

  async function receptionner(achatId) {
    const { error } = await supabase.rpc('receptionner_achat', { p_achat_id: achatId })
    if (error) {
      alert(`Erreur à la réception : ${error.message}`)
    } else {
      chargerTout()
    }
  }

  async function marquerPaye(achatId) {
    const compteId = compteChoisi[achatId]
    if (!compteId) {
      alert('Choisissez un compte pour le paiement.')
      return
    }
    const { error } = await supabase.rpc('marquer_achat_paye', {
      p_achat_id: achatId,
      p_compte_id: compteId,
    })
    if (error) {
      alert(`Erreur au paiement : ${error.message}`)
    } else {
      chargerTout()
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Module Achats</div>
          <h1>Commandes fournisseurs</h1>
        </div>
      </div>

      <form onSubmit={creerAchat} style={{ marginBottom: 32, background: '#fff', padding: 16, border: '1px solid var(--color-line)', borderRadius: 6 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select required value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)}>
            <option value="">Fournisseur…</option>
            {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
          <select required value={entrepotId} onChange={(e) => setEntrepotId(e.target.value)}>
            <option value="">Entrepôt de réception…</option>
            {entrepots.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
          </select>
          <input placeholder="Référence commande (optionnel)"
            value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>

        {lignes.map((ligne, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select required value={ligne.produit_id}
              onChange={(e) => majLigne(i, 'produit_id', e.target.value)}>
              <option value="">Produit…</option>
              {produits.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <input type="number" min="1" placeholder="Quantité"
              value={ligne.quantite}
              onChange={(e) => majLigne(i, 'quantite', Number(e.target.value))} />
            <input type="number" min="0" step="0.01" placeholder="Prix unitaire"
              value={ligne.prix_unitaire}
              onChange={(e) => majLigne(i, 'prix_unitaire', Number(e.target.value))} />
            {lignes.length > 1 && (
              <button type="button" className="btn-secondary btn" onClick={() => retirerLigne(i)}>Retirer</button>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={ajouterLigne}>+ Ligne</button>
          <button type="submit" className="btn">Créer la commande</button>
        </div>
      </form>

      {loading && <p>Chargement…</p>}

      {!loading && achats.length === 0 && (
        <div className="empty-state">Aucune commande fournisseur pour le moment.</div>
      )}

      {!loading && achats.length > 0 && achats.map((achat) => (
        <div key={achat.id} style={{ background: '#fff', border: '1px solid var(--color-line)', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <strong>{achat.fournisseurs?.nom}</strong>
              {achat.reference && <span style={{ color: '#6b7280' }}> · {achat.reference}</span>}
              <span style={{ marginLeft: 8 }} className={`badge ${achat.statut === 'receptionne' ? 'badge-ok' : 'badge-low'}`}>
                {achat.statut}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {achat.statut !== 'receptionne' && achat.statut !== 'annule' && (
                <button className="btn" onClick={() => receptionner(achat.id)}>Réceptionner</button>
              )}
              {!achat.paye ? (
                <>
                  <select
                    value={compteChoisi[achat.id] || ''}
                    onChange={(e) => setCompteChoisi({ ...compteChoisi, [achat.id]: e.target.value })}
                  >
                    <option value="">Payer depuis…</option>
                    {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                  <button className="btn btn-secondary" onClick={() => marquerPaye(achat.id)}>Marquer payé</button>
                </>
              ) : (
                <span className="badge badge-ok">Payé</span>
              )}
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th><th>Reçu</th></tr>
            </thead>
            <tbody>
              {achat.achat_lignes?.map((l) => (
                <tr key={l.id}>
                  <td>{l.produits?.nom}</td>
                  <td>{l.quantite}</td>
                  <td>{l.prix_unitaire}</td>
                  <td>{l.quantite_recue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
