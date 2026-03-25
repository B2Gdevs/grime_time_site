import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "growth_milestones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"trigger" varchar,
  	"win_condition" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ops_asset_ladder_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"buy_notes" varchar,
  	"why_notes" varchar,
  	"owned" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "internal_ops_settings_scorecard_kpi_tooltips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kpi_name" varchar NOT NULL,
  	"help_text" varchar NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "growth_milestones_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ops_asset_ladder_items_id" integer;
  ALTER TABLE "internal_ops_settings" ADD COLUMN "chart_pipeline_note" varchar;
  ALTER TABLE "internal_ops_settings" ADD COLUMN "kpi_tooltip_leads" varchar;
  ALTER TABLE "internal_ops_settings" ADD COLUMN "kpi_tooltip_quotes" varchar;
  ALTER TABLE "internal_ops_settings" ADD COLUMN "kpi_tooltip_projected_revenue" varchar;
  ALTER TABLE "internal_ops_settings" ADD COLUMN "kpi_tooltip_mrr" varchar;
  ALTER TABLE "internal_ops_settings_scorecard_kpi_tooltips" ADD CONSTRAINT "internal_ops_settings_scorecard_kpi_tooltips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."internal_ops_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "growth_milestones_updated_at_idx" ON "growth_milestones" USING btree ("updated_at");
  CREATE INDEX "growth_milestones_created_at_idx" ON "growth_milestones" USING btree ("created_at");
  CREATE INDEX "ops_asset_ladder_items_updated_at_idx" ON "ops_asset_ladder_items" USING btree ("updated_at");
  CREATE INDEX "ops_asset_ladder_items_created_at_idx" ON "ops_asset_ladder_items" USING btree ("created_at");
  CREATE INDEX "internal_ops_settings_scorecard_kpi_tooltips_order_idx" ON "internal_ops_settings_scorecard_kpi_tooltips" USING btree ("_order");
  CREATE INDEX "internal_ops_settings_scorecard_kpi_tooltips_parent_id_idx" ON "internal_ops_settings_scorecard_kpi_tooltips" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_growth_milestones_fk" FOREIGN KEY ("growth_milestones_id") REFERENCES "public"."growth_milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ops_asset_ladder_items_fk" FOREIGN KEY ("ops_asset_ladder_items_id") REFERENCES "public"."ops_asset_ladder_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_growth_milestones_id_idx" ON "payload_locked_documents_rels" USING btree ("growth_milestones_id");
  CREATE INDEX "payload_locked_documents_rels_ops_asset_ladder_items_id_idx" ON "payload_locked_documents_rels" USING btree ("ops_asset_ladder_items_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "growth_milestones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ops_asset_ladder_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "internal_ops_settings_scorecard_kpi_tooltips" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "growth_milestones" CASCADE;
  DROP TABLE "ops_asset_ladder_items" CASCADE;
  DROP TABLE "internal_ops_settings_scorecard_kpi_tooltips" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_growth_milestones_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ops_asset_ladder_items_fk";
  
  DROP INDEX "payload_locked_documents_rels_growth_milestones_id_idx";
  DROP INDEX "payload_locked_documents_rels_ops_asset_ladder_items_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "growth_milestones_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ops_asset_ladder_items_id";
  ALTER TABLE "internal_ops_settings" DROP COLUMN "chart_pipeline_note";
  ALTER TABLE "internal_ops_settings" DROP COLUMN "kpi_tooltip_leads";
  ALTER TABLE "internal_ops_settings" DROP COLUMN "kpi_tooltip_quotes";
  ALTER TABLE "internal_ops_settings" DROP COLUMN "kpi_tooltip_projected_revenue";
  ALTER TABLE "internal_ops_settings" DROP COLUMN "kpi_tooltip_mrr";`)
}
