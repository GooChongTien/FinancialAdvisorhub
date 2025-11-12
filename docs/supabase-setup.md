# Supabase Setup For AdvisorHub

Follow these steps to provision the backend required by the updated frontend data layer.

## 1. Create a Supabase project
- Sign in to https://supabase.com/ and create a new project (or reuse your local Supabase stack).
- Copy the project `Project URL` and `anon` public API key from **Project Settings → API**.

## 2. Run the schema and seed scripts
- Open the Supabase SQL Editor.
- Paste and run `docs/supabase-schema.sql`.
  - This creates the `profiles`, `leads`, `policies`, `products`, `proposals`, `tasks`, and `broadcasts` tables together with triggers and the `lead_metrics` view that the UI expects.
- Paste and run `docs/supabase-seed.sql`.
  - The script is idempotent; it inserts the prototype dataset (advisor profile, leads, policies, proposals, tasks, broadcasts, products). You can rerun it to refresh the demo data if needed.

## 3. Configure the frontend
- Copy `.env.example` to `.env.local` (or `.env`) in the project root.
- Replace the placeholders with your Supabase project URL and anon key:
  ```bash
  VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
  VITE_SUPABASE_ANON_KEY=<public-anon-key>
  ```
- Install the new dependency:
  ```bash
  npm install
  ```
- Start the app with `npm run dev`. The frontend now reads and writes directly against Supabase instead of the in-memory legacy AdviseU admin mocks.
- (Optional) For local Playwright tests or seed scripts, add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
  - Never commit this key; it bypasses Row-Level Security and is only for local environments.
- (Optional) Override `E2E_EMAIL` and `E2E_PASSWORD` if you prefer different test credentials.

## 4. (Optional) Configure Row-Level Security
- Enable RLS if you plan to expose this backend beyond local development.
- Create RLS policies for each table as appropriate, or access the data via the Supabase service-role key on a secured API layer.
- For local testing with anonymous keys, you can relax policies temporarily. Example (allow authenticated inserts into leads):
  ```sql
  create policy \"Allow authenticated insert (dev)\"
    on leads
    for insert
    to authenticated
    using (true)
    with check (true);
  ```

## 5. Telemetry instrumentation for Mira
- The agent orchestration layers persist events to `public.mira_telemetry_events`. Ensure the Edge Function environment exposes `SUPABASE_SERVICE_ROLE_KEY` (or a prefixed variant) so the logger can write to Supabase.
- The frontend reads `VITE_MIRA_TELEMETRY_WRITE_KEY` at build time. For local development reuse the same service-role key in `.env.local`; configure a managed secret for deployed environments. Never commit the actual key.
- Two helper views are available for analytics and QA:
  - `public.mira_telemetry_daily_metrics` — aggregates submissions, completions, retries, and feedback by day/persona/mode.
  - `public.mira_telemetry_recent_events` — exposes the latest 200 raw events for debugging.
- After configuring the keys, validate connectivity with the SQL editor:
  ```sql
  select *
    from public.mira_telemetry_daily_metrics
   order by day desc
   limit 10;
  ```

