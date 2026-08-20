# ERP FactureFlow — Module Stock (scaffold)

ERP interne, connecté à [FactureFlow Africa](https://factureflow-africa.vercel.app)
via webhooks signés (HMAC-SHA256). Stack : React + Vite + Supabase.

## Architecture

```
FactureFlow Africa                    ERP (ce projet)
───────────────────                   ─────────────────
Facturation, clients        →  webhook   Edge Function factureflow-webhook
                                          vérifie signature HMAC
                                          → met à jour le stock (Postgres)
```

## Mise en route

### 1. Créer le projet Supabase de l'ERP
Un projet **séparé** de celui de FactureFlow (bases indépendantes).

```bash
npx supabase init
npx supabase link --project-ref <votre-ref-projet>
npx supabase db push   # applique supabase/migrations/0001_init_stock.sql
```

### 2. Créer un entrepôt par défaut
Dans le SQL editor Supabase :
```sql
insert into entrepots (nom) values ('Entrepôt principal') returning id;
```
Notez l'`id` retourné, il sert de `DEFAULT_ENTREPOT_ID`.

### 3. Déployer l'Edge Function
```bash
npx supabase functions deploy factureflow-webhook
npx supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key-du-projet-erp> \
  FACTUREFLOW_WEBHOOK_SECRET=<clé générée dans FactureFlow > Integrations> \
  DEFAULT_ENTREPOT_ID=<id-recupere-etape-2>
```

L'URL de la fonction (à coller dans FactureFlow > Integrations > Webhooks sortants) :
```
https://<votre-ref-projet>.supabase.co/functions/v1/factureflow-webhook
```

### 4. Configurer FactureFlow
Dans l'écran **Integrations** que vous avez déjà commencé :
- **Clés API** : générez une clé, c'est elle qui sert de `FACTUREFLOW_WEBHOOK_SECRET`
- **Webhooks sortants** : collez l'URL de l'Edge Function, cochez au minimum
  `Facture créée`

### 5. Faire correspondre vos produits
Dans le module **Produits** de l'ERP, chaque produit doit avoir une
**Réf. FactureFlow** qui correspond à l'identifiant envoyé dans les lignes
de facture par le webhook — sans ça, l'ERP ne peut pas retrouver quel
produit décrémenter.

### 6. Lancer le front
```bash
npm install
cp .env.example .env   # puis renseignez VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## Ce qui est fait
- Schéma Stock : `produits`, `entrepots`, `stock`, `mouvements_stock`, `webhook_events`
- Schéma Achats : `fournisseurs`, `achats`, `achat_lignes`
- Trigger Postgres qui recalcule `stock.quantite` à chaque mouvement
- Fonction `receptionner_achat(p_achat_id)` : crée les entrées de stock
  correspondant aux lignes non encore reçues, puis passe l'achat au
  statut `receptionne` (supporte les réceptions partielles répétées)
- Edge Function qui vérifie la signature HMAC et traite `invoice.created`
- Front React : Stock, Produits, Fournisseurs, Achats (création de
  commande multi-lignes + bouton "Réceptionner")

## Module Achats/Fournisseurs — comment ça marche
1. **Fournisseurs** : créez vos fournisseurs (nom, contact, téléphone, email)
2. **Achats** : créez une commande — fournisseur, entrepôt de réception,
   puis une ou plusieurs lignes (produit, quantité, prix unitaire). La
   commande passe au statut `commande`
3. **Réceptionner** : quand la marchandise arrive, cliquez sur
   "Réceptionner" → la fonction Postgres `receptionner_achat` crée
   automatiquement un mouvement de stock `entree` pour chaque ligne et
   met à jour `stock.quantite` via le trigger déjà en place. Le statut
   passe à `receptionne`

Appliquer la nouvelle migration :
```bash
npx supabase db push   # applique aussi 0002_achats_fournisseurs.sql
```

## Module Trésorerie/Comptabilité — comment ça marche
1. **Comptes** : créez au moins un compte (Caisse, Banque, Mobile Money...)
   avec son solde initial. C'est ce solde qui évolue automatiquement à
   chaque transaction (trigger Postgres, comme pour le stock)
2. **Encaissement automatique** : quand FactureFlow envoie l'événement
   `payment.received`, l'Edge Function crée un encaissement sur le
   compte défini par le secret `DEFAULT_COMPTE_ID`
3. **Décaissement fournisseur** : sur la page Achats, une fois une
   commande reçue, choisissez un compte et cliquez "Marquer payé" —
   ça enregistre un décaissement du montant total de la commande
4. **Trésorerie** : le journal complet des transactions, avec ajout
   manuel possible (salaires, charges diverses...)

Appliquer la nouvelle migration et le secret :
```bash
npx supabase db push   # applique aussi 0003_tresorerie.sql
npx supabase secrets set DEFAULT_COMPTE_ID=<id-du-compte-cree-etape-1>
```

## Module RH basique — comment ça marche
1. **Employés** : fiche simple (nom, poste, contact, date d'embauche,
   salaire mensuel de référence)
2. **Paie** : pour un employé et une période donnée, génère un bulletin
   à partir du salaire mensuel + primes − déductions (net calculé
   automatiquement par la base)
3. **Payer** : choisissez un compte de trésorerie et cliquez "Payer" —
   ça enregistre un décaissement (catégorie `salaire`) et passe le
   bulletin au statut `paye`, exactement comme pour les achats

Appliquer la nouvelle migration :
```bash
npx supabase db push   # applique aussi 0004_rh.sql
```

## Les 4 modules sont maintenant reliés entre eux

```
FactureFlow ──(vente)──► Stock (sortie) + Trésorerie (encaissement)
Fournisseur ──(achat)──► Stock (entrée) + Trésorerie (décaissement)
Employé ──────(paie)───► Trésorerie (décaissement)
```

Tout passe par le même journal `transactions_tresorerie` et les mêmes
comptes → une vue de trésorerie unifiée, sans double saisie.

## Prochaines étapes suggérées
- Gérer `invoice.updated` dans l'Edge Function
- Ajouter la logique de retry côté FactureFlow si l'ERP ne répond pas
- Réceptions partielles depuis l'interface (actuellement la fonction
  le permet, mais l'UI réceptionne tout en une fois)
- Rapprochement bancaire, export comptable (CSV/PDF)
- Génération automatique des bulletins en masse en fin de mois
- Authentification équipe + rôles (RLS actuellement basique : tout
  utilisateur authentifié peut tout faire)
