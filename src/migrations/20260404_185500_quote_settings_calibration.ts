import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "house_wash_pricing_one_story_per_wall" numeric DEFAULT 100;
  ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "house_wash_pricing_two_story_per_wall" numeric DEFAULT 150;
  ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "house_wash_pricing_minimum_walls" numeric DEFAULT 4;
  ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "house_wash_pricing_manual_review_note" varchar DEFAULT 'Three-story and taller homes move to a staff-reviewed quote. Photo review confirms access, setup, and safety before we lock scope.';
  ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "estimator_messaging_estimate_disclaimer" varchar DEFAULT 'Instant quotes are starting guidance. Final scope is confirmed after we review surface condition, access, and any photos you send.';
  ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "estimator_messaging_water_access_note" varchar DEFAULT 'Standard pricing assumes customer-supplied water is available on site. Low-water properties may need a hauling review.';
  ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "estimator_messaging_driveway_photo_note" varchar DEFAULT 'Residential flatwork estimates move faster when we can review both the driveway and the connecting sidewalk.';
  ALTER TABLE "quote_settings" ADD COLUMN IF NOT EXISTS "estimator_messaging_commercial_expansion_note" varchar DEFAULT 'Larger commercial flatwork, parking lots, fences, and building packages stay staff-reviewed until the expanded equipment lane is live.';
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_house_wash_pricing_one_story_per_wall" numeric DEFAULT 100;
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_house_wash_pricing_two_story_per_wall" numeric DEFAULT 150;
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_house_wash_pricing_minimum_walls" numeric DEFAULT 4;
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_house_wash_pricing_manual_review_note" varchar DEFAULT 'Three-story and taller homes move to a staff-reviewed quote. Photo review confirms access, setup, and safety before we lock scope.';
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_estimator_messaging_estimate_disclaimer" varchar DEFAULT 'Instant quotes are starting guidance. Final scope is confirmed after we review surface condition, access, and any photos you send.';
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_estimator_messaging_water_access_note" varchar DEFAULT 'Standard pricing assumes customer-supplied water is available on site. Low-water properties may need a hauling review.';
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_estimator_messaging_driveway_photo_note" varchar DEFAULT 'Residential flatwork estimates move faster when we can review both the driveway and the connecting sidewalk.';
  ALTER TABLE "_quote_settings_v" ADD COLUMN IF NOT EXISTS "version_estimator_messaging_commercial_expansion_note" varchar DEFAULT 'Larger commercial flatwork, parking lots, fences, and building packages stay staff-reviewed until the expanded equipment lane is live.';`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_estimator_messaging_commercial_expansion_note";
  ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_estimator_messaging_driveway_photo_note";
  ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_estimator_messaging_water_access_note";
  ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_estimator_messaging_estimate_disclaimer";
  ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_house_wash_pricing_manual_review_note";
  ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_house_wash_pricing_minimum_walls";
  ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_house_wash_pricing_two_story_per_wall";
  ALTER TABLE "_quote_settings_v" DROP COLUMN IF EXISTS "version_house_wash_pricing_one_story_per_wall";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "estimator_messaging_commercial_expansion_note";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "estimator_messaging_driveway_photo_note";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "estimator_messaging_water_access_note";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "estimator_messaging_estimate_disclaimer";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "house_wash_pricing_manual_review_note";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "house_wash_pricing_minimum_walls";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "house_wash_pricing_two_story_per_wall";
  ALTER TABLE "quote_settings" DROP COLUMN IF EXISTS "house_wash_pricing_one_story_per_wall";`)
}
