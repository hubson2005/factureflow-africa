import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Ouvre automatiquement le formulaire de creation d'une page liste quand on y arrive
 * avec location.state.openCreate === true (utilise par le bouton "+" -> "Creer" de
 * BottomNav sur mobile, qui n'a pas de route dediee type /invoices/new).
 *
 * Nettoie ensuite cet etat de navigation (replace, state vide) pour eviter que le
 * formulaire se rouvre tout seul sur un retour arriere navigateur ou un rechargement
 * de la page.
 *
 * Usage : dans chaque page liste (Invoices.tsx, Quotes.tsx, Clients.tsx, Products.tsx,
 * Expenses.tsx), juste apres la declaration de `showForm` :
 *   useAutoOpenCreate(setShowForm);
 */
export function useAutoOpenCreate(setShowForm: (value: boolean) => void) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if ((location.state as any)?.openCreate) {
      setShowForm(true);
      // Remplace l'entree d'historique courante en vidant le state, pour que le
      // formulaire ne se rouvre pas si l'utilisateur revient sur cette page plus tard.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);
}