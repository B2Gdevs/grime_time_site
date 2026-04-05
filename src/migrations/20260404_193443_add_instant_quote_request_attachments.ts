import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_type.typname = 'enum_instant_quote_request_attachments_attachment_status'
        AND pg_namespace.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum_instant_quote_request_attachments_attachment_status" AS ENUM('new', 'reviewed', 'linked_to_quote');
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_type.typname = 'enum_instant_quote_request_attachments_intake_source'
        AND pg_namespace.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum_instant_quote_request_attachments_intake_source" AS ENUM('instant_quote');
    END IF;
  END $$;
  CREATE TABLE IF NOT EXISTS "instant_quote_request_attachments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"submission_id" integer NOT NULL,
  	"quote_id" integer,
  	"attachment_status" "enum_instant_quote_request_attachments_attachment_status" DEFAULT 'new' NOT NULL,
  	"intake_source" "enum_instant_quote_request_attachments_intake_source" DEFAULT 'instant_quote' NOT NULL,
  	"customer_filename" varchar NOT NULL,
  	"content_type" varchar NOT NULL,
  	"file_size_bytes" numeric NOT NULL,
  	"review_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  ALTER TABLE "instant_quote_request_attachments"
    ADD CONSTRAINT "instant_quote_request_attachments_submission_id_form_submissions_id_fk"
    FOREIGN KEY ("submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "instant_quote_request_attachments"
    ADD CONSTRAINT "instant_quote_request_attachments_quote_id_quotes_id_fk"
    FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "instant_quote_request_attachments_submission_idx" ON "instant_quote_request_attachments" USING btree ("submission_id");
  CREATE INDEX IF NOT EXISTS "instant_quote_request_attachments_quote_idx" ON "instant_quote_request_attachments" USING btree ("quote_id");
  CREATE INDEX IF NOT EXISTS "instant_quote_request_attachments_updated_at_idx" ON "instant_quote_request_attachments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "instant_quote_request_attachments_created_at_idx" ON "instant_quote_request_attachments" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "instant_quote_request_attachments_filename_idx" ON "instant_quote_request_attachments" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "instant_quote_request_attachments_sizes_thumbnail_sizes__idx" ON "instant_quote_request_attachments" USING btree ("sizes_thumbnail_filename");
  ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "instant_quote_request_attachments_id" integer;
  ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_instant_quote_request_attac_fk"
    FOREIGN KEY ("instant_quote_request_attachments_id") REFERENCES "public"."instant_quote_request_attachments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_instant_quote_request_atta_idx" ON "payload_locked_documents_rels" USING btree ("instant_quote_request_attachments_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_instant_quote_request_attac_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_instant_quote_request_atta_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "instant_quote_request_attachments_id";
  DROP TABLE IF EXISTS "instant_quote_request_attachments" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_instant_quote_request_attachments_attachment_status";
  DROP TYPE IF EXISTS "public"."enum_instant_quote_request_attachments_intake_source";`)
}
