import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

function createTypeStatements(): string {
  return [
    `DO $$ BEGIN
  CREATE TYPE "public"."enum_pages_blocks_hero_block_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  CREATE TYPE "public"."enum_pages_blocks_hero_block_links_link_type" AS ENUM('reference', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  CREATE TYPE "public"."enum_pages_blocks_hero_block_links_link_appearance" AS ENUM('default', 'outline');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  CREATE TYPE "public"."enum__pages_v_blocks_hero_block_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  CREATE TYPE "public"."enum__pages_v_blocks_hero_block_links_link_type" AS ENUM('reference', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  CREATE TYPE "public"."enum__pages_v_blocks_hero_block_links_link_appearance" AS ENUM('default', 'outline');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  ].join('\n')
}

function createTableStatements(): string {
  return [
    `CREATE TABLE IF NOT EXISTS "pages_blocks_hero_block_links" (
  "_order" integer NOT NULL,
  "_parent_id" varchar NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "link_type" "enum_pages_blocks_hero_block_links_link_type" DEFAULT 'reference',
  "link_new_tab" boolean,
  "link_url" varchar,
  "link_label" varchar,
  "link_appearance" "enum_pages_blocks_hero_block_links_link_appearance" DEFAULT 'default'
);`,
    `CREATE TABLE IF NOT EXISTS "pages_blocks_hero_block" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_path" text NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "type" "enum_pages_blocks_hero_block_type" DEFAULT 'lowImpact',
  "eyebrow" varchar,
  "headline_primary" varchar,
  "headline_accent" varchar,
  "rich_text" jsonb,
  "panel_eyebrow" varchar,
  "panel_heading" varchar,
  "panel_body" text,
  "media_id" integer,
  "is_hidden" boolean DEFAULT false,
  "block_name" varchar
);`,
    `CREATE TABLE IF NOT EXISTS "pages_blocks_service_estimator" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_path" text NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "is_hidden" boolean DEFAULT false,
  "block_name" varchar
);`,
    `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_hero_block_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "link_type" "enum__pages_v_blocks_hero_block_links_link_type" DEFAULT 'reference',
  "link_new_tab" boolean,
  "link_url" varchar,
  "link_label" varchar,
  "link_appearance" "enum__pages_v_blocks_hero_block_links_link_appearance" DEFAULT 'default',
  "_uuid" varchar
);`,
    `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_hero_block" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_path" text NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "type" "enum__pages_v_blocks_hero_block_type" DEFAULT 'lowImpact',
  "eyebrow" varchar,
  "headline_primary" varchar,
  "headline_accent" varchar,
  "rich_text" jsonb,
  "panel_eyebrow" varchar,
  "panel_heading" varchar,
  "panel_body" text,
  "media_id" integer,
  "is_hidden" boolean DEFAULT false,
  "_uuid" varchar,
  "block_name" varchar
);`,
    `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_service_estimator" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_path" text NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "is_hidden" boolean DEFAULT false,
  "_uuid" varchar,
  "block_name" varchar
);`,
  ].join('\n')
}

function addConstraintStatements(): string {
  return [
    `DO $$ BEGIN
  ALTER TABLE "pages_blocks_hero_block_links"
    ADD CONSTRAINT "pages_blocks_hero_block_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero_block"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "pages_blocks_hero_block"
    ADD CONSTRAINT "pages_blocks_hero_block_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "pages_blocks_hero_block"
    ADD CONSTRAINT "pages_blocks_hero_block_media_id_media_id_fk"
    FOREIGN KEY ("media_id") REFERENCES "public"."media"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "pages_blocks_service_estimator"
    ADD CONSTRAINT "pages_blocks_service_estimator_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "_pages_v_blocks_hero_block_links"
    ADD CONSTRAINT "_pages_v_blocks_hero_block_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero_block"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "_pages_v_blocks_hero_block"
    ADD CONSTRAINT "_pages_v_blocks_hero_block_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "_pages_v_blocks_hero_block"
    ADD CONSTRAINT "_pages_v_blocks_hero_block_media_id_media_id_fk"
    FOREIGN KEY ("media_id") REFERENCES "public"."media"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "_pages_v_blocks_service_estimator"
    ADD CONSTRAINT "_pages_v_blocks_service_estimator_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  ].join('\n')
}

