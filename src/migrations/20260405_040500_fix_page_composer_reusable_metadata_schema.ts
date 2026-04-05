import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

const SOURCE_TABLES = [
  'pages_blocks_service_grid',
  '_pages_v_blocks_service_grid',
  'pages_blocks_cta',
  '_pages_v_blocks_cta',
  'pages_blocks_content',
  '_pages_v_blocks_content',
  'pages_blocks_media_block',
  '_pages_v_blocks_media_block',
  'pages_blocks_testimonials_block',
  '_pages_v_blocks_testimonials_block',
] as const

const FULL_METADATA_TABLES = [
  'pages_blocks_media_block',
  '_pages_v_blocks_media_block',
  'pages_blocks_testimonials_block',
  '_pages_v_blocks_testimonials_block',
] as const

function addColumnStatements(): string {
  const statements: string[] = [
    `DO $$ BEGIN
  CREATE TYPE "public"."cmp_reuse_src_type" AS ENUM('preset', 'shared-section');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
    `DO $$ BEGIN
  CREATE TYPE "public"."cmp_reuse_mode" AS ENUM('linked', 'detached');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  ]

  for (const table of SOURCE_TABLES) {
    statements.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "composer_reusable_source_type" "public"."cmp_reuse_src_type";`)
    statements.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "composer_reusable_shared_section_id" integer;`)
    statements.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "composer_reusable_synced_version" integer;`)
  }

  for (const table of FULL_METADATA_TABLES) {
    statements.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "composer_reusable_mode" "public"."cmp_reuse_mode";`)
    statements.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "composer_reusable_key" varchar;`)
    statements.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "composer_reusable_label" varchar;`)
  }

  return statements.join('\n')
}

function dropColumnStatements(): string {
  const statements: string[] = []

  for (const table of SOURCE_TABLES) {
    statements.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "composer_reusable_source_type";`)
    statements.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "composer_reusable_shared_section_id";`)
    statements.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "composer_reusable_synced_version";`)
  }

  for (const table of FULL_METADATA_TABLES) {
    statements.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "composer_reusable_mode";`)
    statements.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "composer_reusable_key";`)
    statements.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "composer_reusable_label";`)
  }

  statements.push(`DROP TYPE IF EXISTS "public"."cmp_reuse_src_type";`)
  statements.push(`DROP TYPE IF EXISTS "public"."cmp_reuse_mode";`)

  return statements.join('\n')
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(addColumnStatements()))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(dropColumnStatements()))
}
