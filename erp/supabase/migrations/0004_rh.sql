-- =========================================================
-- ERP FactureFlow - Module RH basique
-- Dépend de 0003_tresorerie.sql (table comptes, transactions_tresorerie)
-- =========================================================

-- ---------------------------------------------------------
-- Table: employes
-- ---------------------------------------------------------
create table if not exists employes (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  prenom text not null,
  poste text,
  telephone text,
  email text,
  date_embauche date,
  salaire_mensuel numeric(14,2) not null default 0,
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: paies (un bulletin par employé et par période)
-- ---------------------------------------------------------
create table if not exists paies (
  id uuid primary key default uuid_generate_v4(),
  employe_id uuid not null references employes(id),
  periode text not null,                 -- ex: '2026-08' ou 'Août 2026'
  salaire_brut numeric(14,2) not null default 0,
  primes numeric(14,2) not null default 0,
  deductions numeric(14,2) not null default 0,
  salaire_net numeric(14,2) generated always as (salaire_brut + primes - deductions) stored,
  statut text not null default 'a_payer' check (statut in ('a_payer', 'paye')),
  compte_paiement_id uuid references comptes(id),
  date_paiement timestamptz,
  created_at timestamptz not null default now(),
  unique (employe_id, periode)
);

create index if not exists idx_paies_employe on paies(employe_id);
create index if not exists idx_paies_statut on paies(statut);

-- ---------------------------------------------------------
-- Fonction: payer un salaire -> décaissement en trésorerie
-- ---------------------------------------------------------
create or replace function payer_salaire(p_paie_id uuid, p_compte_id uuid)
returns void as $$
declare
  v_net numeric(14,2);
  v_employe_nom text;
begin
  select p.salaire_net, e.nom || ' ' || e.prenom
  into v_net, v_employe_nom
  from paies p
  join employes e on e.id = p.employe_id
  where p.id = p_paie_id;

  if v_net is null or v_net <= 0 then
    raise exception 'Bulletin de paie introuvable ou montant net invalide.';
  end if;

  insert into transactions_tresorerie (compte_id, type, montant, categorie, source, reference_id, description)
  values (p_compte_id, 'decaissement', v_net, 'salaire', 'manuel', p_paie_id::text,
          'Paiement salaire - ' || v_employe_nom);

  update paies
  set statut = 'paye', compte_paiement_id = p_compte_id, date_paiement = now()
  where id = p_paie_id;
end;
$$ language plpgsql security invoker;

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table employes enable row level security;
alter table paies enable row level security;

create policy "authenticated_read_employes" on employes for select using (auth.role() = 'authenticated');
create policy "authenticated_write_employes" on employes for all using (auth.role() = 'authenticated');

create policy "authenticated_read_paies" on paies for select using (auth.role() = 'authenticated');
create policy "authenticated_write_paies" on paies for all using (auth.role() = 'authenticated');
