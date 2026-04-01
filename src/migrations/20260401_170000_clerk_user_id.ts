import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_i_d" varchar;
   CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_i_d_idx" ON "users" USING btree ("clerk_user_i_d");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "users_clerk_user_i_d_idx";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "clerk_user_i_d";`)
}
