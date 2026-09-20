-- Recipe Index — schema, constraints and row-level security.
--
-- Four entities: a Recipe belongs to one Source and to any number of Categories.
-- Every table is owned by a single user and readable by nobody else.
--
-- Re-running this is harmless: it creates nothing twice, and it reinstalls the
-- policies and triggers. It does NOT alter a table that already exists, so
-- changing a column or a constraint here needs either a fresh `drop table` or a
-- second migration file — a re-run alone will silently leave the old shape.
--
-- `owner_id` defaults to auth.uid(), which is the signed-in person in the
-- browser but NULL under a service-role key. A server-side writer — the seed
-- script of ticket 06 — must therefore set owner_id explicitly on every row, or
-- every insert fails the not-null constraint.
--
-- `source.primary_host` is the host a Source is identified and upserted by;
-- `source_host` holds every host that resolves to it, the primary one included.
-- Nothing enforces that pairing, so a writer must insert both.

-- ---------------------------------------------------------------------------
-- Source — a place recipes live. Curated, not observed: several hosts may
-- resolve to one Source (docs/adr/0002-source-is-a-curated-entity-from-day-one.md).
-- ---------------------------------------------------------------------------

create table if not exists public.source (
    id            uuid primary key default gen_random_uuid(),
    owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
    display_name  text not null check (length(trim(display_name)) > 0),
    primary_host  text not null check (length(trim(primary_host)) > 0),

    -- One shelf entry per host stem, so the import can upsert rather than duplicate.
    unique (owner_id, primary_host),

    -- Lets child rows carry a composite foreign key, which makes an owner
    -- mismatch between a row and its parent unrepresentable.
    unique (id, owner_id)
);

-- The hosts that resolve to a Source. The blogspot.cz and blogspot.com twins
-- of one blog live here as two rows pointing at one Source.
create table if not exists public.source_host (
    host       text not null,
    source_id  uuid not null,
    owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,

    primary key (owner_id, host),
    foreign key (source_id, owner_id) references public.source (id, owner_id) on delete cascade
);

create index if not exists source_host_source_id_idx on public.source_host (source_id);

-- ---------------------------------------------------------------------------
-- Category — a kitchen-domain label from the owner's own vocabulary.
-- A record in its own right, so it can later be renamed and merged.
-- ---------------------------------------------------------------------------

create table if not exists public.category (
    id        uuid primary key default gen_random_uuid(),
    owner_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
    name      text not null check (length(trim(name)) > 0),

    unique (owner_id, name),
    unique (id, owner_id)
);

-- ---------------------------------------------------------------------------
-- Recipe — a pointer to where the instructions for one dish can be found.
-- Never ingredients or instructions (ADR-0003). No read/unread field: the
-- Pocket concept is gone from the model entirely.
-- ---------------------------------------------------------------------------

create table if not exists public.recipe (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
    source_id   uuid not null,

    name        text not null check (length(trim(name)) > 0),
    url         text not null check (length(trim(url)) > 0),
    saved_at    timestamptz not null,

    tried       boolean not null default false,
    favourite   boolean not null default false,
    deleted_at  timestamptz,

    -- Favourite means proven, and so implies Tried. A dish never made cannot be
    -- a Favourite, however much you want to try it. Enforced here rather than
    -- trusted to the UI.
    --
    -- In practice the trigger below repairs the contradiction before this check
    -- ever sees it. The constraint stands as the statement of the invariant, and
    -- as what still holds if that trigger is ever dropped or disabled.
    constraint favourite_implies_tried check (not favourite or tried),

    -- One Recipe per pointer, so the import can be re-run without duplicating.
    unique (owner_id, url),
    unique (id, owner_id),

    -- restrict rather than cascade: deleting a Source must never silently take
    -- irreplaceable Recipes with it.
    foreign key (source_id, owner_id) references public.source (id, owner_id) on delete restrict
);

create index if not exists recipe_owner_live_idx on public.recipe (owner_id) where deleted_at is null;
create index if not exists recipe_source_id_idx on public.recipe (source_id);

-- Setting Favourite records Tried, so the two can never be asked to contradict
-- each other — including a write that clears Tried while Favourite stands,
-- which is repaired rather than rejected.
create or replace function public.favourite_records_tried()
returns trigger
language plpgsql
as $function$
begin
    if new.favourite then
        new.tried := true;
    end if;
    return new;
end;
$function$;

drop trigger if exists favourite_records_tried on public.recipe;
create trigger favourite_records_tried
    before insert or update on public.recipe
    for each row execute function public.favourite_records_tried();

-- ---------------------------------------------------------------------------
-- Recipe–Category — the many-to-many link. A Christmas dessert is found
-- whether you browse dezerty or vánoce.
-- ---------------------------------------------------------------------------

create table if not exists public.recipe_category (
    recipe_id    uuid not null,
    category_id  uuid not null,
    owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,

    primary key (recipe_id, category_id),

    -- Composite, like every other relation here: a link between one person's
    -- Recipe and another's Category is not representable, rather than merely
    -- forbidden by policy.
    foreign key (recipe_id, owner_id) references public.recipe (id, owner_id) on delete cascade,
    foreign key (category_id, owner_id) references public.category (id, owner_id) on delete cascade
);

create index if not exists recipe_category_category_id_idx on public.recipe_category (category_id);

-- ---------------------------------------------------------------------------
-- Row-level security. This is a single-person index; nobody else ever reads it.
--
-- auth.uid() is null for an unauthenticated request, so every policy below
-- evaluates false and a logged-out visitor reaches no row at all.
-- ---------------------------------------------------------------------------

alter table public.source          enable row level security;
alter table public.source_host     enable row level security;
alter table public.category        enable row level security;
alter table public.recipe          enable row level security;
alter table public.recipe_category enable row level security;

drop policy if exists source_is_private_to_its_owner on public.source;
create policy source_is_private_to_its_owner on public.source
    for all to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists source_host_is_private_to_its_owner on public.source_host;
create policy source_host_is_private_to_its_owner on public.source_host
    for all to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists category_is_private_to_its_owner on public.category;
create policy category_is_private_to_its_owner on public.category
    for all to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists recipe_is_private_to_its_owner on public.recipe;
create policy recipe_is_private_to_its_owner on public.recipe
    for all to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists recipe_category_follows_its_recipe on public.recipe_category;
drop policy if exists recipe_category_is_private_to_its_owner on public.recipe_category;
create policy recipe_category_is_private_to_its_owner on public.recipe_category
    for all to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));
