import { useState } from 'react'
import Stock from './pages/Stock'
import Produits from './pages/Produits'
import Fournisseurs from './pages/Fournisseurs'
import Achats from './pages/Achats'
import Comptes from './pages/Comptes'
import Tresorerie from './pages/Tresorerie'
import Employes from './pages/Employes'
import Paies from './pages/Paies'

const PAGES = {
  stock: { label: 'Stock', component: Stock },
  produits: { label: 'Produits', component: Produits },
  fournisseurs: { label: 'Fournisseurs', component: Fournisseurs },
  achats: { label: 'Achats', component: Achats },
  comptes: { label: 'Comptes', component: Comptes },
  tresorerie: { label: 'Trésorerie', component: Tresorerie },
  employes: { label: 'Employés', component: Employes },
  paies: { label: 'Paie', component: Paies },
}

export default function App() {
  const [page, setPage] = useState('stock')
  const Page = PAGES[page].component

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-title">ERP · FactureFlow Africa</div>
        <nav>
          {Object.entries(PAGES).map(([key, { label }]) => (
            <a
              key={key}
              href="#"
              className={page === key ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); setPage(key) }}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Page />
      </main>
    </div>
  )
}
