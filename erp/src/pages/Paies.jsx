import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Paies() {
  const [paies, setPaies] = useState([])
  const [employes, setEmployes] = useState([])
  const [comptes, setComptes] = useState([])
  const [compteChoisi, setCompteChoisi] = useState({})
  const [loading, setLoading] = useState(true)

  const [employeId, setEmployeId] = useState('')
  const [periode, setPeriode] = useState('')
  const [primes, setPrimes] = useState(0)
  const [deductions, setDeductions] = useState(0)

  useEffect(() => { chargerTout() }, [])

  async function chargerTout() {
    setLoading(true)
    const [paiesRes, employesRes, comptesRes] = await Promise.all([
      supabase
        .from('paies')
        .select('*, employes(nom, prenom)')
        .order('created_at', { ascending: false }),
      supabase.from('employes').select('id, nom, prenom, salaire_mensuel').eq('statut', 'actif').order('nom'),
      supabase.from('comptes').select('id, nom').order('nom'),
    ])
    setPaies(paiesRes.data ?? [])
    setEmployes(employesRes.data ?? [])
    setComptes(comptesRes.data ?? [])
    setLoading(false)
  }

  async function genererBulletin(e) {
    e.preventDefault()
    if (!employeId || !periode) {
      alert('Choisissez un employé et une période.')
      return
    }
    const employe = employes.find((emp) => emp.id === employeId)

    const { error } = await supabase.from('paies').insert({
      employe_id: employeId,
      periode,
      salaire_brut: employe.salaire_mensuel,
      primes,
      deductions,
    })

    if (error) {
      alert(`Erreur : ${error.message}`)
    } else {
      setEmployeId('')
      setPeriode('')
      setPrimes(0)
      setDeductions(0)
      chargerTout()
    }
  }

  async function payer(paieId) {
    const compteId = compteChoisi[paieId]
    if (!compteId) {
      alert('Choisissez un compte pour le paiement.')
      return
    }
    const { error } = await supabase.rpc('payer_salaire', {
      p_paie_id: paieId,
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
          <div className="eyebrow">Module RH</div>
          <h1>Paie</h1>
        </div>
      </div>

      <form onSubmit={genererBulletin} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <select required value={employeId} onChange={(e) => setEmployeId(e.target.value)}>
          <option value="">Employé…</option>
          {employes.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
        </select>
        <input placeholder="Période (ex: Août 2026)" required
          value={periode} onChange={(e) => setPeriode(e.target.value)} />
        <input type="number" step="0.01" placeholder="Primes"
          value={primes} onChange={(e) => setPrimes(Number(e.target.value))} />
        <input type="number" step="0.01" placeholder="Déductions"
          value={deductions} onChange={(e) => setDeductions(Number(e.target.value))} />
        <button className="btn" type="submit">Générer le bulletin</button>
      </form>

      {loading && <p>Chargement…</p>}

      {!loading && paies.length === 0 && (
        <div className="empty-state">Aucun bulletin de paie généré pour le moment.</div>
      )}

      {!loading && paies.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Employé</th><th>Période</th><th>Brut</th><th>Primes</th>
              <th>Déductions</th><th>Net</th><th>Statut</th><th></th>
            </tr>
          </thead>
          <tbody>
            {paies.map((p) => (
              <tr key={p.id}>
                <td>{p.employes?.prenom} {p.employes?.nom}</td>
                <td>{p.periode}</td>
                <td>{Number(p.salaire_brut).toLocaleString('fr-FR')} F</td>
                <td>{Number(p.primes).toLocaleString('fr-FR')} F</td>
                <td>{Number(p.deductions).toLocaleString('fr-FR')} F</td>
                <td><strong>{Number(p.salaire_net).toLocaleString('fr-FR')} F</strong></td>
                <td>
                  <span className={`badge ${p.statut === 'paye' ? 'badge-ok' : 'badge-low'}`}>{p.statut}</span>
                </td>
                <td>
                  {p.statut !== 'paye' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        value={compteChoisi[p.id] || ''}
                        onChange={(e) => setCompteChoisi({ ...compteChoisi, [p.id]: e.target.value })}
                      >
                        <option value="">Compte…</option>
                        {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                      <button className="btn btn-secondary" onClick={() => payer(p.id)}>Payer</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
