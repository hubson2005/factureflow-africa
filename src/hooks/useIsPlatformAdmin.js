import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

/**
 * Vérifie si l'utilisateur courant est un platform_admin (super admin de la
 * plateforme FactureFlow elle-même, distinct des rôles admin/manager/comptable
 * qui sont scopés à une entreprise cliente).
 *
 * Volontairement séparé de AuthContext : cette vérification ne concerne qu'une
 * poignée de comptes (toi), donc on évite de l'exécuter à chaque connexion
 * pour tout le monde — seule la page /admin l'appelle.
 */
export function useIsPlatformAdmin() {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(null); // null = en cours de vérification
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (!user) {
        if (mounted) {
          setIsPlatformAdmin(false);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mounted) return;
      setIsPlatformAdmin(!error && !!data);
      setLoading(false);
    };

    check();
    return () => { mounted = false; };
  }, [user]);

  return { isPlatformAdmin, loading };
}