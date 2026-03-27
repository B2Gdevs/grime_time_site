import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'enum_pages_blocks_testimonials_block_selection_mode'
        AND n.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum_pages_blocks_testimonials_block_selection_mode" AS ENUM('selected', 'featuredLatest');
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'enum__pages_v_blocks_testimonials_block_selection_mode'
        AND n.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum__pages_v_blocks_testimonials_block_selection_mode" AS ENUM('selected', 'featuredLatest');
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'enum_users_portal_invite_state'
        AND n.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum_users_portal_invite_state" AS ENUM('none', 'claim_pending', 'invite_pending', 'active');
    END IF;
  END $$;
  CREATE TABLE IF NOT EXISTS "pages_blocks_testimonials_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" jsonb,
  	"selection_mode" "enum_pages_blocks_testimonials_block_selection_mode" DEFAULT 'selected',
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_testimonials_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" jsonb,
  	"selection_mode" "enum__pages_v_blocks_testimonials_block_selection_mode" DEFAULT 'selected',
  	"limit" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author_name" varchar NOT NULL,
  	"author_detail" varchar,
  	"photo_id" integer,
  	"rating" numeric,
  	"published" boolean DEFAULT false,
  	"featured" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "testimonials_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "testimonials_id" integer;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supabase_auth_user_i_d" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_portal_login_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portal_invite_state" "enum_users_portal_invite_state" DEFAULT 'none';
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portal_invite_token_hash" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portal_invite_expires_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portal_invite_sent_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "testimonials_id" integer;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'pages_blocks_testimonials_block_parent_id_fk'
    ) THEN
      ALTER TABLE "pages_blocks_testimonials_block"
        ADD CONSTRAINT "pages_blocks_testimonials_block_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."pages"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = '_pages_v_blocks_testimonials_block_parent_id_fk'
    ) THEN
      ALTER TABLE "_pages_v_blocks_testimonials_block"
        ADD CONSTRAINT "_pages_v_blocks_testimonials_block_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_pages_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'testimonials_photo_id_media_id_fk'
    ) THEN
      ALTER TABLE "testimonials"
        ADD CONSTRAINT "testimonials_photo_id_media_id_fk"
        FOREIGN KEY ("photo_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_block_order_idx" ON "pages_blocks_testimonials_block" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_block_parent_id_idx" ON "pages_blocks_testimonials_block" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_block_path_idx" ON "pages_blocks_testimonials_block" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_block_order_idx" ON "_pages_v_blocks_testimonials_block" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_block_parent_id_idx" ON "_pages_v_blocks_testimonials_block" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_block_path_idx" ON "_pages_v_blocks_testimonials_block" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "testimonials_photo_idx" ON "testimonials" USING btree ("photo_id");
  CREATE INDEX IF NOT EXISTS "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_supabase_auth_user_i_d_idx" ON "users" USING btree ("supabase_auth_user_i_d");
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'pages_rels_testimonials_fk'
    ) THEN
      ALTER TABLE "pages_rels"
        ADD CONSTRAINT "pages_rels_testimonials_fk"
        FOREIGN KEY ("testimonials_id")
        REFERENCES "public"."testimonials"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = '_pages_v_rels_testimonials_fk'
    ) THEN
      ALTER TABLE "_pages_v_rels"
        ADD CONSTRAINT "_pages_v_rels_testimonials_fk"
        FOREIGN KEY ("testimonials_id")
        REFERENCES "public"."testimonials"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_testimonials_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk"
        FOREIGN KEY ("testimonials_id")
        REFERENCES "public"."testimonials"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "pages_rels_testimonials_id_idx" ON "pages_rels" USING btree ("testimonials_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_testimonials_id_idx" ON "_pages_v_rels" USING btree ("testimonials_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "pages_blocks_testimonials_block" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_testimonials_block" CASCADE;
  DROP TABLE IF EXISTS "testimonials" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_testimonials_fk";
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_testimonials_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_testimonials_fk";
  DROP INDEX IF EXISTS "pages_rels_testimonials_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_testimonials_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_testimonials_id_idx";
  DROP INDEX IF EXISTS "users_supabase_auth_user_i_d_idx";
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "testimonials_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "testimonials_id";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "supabase_auth_user_i_d";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified_at";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "last_portal_login_at";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "portal_invite_state";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "portal_invite_token_hash";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "portal_invite_expires_at";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "portal_invite_sent_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "testimonials_id";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_testimonials_block_selection_mode";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_testimonials_block_selection_mode";
  DROP TYPE IF EXISTS "public"."enum_users_portal_invite_state";`)
}
