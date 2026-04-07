import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

function addColumnStatements(): string {
  return [
    `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_eyebrow" varchar;`,
    `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_headline_primary" varchar;`,
    `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_headline_accent" varchar;`,
    `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_panel_eyebrow" varchar;`,
    `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_panel_heading" varchar;`,
    `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_panel_body" text;`,
    `ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_eyebrow" varchar;`,
    `ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_headline_primary" varchar;`,
    `ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_headline_accent" varchar;`,
    `ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_panel_eyebrow" varchar;`,
    `ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_panel_heading" varchar;`,
    `ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_panel_body" text;`,
  ].join('\n')
}

function dropColumnStatements(): string {
  return [
    `ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_hero_panel_body";`,
    `ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_hero_panel_heading";`,
    `ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_hero_panel_eyebrow";`,
    `ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_hero_headline_accent";`,
    `ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_hero_headline_primary";`,
    `ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_hero_eyebrow";`,
    `ALTER TABLE "pages" DROP COLUMN IF EXISTS "hero_panel_body";`,
    `ALTER TABLE "pages" DROP COLUMN IF EXISTS "hero_panel_heading";`,
    `ALTER TABLE "pages" DROP COLUMN IF EXISTS "hero_panel_eyebrow";`,
    `ALTER TABLE "pages" DROP COLUMN IF EXISTS "hero_headline_accent";`,
    `ALTER TABLE "pages" DROP COLUMN IF EXISTS "hero_headline_primary";`,
    `ALTER TABLE "pages" DROP COLUMN IF EXISTS "hero_eyebrow";`,
  ].join('\n')
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(addColumnStatements()))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(dropColumnStatements()))
}
