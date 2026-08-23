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

## Chantier en cours : ERP multi-tenant (20/08/2026)

`feature/erp-scaffold` (mono-tenant, projet Supabase separe, voir plus haut)
en cours de conversion multi-tenant directement dans FactureFlow, sur
demande explicite de Hubert. Nouvelle branche : `feature/erp-multitenant`
(basee sur `main`).

**Convention actee pour tous les modules ERP a venir** : nommage anglais
des tables/colonnes (coherent avec le reste du schema : invoices,
invoice_items, products...), PAS le francais du scaffold original
(entrepots -> warehouses, mouvements_stock -> stock_movements, etc.).
Merci de suivre cette convention sur Achats/Tresorerie/RH si vous
continuez ce chantier.

### Module Stock — DB terminee et testee, front pas encore fait

Migrations appliquees : `erp_stock_module_multitenant`.
- `products` etendu (sku, purchase_price, stock_alert_threshold, unit,
  track_stock) plutot que de dupliquer un catalogue `produits` separe
  (le scaffold en avait besoin uniquement parce que c'etait deux bases
  differentes — plus necessaire maintenant).
- Nouvelles tables : `warehouses`, `stock_levels`, `stock_movements`.
  RLS via `user_role_in_company()` (le scaffold n'isolait que par
  `auth.role() = 'authenticated'` — faille multi-tenant totale si
  merge tel quel, cf. section securite plus haut : le module RH/Paie
  du scaffold a le meme probleme, a traiter avec le meme soin quand
  on y arrivera).
- Le webhook HMAC cross-projet du scaffold est remplace par un trigger
  interne `trg_sync_stock_on_invoice_item` (meme transaction que la
  creation de facture) : plus besoin d'Edge Function ni de
  `webhook_events`, plus fiable qu'un webhook fire-and-forget.
  Quantite negative (avoir) reapprovisionne automatiquement grace au
  signe deja en place sur les avoirs. Ne bloque jamais la creation
  d'une facture (produit sans track_stock, ou entreprise sans entrepot
  par defaut -> ignore silencieusement, pas d'exception).

**Teste par intrusion (cree/verifie/nettoye)** : utilisateur lie
uniquement a l'entreprise A -> 0 entrepot visible pour B, insertion
refusee par RLS. Cycle facture -> sortie stock -> avoir -> stock
revient a 0, verifie avec les vrais montants.

### Module Stock — TERMINE (DB + front)

DB (migration `erp_stock_module_multitenant`) et front (commit
`ac46914`) tous les deux faits et testes. Page `/stock` accessible
depuis la sidebar (section Relations, a cote de Produits). Toggle
"Suivre le stock" ajoute a la fiche produit (categorie "Produit"
uniquement). Build de production valide, forme des donnees PostgREST
confirmee, jeu de donnees complet cree/verifie/nettoye.

