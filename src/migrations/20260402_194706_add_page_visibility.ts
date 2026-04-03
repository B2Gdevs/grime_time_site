import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_type.typname = 'enum_pages_visibility'
        AND pg_namespace.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum_pages_visibility" AS ENUM('public', 'private');
    END IF;
  END $$;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_type.typname = 'enum__pages_v_version_visibility'
        AND pg_namespace.nspname = 'public'
    ) THEN
      CREATE TYPE "public"."enum__pages_v_version_visibility" AS ENUM('public', 'private');
    END IF;
  END $$;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "visibility" "enum_pages_visibility" DEFAULT 'public';
  ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_visibility" "enum__pages_v_version_visibility" DEFAULT 'public';`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN IF EXISTS "visibility";
  ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_visibility";
  DROP TYPE IF EXISTS "public"."enum_pages_visibility";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_visibility";`)
}
