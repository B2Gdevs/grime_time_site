---
name: payload-manual-migration-when-generator-drifts
description: >-
  Use this when a new Payload collection or field change is small and well understood, but
  `payload migrate:create` starts asking unrelated enum/table rename questions from schema
  drift. Simplify the schema shape if needed, write the migration by hand, and verify it
  with `payload migrate`, `tsc`, and `next build` instead of trusting an interactive diff.
---

# Payload manual migration when generator drifts

## When to use
- `payload migrate:create` opens interactive enum/table rename prompts that are outside the current task.
- The schema change is small enough to describe directly in SQL.
- You need a reproducible migration without unrelated churn from older generator drift.

## The pattern
1. Keep the new collection/field contract as small as the phase actually needs.
2. Prefer `json` fields over nested arrays/relationships when the phase only needs audit/state capture.
3. Add the config/code first, then run `npm.cmd run generate:types`.
4. Hand-write a migration in `src/migrations/<timestamp>_<name>.ts` using type-only imports:

```ts
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- create enums if needed
    -- create table
    -- add payload_locked_documents_rels column + fk
    -- add indexes
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- drop fk / indexes / column
    -- drop table
    -- drop enums
  `)
}
```

5. Update `src/migrations/index.ts` manually.
6. Verify in this order:
   - `npm.cmd run generate:types`
   - `npm.cmd exec -- tsc --noEmit`
   - `npm.cmd exec -- vitest run ...`
   - `npm.cmd run payload -- migrate`
   - `npm.cmd run build`

## Why
The generator can confuse unrelated historic enum/table drift with the current change and prompt for renames that have nothing to do with the active phase. That is high-risk because one bad answer can bake unrelated schema edits into the migration. A small hand-written migration is safer when the desired SQL is obvious and bounded.

## Failure modes
- If you keep nested arrays/relationships for a contract that only needs audit capture, the manual migration grows into companion tables and extra lock relations.
- If you forget the `payload_locked_documents_rels` column and foreign key, Payload admin locking falls out of sync with the collection.
- If you import `MigrateUpArgs` / `MigrateDownArgs` as runtime values instead of type-only imports, older test/migration tooling can break.

## Related
- `vendor/grime-time-site/.planning/ERRORS-AND-ATTEMPTS.xml`