**Reste a faire** : Achats/Fournisseurs, Tresorerie, RH (RH en dernier
vu la sensibilite des donnees de salaire — meme methode : company_id +
RLS via user_role_in_company + test d'intrusion avant tout merge).

### Module Achats/Fournisseurs — TERMINE (DB + front)

Migration `erp_purchases_module_multitenant` + commit `d039faf`. Page
`/purchases` (section Finances, a cote de Paiements). Gestion
fournisseurs, commandes multi-lignes, reception (partielle repetable)
qui incremente automatiquement le stock via `stock_movements` (reutilise
le mecanisme du module Stock). Teste par intrusion cross-tenant
(cree/verifie/nettoye) : RLS bloque en amont (postgres n'a pas
BYPASSRLS sur ce projet), verification explicite dans
`receive_purchase()` en filet de securite -- double protection.

**Dependance explicite pour la suite (Tresorerie)** : le scaffold
original avait un bouton "Marquer paye" sur chaque achat, relie a une
table `comptes` et une fonction `marquer_achat_paye()` -- appartient
au module Tresorerie, pas encore construit. Volontairement absent du
front actuel. Quand Tresorerie sera fait, revenir sur
`src/pages/Purchases.tsx` (`PurchaseCard`) pour ajouter ce bouton.

**Reste a faire pour l'ERP complet** : Tresorerie, RH (RH en dernier).

### Module Tresorerie — TERMINE (DB + front)

Migration `erp_treasury_module_multitenant` + commit `41cdb5e`. Page
`/accounts` (nav "Comptes", section Finances) -- volontairement PAS
appelee "Tresorerie" dans le menu pour eviter la collision avec la
page existante `/cashflow` (outil de PREVISION/forecast, fonctionnalite
totalement differente de la comptabilite reelle construite ici).

Encaissements/decaissements generes automatiquement par des triggers
internes sur `payments` et `expenses` (pas de webhook, contrairement
au scaffold original). `mark_purchase_paid()` ferme la boucle laissee
ouverte par le module Achats -- le bouton "Marquer paye" est
maintenant dans `/accounts` (section "Achats a payer"), pas dans
`/purchases`.

Teste par intrusion (cree/verifie/nettoye) + cycle complet valide au
centime pres (encaissement + 2 decaissements -> solde exact).

**BUGFIX CRITIQUE trouve en testant ce module** (sans rapport avec la
tresorerie elle-meme, migration `fix_trg_audit_payment_recorded_broken_signature`) :
`trg_audit_payment_recorded()` appelait `log_audit_event()` avec les
arguments 5 et 6 inverses (texte au lieu du jsonb attendu par la
signature reelle). **Consequence : tout enregistrement de paiement
client echouait en production** (l'insert dans `payments` etait
annule par l'exception du trigger d'audit). Corrige et revalide par
insertion reelle. Si vous avez deja rencontre des paiements qui
"ne s'enregistrent pas" sans comprendre pourquoi, c'etait ca.

**Trouve mais PAS corrige, a nettoyer plus tard** : `payments` a des
triggers dupliques (`audit_payment_insert` + `audit_payment_recorded`,
`trg_payments_webhook` + `webhook_payment_received`) -- signe d'une
collision entre sessions IA anterieure a celle-ci. Pas touche pour
rester concentre sur le chantier ERP, mais a comparer/dedupliquer un
jour.

**Reste a faire pour l'ERP complet** : RH (dernier module, donnees de
salaire -- meme methode stricte : company_id + RLS +
user_role_in_company + test d'intrusion avant tout merge, en portant
une attention particuliere a ce qu'aucune colonne ne soit oubliee
dans la conversion, contrairement au risque signale des le debut de
ce chantier).

### Module RH — TERMINE (DB + front) — LES 4 MODULES ERP SONT FINIS

Migration `erp_hr_module_multitenant` + commit `098c0ea`. Page `/hr`,
nouvelle section de navigation dediee "Ressources humaines" (separee
de "Finances", visibilite volontaire vu la sensibilite du module).

`pay_payslip()` ferme la derniere boucle : decaissement tresorerie
categorie 'salaire', meme pattern de verification explicite que
`mark_purchase_paid()`.

**Teste avec une rigueur au-dela du standard des autres modules**
(justifie par la sensibilite des donnees de salaire) : en plus du
cree/verifie/nettoye habituel, verification explicite qu'un UPDATE
malveillant sur le salaire d'un employe d'une autre entreprise n'a
AUCUN effet (pas seulement que le SELECT retourne 0 lignes -- le
salaire reel a ete relu apres la tentative et confirme inchange).
`pay_payslip()` sur le bulletin d'une autre entreprise refuse, 0
transaction de tresorerie frauduleuse creee. Cycle complet valide au
centime pres pour le cas legitime.

---

## BILAN : les 4 modules ERP (Stock, Achats, Tresorerie, RH) sont
## termines -- DB + front + tests d'intrusion + documentation

Toute la conversion mono-tenant -> multi-tenant de `feature/erp-scaffold`
est faite sur la branche `feature/erp-multitenant` (derniere reference
locale a synchroniser : commit `098c0ea` au 21/08/2026). Chaque module
a ete teste par un scenario d'intrusion reel (deux entreprises de
test, tentative d'acces croisee, verification, nettoyage) avant
d'etre considere termine.

**PAS ENCORE MERGE vers `main`** -- attente de validation de Hubert
avant que ca touche la production Vercel. Avant de merger, il reste
peut-etre a :
- Nettoyer les doublons de triggers sur `payments` (voir section
  Tresorerie plus haut) -- pas bloquant mais signale
