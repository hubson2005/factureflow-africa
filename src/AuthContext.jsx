import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null); // { id, name, ... } de companies
  const [role, setRole] = useState(null); // 'admin' | 'manager' | 'comptable' | null
  const [loading, setLoading] = useState(true);

  // Charge l'entreprise + le rôle de l'utilisateur courant depuis company_users.
  // IMPORTANT: en cas d'erreur réseau/lock transitoire, on NE touche PAS à l'état
  // existant (company/role) — on ne l'écrase que si la requête a réellement réussi
  // et n'a rien trouvé. Ça évite qu'un TOKEN_REFRESHED qui échoue ponctuellement
  // déconnecte l'utilisateur de son entreprise alors qu'elle existe bien en base.
  const loadCompanyContext = useCallback(async (currentUser) => {
    if (!currentUser) {
      setCompany(null);
      setRole(null);
      return;
    }

    const { data, error } = await supabase
      .from('company_users')
      .select('role, company_id, companies(*)')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[Auth] Erreur chargement entreprise (état conservé):', error.message);
      return; // ne pas écraser l'état existant sur une erreur transitoire
    }

    if (!data) {
      setCompany(null);
      setRole(null);
      return;
    }

    setCompany(data.companies);
    setRole(data.role);
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'PASSWORD_RECOVERY') {
          setUser(null);
          setCompany(null);
          setRole(null);
          setLoading(false);
          window.location.href = '/reset-password';
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setCompany(null);
          setRole(null);
          setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await loadCompanyContext(currentUser);
        }

        if (mounted) setLoading(false);
      }
    );

    // Filet de sécurité : si AUCUN event onAuthStateChange ne se déclenche du
    // tout (cas anormal), on ne reste pas bloqué indéfiniment sur l'écran de
    // chargement. 8s est largement supérieur au temps normal d'une requête.
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loadCompanyContext]);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, fullName) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
    setRole(null);
  };

  // À appeler juste après l'étape 2 de l'inscription (création entreprise)
  // pour rafraîchir le contexte sans attendre un nouvel event auth.
  const refreshCompanyContext = useCallback(async () => {
    if (user) await loadCompanyContext(user);
  }, [user, loadCompanyContext]);

  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'admin';
  const hasCompany = !!company;

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        role,
        isAdmin,
        isManager,
        hasCompany,
        loading,
        signIn,
        signUp,
        signOut,
        refreshCompanyContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  return ctx;
}