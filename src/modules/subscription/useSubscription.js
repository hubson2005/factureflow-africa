import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export const PLANS = [
  {
    id: "free", name: "Gratuit", price: 0,
    features: [
      "10 clients maximum",
      "20 factures / mois",
      "1 utilisateur (admin)",
      "Devis et paiements de base",
      "Support par email",
    ],
  },
  {
    id: "starter", name: "Starter", price: 5000,
    features: [
      "Clients et factures illimites",
      "Devis, produits, paiements illimites",
      "Suivi des depenses",
      "Export PDF (factures, devis)",
      "3 utilisateurs (equipe)",
      "Support prioritaire",
    ],
  },
  {
    id: "pro", name: "Pro", price: 15000,
    features: [
      "Tout Starter",
      "Assistant IA (analyse de vos donnees en temps reel)",
      "Recouvrement IA (score de fiabilite client, relances automatisees)",
      "Rapports avances par periode et par categorie",
      "Export PDF des rapports",
      "10 utilisateurs (equipe)",
    ],
  },
  {
    id: "business", name: "Business", price: 35000,
    features: [
      "Tout Pro",
      "Utilisateurs illimites",
      "Gestion d'equipe complete (roles admin/manager/comptable)",
      "Support telephonique dedie",
      "Acces API (a venir)",
      "Account manager dedie",
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