import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function useChartOfAccounts() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["chart-of-accounts", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("chart_of_accounts").select("*").order("account_number");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useInitializeAccounting() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error: err1 } = await supabase.rpc("initialize_accounting", { p_company_id: company.company_id });
      if (err1) throw err1;
      // Phase 2 (Depenses/Achats) : idempotent, s'applique automatiquement a
      // la suite de la Phase 1 -- l'utilisateur n'a qu'une seule action
      // "Activer la comptabilite" a faire, le decoupage en phases est un
      // detail de deploiement interne, pas une distinction utile cote UI.
      const { error: err2 } = await supabase.rpc("extend_accounting_phase2", { p_company_id: company.company_id });
      if (err2) throw err2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-journals"] });
    },
  });
}

export function useAccountingJournals() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["accounting-journals", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounting_journals").select("*").order("code");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

export function useJournalEntries() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["journal-entries", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*, journal:accounting_journals(code, label), lines:journal_entry_lines(id, debit, credit, label, account:chart_of_accounts(account_number, label))")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.company_id,
  });
}

// Balance generale (solde par compte, calculee cote client a partir des
// lignes d'ecriture -- suffisant pour le volume attendu en Phase 1).
export function useTrialBalance() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["trial-balance", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entry_lines")
        .select("debit, credit, account:chart_of_accounts(account_number, label, class)");
      if (error) throw error;
      const byAccount = {};
      for (const line of data) {
        const key = line.account.account_number;
        if (!byAccount[key]) byAccount[key] = { ...line.account, totalDebit: 0, totalCredit: 0 };
        byAccount[key].totalDebit += Number(line.debit);
        byAccount[key].totalCredit += Number(line.credit);
      }
      return Object.values(byAccount).sort((a, b) => a.account_number.localeCompare(b.account_number));
    },
    enabled: !!company?.company_id,
  });
}

export function useCreateManualJournalEntry() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journalCode, entryDate, label, lines }) => {
      const { data, error } = await supabase.rpc("create_manual_journal_entry", {
        p_company_id: company.company_id,
        p_journal_code: journalCode,
        p_entry_date: entryDate,
        p_label: label,
        p_lines: lines,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
    },
  });
}

// Regime comptable SYSCOHADA (SMT ou Systeme Normal) -- reglage manuel,
// PAS calcule automatiquement (le seuil exact de bascule reste en attente
// de validation par un expert-comptable, voir handoff).
export function useSetAccountingSystem() {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (system) => {
      const { error } = await supabase.from("companies").update({ accounting_system: system }).eq("id", company.company_id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });
}

// Phase 3 (SMT) -- Etat de recettes/depenses : approche caisse, derivee des
// mouvements de tresorerie deja existants (treasury_transactions), pas des
// ecritures comptables en partie double (qui sont en engagement/accrual,
// pas en caisse). Regroupe par categorie pour lisibilite.
export function useIncomeExpenseStatement() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["income-expense-statement", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .select("type, amount, category, created_at");
      if (error) throw error;
      const byCategory = {};
      let totalRecettes = 0, totalDepenses = 0;
      for (const t of data) {
        const key = t.category;
        if (!byCategory[key]) byCategory[key] = { category: key, recettes: 0, depenses: 0 };
        if (t.type === "encaissement") { byCategory[key].recettes += Number(t.amount); totalRecettes += Number(t.amount); }
        else { byCategory[key].depenses += Number(t.amount); totalDepenses += Number(t.amount); }
      }
      return { lines: Object.values(byCategory), totalRecettes, totalDepenses, solde: totalRecettes - totalDepenses };
    },
    enabled: !!company?.company_id,
  });
}

// Phase 4 (Systeme Normal) -- Bilan : classement Actif/Passif derive du
// normal_side de chaque compte (debit -> Actif pour classes 2/3/4/5, credit
// -> Passif pour classes 1/4). Simplifie -- pas de distinction immobilise/
// circulant, suffisant pour une premiere version.
export function useBalanceSheet() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["balance-sheet", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entry_lines")
        .select("debit, credit, account:chart_of_accounts(account_number, label, class, normal_side)");
      if (error) throw error;
      const byAccount = {};
      for (const l of data) {
        if (l.account.class >= 6) continue; // classes 6/7 = compte de resultat, pas le bilan
        const key = l.account.account_number;
        if (!byAccount[key]) byAccount[key] = { ...l.account, solde: 0 };
        byAccount[key].solde += Number(l.debit) - Number(l.credit);
      }
      const actif = [], passif = [];
      for (const a of Object.values(byAccount)) {
        if (Math.abs(a.solde) < 0.01) continue;
        const isActif = a.class === 5 || a.class === 2 || a.class === 3 || (a.class === 4 && a.normal_side === "debit");
        (isActif ? actif : passif).push({ ...a, solde: isActif ? a.solde : -a.solde });
      }
      actif.sort((a, b) => a.account_number.localeCompare(b.account_number));
      passif.sort((a, b) => a.account_number.localeCompare(b.account_number));
      const totalActifAvantResultat = actif.reduce((s, a) => s + a.solde, 0);
      const totalPassifAvantResultat = passif.reduce((s, a) => s + a.solde, 0);
      // Resultat net de l'exercice (Produits - Charges, classes 6/7 exclues du
      // bilan ci-dessus) : ligne de capitaux propres necessaire pour equilibrer
      // Actif = Passif tant que l'exercice n'est pas cloture (pas d'ecriture de
      // report du resultat vers un compte de reserves -- normal, la cloture
      // d'exercice est Phase 5, pas encore construite).
      const resultatExercice = totalActifAvantResultat - totalPassifAvantResultat;
      if (Math.abs(resultatExercice) > 0.01) {
        passif.push({ account_number: "120000", label: "Résultat net de l'exercice (calculé)", class: 1, solde: resultatExercice });
      }
      const totalActif = totalActifAvantResultat;
      const totalPassif = totalPassifAvantResultat + resultatExercice;
      return { actif, passif, totalActif, totalPassif };
    },
    enabled: !!company?.company_id,
  });
}

// Phase 4 (Systeme Normal) -- Compte de resultat par nature : classe 6
// (Charges) vs classe 7 (Produits), resultat = Produits - Charges.
export function useIncomeStatement() {
  const { data: company } = useCompany();
  return useQuery({
    queryKey: ["income-statement", company?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entry_lines")
        .select("debit, credit, account:chart_of_accounts(account_number, label, class)");
      if (error) throw error;
      const byAccount = {};
      for (const l of data) {
        if (l.account.class !== 6 && l.account.class !== 7) continue;
        const key = l.account.account_number;
        if (!byAccount[key]) byAccount[key] = { ...l.account, montant: 0 };
        byAccount[key].montant += l.account.class === 6 ? Number(l.debit) - Number(l.credit) : Number(l.credit) - Number(l.debit);
      }
      const charges = [], produits = [];
      for (const a of Object.values(byAccount)) {
        if (Math.abs(a.montant) < 0.01) continue;
        (a.class === 6 ? charges : produits).push(a);
      }
      charges.sort((a, b) => a.account_number.localeCompare(b.account_number));
      produits.sort((a, b) => a.account_number.localeCompare(b.account_number));
      const totalCharges = charges.reduce((s, a) => s + a.montant, 0);
      const totalProduits = produits.reduce((s, a) => s + a.montant, 0);
      return { charges, produits, totalCharges, totalProduits, resultat: totalProduits - totalCharges };
    },
    enabled: !!company?.company_id,
  });
}
