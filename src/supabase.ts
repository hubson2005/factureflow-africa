import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Variables d'environnement Supabase manquantes. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local (dev) ou les variables d'environnement Vercel (prod)."
  )
}

// Contournement d'un bug connu de @supabase/supabase-js (issues GitHub #1517,
// #936, #1594, #1620, #2111) : le mécanisme interne de verrou navigator.locks
// peut se bloquer indéfiniment (surtout avec le Hot Module Reload de Vite en
// dev, ou React StrictMode), gelant silencieusement TOUTES les requêtes sans
// erreur ni timeout. On désactive ce verrou — sans risque pour une app web
// classique avec un seul onglet actif typique par utilisateur.
const noOpLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => {
  return await fn()
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    flowType: 'pkce',           // évite le token dans l'URL (#access_token=...)
    detectSessionInUrl: true,   // détecte le callback OAuth et magic link
    persistSession: true,       // garde la session dans localStorage
    autoRefreshToken: true,     // rafraîchit le token automatiquement
    lock: noOpLock,             // contourne le bug de verrou navigator.locks
  }
})