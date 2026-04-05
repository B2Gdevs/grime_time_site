import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_service_grid_composer_reusable_mode" AS ENUM('linked', 'detached');
  CREATE TYPE "public"."enum_pages_blocks_cta_composer_reusable_mode" AS ENUM('linked', 'detached');
  CREATE TYPE "public"."enum_pages_blocks_content_composer_reusable_mode" AS ENUM('linked', 'detached');
  CREATE TYPE "public"."enum__pages_v_blocks_service_grid_composer_reusable_mode" AS ENUM('linked', 'detached');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_composer_reusable_mode" AS ENUM('linked', 'detached');
  CREATE TYPE "public"."enum__pages_v_blocks_content_composer_reusable_mode" AS ENUM('linked', 'detached');
  CREATE TABLE "pages_blocks_custom_html" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"html" varchar,
  	"is_hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_custom_html" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"html" varchar,
  	"is_hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_service_grid" ADD COLUMN "composer_reusable_mode" "enum_pages_blocks_service_grid_composer_reusable_mode";
  ALTER TABLE "pages_blocks_service_grid" ADD COLUMN "composer_reusable_key" varchar;
  ALTER TABLE "pages_blocks_service_grid" ADD COLUMN "composer_reusable_label" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "composer_reusable_mode" "enum_pages_blocks_cta_composer_reusable_mode";
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "composer_reusable_key" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "composer_reusable_label" varchar;
  ALTER TABLE "pages_blocks_content" ADD COLUMN "composer_reusable_mode" "enum_pages_blocks_content_composer_reusable_mode";
  ALTER TABLE "pages_blocks_content" ADD COLUMN "composer_reusable_key" varchar;
  ALTER TABLE "pages_blocks_content" ADD COLUMN "composer_reusable_label" varchar;
  ALTER TABLE "_pages_v_blocks_service_grid" ADD COLUMN "composer_reusable_mode" "enum__pages_v_blocks_service_grid_composer_reusable_mode";
  ALTER TABLE "_pages_v_blocks_service_grid" ADD COLUMN "composer_reusable_key" varchar;
  ALTER TABLE "_pages_v_blocks_service_grid" ADD COLUMN "composer_reusable_label" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "composer_reusable_mode" "enum__pages_v_blocks_cta_composer_reusable_mode";
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "composer_reusable_key" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "composer_reusable_label" varchar;
  ALTER TABLE "_pages_v_blocks_content" ADD COLUMN "composer_reusable_mode" "enum__pages_v_blocks_content_composer_reusable_mode";
  ALTER TABLE "_pages_v_blocks_content" ADD COLUMN "composer_reusable_key" varchar;
  ALTER TABLE "_pages_v_blocks_content" ADD COLUMN "composer_reusable_label" varchar;
  ALTER TABLE "pages_blocks_custom_html" ADD CONSTRAINT "pages_blocks_custom_html_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_custom_html" ADD CONSTRAINT "_pages_v_blocks_custom_html_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_custom_html_order_idx" ON "pages_blocks_custom_html" USING btree ("_order");
  CREATE INDEX "pages_blocks_custom_html_parent_id_idx" ON "pages_blocks_custom_html" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_custom_html_path_idx" ON "pages_blocks_custom_html" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_custom_html_order_idx" ON "_pages_v_blocks_custom_html" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_custom_html_parent_id_idx" ON "_pages_v_blocks_custom_html" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_custom_html_path_idx" ON "_pages_v_blocks_custom_html" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_custom_html" CASCADE;
  DROP TABLE "_pages_v_blocks_custom_html" CASCADE;
  ALTER TABLE "pages_blocks_service_grid" DROP COLUMN "composer_reusable_mode";
  ALTER TABLE "pages_blocks_service_grid" DROP COLUMN "composer_reusable_key";
  ALTER TABLE "pages_blocks_service_grid" DROP COLUMN "composer_reusable_label";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "composer_reusable_mode";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "composer_reusable_key";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "composer_reusable_label";
  ALTER TABLE "pages_blocks_content" DROP COLUMN "composer_reusable_mode";
  ALTER TABLE "pages_blocks_content" DROP COLUMN "composer_reusable_key";
  ALTER TABLE "pages_blocks_content" DROP COLUMN "composer_reusable_label";
  ALTER TABLE "_pages_v_blocks_service_grid" DROP COLUMN "composer_reusable_mode";
  ALTER TABLE "_pages_v_blocks_service_grid" DROP COLUMN "composer_reusable_key";
  ALTER TABLE "_pages_v_blocks_service_grid" DROP COLUMN "composer_reusable_label";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "composer_reusable_mode";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "composer_reusable_key";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "composer_reusable_label";
  ALTER TABLE "_pages_v_blocks_content" DROP COLUMN "composer_reusable_mode";
  ALTER TABLE "_pages_v_blocks_content" DROP COLUMN "composer_reusable_key";
  ALTER TABLE "_pages_v_blocks_content" DROP COLUMN "composer_reusable_label";
  DROP TYPE "public"."enum_pages_blocks_service_grid_composer_reusable_mode";
  DROP TYPE "public"."enum_pages_blocks_cta_composer_reusable_mode";
  DROP TYPE "public"."enum_pages_blocks_content_composer_reusable_mode";
  DROP TYPE "public"."enum__pages_v_blocks_service_grid_composer_reusable_mode";
  DROP TYPE "public"."enum__pages_v_blocks_cta_composer_reusable_mode";
  DROP TYPE "public"."enum__pages_v_blocks_content_composer_reusable_mode";`)
}
