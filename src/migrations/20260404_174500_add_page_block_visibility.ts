import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const pageBlockTables = [
  'pages_blocks_service_grid',
  'pages_blocks_pricing_table',
  'pages_blocks_cta',
  'pages_blocks_content',
  'pages_blocks_media_block',
  'pages_blocks_archive',
  'pages_blocks_form_block',
  'pages_blocks_contact_request',
  'pages_blocks_testimonials_block',
] as const

const pageBlockVersionTables = [
  '_pages_v_blocks_service_grid',
  '_pages_v_blocks_pricing_table',
  '_pages_v_blocks_cta',
  '_pages_v_blocks_content',
  '_pages_v_blocks_media_block',
  '_pages_v_blocks_archive',
  '_pages_v_blocks_form_block',
  '_pages_v_blocks_contact_request',
  '_pages_v_blocks_testimonials_block',
] as const

function addIsHiddenColumn(tableName: string) {
  return sql.raw(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "is_hidden" boolean DEFAULT false;`)
}

function dropIsHiddenColumn(tableName: string) {
  return sql.raw(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "is_hidden";`)
}

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.join([...pageBlockTables, ...pageBlockVersionTables].map(addIsHiddenColumn), sql.raw('\n')))
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.join([...pageBlockVersionTables, ...pageBlockTables].map(dropIsHiddenColumn), sql.raw('\n')))
}
