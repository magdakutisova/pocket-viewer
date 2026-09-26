# Supabase setup

Three steps, done once, by hand. They need an account and a password, so they
are not automated and not scripted.

After them, `npm run dev` shows a login page, your password gets you in, and a
reload keeps you in.

## 1. Create the project

In the [Supabase dashboard](https://supabase.com/dashboard), create a project.
Any region near you; the free tier is ample — the whole collection is about half
a megabyte.

## 2. Create the schema

Open the project's **SQL Editor**, paste the whole of
[`supabase/migrations/0001_recipe_index.sql`](../supabase/migrations/0001_recipe_index.sql),
and run it.

Re-running it is harmless — it creates nothing twice. But it will not *alter* a
table that already exists, so if you change a column or a constraint in that
file, a second run silently leaves the old shape in place. While the database is
still empty, `drop table` the affected tables and run it again; once the
collection is in there, write a second migration file instead.

It creates `source`, `source_host`, `category`, `recipe` and `recipe_category`,
turns on row-level security for every one of them, and installs the constraint
that makes a Favourite that is not Tried impossible to store.

## 3. Create your user

This index has exactly one person in it. Under **Authentication → Users**, choose
**Add user → Create new user**, give it your email and a password, and tick
*Auto Confirm User* so there is no confirmation email to chase.

Then, under **Authentication → Sign In / Providers**, turn **Allow new users to
sign up** off. Nobody else is ever meant to have an account here.

## 4. Point the app at it

From **Project Settings → API**, copy the project URL and the **publishable**
(`anon`) key.

Take the **Project URL** — the bare origin, `https://your-project-ref.supabase.co`.
The **Data API** endpoint shown near it ends in `/rest/v1`, and is a different
thing: the client appends its own paths, so that one sends every login to
`/rest/v1/auth/v1/token` and fails with a PostgREST `PGRST125` error. The app
refuses to start on a URL carrying a path, and names the origin to use instead.

```bash
cp .env.example .env.local
```

Fill both values in. `.env.local` is git-ignored and must stay that way.

The **service-role** key is not one of these. It bypasses row-level security
entirely, and anything in a `VITE_`-prefixed variable is compiled into the
browser bundle for anyone to read. The app refuses to start if it finds one.

## Checking it worked

```bash
npm run dev
```

- The login page appears, and none of the collection is visible behind it.
- Your email and password get you in; a wrong password says so and does not.
- Reloading the page keeps you signed in.
- **Odhlásit se** returns you to the login page.

To confirm the collection is genuinely private rather than merely hidden, open
the SQL Editor and run:

```sql
set role anon;
select count(*) from public.recipe;
reset role;
```

It returns `0`, and would still return `0` with rows in the table — an
unauthenticated request has no `auth.uid()`, so every policy denies it.

## What is not set up yet

The database is empty. Filling it is [ticket 06](../.scratch/recipe-index/issues/06-seed-script.md),
and the app reading from it rather than from the bundled CSV is
[ticket 07](../.scratch/recipe-index/issues/07-read-collection-from-supabase.md).
Until then the collection on screen still comes from `src/data/pocket.csv`.
