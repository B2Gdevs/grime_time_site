import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "ops_liability_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"notes" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ops_scorecard_rows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"formula" varchar NOT NULL,
  	"target_guidance" varchar,
  	"manual_value" numeric,
  	"manual_value_label" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ops_liability_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ops_scorecard_rows_id" integer;
  CREATE INDEX "ops_liability_items_updated_at_idx" ON "ops_liability_items" USING btree ("updated_at");
  CREATE INDEX "ops_liability_items_created_at_idx" ON "ops_liability_items" USING btree ("created_at");
  CREATE INDEX "ops_scorecard_rows_updated_at_idx" ON "ops_scorecard_rows" USING btree ("updated_at");
  CREATE INDEX "ops_scorecard_rows_created_at_idx" ON "ops_scorecard_rows" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ops_liability_items_fk" FOREIGN KEY ("ops_liability_items_id") REFERENCES "public"."ops_liability_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ops_scorecard_rows_fk" FOREIGN KEY ("ops_scorecard_rows_id") REFERENCES "public"."ops_scorecard_rows"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ops_liability_items_id_idx" ON "payload_locked_documents_rels" USING btree ("ops_liability_items_id");
  CREATE INDEX "payload_locked_documents_rels_ops_scorecard_rows_id_idx" ON "payload_locked_documents_rels" USING btree ("ops_scorecard_rows_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ops_liability_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ops_scorecard_rows" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ops_liability_items" CASCADE;
  DROP TABLE "ops_scorecard_rows" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ops_liability_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ops_scorecard_rows_fk";
  
  DROP INDEX "payload_locked_documents_rels_ops_liability_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_ops_scorecard_rows_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ops_liability_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ops_scorecard_rows_id";`)
}
