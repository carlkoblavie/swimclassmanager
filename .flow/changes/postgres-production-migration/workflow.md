---
name: postgres-production-migration
type: package-migration
status: planned
planned: 2026-07-26
---

# Postgres Production Migration

## Current Shape

- Production runs the Adonis app on Dokku with SQLite at `/app/tmp/db.sqlite3`.
- Dokku persistent storage is mounted at `/var/lib/dokku/data/storage/swimclassmanager:/app/tmp`, so the current SQLite database survives deploys.
- `app.json` runs `node ace migration:run --force` in Dokku predeploy.
- SQLite backups currently run through `node ace backup:sqlite` at `30 2 * * *` and upload the database file to Cloudflare R2.
- `config/database.ts` defaults to `sqlite`; a commented `pg` connection exists, but `pg` is not installed and `start/env.ts` does not validate database env vars.
- The Dokku Postgres plugin was not present in the production plugin list during inspection.

## Assumptions

- Keep SQLite for local development and tests until we intentionally move those too.
- Use Postgres only for production first.
- Prefer Dokku Postgres linked env vars over manually maintained database credentials.
- Use `DATABASE_URL` as the primary production config, because Dokku Postgres link normally provides it.
- Keep `better-sqlite3` installed during the migration window so the import tool can read the old database and tests can keep using SQLite.
- Do not include unrelated Paystack branch files in this branch.

## Harness Rules

- Migrations are created under `database/migrations/`; each migration extends `BaseSchema`, implements `up` / `down`, and uses the schema builder for DDL where possible (`.flow/docs/migrations.md:16-25`).
- Data work belongs in `this.defer(...)`; large data backfills should be split from destructive DDL (`.flow/docs/migrations.md:26-27`).
- `node ace migration:run` is the normal apply path and uses advisory locks on PostgreSQL (`.flow/docs/migrations.md:37-50`).
- Production rollback should not use `migration:rollback`; write forward fixes instead (`.flow/docs/migrations.md:77-80`).
- `database/schema.ts` is generated, should not be hand-edited, and schema generation is configured per connection (`.flow/docs/migrations.md:52-54`, `.flow/docs/schema-rules.md:16-29`).
- Copy/import work that spans multiple writes should use managed transactions, with all queries built from `trx` (`.flow/docs/transactions.md:15-20`).
- Do not run queries through `db` inside a transaction callback and do not hold long external work inside a transaction (`.flow/docs/transactions.md:43-53`).

## Workflow

### 1. Add Postgres-Capable App Config

- Install `pg` and commit `package.json` / `package-lock.json`.
- Add env validation for:
  - `DB_CONNECTION`: `sqlite` or `pg`, defaulting to `sqlite` outside production.
  - `DATABASE_URL`: optional, required when `DB_CONNECTION=pg`.
- Update `config/database.ts`:
  - default to SQLite in tests;
  - use `env.get('DB_CONNECTION')` otherwise;
  - add a real `pg` connection using `DATABASE_URL`;
  - keep shared migration paths and `schemaGeneration` rules on both connections;
  - set `migrations.disableRollbacksInProduction: true` on production-capable connections.
- Remove or make dialect-aware the SQLite-specific boolean prepare hook in `app/models/school_level_setting.ts`.
- Keep `better-sqlite3` in dependencies until cutover, import, and local test strategy are settled.

Gate:

```bash
npm run format
npm run lint
npm run typecheck
node ace migration:run --dry-run
```

### 2. Add A Repeatable SQLite-To-Postgres Import Command

- Add a one-off Ace command, for example `node ace db:import-sqlite-to-pg --sqlite=/app/tmp/db.sqlite3`.
- The command should:
  - open SQLite read-only;
  - connect to the active Postgres connection;
  - refuse to run if target business tables already contain rows unless `--force-empty-target` is passed;
  - copy tables in foreign-key-safe order or derive order from migration metadata;
  - preserve primary keys, public IDs, timestamps, and auth columns;
  - normalize SQLite booleans (`0` / `1`) into Postgres booleans;
  - normalize JSON columns into objects/arrays before insert where required;
  - reset Postgres sequences after copy with `setval(..., max(id))`;
  - produce source/target row-count checksums per table.
- Run table inserts through a managed transaction, but compute/read large source batches outside or in small chunks so the transaction does not do slow external work.

Gate:

```bash
npm run lint
npm run typecheck
node ace migration:fresh --connection=pg
node ace db:import-sqlite-to-pg --sqlite=tmp/prod-db.sqlite3 --connection=pg
```

### 3. Add Postgres Backup Path Before Cutover

- Replace or complement `backup:sqlite` with `backup:postgres`.
- Backups should run after cutover on the same `30 2 * * *` schedule.
- Store dumps in the existing Cloudflare R2 bucket under a new prefix such as `swimclassmanager/postgres/`.
- Keep the SQLite backup cron until the actual cutover is verified, then remove it.

Gate:

```bash
node ace backup:postgres --dry-run
npm run typecheck
```

### 4. Provision Production Postgres

- Install the Dokku Postgres plugin if still missing.
- Create and link a database:

```bash
ssh dokku@89.167.107.2 postgres:create swimclassmanager-db
ssh dokku@89.167.107.2 postgres:link swimclassmanager-db swimclassmanager
```

- Confirm `DATABASE_URL` exists in the app env without printing the secret value.
- Do not set `DB_CONNECTION=pg` until the app code supports both connections and the cutover window is ready.

### 5. Dry-Run On A Production Snapshot

- Pull a fresh SQLite backup from production or R2.
- Run Postgres migrations against an empty local/staging Postgres database.
- Import the snapshot.
- Compare row counts for all tables.
- Exercise:
  - admin login;
  - waitlist signup;
  - signup user count;
  - school/program catalog;
  - class/program/level reads;
  - any Paystack purchase tables if merged before the migration.

Gate:

```bash
npm test
npm run lint
npm run typecheck
```

### 6. Production Cutover Runbook

1. Announce a short write freeze.
2. Trigger one final SQLite R2 backup and verify it completed.
3. Deploy the Postgres-capable code while `DB_CONNECTION=sqlite` remains active.
4. Provision/link Dokku Postgres if not already done.
5. Temporarily stop public writes or enable maintenance.
6. Set `DB_CONNECTION=pg`.
7. Run `node ace migration:run --force` against Postgres.
8. Run the import command from `/app/tmp/db.sqlite3` into Postgres.
9. Run row-count verification.
10. Restart the app.
11. Smoke-test critical flows.
12. Disable SQLite backup cron only after Postgres backup succeeds.

Fallback:

- If import or smoke tests fail before public traffic is restored, set `DB_CONNECTION=sqlite`, restart, and keep the existing SQLite database active.
- If failure happens after public traffic writes to Postgres, freeze writes first and decide whether to reconcile Postgres rows back to SQLite or continue forward with a fix.

### 7. Post-Cutover Cleanup

- Remove SQLite-specific production assumptions from docs and commands.
- Retire `backup:sqlite` only after several successful Postgres backups.
- Decide whether local/test should remain SQLite or move to Postgres for parity.
- If local/test moves to Postgres, update CI and developer setup docs in the same change.

## Risks To Watch

- Serving an empty Postgres database if `DB_CONNECTION=pg` is set before import.
- SQLite boolean coercion leaking into Postgres writes.
- JSON and timestamp values differing between SQLite and Postgres drivers.
- Postgres sequences not being reset after explicit `id` inserts.
- The existing SQLite R2 backup cron becoming a false sense of safety after cutover.
- Untracked Paystack migrations may change the table list; rerun the table-order/checksum plan after those files are merged.