- Verifier qu'aucun autre webhook/trigger externe au perimetre ERP ne
  depend du `webhook_events` du scaffold original (on ne l'a jamais
  cree cote multi-tenant -- tout passe par des triggers internes)
- Repasser une fois de plus sur les 4 nouvelles fonctions
  SECURITY DEFINER (receive_purchase, mark_purchase_paid, pay_payslip,
  + les triggers sync_stock/sync_treasury) avec le meme regard que
  l'audit complet fait plus haut sur les fonctions preexistantes,
  si une nouvelle session veut faire un tour de verification
  independant avant le merge.

## Passage de securite sur les fonctions ERP -- FAIT (21/08/2026)

Audit systematique des 8 fonctions SECURITY DEFINER creees pendant ce
chantier (receive_purchase, mark_purchase_paid, pay_payslip,
sync_stock_on_invoice_item, sync_treasury_on_payment,
sync_treasury_on_expense, apply_stock_movement, apply_treasury_transaction),
avant merge vers `main`.

### Faille critique trouvee et corrigee : compte tresorerie d'une autre entreprise

`mark_purchase_paid()` et `pay_payslip()` verifiaient l'acces a
l'achat/bulletin d'un cote et au compte de l'autre, **mais jamais que
les deux appartenaient a la meme entreprise**. Un utilisateur ayant
legitimement acces a plusieurs entreprises (comptable multi-clients,
cas reel et supporte par `company_users`) pouvait payer l'achat ou le
salaire d'une entreprise A en debitant le compte d'une entreprise B.

**Prouve empiriquement** avant correctif : achat de 30000 FCFA chez A,
paye avec le compte de B -> solde de A reste a 0, solde de B debite de
-30000. Incoherence financiere reelle, pas juste theorique.

**Corrige** (migration `fix_cross_company_account_mismatch`) : les
deux fonctions verifient maintenant explicitement
`v_account_company_id = v_purchase.company_id` (respectivement
`v_payslip.company_id`) avant tout mouvement. Revalide : le paiement
croise est refuse avec un message clair, le paiement avec le bon
compte fonctionne toujours normalement (solde correct, verifie au
centime pres).

**Lecon supplementaire** : pour toute fonction SECURITY DEFINER qui
prend en parametre PLUSIEURS references vers des entites appartenant
potentiellement a des entreprises differentes (ici : achat + compte),
ne pas se contenter de verifier l'acces a chacune independamment --
verifier explicitement qu'elles appartiennent a la MEME entreprise.
Un utilisateur multi-entreprises legitime peut declencher ce genre de
bug par erreur, sans meme etre malveillant.

### Verifications complementaires (pas de probleme trouve)

- `sync_stock_on_invoice_item`, `sync_treasury_on_payment`,
  `sync_treasury_on_expense`, `apply_stock_movement`,
  `apply_treasury_transaction` : fonctions de trigger (RETURNS
  trigger), avaient EXECUTE accorde par erreur a anon/authenticated
  (meme defaut generique que log_audit_event/dispatch_webhook
  precedemment). Verifie empiriquement qu'un appel direct est de
  toute facon rejete par Postgres lui-meme ("trigger functions can
  only be called as triggers"), independamment des droits -- **pas
  exploitable**, contrairement a log_audit_event/dispatch_webhook qui
  etaient de vraies fonctions RPC. Droits retires quand meme par
  principe de moindre privilege (migration
  `revoke_execute_on_erp_trigger_only_functions`), revalide qu'aucun
  trigger interne n'est casse par ce retrait.
- `receive_purchase()` : ne prend qu'un seul parametre (l'achat),
  l'entrepot est deduit de l'achat lui-meme -- aucun risque de
  confusion cross-entreprise du meme type que mark_purchase_paid/
  pay_payslip.

**Le passage de securite est termine. Les 4 modules ERP sont prets
pour le merge vers `main`, sous reserve de la validation de Hubert.**

## Mise a niveau des points en attente (22/08/2026, sur demande de Hubert)

