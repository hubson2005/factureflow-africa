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

- ~~Le PDF de facture ne semble pas encore integrer le visuel FNE ni le
  detail TVA par taux~~ **Verifie le 20/08/2026 : deja fait**, voir
  commit `bd6aa80`. `pdfGenerator.ts` regroupe la TVA par taux distinct
  et affiche un bloc FNE reglementaire (QR + reference + NCC),
  independant des reglages generiques du template.
- ~~Expansion SN/BJ/BF : aucun test fonctionnel frontend~~ **Teste le
  20/08/2026** via insertion reelle (puis nettoyee) d'une facture
  multi-lignes (normal/exonere/hors_champ) pour une entreprise de
  chaque pays. Resultat : taux et totaux corrects pour les 4 pays
  (CI/SN/BJ/BF). Le trigger `trg_auto_fill_vat_rate` et
  `get_current_vat_rate()` se comportent de facon identique et fiable
  quel que soit le pays. Aucun code frontend n'a ete modifie (deja
  correctement branche sur `country_code` dynamique, pas de valeur
  codee en dur).
  **Note technique decouverte au passage** : une contrainte DB
  `chk_vat_exemption_reason_required` impose un motif d'exoneration
  quand `vat_rate_type = 'exonere'` — deja anticipee cote frontend
  (`NewInvoiceForm.tsx`), rien a corriger, juste a garder en tete pour
  tout futur script/seed qui inserait des lignes exonerees.

### A faire ensuite

- Aucun chantier TVA/FNE ouvert a ce stade sur les 4 pays couverts.
  Prochaine etape logique si besoin : ajouter un 5e pays, ou traiter
  un des autres points "on the horizon" (audits/avoirs, responsive).

## Correctifs appliques (20/08/2026)

### create_credit_note() — faille d'autorisation (SECURITE)

**Trouve par audit fonctionnel avant merge vers `main`** (voir regle d'or).
`create_credit_note()` (RPC, `EXECUTE` accorde a `authenticated` et meme
`anon`) ne verifiait jamais que l'appelant avait un role dans l'entreprise
proprietaire de la facture — contrairement a
`calculate_invoice_compliance_score()` qui fait deja ce controle.

Preuve par scenario controle (entreprises de test, nettoyees ensuite) :
un utilisateur n'ayant acces qu'a l'entreprise A a pu faire progresser
`create_credit_note()` jusqu'a l'insertion de la ligne `invoices` chez
l'entreprise B, stoppe uniquement **par accident** par le trigger
`invoices_compliance_recalc` (qui vérifie les droits mais n'a pas été
conçu pour jouer ce rôle de garde-fou). Si ce trigger est un jour
desactive/refactore, la faille redevient pleinement exploitable :
creation d'avoirs frauduleux sur les factures d'une autre entreprise,
consommation de sa numerotation.

**Correctif appliqué** (migration `fix_create_credit_note_authz_and_vat_type`) :
ajout d'une verification explicite `user_role_in_company()` en tete de
fonction, meme pattern que `calculate_invoice_compliance_score()`.
Revalide : l'intrusion echoue desormais immediatement ("Acces refuse"
a la ligne de la nouvelle verification, avant toute ecriture), le cas
legitime fonctionne toujours normalement.

**Bug mineur corrige au passage** : les lignes de l'avoir ne recopiaient
pas `vat_rate_type`/`vat_exemption_reason` depuis la facture d'origine
(retombaient sur le defaut `'normal'`/`null`). `tax_rate` etait deja
correct donc aucun impact financier, juste une incoherence de reporting.
Revalide : un avoir sur une ligne `exonere` affiche desormais bien
`vat_rate_type='exonere'` et le motif d'origine.

**Lecon** : pour toute fonction `SECURITY DEFINER` appelable en RPC,
verifier explicitement `user_role_in_company()` (ou equivalent) en
premiere instruction — ne jamais compter sur un trigger d'un autre
sous-systeme pour jouer ce role, meme s'il semble le faire aujourd'hui.
A verifier sur les autres fonctions `SECURITY DEFINER` du projet avant
le merge vers `main`.

### Audit complet des 31 fonctions SECURITY DEFINER (20/08/2026)

Suite au correctif ci-dessus, audit systematique de toutes les fonctions
`SECURITY DEFINER` du schema public, avant merge vers `main`.

