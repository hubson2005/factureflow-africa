-- =========================================================
-- ERP FactureFlow - Module Trésorerie / Comptabilité simplifiée
-- Dépend de 0001_init_stock.sql et 0002_achats_fournisseurs.sql
-- =========================================================

-- ---------------------------------------------------------
-- Table: comptes (caisse, banque, mobile money…)
-- ---------------------------------------------------------
create table if not exists comptes (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  type text not null default 'caisse'
    check (type in ('caisse', 'banque', 'mobile_money', 'autre')),
  solde_initial numeric(14,2) not null default 0,
  solde numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: transactions_tresorerie
-- ---------------------------------------------------------
create table if not exists transactions_tresorerie (
  id uuid primary key default uuid_generate_v4(),
  compte_id uuid not null references comptes(id),
  type text not null check (type in ('encaissement', 'decaissement')),
  montant numeric(14,2) not null check (montant > 0),
  categorie text not null default 'autre'
    check (categorie in ('vente', 'achat', 'salaire', 'charge', 'autre')),
  -- 'factureflow_webhook', 'achat_fournisseur', 'manuel'
  source text not null default 'manuel',
  reference_id text,
  description text,
  date_transaction timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_compte on transactions_tresorerie(compte_id);
create index if not exists idx_transactions_reference on transactions_tresorerie(reference_id);
create index if not exists idx_transactions_categorie on transactions_tresorerie(categorie);

-- ---------------------------------------------------------
-- Trigger: maintenir comptes.solde à jour automatiquement
-- ---------------------------------------------------------
create or replace function appliquer_transaction_tresorerie()
returns trigger as $$
begin
  update comptes
  set solde = solde + (case when new.type = 'encaissement' then new.montant else -new.montant end)
  where id = new.compte_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_transaction_tresorerie on transactions_tresorerie;
create trigger trg_transaction_tresorerie
  after insert on transactions_tresorerie
  for each row execute function appliquer_transaction_tresorerie();

-- Initialise `solde` = `solde_initial` à la création d'un compte
create or replace function initialiser_solde_compte()
returns trigger as $$
begin
  new.solde := new.solde_initial;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_init_solde_compte on comptes;
create trigger trg_init_solde_compte
  before insert on comptes
  for each row execute function initialiser_solde_compte();

-- ---------------------------------------------------------
-- Lien avec les Achats : marquer un achat comme payé
-- ---------------------------------------------------------
alter table achats add column if not exists paye boolean not null default false;
alter table achats add column if not exists compte_paiement_id uuid references comptes(id);

create or replace function marquer_achat_paye(p_achat_id uuid, p_compte_id uuid)
returns void as $$
declare
  v_montant numeric(14,2);
begin
  select coalesce(sum(quantite * prix_unitaire), 0)
  into v_montant
  from achat_lignes
  where achat_id = p_achat_id;

  if v_montant <= 0 then
    raise exception 'Aucun montant à payer pour cet achat.';
  end if;

  insert into transactions_tresorerie (compte_id, type, montant, categorie, source, reference_id, description)
  values (p_compte_id, 'decaissement', v_montant, 'achat', 'achat_fournisseur', p_achat_id::text,
          'Paiement fournisseur - achat ' || p_achat_id);

  update achats
  set paye = true, compte_paiement_id = p_compte_id, updated_at = now()
  where id = p_achat_id;
end;
$$ language plpgsql security invoker;

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table comptes enable row level security;
alter table transactions_tresorerie enable row level security;

create policy "authenticated_read_comptes" on comptes for select using (auth.role() = 'authenticated');
create policy "authenticated_write_comptes" on comptes for all using (auth.role() = 'authenticated');

create policy "authenticated_read_transactions" on transactions_tresorerie for select using (auth.role() = 'authenticated');
create policy "authenticated_write_transactions" on transactions_tresorerie for insert with check (auth.role() = 'authenticated');