Trois des points signales comme "non prioritaire"/"a nettoyer plus tard"
traites maintenant. Deux autres (plan comptable SYSCOHADA, placeholders
NCC/RCCM) restent hors de portee -- necessitent respectivement une
validation comptable OHADA et les vraies valeurs legales des entreprises,
que ni moi ni l'autre IA ne pouvons deviner.

### 1. Triggers dupliques sur `payments` -- NETTOYE

Retire `audit_payment_recorded` (garde `audit_payment_insert`, convention
MAJUSCULES coherente avec le reste du schema) et `trg_payments_webhook`
(garde `webhook_payment_received` -- l'autre utilisait un nom d'evenement
`'paiement_recu'` absent de la liste documentee dans IntegrationsSection.tsx
et envoyait la ligne brute complete au lieu d'un payload propre). Teste :
un seul log d'audit desormais par paiement enregistre.

### 2. Chiffrement de `fne_api_key` -- FAIT (migration + Edge Function + front)

Migre vers Supabase Vault (extension deja disponible sur ce projet).
`companies.fne_api_key` (colonne en clair) **supprimee**. Remplacee par
`fne_api_key_secret_id uuid references vault.secrets(id)`.

Nouvelles fonctions : `set_fne_api_key(company_id, api_key)` (admin
uniquement, cree/met a jour le secret Vault), `clear_fne_api_key(company_id)`
(admin uniquement), `get_decrypted_fne_api_key(company_id)` (EXECUTE
reserve a service_role/postgres -- jamais anon/authenticated, sinon on
recree la fuite qu'on corrige). Le schema `vault` n'etant pas expose via
PostgREST, l'Edge Function passe par cette derniere fonction via `.rpc()`
plutot qu'un acces direct a `vault.decrypted_secrets`.

Edge Function `fne-certify-invoice` mise a jour et redeployee (v4).

**BUG CRITIQUE trouve et corrige en cours de route** : `useCompany.js`
(hook central utilise dans toute l'app) selectionnait encore
`companies.fne_api_key` -- la colonne venait d'etre supprimee par la
migration. Sans ce correctif immediat, le prochain chargement de l'app
aurait casse partout (`useCompany` est appele quasiment sur chaque page).
Corrige avant meme de committer, donc jamais deploye en l'etat casse.

Frontend (`Settings.tsx`, `useCompanySettings.js`) : la cle ne se
pre-remplit plus jamais avec la vraie valeur (le serveur ne l'envoie
plus). Badge "Configuree"/"Non configuree", bouton "Retirer la cle".

Teste de bout en bout : cycle definir/dechiffrer/retirer valide,
verification non-admin refusee, logique exacte de l'Edge Function
(via `get_decrypted_fne_api_key`) validee dans les deux cas (avec/sans
cle configuree). Aucune vraie cle FNE n'existait en base au moment de
la migration (verifie avant de commencer) -- rien a migrer, juste la
structure.

### 3. `accept_invitation()` sans verification email -- CORRIGE

Ajoute une comparaison insensible a la casse entre l'email de
l'invitation et celui de l'utilisateur connecte. Avant : n'importe qui
en possession du token (lien forwarde par erreur, etc.) pouvait accepter
l'invitation en son propre nom, quel que soit son email. Teste : email
different refuse avec message clair, email identique (casse differente
y compris) accepte normalement. Utilisateur de test cree directement
dans `auth.users` pour le test (seule facon de tester un utilisateur
"neuf" sans entreprise), supprime immediatement apres.

### Points restants, hors de portee pour une IA

- **Plan comptable SYSCOHADA complet** : necessite la validation d'un
  comptable OHADA avant de coder quoi que ce soit -- ne pas deviner une
  classification comptable.
- **Placeholders NCC/RCCM** (`A_COMPLETER_NCC`/`A_COMPLETER_RCCM` pour
  KUDU CASH et SOCIALAPP) : necessitent les vraies valeurs legales des
  entreprises, que Hubert seul peut fournir.

### Note mineure, non traitee (hors scope de cette tache)

`useUpdateCompanyCompliance()` dans `useCompanySettings.js` contient des
`console.log` de debug ("DEBUG mutationFn START/AFTER AWAIT/CAUGHT
EXCEPTION") oublies dans le code de production. Sans risque de securite,
juste du bruit dans la console -- a nettoyer a l'occasion.
