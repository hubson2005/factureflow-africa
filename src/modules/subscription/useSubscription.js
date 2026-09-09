import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export const PLANS = [
  {
    id: "free", name: "Gratuit", price: 0, priceAnnual: 0, trialDays: 14,
    features: [
      "Essai gratuit de 14 jours",
      "Acces complet aux fonctionnalites Starter",
      "Factures et devis illimites pendant l'essai",
      "Certification FNE automatique",
      "Stock, paiements et depenses",
      "1 utilisateur (admin)",
      "Acces desactive apres 14 jours sans abonnement",
    ],
  },
  {
    id: "starter", name: "Starter", price: 4990, priceAnnual: 43900,
    features: [
      "Clients et factures illimites",
      "Devis, produits et paiements illimites",
      "Certification FNE automatique",
      "Module Stock inclus",
      "Suivi des depenses et rapports de base",
      "Facturation recurrente",
      "Export PDF (factures, devis) sans marque FactureFlow",
      "3 utilisateurs (equipe)",
      "Support par email (48h)",
    ],
  },
  {
    id: "pro", name: "Pro", price: 8900, priceAnnual: 87800,
    features: [
      "Tout Starter, plus :",
      "Achats fournisseurs et rapprochement automatique",
      "Comptes et Tresorerie consolides",
      "Previsionnel de tresorerie a 30 jours",
      "Recouvrement IA (score de fiabilite client, relances automatisees)",
      "Automatisation illimitee (regles et declencheurs)",
      "Assistant IA illimite (analyse de vos donnees en temps reel)",
      "Ressources humaines jusqu'a 10 employes",
      "Rapports avances exportables (PDF / tableur)",
      "10 utilisateurs (equipe)",
      "Support prioritaire (reponse sous 24h)",
    ],
  },
  {
    id: "business", name: "Business", price: 15000, priceAnnual: 159000,
    features: [
      "Tout Pro, plus :",
      "Multi-entreprises illimite",
      "Gestion d'equipe complete (roles admin/manager/comptable)",
      "RH illimite (aucune limite d'employes)",
      "Roles et permissions avances par module",
      "Tableau de bord consolide multi-entreprises",
      "Export comptable multi-structures",
      "Utilisateurs illimites",
      "Accompagnement dedie a la mise en place",
      "Formation de l'equipe incluse",
      "Support telephonique dedie",
      "Support SLA prioritaire (reponse sous 4h)",
      "Account manager dedie",
      "Acces API et Webhooks (a venir)",
    ],
  },
];

export function useSubscription() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["subscription", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("subscription_plan, subscription_status, trial_ends_at, monthly_price")
        .eq("id", company.company_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useChangePlan() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ newPlan, amount }) => {
      const companyId = company.company_id;

      const { data: current } = await supabase
        .from("companies")
        .select("subscription_plan")
        .eq("id", companyId)
        .single();

      const { error: updateErr } = await supabase
        .from("companies")
        .update({
          subscription_plan: newPlan,
          subscription_status: "active",
          monthly_price: amount,
        })
        .eq("id", companyId);
      if (updateErr) throw updateErr;

      await supabase.from("subscription_events").insert({
        company_id: companyId,
        event_type: "plan_change",
        old_plan: current?.subscription_plan || null,
        new_plan: newPlan,
        amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}

