-- The whole collection, in one query.
--
-- About half a megabyte, fetched once when the app loads and held in memory;
-- browsing then runs over that in memory. The database owns the data, the
-- relations and the writes, and is not consulted on every keystroke.
--
-- Why a function rather than three selects:
--
--   * PostgREST returns at most 1000 rows, and the collection is 3,357. Plain
--     selects would have to be walked page by page — several round trips, and a
--     single unpaginated one silently returns a third of the collection and
--     looks like success.
--   * PostgREST cannot embed `recipe(*, category(*))` here, because the foreign
--     keys are composite on (id, owner_id) and it infers no relationship from
--     them.
--
-- One row of JSON sidesteps both. Shaped to match src/domain.ts, so what the
-- app holds in memory is the same whether it came from here or from the
-- transform that seeded it.
--
-- SECURITY INVOKER (the default): row-level security applies as the caller, so
-- a logged-out visitor gets empty arrays rather than somebody's collection.
-- Soft-deleted Recipes are excluded here, which is every read path there is.

create or replace function public.collection()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $function$
    select jsonb_build_object(
        'recipes', coalesce((
            select jsonb_agg(
                jsonb_build_object(
                    'name', r.name,
                    'url', r.url,
                    'savedAt', r.saved_at,
                    'source', s.display_name,
                    'categories', coalesce((
                        select jsonb_agg(c.name order by c.name)
                        from recipe_category rc
                        join category c on c.id = rc.category_id
                        where rc.recipe_id = r.id
                    ), '[]'::jsonb)
                )
                order by r.saved_at desc
            )
            from recipe r
            join source s on s.id = r.source_id
            where r.deleted_at is null
        ), '[]'::jsonb),

        -- The curated list, not merely the ones in use: a Category with nothing
        -- filed under it is still one of the cook's own words.
        'categories', coalesce((
            select jsonb_agg(jsonb_build_object('name', c.name) order by c.name)
            from category c
        ), '[]'::jsonb),

        -- The shelf, deepest entry first, each with the hosts that resolve to
        -- it and its primary host at the front.
        'sources', coalesce((
            select jsonb_agg(shelf.entry order by shelf.recipe_count desc, shelf.name)
            from (
                select
                    s.display_name as name,
                    (
                        select count(*)
                        from recipe r
                        where r.source_id = s.id and r.deleted_at is null
                    ) as recipe_count,
                    jsonb_build_object(
                        'name', s.display_name,
                        'hosts', coalesce((
                            select jsonb_agg(h.host order by (h.host <> s.primary_host), h.host)
                            from source_host h
                            where h.source_id = s.id
                        ), jsonb_build_array(s.primary_host)),
                        'recipeCount', (
                            select count(*)
                            from recipe r
                            where r.source_id = s.id and r.deleted_at is null
                        )
                    ) as entry
                from source s
            ) shelf
        ), '[]'::jsonb)
    );
$function$;
