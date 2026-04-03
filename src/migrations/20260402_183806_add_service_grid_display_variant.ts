import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_service_grid_display_variant" AS ENUM('interactive', 'featureCards', 'pricingSteps');
  CREATE TYPE "public"."enum__pages_v_blocks_service_grid_display_variant" AS ENUM('interactive', 'featureCards', 'pricingSteps');
  ALTER TABLE "internal_ops_settings" ALTER COLUMN "chart_disclaimer" SET DEFAULT 'Revenue uses paid invoices by paid date, pipeline uses weighted sent and accepted quotes by update month, and MRR reflects current active service plans.';
  ALTER TABLE "pages_blocks_service_grid" ADD COLUMN "display_variant" "enum_pages_blocks_service_grid_display_variant" DEFAULT 'interactive';
  ALTER TABLE "_pages_v_blocks_service_grid" ADD COLUMN "display_variant" "enum__pages_v_blocks_service_grid_display_variant" DEFAULT 'interactive';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "internal_ops_settings" ALTER COLUMN "chart_disclaimer" SET DEFAULT 'Illustrative sample trend for layout only. Connect real accounting and first-party CRM data in a later phase.';
  ALTER TABLE "pages_blocks_service_grid" DROP COLUMN "display_variant";
  ALTER TABLE "_pages_v_blocks_service_grid" DROP COLUMN "display_variant";
  DROP TYPE "public"."enum_pages_blocks_service_grid_display_variant";
  DROP TYPE "public"."enum__pages_v_blocks_service_grid_display_variant";`)
}
