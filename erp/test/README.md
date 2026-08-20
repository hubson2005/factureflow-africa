# Test end-to-end — ERP FactureFlow

Ces scripts ont été écrits et **vraiment exécutés** contre une base
PostgreSQL locale pour valider le schéma, les fonctions SQL et la
logique de l'Edge Function (HMAC + traitement des événements),
sans dépendre d'un compte Supabase distant. Tous les tests sont passés.

## Ce qui a été testé et validé

**Scénario métier (`scenario_test.sql`)**
| # | Test | Résultat |
|---|------|----------|
| 1 | Stock après réception d'un achat (20 unités) | ✅ 20 |
| 2 | Solde du compte après paiement fournisseur (-160 000) | ✅ -110 000 |
| 3 | Achat marqué "payé" | ✅ true |
| 4 | Calcul automatique du salaire net (75000+5000) | ✅ 80 000 |
| 5 | Solde du compte après paiement salaire | ✅ -190 000 |
| 6 | Mouvement de stock "entree" bien tracé | ✅ |
| 7 | Journal de trésorerie (achat + salaire) | ✅ |

**Webhooks (`webhook-sim/test-webhook.mjs`)** — port Node.js fidèle
de l'Edge Function, testé avec de vraies requêtes HTTP signées :
| # | Test | Résultat |
|---|------|----------|
| 1 | Signature HMAC invalide → 401 rejeté | ✅ |
| 2 | `invoice.created` signé → sortie de stock (-3) | ✅ |
| 3 | `payment.received` signé → encaissement (+36 000) | ✅ |
| 4 | Événement inconnu → 200, ignoré proprement | ✅ |
| 5 | Traçabilité dans `webhook_events` | ✅ |

## Comment relancer ces tests vous-même

### 1. Base de données locale (simule votre futur projet Supabase)
```bash
# Nécessite PostgreSQL installé localement
createdb erp_test
psql -d erp_test -f test/0000_stub_supabase_auth.sql   # stub auth.role(), inutile sur vrai Supabase
psql -d erp_test -f supabase/migrations/0001_init_stock.sql
psql -d erp_test -f supabase/migrations/0002_achats_fournisseurs.sql
psql -d erp_test -f supabase/migrations/0003_tresorerie.sql
psql -d erp_test -f supabase/migrations/0004_rh.sql
psql -d erp_test -f test/scenario_test.sql
```

### 2. Simulateur de webhook
```bash
cd test/webhook-sim
npm install
node server.mjs &        # démarre le "faux" récepteur de webhook sur :8787
node test-webhook.mjs    # envoie de vraies requêtes signées et vérifie les résultats en base
```

## Important : ceci teste la LOGIQUE, pas le déploiement réel

Ce qui a été validé : le schéma SQL est cohérent, les triggers
fonctionnent, les fonctions (`receptionner_achat`, `marquer_achat_paye`,
`payer_salaire`) produisent les bons montants, et la logique de
vérification HMAC + traitement des événements est correcte.

Ce qui n'a **pas** pu être testé ici (pas d'accès réseau à supabase.com
depuis cet environnement) :
- Le déploiement réel de l'Edge Function sur Supabase
- Un vrai webhook envoyé depuis FactureFlow Africa en production
- Les policies RLS avec de vrais utilisateurs authentifiés (le stub
  `auth.role()` simule toujours "authenticated")

**Prochaine étape recommandée** : une fois le projet Supabase créé
(étapes du README principal), envoyer un webhook de test réel depuis
FactureFlow vers l'URL de l'Edge Function déployée, avec la vraie clé
API, pour confirmer que tout fonctionne de bout en bout en production.
