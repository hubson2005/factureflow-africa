import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pufeqrduffcgneaxhuix.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZmVxcmR1ZmZjZ25lYXhodWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjkxNDMsImV4cCI6MjA5NzQ0NTE0M30.bZssyjOpEcG6EHg1zfriAhWiW1_ez8p3milbL_AR8M8'

// Contournement d'un bug connu de @supabase/supabase-js (issues GitHub #1517,
// #936, #1594, #1620, #2111) : le mécanisme interne de verrou navigator.locks
// peut se bloquer indéfiniment (surtout avec le Hot Module Reload de Vite en
// dev, ou React StrictMode), gelant silencieusement TOUTES les requêtes sans
// erreur ni timeout. On désactive ce verrou — sans risque pour une app web
// classique avec un seul onglet actif typique par utilisateur.
const noOpLock = async (name, acquireTimeout, fn) => {
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
