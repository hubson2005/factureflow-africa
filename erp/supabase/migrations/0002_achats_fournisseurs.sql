-- =========================================================
-- ERP FactureFlow - Module Achats / Fournisseurs
-- Dépend de 0001_init_stock.sql (tables produits, entrepots,
-- mouvements_stock)
-- =========================================================

-- ---------------------------------------------------------
-- Table: fournisseurs
-- ---------------------------------------------------------
create table if not exists fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  contact text,
  telephone text,
  email text,
  adresse text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: achats (bon de commande / réception fournisseur)
-- ---------------------------------------------------------
create table if not exists achats (
  id uuid primary key default uuid_generate_v4(),
  fournisseur_id uuid not null references fournisseurs(id),
  entrepot_id uuid not null references entrepots(id),
  reference text,
  statut text not null default 'brouillon'
    check (statut in ('brouillon', 'commande', 'receptionne', 'annule')),
  date_commande timestamptz,
  date_reception timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: achat_lignes (détail des produits commandés)
-- ---------------------------------------------------------
create table if not exists achat_lignes (
  id uuid primary key default uuid_generate_v4(),
  achat_id uuid not null references achats(id) on delete cascade,
  produit_id uuid not null references produits(id),
  quantite numeric(12,2) not null check (quantite > 0),
  prix_unitaire numeric(12,2) not null default 0,
  quantite_recue numeric(12,2) not null default 0
);

create index if not exists idx_achat_lignes_achat on achat_lignes(achat_id);
create index if not exists idx_achats_fournisseur on achats(fournisseur_id);
create index if not exists idx_achats_statut on achats(statut);

-- ---------------------------------------------------------
-- Fonction: réceptionner un achat
-- Crée une entrée de stock pour chaque ligne (quantité commandée
-- par défaut, ou quantité passée en paramètre pour une réception
-- partielle) et passe l'achat au statut "receptionne".
-- ---------------------------------------------------------
create or replace function receptionner_achat(p_achat_id uuid)
returns void as $$
declare
  v_entrepot_id uuid;
  ligne record;
begin
  select entrepot_id into v_entrepot_id from achats where id = p_achat_id;

  if v_entrepot_id is null then
    raise exception 'Achat introuvable: %', p_achat_id;
  end if;

  for ligne in
    select id, produit_id, quantite, quantite_recue
    from achat_lignes
    where achat_id = p_achat_id
  loop
    -- N'enregistre que la quantité pas encore reçue (permet des réceptions partielles répétées)
    if ligne.quantite > ligne.quantite_recue then
      insert into mouvements_stock (produit_id, entrepot_id, type, quantite, source, reference_id, commentaire)
      values (
        ligne.produit_id,
        v_entrepot_id,
        'entree',
        ligne.quantite - ligne.quantite_recue,
        'achat_fournisseur',
        p_achat_id::text,
        'Réception achat ' || p_achat_id
      );

      update achat_lignes
      set quantite_recue = quantite
      where id = ligne.id;
    end if;
  end loop;

  update achats
  set statut = 'receptionne',
      date_reception = now(),
      updated_at = now()
  where id = p_achat_id;
end;
$$ language plpgsql security invoker;

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table fournisseurs enable row level security;
alter table achats enable row level security;
alter table achat_lignes enable row level security;

create policy "authenticated_read_fournisseurs" on fournisseurs for select using (auth.role() = 'authenticated');
create policy "authenticated_write_fournisseurs" on fournisseurs for all using (auth.role() = 'authenticated');

create policy "authenticated_read_achats" on achats for select using (auth.role() = 'authenticated');
create policy "authenticated_write_achats" on achats for all using (auth.role() = 'authenticated');

create policy "authenticated_read_achat_lignes" on achat_lignes for select using (auth.role() = 'authenticated');
create policy "authenticated_write_achat_lignes" on achat_lignes for all using (auth.role() = 'authenticated');
