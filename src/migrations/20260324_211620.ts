import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "internal_ops_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"annual_revenue_goal" numeric DEFAULT 250000,
  	"projected_revenue_display" varchar DEFAULT '$13.6k',
  	"mrr_target_display" varchar DEFAULT '$1.8k',
  	"chart_disclaimer" varchar DEFAULT 'Illustrative sample trend for layout only — connect real accounting or CRM data in a later phase.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "internal_ops_settings" CASCADE;`)
}
