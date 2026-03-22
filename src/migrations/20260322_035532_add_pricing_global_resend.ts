import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_pricing_table_inline_plans_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_pricing_table_inline_plans_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_pricing_table_data_source" AS ENUM('global', 'inline');
  CREATE TYPE "public"."enum__pages_v_blocks_pricing_table_inline_plans_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_pricing_table_inline_plans_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_pricing_table_data_source" AS ENUM('global', 'inline');
  CREATE TYPE "public"."enum_pricing_plans_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pricing_plans_link_appearance" AS ENUM('default', 'outline');
  CREATE TABLE "pages_blocks_service_grid_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"summary" varchar
  );
  
  CREATE TABLE "pages_blocks_service_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Our services',
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_pricing_table_inline_plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_pricing_table_inline_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"tagline" varchar,
  	"price" varchar,
  	"price_note" varchar,
  	"highlighted" boolean DEFAULT false,
  	"link_type" "enum_pages_blocks_pricing_table_inline_plans_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_blocks_pricing_table_inline_plans_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pages_blocks_pricing_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"data_source" "enum_pages_blocks_pricing_table_data_source" DEFAULT 'global',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_service_grid_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"summary" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_service_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Our services',
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pricing_table_inline_plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pricing_table_inline_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"tagline" varchar,
  	"price" varchar,
  	"price_note" varchar,
  	"highlighted" boolean DEFAULT false,
  	"link_type" "enum__pages_v_blocks_pricing_table_inline_plans_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_blocks_pricing_table_inline_plans_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pricing_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"data_source" "enum__pages_v_blocks_pricing_table_data_source" DEFAULT 'global',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pricing_plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "pricing_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"tagline" varchar,
  	"price" varchar NOT NULL,
  	"price_note" varchar,
  	"highlighted" boolean DEFAULT false,
  	"link_type" "enum_pricing_plans_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL,
  	"link_appearance" "enum_pricing_plans_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pricing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"section_title" varchar DEFAULT 'Packages & pricing',
  	"section_intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "pricing_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer
  );
  
  ALTER TABLE "pages_blocks_service_grid_services" ADD CONSTRAINT "pages_blocks_service_grid_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_service_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_service_grid" ADD CONSTRAINT "pages_blocks_service_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pricing_table_inline_plans_features" ADD CONSTRAINT "pages_blocks_pricing_table_inline_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pricing_table_inline_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pricing_table_inline_plans" ADD CONSTRAINT "pages_blocks_pricing_table_inline_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pricing_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pricing_table" ADD CONSTRAINT "pages_blocks_pricing_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_grid_services" ADD CONSTRAINT "_pages_v_blocks_service_grid_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_service_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_grid" ADD CONSTRAINT "_pages_v_blocks_service_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pricing_table_inline_plans_features" ADD CONSTRAINT "_pages_v_blocks_pricing_table_inline_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_pricing_table_inline_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pricing_table_inline_plans" ADD CONSTRAINT "_pages_v_blocks_pricing_table_inline_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_pricing_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pricing_table" ADD CONSTRAINT "_pages_v_blocks_pricing_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_plans_features" ADD CONSTRAINT "pricing_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_plans" ADD CONSTRAINT "pricing_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_rels" ADD CONSTRAINT "pricing_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_rels" ADD CONSTRAINT "pricing_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_rels" ADD CONSTRAINT "pricing_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_service_grid_services_order_idx" ON "pages_blocks_service_grid_services" USING btree ("_order");
  CREATE INDEX "pages_blocks_service_grid_services_parent_id_idx" ON "pages_blocks_service_grid_services" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_service_grid_order_idx" ON "pages_blocks_service_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_service_grid_parent_id_idx" ON "pages_blocks_service_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_service_grid_path_idx" ON "pages_blocks_service_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_pricing_table_inline_plans_features_order_idx" ON "pages_blocks_pricing_table_inline_plans_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_pricing_table_inline_plans_features_parent_id_idx" ON "pages_blocks_pricing_table_inline_plans_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pricing_table_inline_plans_order_idx" ON "pages_blocks_pricing_table_inline_plans" USING btree ("_order");
  CREATE INDEX "pages_blocks_pricing_table_inline_plans_parent_id_idx" ON "pages_blocks_pricing_table_inline_plans" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pricing_table_order_idx" ON "pages_blocks_pricing_table" USING btree ("_order");
  CREATE INDEX "pages_blocks_pricing_table_parent_id_idx" ON "pages_blocks_pricing_table" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pricing_table_path_idx" ON "pages_blocks_pricing_table" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_service_grid_services_order_idx" ON "_pages_v_blocks_service_grid_services" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_service_grid_services_parent_id_idx" ON "_pages_v_blocks_service_grid_services" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_service_grid_order_idx" ON "_pages_v_blocks_service_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_service_grid_parent_id_idx" ON "_pages_v_blocks_service_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_service_grid_path_idx" ON "_pages_v_blocks_service_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_pricing_table_inline_plans_features_order_idx" ON "_pages_v_blocks_pricing_table_inline_plans_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pricing_table_inline_plans_features_parent_id_idx" ON "_pages_v_blocks_pricing_table_inline_plans_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pricing_table_inline_plans_order_idx" ON "_pages_v_blocks_pricing_table_inline_plans" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pricing_table_inline_plans_parent_id_idx" ON "_pages_v_blocks_pricing_table_inline_plans" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pricing_table_order_idx" ON "_pages_v_blocks_pricing_table" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pricing_table_parent_id_idx" ON "_pages_v_blocks_pricing_table" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pricing_table_path_idx" ON "_pages_v_blocks_pricing_table" USING btree ("_path");
  CREATE INDEX "pricing_plans_features_order_idx" ON "pricing_plans_features" USING btree ("_order");
  CREATE INDEX "pricing_plans_features_parent_id_idx" ON "pricing_plans_features" USING btree ("_parent_id");
  CREATE INDEX "pricing_plans_order_idx" ON "pricing_plans" USING btree ("_order");
  CREATE INDEX "pricing_plans_parent_id_idx" ON "pricing_plans" USING btree ("_parent_id");
  CREATE INDEX "pricing_rels_order_idx" ON "pricing_rels" USING btree ("order");
  CREATE INDEX "pricing_rels_parent_idx" ON "pricing_rels" USING btree ("parent_id");
  CREATE INDEX "pricing_rels_path_idx" ON "pricing_rels" USING btree ("path");
  CREATE INDEX "pricing_rels_pages_id_idx" ON "pricing_rels" USING btree ("pages_id");
  CREATE INDEX "pricing_rels_posts_id_idx" ON "pricing_rels" USING btree ("posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_service_grid_services" CASCADE;
  DROP TABLE "pages_blocks_service_grid" CASCADE;
  DROP TABLE "pages_blocks_pricing_table_inline_plans_features" CASCADE;
  DROP TABLE "pages_blocks_pricing_table_inline_plans" CASCADE;
  DROP TABLE "pages_blocks_pricing_table" CASCADE;
  DROP TABLE "_pages_v_blocks_service_grid_services" CASCADE;
  DROP TABLE "_pages_v_blocks_service_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_pricing_table_inline_plans_features" CASCADE;
  DROP TABLE "_pages_v_blocks_pricing_table_inline_plans" CASCADE;
  DROP TABLE "_pages_v_blocks_pricing_table" CASCADE;
  DROP TABLE "pricing_plans_features" CASCADE;
  DROP TABLE "pricing_plans" CASCADE;
  DROP TABLE "pricing" CASCADE;
  DROP TABLE "pricing_rels" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_pricing_table_inline_plans_link_type";
  DROP TYPE "public"."enum_pages_blocks_pricing_table_inline_plans_link_appearance";
  DROP TYPE "public"."enum_pages_blocks_pricing_table_data_source";
  DROP TYPE "public"."enum__pages_v_blocks_pricing_table_inline_plans_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_pricing_table_inline_plans_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_pricing_table_data_source";
  DROP TYPE "public"."enum_pricing_plans_link_type";
  DROP TYPE "public"."enum_pricing_plans_link_appearance";`)
}
