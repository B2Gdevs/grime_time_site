import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'enum_pages_blocks_contact_request_layout_variant'
        AND n.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum_pages_blocks_contact_request_layout_variant" AS ENUM('default');
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'enum__pages_v_blocks_contact_request_layout_variant'
        AND n.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum__pages_v_blocks_contact_request_layout_variant" AS ENUM('default');
    END IF;
  END $$;
  CREATE TABLE IF NOT EXISTS "pages_blocks_contact_request" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout_variant" "enum_pages_blocks_contact_request_layout_variant" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_contact_request" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout_variant" "enum__pages_v_blocks_contact_request_layout_variant" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'pages_blocks_contact_request_parent_id_fk'
    ) THEN
      ALTER TABLE "pages_blocks_contact_request"
        ADD CONSTRAINT "pages_blocks_contact_request_parent_id_fk"
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
      WHERE conname = '_pages_v_blocks_contact_request_parent_id_fk'
    ) THEN
      ALTER TABLE "_pages_v_blocks_contact_request"
        ADD CONSTRAINT "_pages_v_blocks_contact_request_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_pages_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "pages_blocks_contact_request_order_idx" ON "pages_blocks_contact_request" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_contact_request_parent_id_idx" ON "pages_blocks_contact_request" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_contact_request_path_idx" ON "pages_blocks_contact_request" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_contact_request_order_idx" ON "_pages_v_blocks_contact_request" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_contact_request_parent_id_idx" ON "_pages_v_blocks_contact_request" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_contact_request_path_idx" ON "_pages_v_blocks_contact_request" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "pages_blocks_contact_request" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_contact_request" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_contact_request_layout_variant";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_contact_request_layout_variant";`)
}
