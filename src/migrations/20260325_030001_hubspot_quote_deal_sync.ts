import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_quotes_crm_provider" AS ENUM('engagebay', 'hubspot');
  CREATE TYPE "public"."enum_quotes_crm_sync_status" AS ENUM('skipped_draft', 'skipped_no_email', 'skipped_provider', 'ok', 'ok_note_warning', 'failed');
  ALTER TABLE "quotes" ADD COLUMN "crm_provider" "enum_quotes_crm_provider";
  ALTER TABLE "quotes" ADD COLUMN "crm_deal_id" varchar;
  ALTER TABLE "quotes" ADD COLUMN "crm_sync_status" "enum_quotes_crm_sync_status";
  ALTER TABLE "quotes" ADD COLUMN "crm_synced_at" timestamp(3) with time zone;
  ALTER TABLE "quotes" ADD COLUMN "crm_sync_detail" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "quotes" DROP COLUMN "crm_provider";
  ALTER TABLE "quotes" DROP COLUMN "crm_deal_id";
  ALTER TABLE "quotes" DROP COLUMN "crm_sync_status";
  ALTER TABLE "quotes" DROP COLUMN "crm_synced_at";
  ALTER TABLE "quotes" DROP COLUMN "crm_sync_detail";
  DROP TYPE "public"."enum_quotes_crm_provider";
  DROP TYPE "public"."enum_quotes_crm_sync_status";`)
}
