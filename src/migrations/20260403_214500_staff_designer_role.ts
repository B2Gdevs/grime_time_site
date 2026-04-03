import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_organization_memberships_role_template"
    ADD VALUE IF NOT EXISTS 'staff-designer' AFTER 'staff-admin';
  `)
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // PostgreSQL enum values are intentionally left in place on down migrations.
}
