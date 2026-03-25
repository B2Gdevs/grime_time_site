import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_quote_settings_services_service_key" AS ENUM('house_wash', 'driveway', 'porch_patio', 'dock', 'dumpster_pad');
  CREATE TYPE "public"."enum_quote_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__quote_settings_v_version_services_service_key" AS ENUM('house_wash', 'driveway', 'porch_patio', 'dock', 'dumpster_pad');
  CREATE TYPE "public"."enum__quote_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "quote_settings_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"service_key" "enum_quote_settings_services_service_key",
  	"label" varchar,
  	"description" varchar,
  	"recommended_for" varchar,
  	"minimum" numeric,
  	"sqft_low_rate" numeric,
  	"sqft_high_rate" numeric,
  	"sort_order" numeric DEFAULT 0,
  	"enabled_on_site" boolean DEFAULT true,
  	"quote_enabled" boolean DEFAULT true,
  	"frequency_eligible" boolean DEFAULT true
  );
  
  CREATE TABLE "quote_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"condition_multipliers_light" numeric DEFAULT 0.94,
  	"condition_multipliers_standard" numeric DEFAULT 1,
  	"condition_multipliers_heavy" numeric DEFAULT 1.22,
  	"story_multipliers_one_story" numeric DEFAULT 1,
  	"story_multipliers_two_stories" numeric DEFAULT 1.14,
  	"story_multipliers_three_plus_stories" numeric DEFAULT 1.3,
  	"frequency_multipliers_one_time" numeric DEFAULT 1,
  	"frequency_multipliers_biannual" numeric DEFAULT 0.96,
  	"frequency_multipliers_quarterly" numeric DEFAULT 0.9,
  	"_status" "enum_quote_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_quote_settings_v_version_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"service_key" "enum__quote_settings_v_version_services_service_key",
  	"label" varchar,
  	"description" varchar,
  	"recommended_for" varchar,
  	"minimum" numeric,
  	"sqft_low_rate" numeric,
  	"sqft_high_rate" numeric,
  	"sort_order" numeric DEFAULT 0,
  	"enabled_on_site" boolean DEFAULT true,
  	"quote_enabled" boolean DEFAULT true,
  	"frequency_eligible" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_quote_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_condition_multipliers_light" numeric DEFAULT 0.94,
  	"version_condition_multipliers_standard" numeric DEFAULT 1,
  	"version_condition_multipliers_heavy" numeric DEFAULT 1.22,
  	"version_story_multipliers_one_story" numeric DEFAULT 1,
  	"version_story_multipliers_two_stories" numeric DEFAULT 1.14,
  	"version_story_multipliers_three_plus_stories" numeric DEFAULT 1.3,
  	"version_frequency_multipliers_one_time" numeric DEFAULT 1,
  	"version_frequency_multipliers_biannual" numeric DEFAULT 0.96,
  	"version_frequency_multipliers_quarterly" numeric DEFAULT 0.9,
  	"version__status" "enum__quote_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "quote_settings_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "quote_settings_update" boolean DEFAULT false;
  ALTER TABLE "quote_settings_services" ADD CONSTRAINT "quote_settings_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quote_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_quote_settings_v_version_services" ADD CONSTRAINT "_quote_settings_v_version_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_quote_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "quote_settings_services_order_idx" ON "quote_settings_services" USING btree ("_order");
  CREATE INDEX "quote_settings_services_parent_id_idx" ON "quote_settings_services" USING btree ("_parent_id");
  CREATE INDEX "quote_settings__status_idx" ON "quote_settings" USING btree ("_status");
  CREATE INDEX "_quote_settings_v_version_services_order_idx" ON "_quote_settings_v_version_services" USING btree ("_order");
  CREATE INDEX "_quote_settings_v_version_services_parent_id_idx" ON "_quote_settings_v_version_services" USING btree ("_parent_id");
  CREATE INDEX "_quote_settings_v_version_version__status_idx" ON "_quote_settings_v" USING btree ("version__status");
  CREATE INDEX "_quote_settings_v_created_at_idx" ON "_quote_settings_v" USING btree ("created_at");
  CREATE INDEX "_quote_settings_v_updated_at_idx" ON "_quote_settings_v" USING btree ("updated_at");
  CREATE INDEX "_quote_settings_v_latest_idx" ON "_quote_settings_v" USING btree ("latest");
  CREATE INDEX "_quote_settings_v_autosave_idx" ON "_quote_settings_v" USING btree ("autosave");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "quote_settings_services" CASCADE;
  DROP TABLE "quote_settings" CASCADE;
  DROP TABLE "_quote_settings_v_version_services" CASCADE;
  DROP TABLE "_quote_settings_v" CASCADE;
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "quote_settings_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "quote_settings_update";
  DROP TYPE "public"."enum_quote_settings_services_service_key";
  DROP TYPE "public"."enum_quote_settings_status";
  DROP TYPE "public"."enum__quote_settings_v_version_services_service_key";
  DROP TYPE "public"."enum__quote_settings_v_version_status";`)
}
