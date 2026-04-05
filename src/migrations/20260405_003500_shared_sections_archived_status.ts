import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_shared_sections_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum__shared_sections_v_version_status" ADD VALUE IF NOT EXISTS 'archived';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    SELECT 1;
  `)
}
