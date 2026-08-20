-- =========================================================
-- ERP FactureFlow - Module Stock / Inventaire
-- =========================================================

-- Extension pour uuid
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- Table: entrepots
-- ---------------------------------------------------------
create table if not exists entrepots (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  adresse text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: produits
-- ---------------------------------------------------------
create table if not exists produits (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  sku text unique,
  -- id du produit/article côté FactureFlow, pour faire le lien lors des webhooks
  factureflow_ref text,
  prix_achat numeric(12,2) default 0,
  prix_vente numeric(12,2) default 0,
  seuil_alerte integer default 0,
  unite text default 'piece',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: stock (quantité courante par produit / entrepôt)
-- ---------------------------------------------------------
create table if not exists stock (
  id uuid primary key default uuid_generate_v4(),
  produit_id uuid not null references produits(id) on delete cascade,
  entrepot_id uuid not null references entrepots(id) on delete cascade,
  quantite numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (produit_id, entrepot_id)
);

-- ---------------------------------------------------------
-- Table: mouvements_stock (historique, traçabilité complète)
-- ---------------------------------------------------------
create table if not exists mouvements_stock (
  id uuid primary key default uuid_generate_v4(),
  produit_id uuid not null references produits(id),
  entrepot_id uuid not null references entrepots(id),
  type text not null check (type in ('entree', 'sortie', 'ajustement')),
  quantite numeric(12,2) not null,
  -- d'où vient le mouvement: 'factureflow_webhook', 'achat_fournisseur', 'manuel', ...
  source text not null default 'manuel',
  -- id de la facture / commande / doc source côté externe
  reference_id text,
  commentaire text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: webhook_events (log brut des événements reçus de FactureFlow)
-- utile pour debug + idempotence (éviter de traiter 2x le même event)
-- ---------------------------------------------------------
create table if not exists webhook_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  error text,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Fonction + trigger: maintenir `stock.quantite` à jour
-- automatiquement à chaque insertion dans mouvements_stock
-- ---------------------------------------------------------
create or replace function appliquer_mouvement_stock()
returns trigger as $$
begin
  insert into stock (produit_id, entrepot_id, quantite, updated_at)
  values (
    new.produit_id,
    new.entrepot_id,
    case when new.type = 'sortie' then -new.quantite
         when new.type = 'ajustement' then new.quantite
         else new.quantite end,
    now()
  )
  on conflict (produit_id, entrepot_id)
  do update set
    quantite = case
      when new.type = 'ajustement' then new.quantite
      else stock.quantite + (case when new.type = 'sortie' then -new.quantite else new.quantite end)
    end,
    updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_mouvement_stock on mouvements_stock;
create trigger trg_mouvement_stock
  after insert on mouvements_stock
  for each row execute function appliquer_mouvement_stock();

-- ---------------------------------------------------------
-- Index utiles
-- ---------------------------------------------------------
create index if not exists idx_mouvements_produit on mouvements_stock(produit_id);
create index if not exists idx_mouvements_reference on mouvements_stock(reference_id);
create index if not exists idx_produits_factureflow_ref on produits(factureflow_ref);
create index if not exists idx_webhook_events_type on webhook_events(event_type);

-- ---------------------------------------------------------
-- RLS (Row Level Security) - à adapter selon vos rôles d'équipe
-- ---------------------------------------------------------
alter table entrepots enable row level security;
alter table produits enable row level security;
alter table stock enable row level security;
alter table mouvements_stock enable row level security;
alter table webhook_events enable row level security;

-- Exemple: seuls les utilisateurs authentifiés peuvent lire/écrire
-- (à affiner plus tard avec des rôles précis: admin, magasinier, lecture seule...)
create policy "authenticated_read_entrepots" on entrepots for select using (auth.role() = 'authenticated');
create policy "authenticated_write_entrepots" on entrepots for all using (auth.role() = 'authenticated');

create policy "authenticated_read_produits" on produits for select using (auth.role() = 'authenticated');
create policy "authenticated_write_produits" on produits for all using (auth.role() = 'authenticated');

create policy "authenticated_read_stock" on stock for select using (auth.role() = 'authenticated');

create policy "authenticated_read_mouvements" on mouvements_stock for select using (auth.role() = 'authenticated');
create policy "authenticated_write_mouvements" on mouvements_stock for insert with check (auth.role() = 'authenticated');

-- webhook_events: seule la service_role (utilisée par l'Edge Function) peut écrire
-- pas de policy insert pour "authenticated" -> uniquement accessible via service_role key côté serveur
create policy "authenticated_read_webhook_events" on webhook_events for select using (auth.role() = 'authenticated');