**2e correctif applique** (migration `revoke_public_execute_on_internal_only_functions`) :
`log_audit_event()` et `dispatch_webhook()` n'avaient aucune verification
sur `p_company_id`, mais ne sont jamais appelees par le frontend (confirme
par recherche exhaustive dans `src/`) — uniquement en interne (triggers,
`create_credit_note`). Avant correctif, un utilisateur authentifie pouvait :
- injecter des entrees arbitraires dans le journal d'audit de N'IMPORTE
  QUELLE entreprise (compromet un outil pense pour la conformite OHADA) ;
- declencher les webhooks configures par N'IMPORTE QUELLE entreprise avec
  un payload arbitraire, signe avec le VRAI secret HMAC de la victime
  (usurpation d'evenements + abus/spam de son endpoint).

Correctif : retrait du droit `EXECUTE` accorde a `anon`/`authenticated`/
`PUBLIC` plutot qu'ajout d'une verification interne — ces fonctions ne
sont utiles qu'en interne, et les appels internes (triggers, dont ceux
declenches par `generate_due_recurring_invoices` via `pg_cron`, sans
`auth.uid()`) restent inchanges car ils s'executent avec les privileges
du proprietaire. Revalide par test reel (intrusion refusee, usage interne
via insertion client de test toujours fonctionnel et journalise, nettoye).

**29 autres fonctions verifiees, toutes correctement protegees** via
`user_role_in_company()` en tete de fonction (`generate_api_key`,
`accept_invitation`, `convert_quote_to_invoice`, `create_company_with_admin`,
`can_add_user`, `can_create_client`, `can_create_invoice`,
`unread_notifications_count`, `user_company_ids`, `calculate_client_score`,
`recalculate_all_client_scores`, `evaluate_periodic_automation_rules`,
`get_subscription_usage`, etc.). `get_invitation_preview` est protegee par
design (token UUID imprevisible, donnees exposees non sensibles).

**Nuance notee, non corrigee** : `accept_invitation()` ne verifie pas que
l'email de l'utilisateur connecte correspond a l'email invite — n'importe
qui en possession du token peut l'accepter en son propre nom. Probablement
voulu (pattern lien-invitation "bearer token"), a confirmer avec Hubert
si on veut durcir.

### Decouverte hors perimetre securite : module Devis sans moteur TVA — RESOLU

~~En auditant `convert_quote_to_invoice()`, decouverte que `quote_items`
n'a jamais recu le moteur TVA multi-pays~~ **Corrige et teste le
20/08/2026.** DB : colonnes `vat_rate_type`/`vat_exemption_reason`
ajoutees a `quote_items`, trigger `trg_auto_fill_vat_rate_quote` (miroir
de celui des factures), `convert_quote_to_invoice()` recopie desormais
le regime TVA (meme correctif que sur les avoirs). Frontend :
`NewQuoteForm.tsx`, `useQuotes.js`, `pdfGenerator.js` (devis) et
`QuoteCard.tsx` mis a jour — plus de 18% code en dur, TVA regroupee par
taux distinct y compris dans le PDF (valide par generation reelle +
inspection visuelle). Teste en base pour le Senegal (cree/verifie/
nettoye) : devis multi-taux + conversion en facture, tout correct de
bout en bout. Commit `eb1b426`.

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

## Branche feature/erp-scaffold (decouverte le 20/08/2026, confirmee voulue)

Une branche `feature/erp-scaffold` existe sur le remote (commit
`616479f feat(erp): scaffold ERP modulaire (Stock, Achats, Tresorerie,
RH)`, branchee depuis `main` juste avant le merge du 20/08/2026).
**Non documentee dans ce fichier au moment de sa creation** — decouverte
par accident via un `git branch --show-current` de Hubert, pas via ce
handoff. Confirme aupres de Hubert : c'est **voulu**, demande
directement par lui a l'autre IA, ca ne contredit pas la note
"Connecteur Odoo deprioritise" plus haut (portee differente — la
priorisation ERP a change depuis).

**Lecon (bis)** : toute nouvelle branche de travail doit etre
mentionnee ici des sa creation, meme un simple scaffold initial —
sinon elle est invisible pour l'autre IA jusqu'a ce qu'elle merge ou
qu'elle soit decouverte par hasard.

## Note mineure, non prioritaire (20/08/2026)

L'API webhook existante (`invoice.created`/`invoice.updated`/etc., voir
`IntegrationsSection.tsx`) n'a pas d'evenement dedie pour les avoirs
(`create_credit_note` declenche `invoice.created` generique, montant
negatif — pas faux, juste peu explicite) ni pour la certification FNE
(aucun webhook, `fne_status` n'est pas surveille par
`trg_webhook_invoice_updated`). Pas un bug, juste une granularite
absente. A ne traiter que si un client reel en fait la demande — meme
logique que le connecteur Odoo deprioritise.
