import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      console.error('[Auth] Erreur chargement entreprise (etat conserve):', error.message);
      return;
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

        // Ne jamais logger session en entier : contient access_token / refresh_token en clair.
        if (import.meta.env.DEV) {
          console.log('[AUTH EVENT]', event, { userId: session?.user?.id ?? null });
        }

        if (event === 'PASSWORD_RECOVERY') {
          setUser(null);
          setCompany(null);
          setRole(null);
          setLoading(false);
          if (window.location.pathname !== '/reset-password') {
            navigate('/reset-password', { replace: true });
          }
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

    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loadCompanyContext, navigate]);

  // CORRECTIF : supabase.auth.signInWithPassword() ne lève JAMAIS d'exception
  // en cas d'identifiants invalides — l'erreur est renvoyée dans { error },
  // pas levée. Sans ce throw, un login échoué résolvait silencieusement la
  // promesse et Login.tsx naviguait quand même vers /dashboard avant d'être
  // renvoyé vers /login au premier rechargement (aucune session en storage).
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Même remarque pour signUp : signUp() ne throw pas non plus sur erreur
  // (email déjà utilisé, mot de passe trop faible, etc.). On propage ici
  // aussi pour que les appelants (formulaire d'inscription) puissent
  // afficher l'erreur avec un simple try/catch, comme pour signIn.
  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
    setRole(null);
  };

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
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de <AuthProvider>");
  return ctx;
}