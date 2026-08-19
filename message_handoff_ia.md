# Coordination inter-IA — FactureFlow Africa

Ce fichier est **versionne dans le repo** (contrairement aux versions
precedentes qui vivaient uniquement dans un conteneur ephemere et etaient
donc perdues entre sessions — cause directe d'une collision le 19/08/2026,
voir "Incidents" ci-dessous). **Toute IA qui travaille sur ce projet doit
lire ce fichier en debut de session et le mettre a jour avant de terminer,
en particulier avant tout `git push`.**

## Regle d'or

Avant toute migration ou tout developpement frontend consequent :
1. Lire ce fichier.
2. Verifier l'etat reel : `git fetch origin <branche>` puis comparer
   `HEAD..origin/<branche>` — ne jamais supposer que la branche locale est
   a jour.
3. Cote base : verifier `pg_proc`/`pg_trigger`/`information_schema.columns`
   avant de creer une fonction/trigger/colonne — ne jamais supposer l'etat
   du schema.
4. Committer et pousser des que possible : le travail qui reste seulement
   dans un conteneur est perdu a la fin de la session (voir Incidents).

## Etat actuel (19/08/2026, 23:51 UTC)

- **Branche active de developpement** : `refactor/socialapp-to-factureflow`
  (pas `main`, qui est en retard, bloque sur un commit du 14 juillet avec
  des residus SocialApp).
- **Backend Supabase** (`pufeqrduffcgneaxhuix`) : source de verite la plus
  fiable, a jour, independant du conteneur/git.
- **Dernier commit pousse** : `7328803` — voir son message pour le detail.

### Fonctionnalites en place sur `refactor/socialapp-to-factureflow`

- Moteur TVA configurable multi-pays (`vat_rates`, `get_current_vat_rate()`,
  trigger `trg_auto_fill_vat_rate` sur `invoice_items`), cable dans
  `NewInvoiceForm.tsx` (selection du type de taux par ligne) et
  `useInvoices.js`.
- Certification FNE Cote d'Ivoire : Edge Function `fne-certify-invoice`,
  `InvoiceFneVisual.tsx` (`src/modules/invoices/components/`) + QR code,
  hook `useCertifyInvoiceFne` (dans `useInvoices.js`), bouton "Certifier
  via FNE" dans le menu de `InvoiceCard.tsx`. **Limite a
  `country_code === 'CI'`** via une prop `showFne` propagee depuis
  `Invoices.tsx` (`useCompany()`).
- Gestion des avoirs : `useCreditNote.js`, `CancelInvoiceModal.tsx`.
- Journal d'audit : `useAuditLog.js`, page `AuditLog.tsx`.
- Score de conformite fiscale : `ComplianceScoreBadge.tsx`.
- Responsive : refonte `BottomNav.tsx` / `Sidebar.tsx` / `KpiSection.tsx`.

### A verifier / a reprendre

- Le PDF de facture (`pdfGenerator.ts` / `useInvoicePdfContext.js`) ne
  semble pas encore integrer le visuel FNE ni le detail TVA par taux —
  a confirmer et completer si besoin.
- Expansion SN/BJ/BF au-dela de la Cote d'Ivoire : `vat_rates` et
  `country_configs` couvrent deja ces 4 pays cote base, mais aucun test
  fonctionnel frontend n'a ete fait pour SN/BJ/BF (seul CI a ete verifie).

## Incidents (pour eviter de les reproduire)

### 19/08/2026 — Collision sur `refactor/socialapp-to-factureflow`

Deux IA ont travaille en parallele sur le meme perimetre (moteur TVA +
visuel FNE) sans se voir, car le fichier de coordination precedent
n'etait pas versionne dans git (perdu a chaque reset de conteneur). Une
IA a pousse a 18h39 et 19h21 UTC un travail large (47 fichiers). Une
autre IA avait en parallele reconstruit un sous-ensemble equivalent
(TVA + FNE) suite a une perte de travail frontend anterieure
(session du 7-18 aout jamais poussee sur GitHub — cause racine
identique : travail non pousse = travail perdu).

Resolution : la version la plus complete (celle du push 18h39/19h21) a
ete gardee. Deux bugs y ont ete identifies et corriges par patch cible
(commit `7328803`) plutot que par ecrasement :
1. `tax_rate` omis a l'insertion au lieu d'etre mis explicitement a
   `null` → le DEFAULT de colonne (18.00) court-circuitait le trigger
   d'auto-remplissage TVA. **Piege PostgreSQL a connaitre** : une colonne
   omise dans un INSERT recoit sa valeur DEFAULT *avant* qu'un trigger
   BEFORE INSERT ne s'execute — un check `if new.col is null` ne verra
   donc jamais NULL si la colonne a un DEFAULT non-null et est omise.
   Verifie empiriquement via table temporaire de test.
2. FNE affiche pour tous les pays au lieu d'etre limite a la Cote
   d'Ivoire (specificite DGI).

**Lecon** : ce fichier doit desormais etre committe et pousse a chaque
session, pas seulement garde en local.
