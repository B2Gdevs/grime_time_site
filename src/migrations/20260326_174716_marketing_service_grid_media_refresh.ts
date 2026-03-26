import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_service_grid_services_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_service_grid_services_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_blocks_service_grid_services" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_service_grid_services" ADD COLUMN "media_id" integer;
  ALTER TABLE "pages_blocks_service_grid_services" ADD COLUMN "pricing_hint" varchar;
  ALTER TABLE "pages_blocks_service_grid" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_service_grid_services" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_service_grid_services" ADD COLUMN "media_id" integer;
  ALTER TABLE "_pages_v_blocks_service_grid_services" ADD COLUMN "pricing_hint" varchar;
  ALTER TABLE "_pages_v_blocks_service_grid" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_service_grid_services_highlights" ADD CONSTRAINT "pages_blocks_service_grid_services_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_service_grid_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_grid_services_highlights" ADD CONSTRAINT "_pages_v_blocks_service_grid_services_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_service_grid_services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_service_grid_services_highlights_order_idx" ON "pages_blocks_service_grid_services_highlights" USING btree ("_order");
  CREATE INDEX "pages_blocks_service_grid_services_highlights_parent_id_idx" ON "pages_blocks_service_grid_services_highlights" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_service_grid_services_highlights_order_idx" ON "_pages_v_blocks_service_grid_services_highlights" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_service_grid_services_highlights_parent_id_idx" ON "_pages_v_blocks_service_grid_services_highlights" USING btree ("_parent_id");
  ALTER TABLE "pages_blocks_service_grid_services" ADD CONSTRAINT "pages_blocks_service_grid_services_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_grid_services" ADD CONSTRAINT "_pages_v_blocks_service_grid_services_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_service_grid_services_media_idx" ON "pages_blocks_service_grid_services" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_service_grid_services_media_idx" ON "_pages_v_blocks_service_grid_services" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_service_grid_services_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_service_grid_services_highlights" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_service_grid_services_highlights" CASCADE;
  DROP TABLE "_pages_v_blocks_service_grid_services_highlights" CASCADE;
  ALTER TABLE "pages_blocks_service_grid_services" DROP CONSTRAINT "pages_blocks_service_grid_services_media_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_service_grid_services" DROP CONSTRAINT "_pages_v_blocks_service_grid_services_media_id_media_id_fk";
  DROP INDEX "pages_blocks_service_grid_services_media_idx";
  DROP INDEX "_pages_v_blocks_service_grid_services_media_idx";
  ALTER TABLE "pages_blocks_service_grid_services" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_service_grid_services" DROP COLUMN "media_id";
  ALTER TABLE "pages_blocks_service_grid_services" DROP COLUMN "pricing_hint";
  ALTER TABLE "pages_blocks_service_grid" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_service_grid_services" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_service_grid_services" DROP COLUMN "media_id";
  ALTER TABLE "_pages_v_blocks_service_grid_services" DROP COLUMN "pricing_hint";
  ALTER TABLE "_pages_v_blocks_service_grid" DROP COLUMN "eyebrow";`)
}
