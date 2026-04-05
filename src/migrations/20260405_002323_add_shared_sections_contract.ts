import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_shared_sections_category" AS ENUM('hero', 'content', 'cta', 'social-proof', 'media', 'utility');
  CREATE TYPE "public"."enum_shared_sections_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_shared_sections_preview_status" AS ENUM('pending', 'ready', 'failed');
  CREATE TYPE "public"."enum__shared_sections_v_version_category" AS ENUM('hero', 'content', 'cta', 'social-proof', 'media', 'utility');
  CREATE TYPE "public"."enum__shared_sections_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__shared_sections_v_version_preview_status" AS ENUM('pending', 'ready', 'failed');
  CREATE TABLE "shared_sections_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "shared_sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"category" "enum_shared_sections_category" DEFAULT 'content',
  	"status" "enum_shared_sections_status" DEFAULT 'draft',
  	"current_version" numeric DEFAULT 1,
  	"usage_count" numeric DEFAULT 0,
  	"structure" jsonb,
  	"preview_url" varchar,
  	"preview_status" "enum_shared_sections_preview_status" DEFAULT 'pending',
  	"preview_updated_at" timestamp(3) with time zone,
  	"preview_error_message" varchar,
  	"created_by_id" integer,
  	"updated_by_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"archived_at" timestamp(3) with time zone,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_shared_sections_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_shared_sections_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_shared_sections_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_description" varchar,
  	"version_category" "enum__shared_sections_v_version_category" DEFAULT 'content',
  	"version_status" "enum__shared_sections_v_version_status" DEFAULT 'draft',
  	"version_current_version" numeric DEFAULT 1,
  	"version_usage_count" numeric DEFAULT 0,
  	"version_structure" jsonb,
  	"version_preview_url" varchar,
  	"version_preview_status" "enum__shared_sections_v_version_preview_status" DEFAULT 'pending',
  	"version_preview_updated_at" timestamp(3) with time zone,
  	"version_preview_error_message" varchar,
  	"version_created_by_id" integer,
  	"version_updated_by_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_archived_at" timestamp(3) with time zone,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__shared_sections_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "shared_sections_id" integer;
  ALTER TABLE "shared_sections_tags" ADD CONSTRAINT "shared_sections_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shared_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shared_sections" ADD CONSTRAINT "shared_sections_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shared_sections" ADD CONSTRAINT "shared_sections_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_shared_sections_v_version_tags" ADD CONSTRAINT "_shared_sections_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_shared_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_shared_sections_v" ADD CONSTRAINT "_shared_sections_v_parent_id_shared_sections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shared_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_shared_sections_v" ADD CONSTRAINT "_shared_sections_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_shared_sections_v" ADD CONSTRAINT "_shared_sections_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "shared_sections_tags_order_idx" ON "shared_sections_tags" USING btree ("_order");
  CREATE INDEX "shared_sections_tags_parent_id_idx" ON "shared_sections_tags" USING btree ("_parent_id");
  CREATE INDEX "shared_sections_created_by_idx" ON "shared_sections" USING btree ("created_by_id");
  CREATE INDEX "shared_sections_updated_by_idx" ON "shared_sections" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX "shared_sections_slug_idx" ON "shared_sections" USING btree ("slug");
  CREATE INDEX "shared_sections_updated_at_idx" ON "shared_sections" USING btree ("updated_at");
  CREATE INDEX "shared_sections_created_at_idx" ON "shared_sections" USING btree ("created_at");
  CREATE INDEX "shared_sections__status_idx" ON "shared_sections" USING btree ("_status");
  CREATE INDEX "_shared_sections_v_version_tags_order_idx" ON "_shared_sections_v_version_tags" USING btree ("_order");
  CREATE INDEX "_shared_sections_v_version_tags_parent_id_idx" ON "_shared_sections_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_shared_sections_v_parent_idx" ON "_shared_sections_v" USING btree ("parent_id");
  CREATE INDEX "_shared_sections_v_version_version_created_by_idx" ON "_shared_sections_v" USING btree ("version_created_by_id");
  CREATE INDEX "_shared_sections_v_version_version_updated_by_idx" ON "_shared_sections_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_shared_sections_v_version_version_slug_idx" ON "_shared_sections_v" USING btree ("version_slug");
  CREATE INDEX "_shared_sections_v_version_version_updated_at_idx" ON "_shared_sections_v" USING btree ("version_updated_at");
  CREATE INDEX "_shared_sections_v_version_version_created_at_idx" ON "_shared_sections_v" USING btree ("version_created_at");
  CREATE INDEX "_shared_sections_v_version_version__status_idx" ON "_shared_sections_v" USING btree ("version__status");
  CREATE INDEX "_shared_sections_v_created_at_idx" ON "_shared_sections_v" USING btree ("created_at");
  CREATE INDEX "_shared_sections_v_updated_at_idx" ON "_shared_sections_v" USING btree ("updated_at");
  CREATE INDEX "_shared_sections_v_latest_idx" ON "_shared_sections_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shared_sections_fk" FOREIGN KEY ("shared_sections_id") REFERENCES "public"."shared_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_shared_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("shared_sections_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "shared_sections_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "shared_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shared_sections_v_version_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shared_sections_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "shared_sections_tags" CASCADE;
  DROP TABLE "shared_sections" CASCADE;
  DROP TABLE "_shared_sections_v_version_tags" CASCADE;
  DROP TABLE "_shared_sections_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_shared_sections_fk";
  
  DROP INDEX "payload_locked_documents_rels_shared_sections_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "shared_sections_id";
  DROP TYPE "public"."enum_shared_sections_category";
  DROP TYPE "public"."enum_shared_sections_status";
  DROP TYPE "public"."enum_shared_sections_preview_status";
  DROP TYPE "public"."enum__shared_sections_v_version_category";
  DROP TYPE "public"."enum__shared_sections_v_version_status";
  DROP TYPE "public"."enum__shared_sections_v_version_preview_status";`)
}
