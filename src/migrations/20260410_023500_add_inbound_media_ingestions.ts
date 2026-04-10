import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        WHERE pg_type.typname = 'enum_inbound_media_ingestions_status'
          AND pg_namespace.nspname = 'public'
      ) THEN
        CREATE TYPE "public"."enum_inbound_media_ingestions_status" AS ENUM(
          'received',
          'processing',
          'ingested',
          'partial',
          'failed_validation',
          'failed_processing',
          'replay_requested',
          'replayed'
        );
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        WHERE pg_type.typname = 'enum_inbound_media_ingestions_provider'
          AND pg_namespace.nspname = 'public'
      ) THEN
        CREATE TYPE "public"."enum_inbound_media_ingestions_provider" AS ENUM(
          'resend',
          'manual',
          'other'
        );
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "inbound_media_ingestions" (
      "id" serial PRIMARY KEY NOT NULL,
      "ingestion_label" varchar NOT NULL,
      "status" "enum_inbound_media_ingestions_status" DEFAULT 'received' NOT NULL,
      "provider" "enum_inbound_media_ingestions_provider" DEFAULT 'other' NOT NULL,
      "received_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "provider_event_i_d" varchar,
      "provider_message_i_d" varchar,
      "idempotency_key" varchar NOT NULL,
      "sender_email" varchar,
      "sender_name" varchar,
      "recipient_email" varchar,
      "subject" varchar,
      "replay_count" numeric DEFAULT 0 NOT NULL,
      "replay_requested_at" timestamp(3) with time zone,
      "processed_at" timestamp(3) with time zone,
      "attachment_audit" jsonb,
      "created_media_i_ds" jsonb,
      "latest_error" varchar,
      "notes" varchar,
      "payload_snapshot" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "inbound_media_ingestions_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_inbound_media_ingestions_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_inbound_media_ingestions_fk"
          FOREIGN KEY ("inbound_media_ingestions_id")
          REFERENCES "public"."inbound_media_ingestions"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "inbound_media_ingestions_provider_event_i_d_idx"
      ON "inbound_media_ingestions" USING btree ("provider_event_i_d");
    CREATE UNIQUE INDEX IF NOT EXISTS "inbound_media_ingestions_idempotency_key_idx"
      ON "inbound_media_ingestions" USING btree ("idempotency_key");
    CREATE INDEX IF NOT EXISTS "inbound_media_ingestions_received_at_idx"
      ON "inbound_media_ingestions" USING btree ("received_at");
    CREATE INDEX IF NOT EXISTS "inbound_media_ingestions_status_idx"
      ON "inbound_media_ingestions" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "inbound_media_ingestions_updated_at_idx"
      ON "inbound_media_ingestions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "inbound_media_ingestions_created_at_idx"
      ON "inbound_media_ingestions" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inbound_media_ingestions_id_idx"
      ON "payload_locked_documents_rels" USING btree ("inbound_media_ingestions_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inbound_media_ingestions_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_inbound_media_ingestions_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "inbound_media_ingestions_id";

    DROP INDEX IF EXISTS "inbound_media_ingestions_provider_event_i_d_idx";
    DROP INDEX IF EXISTS "inbound_media_ingestions_idempotency_key_idx";
    DROP INDEX IF EXISTS "inbound_media_ingestions_received_at_idx";
    DROP INDEX IF EXISTS "inbound_media_ingestions_status_idx";
    DROP INDEX IF EXISTS "inbound_media_ingestions_updated_at_idx";
    DROP INDEX IF EXISTS "inbound_media_ingestions_created_at_idx";
    DROP TABLE IF EXISTS "inbound_media_ingestions" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_inbound_media_ingestions_status";
    DROP TYPE IF EXISTS "public"."enum_inbound_media_ingestions_provider";
  `)
}