function createIndexStatements(): string {
  return [
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_block_links_order_idx" ON "pages_blocks_hero_block_links" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_block_links_parent_id_idx" ON "pages_blocks_hero_block_links" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_block_order_idx" ON "pages_blocks_hero_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_block_parent_id_idx" ON "pages_blocks_hero_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_block_path_idx" ON "pages_blocks_hero_block" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_block_media_idx" ON "pages_blocks_hero_block" USING btree ("media_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_service_estimator_order_idx" ON "pages_blocks_service_estimator" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_service_estimator_parent_id_idx" ON "pages_blocks_service_estimator" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_service_estimator_path_idx" ON "pages_blocks_service_estimator" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_block_links_order_idx" ON "_pages_v_blocks_hero_block_links" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_block_links_parent_id_idx" ON "_pages_v_blocks_hero_block_links" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_block_order_idx" ON "_pages_v_blocks_hero_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_block_parent_id_idx" ON "_pages_v_blocks_hero_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_block_path_idx" ON "_pages_v_blocks_hero_block" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_block_media_idx" ON "_pages_v_blocks_hero_block" USING btree ("media_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_service_estimator_order_idx" ON "_pages_v_blocks_service_estimator" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_service_estimator_parent_id_idx" ON "_pages_v_blocks_service_estimator" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_service_estimator_path_idx" ON "_pages_v_blocks_service_estimator" USING btree ("_path");`,
  ].join('\n')
}

function dropConstraintStatements(): string {
  return [
    `ALTER TABLE IF EXISTS "pages_blocks_hero_block_links" DROP CONSTRAINT IF EXISTS "pages_blocks_hero_block_links_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "pages_blocks_hero_block" DROP CONSTRAINT IF EXISTS "pages_blocks_hero_block_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "pages_blocks_hero_block" DROP CONSTRAINT IF EXISTS "pages_blocks_hero_block_media_id_media_id_fk";`,
    `ALTER TABLE IF EXISTS "pages_blocks_service_estimator" DROP CONSTRAINT IF EXISTS "pages_blocks_service_estimator_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "_pages_v_blocks_hero_block_links" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_hero_block_links_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "_pages_v_blocks_hero_block" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_hero_block_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "_pages_v_blocks_hero_block" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_hero_block_media_id_media_id_fk";`,
    `ALTER TABLE IF EXISTS "_pages_v_blocks_service_estimator" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_service_estimator_parent_id_fk";`,
  ].join('\n')
}

function dropTableStatements(): string {
  return [
    `DROP TABLE IF EXISTS "pages_blocks_hero_block_links" CASCADE;`,
    `DROP TABLE IF EXISTS "pages_blocks_hero_block" CASCADE;`,
    `DROP TABLE IF EXISTS "pages_blocks_service_estimator" CASCADE;`,
    `DROP TABLE IF EXISTS "_pages_v_blocks_hero_block_links" CASCADE;`,
    `DROP TABLE IF EXISTS "_pages_v_blocks_hero_block" CASCADE;`,
    `DROP TABLE IF EXISTS "_pages_v_blocks_service_estimator" CASCADE;`,
  ].join('\n')
}

function dropTypeStatements(): string {
  return [
    `DROP TYPE IF EXISTS "public"."enum_pages_blocks_hero_block_links_link_appearance";`,
    `DROP TYPE IF EXISTS "public"."enum_pages_blocks_hero_block_links_link_type";`,
    `DROP TYPE IF EXISTS "public"."enum_pages_blocks_hero_block_type";`,
    `DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_hero_block_links_link_appearance";`,
    `DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_hero_block_links_link_type";`,
    `DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_hero_block_type";`,
  ].join('\n')
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql.raw(
      [
        createTypeStatements(),
        createTableStatements(),
        addConstraintStatements(),
        createIndexStatements(),
      ].join('\n'),
    ),
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(
    sql.raw(
      [
        dropConstraintStatements(),
        dropTableStatements(),
        dropTypeStatements(),
      ].join('\n'),
    ),
  )
}
