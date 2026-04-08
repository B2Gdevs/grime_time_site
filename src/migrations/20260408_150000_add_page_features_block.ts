import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

function createTableStatements(): string {
  return [
    `CREATE TABLE IF NOT EXISTS "pages_blocks_features_features" (
  "_order" integer NOT NULL,
  "_parent_id" varchar NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "eyebrow" varchar,
  "title" varchar,
  "summary" text
);`,
    `CREATE TABLE IF NOT EXISTS "pages_blocks_features" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_path" text NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "eyebrow" varchar,
  "heading" varchar,
  "intro" text,
  "is_hidden" boolean DEFAULT false,
  "block_name" varchar
);`,
    `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_features_features" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "eyebrow" varchar,
  "title" varchar,
  "summary" text,
  "_uuid" varchar
);`,
    `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_features" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_path" text NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "eyebrow" varchar,
  "heading" varchar,
  "intro" text,
  "is_hidden" boolean DEFAULT false,
  "_uuid" varchar,
  "block_name" varchar
);`,
  ].join('\n')
}

function addConstraintStatements(): string {
  return [
    `DO $$ BEGIN
  ALTER TABLE "pages_blocks_features_features"
    ADD CONSTRAINT "pages_blocks_features_features_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_features"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "pages_blocks_features"
    ADD CONSTRAINT "pages_blocks_features_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "_pages_v_blocks_features_features"
    ADD CONSTRAINT "_pages_v_blocks_features_features_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_features"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  ALTER TABLE "_pages_v_blocks_features"
    ADD CONSTRAINT "_pages_v_blocks_features_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  ].join('\n')
}

function createIndexStatements(): string {
  return [
    `CREATE INDEX IF NOT EXISTS "pages_blocks_features_features_order_idx" ON "pages_blocks_features_features" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_features_features_parent_id_idx" ON "pages_blocks_features_features" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_features_order_idx" ON "pages_blocks_features" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_features_parent_id_idx" ON "pages_blocks_features" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_features_path_idx" ON "pages_blocks_features" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_features_features_order_idx" ON "_pages_v_blocks_features_features" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_features_features_parent_id_idx" ON "_pages_v_blocks_features_features" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_features_order_idx" ON "_pages_v_blocks_features" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_features_parent_id_idx" ON "_pages_v_blocks_features" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_features_path_idx" ON "_pages_v_blocks_features" USING btree ("_path");`,
  ].join('\n')
}

function dropConstraintStatements(): string {
  return [
    `ALTER TABLE IF EXISTS "pages_blocks_features_features" DROP CONSTRAINT IF EXISTS "pages_blocks_features_features_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "pages_blocks_features" DROP CONSTRAINT IF EXISTS "pages_blocks_features_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "_pages_v_blocks_features_features" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_features_features_parent_id_fk";`,
    `ALTER TABLE IF EXISTS "_pages_v_blocks_features" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_features_parent_id_fk";`,
  ].join('\n')
}

function dropTableStatements(): string {
  return [
    `DROP TABLE IF EXISTS "pages_blocks_features_features" CASCADE;`,
    `DROP TABLE IF EXISTS "pages_blocks_features" CASCADE;`,
    `DROP TABLE IF EXISTS "_pages_v_blocks_features_features" CASCADE;`,
    `DROP TABLE IF EXISTS "_pages_v_blocks_features" CASCADE;`,
  ].join('\n')
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql.raw(
      [
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
      ].join('\n'),
    ),
  )
}
