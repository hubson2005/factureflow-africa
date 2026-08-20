-- =========================================================
-- Scénario de test end-to-end (hors webhooks FactureFlow,
-- testés séparément via le script Node)
-- =========================================================
\set ON_ERROR_STOP on

-- 1) Données de base -----------------------------------------------
insert into entrepots (id, nom) values ('11111111-1111-1111-1111-111111111111', 'Entrepôt principal');
insert into comptes (id, nom, type, solde_initial) values
  ('22222222-2222-2222-2222-222222222222', 'Mobile Money', 'mobile_money', 50000);

insert into produits (id, nom, sku, factureflow_ref, prix_achat, prix_vente, seuil_alerte)
values ('33333333-3333-3333-3333-333333333333', 'Sac de riz 25kg', 'RIZ25', 'ff-prod-riz25', 8000, 12000, 5);

insert into fournisseurs (id, nom) values ('44444444-4444-4444-4444-444444444444', 'Grossiste Riz SARL');

-- 2) Cycle Achat -> Réception -> Stock -------------------------------
insert into achats (id, fournisseur_id, entrepot_id, reference, statut, date_commande)
values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444',
        '11111111-1111-1111-1111-111111111111', 'PO-0001', 'commande', now());

insert into achat_lignes (achat_id, produit_id, quantite, prix_unitaire)
values ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 20, 8000);

select receptionner_achat('55555555-5555-5555-5555-555555555555');

-- Vérif attendue : stock = 20, mouvement 'entree'
\echo '--- TEST 1 : stock après réception (attendu: 20) ---'
select quantite from stock where produit_id = '33333333-3333-3333-3333-333333333333';

-- 3) Paiement fournisseur -> décaissement ----------------------------
select marquer_achat_paye('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222');

\echo '--- TEST 2 : solde compte après paiement fournisseur (attendu: 50000 - 20*8000 = -110000) ---'
select solde from comptes where id = '22222222-2222-2222-2222-222222222222';

\echo '--- TEST 3 : achat marqué payé (attendu: t) ---'
select paye from achats where id = '55555555-5555-5555-5555-555555555555';

-- 4) Module RH : employé + paie + paiement ----------------------------
insert into employes (id, nom, prenom, poste, salaire_mensuel)
values ('66666666-6666-6666-6666-666666666666', 'Kone', 'Awa', 'Vendeuse', 75000);

insert into paies (employe_id, periode, salaire_brut, primes, deductions)
values ('66666666-6666-6666-6666-666666666666', 'Août 2026', 75000, 5000, 0);

\echo '--- TEST 4 : salaire net calculé (attendu: 80000) ---'
select salaire_net from paies where employe_id = '66666666-6666-6666-6666-666666666666';

select payer_salaire(
  (select id from paies where employe_id = '66666666-6666-6666-6666-666666666666'),
  '22222222-2222-2222-2222-222222222222'
);

\echo '--- TEST 5 : solde compte après paiement salaire (attendu: -110000 - 80000 = -190000) ---'
select solde from comptes where id = '22222222-2222-2222-2222-222222222222';

\echo '--- TEST 6 : historique mouvements de stock (doit contenir 1 ligne "entree" de 20) ---'
select type, quantite, source from mouvements_stock;

\echo '--- TEST 7 : journal de trésorerie (2 décaissements attendus : achat 160000, salaire 80000) ---'
select type, montant, categorie, source from transactions_tresorerie order by created_at;
