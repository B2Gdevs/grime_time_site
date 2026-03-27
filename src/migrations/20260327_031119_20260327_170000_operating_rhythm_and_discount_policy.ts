import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_billing_discount_type" AS ENUM('none', 'percent', 'flat_amount');
  CREATE TYPE "public"."enum_accounts_default_discount_type" AS ENUM('none', 'percent', 'flat_amount');
  CREATE TYPE "public"."enum_crm_tasks_role_tags" AS ENUM('field-tech', 'lead-followup', 'scheduler', 'billing-followup', 'ops-admin');
  CREATE TYPE "public"."enum_crm_tasks_source_type" AS ENUM('lead', 'quote', 'appointment', 'invoice', 'sequence', 'support', 'manual');
  CREATE TYPE "public"."enum_crm_tasks_sla_class" AS ENUM('new_lead', 'quote_follow_up', 'scheduling', 'billing_support', 'refund_request', 'policy_privacy', 'general_support', 'invoice_overdue', 'sequence_task', 'manual_follow_up');
  CREATE TABLE "crm_tasks_role_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_crm_tasks_role_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  ALTER TABLE "users" ADD COLUMN "billing_discount_type" "enum_users_billing_discount_type" DEFAULT 'none';
  ALTER TABLE "users" ADD COLUMN "billing_discount_value" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "billing_discount_note" varchar;
  ALTER TABLE "accounts" ADD COLUMN "default_discount_type" "enum_accounts_default_discount_type" DEFAULT 'none';
  ALTER TABLE "accounts" ADD COLUMN "default_discount_value" numeric DEFAULT 0;
  ALTER TABLE "accounts" ADD COLUMN "default_discount_note" varchar;
  ALTER TABLE "crm_tasks" ADD COLUMN "source_type" "enum_crm_tasks_source_type" DEFAULT 'manual';
  ALTER TABLE "crm_tasks" ADD COLUMN "sla_class" "enum_crm_tasks_sla_class";
  ALTER TABLE "crm_tasks" ADD COLUMN "next_action" varchar;
  ALTER TABLE "crm_tasks" ADD COLUMN "sla_target_at" timestamp(3) with time zone;
  ALTER TABLE "crm_tasks" ADD COLUMN "escalates_at" timestamp(3) with time zone;
  ALTER TABLE "crm_tasks_role_tags" ADD CONSTRAINT "crm_tasks_role_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."crm_tasks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "crm_tasks_role_tags_order_idx" ON "crm_tasks_role_tags" USING btree ("order");
  CREATE INDEX "crm_tasks_role_tags_parent_idx" ON "crm_tasks_role_tags" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "crm_tasks_role_tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "crm_tasks_role_tags" CASCADE;
  ALTER TABLE "users" DROP COLUMN "billing_discount_type";
  ALTER TABLE "users" DROP COLUMN "billing_discount_value";
  ALTER TABLE "users" DROP COLUMN "billing_discount_note";
  ALTER TABLE "accounts" DROP COLUMN "default_discount_type";
  ALTER TABLE "accounts" DROP COLUMN "default_discount_value";
  ALTER TABLE "accounts" DROP COLUMN "default_discount_note";
  ALTER TABLE "crm_tasks" DROP COLUMN "source_type";
  ALTER TABLE "crm_tasks" DROP COLUMN "sla_class";
  ALTER TABLE "crm_tasks" DROP COLUMN "next_action";
  ALTER TABLE "crm_tasks" DROP COLUMN "sla_target_at";
  ALTER TABLE "crm_tasks" DROP COLUMN "escalates_at";
  DROP TYPE "public"."enum_users_billing_discount_type";
  DROP TYPE "public"."enum_accounts_default_discount_type";
  DROP TYPE "public"."enum_crm_tasks_role_tags";
  DROP TYPE "public"."enum_crm_tasks_source_type";
  DROP TYPE "public"."enum_crm_tasks_sla_class";`)
}
