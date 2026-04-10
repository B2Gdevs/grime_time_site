import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "organization_memberships"
      ADD COLUMN IF NOT EXISTS "entitlement_locks" jsonb DEFAULT '[]'::jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "organization_memberships"
      DROP COLUMN IF EXISTS "entitlement_locks";
  `)
}
