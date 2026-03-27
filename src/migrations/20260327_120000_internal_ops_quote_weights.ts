import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "internal_ops_settings" ADD COLUMN IF NOT EXISTS "quote_projection_weight_accepted" numeric DEFAULT 1;
    ALTER TABLE "internal_ops_settings" ADD COLUMN IF NOT EXISTS "quote_projection_weight_sent" numeric DEFAULT 0.6;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "internal_ops_settings" DROP COLUMN IF EXISTS "quote_projection_weight_sent";
    ALTER TABLE "internal_ops_settings" DROP COLUMN IF EXISTS "quote_projection_weight_accepted";
  `)
}
