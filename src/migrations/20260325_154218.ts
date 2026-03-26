import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_billing_terms" AS ENUM('due_on_receipt', 'net_15', 'net_30', 'custom');
  CREATE TYPE "public"."enum_crm_sequences_steps_step_type" AS ENUM('wait', 'send_email', 'create_task', 'finish');
  CREATE TYPE "public"."enum_crm_sequences_steps_delay_unit" AS ENUM('minutes', 'hours', 'days', 'weeks');
  CREATE TYPE "public"."enum_crm_sequences_steps_task_type" AS ENUM('call', 'email', 'text', 'quote_follow_up', 'billing_follow_up', 'scheduling', 'general');
  CREATE TYPE "public"."enum_crm_sequences_steps_task_priority" AS ENUM('low', 'medium', 'high', 'urgent');
  CREATE TYPE "public"."enum_crm_sequences_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_crm_sequences_audience" AS ENUM('lead', 'opportunity', 'customer', 'billing');
  CREATE TYPE "public"."enum_crm_sequences_trigger" AS ENUM('manual', 'lead_created', 'quote_sent', 'quote_accepted', 'appointment_booked', 'invoice_issued', 'invoice_overdue', 'job_completed');
  CREATE TABLE "crm_sequences_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step_type" "enum_crm_sequences_steps_step_type" DEFAULT 'wait' NOT NULL,
  	"delay_amount" numeric DEFAULT 0,
  	"delay_unit" "enum_crm_sequences_steps_delay_unit" DEFAULT 'days',
  	"email_template_key" varchar,
  	"email_subject" varchar,
  	"task_title" varchar,
  	"task_type" "enum_crm_sequences_steps_task_type",
  	"task_priority" "enum_crm_sequences_steps_task_priority" DEFAULT 'medium',
  	"internal_notes" varchar
  );
  
  CREATE TABLE "crm_sequences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"status" "enum_crm_sequences_status" DEFAULT 'draft' NOT NULL,
  	"owner_id" integer,
  	"audience" "enum_crm_sequences_audience" DEFAULT 'lead' NOT NULL,
  	"trigger" "enum_crm_sequences_trigger" DEFAULT 'manual' NOT NULL,
  	"settings_business_days_only" boolean DEFAULT true,
  	"settings_stop_on_reply" boolean DEFAULT true,
  	"settings_stop_on_booking" boolean DEFAULT true,
  	"settings_stop_on_payment" boolean DEFAULT true,
  	"settings_send_window_start_hour" numeric DEFAULT 8,
  	"settings_send_window_end_hour" numeric DEFAULT 18,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "accounts" ADD COLUMN "legal_name" varchar;
  ALTER TABLE "accounts" ADD COLUMN "accounts_payable_email" varchar;
  ALTER TABLE "accounts" ADD COLUMN "accounts_payable_phone" varchar;
  ALTER TABLE "accounts" ADD COLUMN "billing_terms" "enum_accounts_billing_terms" DEFAULT 'due_on_receipt';
  ALTER TABLE "accounts" ADD COLUMN "location_count" numeric DEFAULT 1;
  ALTER TABLE "accounts" ADD COLUMN "tax_exempt" boolean DEFAULT false;
  ALTER TABLE "accounts" ADD COLUMN "tax_exemption_reference" varchar;
  ALTER TABLE "accounts" ADD COLUMN "service_location_summary" varchar;
  ALTER TABLE "sequence_enrollments" ADD COLUMN "sequence_definition_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "crm_sequences_id" integer;
  ALTER TABLE "crm_sequences_steps" ADD CONSTRAINT "crm_sequences_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."crm_sequences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "crm_sequences" ADD CONSTRAINT "crm_sequences_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "crm_sequences_steps_order_idx" ON "crm_sequences_steps" USING btree ("_order");
  CREATE INDEX "crm_sequences_steps_parent_id_idx" ON "crm_sequences_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "crm_sequences_key_idx" ON "crm_sequences" USING btree ("key");
  CREATE INDEX "crm_sequences_owner_idx" ON "crm_sequences" USING btree ("owner_id");
  CREATE INDEX "crm_sequences_updated_at_idx" ON "crm_sequences" USING btree ("updated_at");
  CREATE INDEX "crm_sequences_created_at_idx" ON "crm_sequences" USING btree ("created_at");
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sequence_definition_id_crm_sequences_id_fk" FOREIGN KEY ("sequence_definition_id") REFERENCES "public"."crm_sequences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_crm_sequences_fk" FOREIGN KEY ("crm_sequences_id") REFERENCES "public"."crm_sequences"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sequence_enrollments_sequence_definition_idx" ON "sequence_enrollments" USING btree ("sequence_definition_id");
  CREATE INDEX "payload_locked_documents_rels_crm_sequences_id_idx" ON "payload_locked_documents_rels" USING btree ("crm_sequences_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "crm_sequences_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "crm_sequences" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "crm_sequences_steps" CASCADE;
  DROP TABLE "crm_sequences" CASCADE;
  ALTER TABLE "sequence_enrollments" DROP CONSTRAINT "sequence_enrollments_sequence_definition_id_crm_sequences_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_crm_sequences_fk";
  
  DROP INDEX "sequence_enrollments_sequence_definition_idx";
  DROP INDEX "payload_locked_documents_rels_crm_sequences_id_idx";
  ALTER TABLE "accounts" DROP COLUMN "legal_name";
  ALTER TABLE "accounts" DROP COLUMN "accounts_payable_email";
  ALTER TABLE "accounts" DROP COLUMN "accounts_payable_phone";
  ALTER TABLE "accounts" DROP COLUMN "billing_terms";
  ALTER TABLE "accounts" DROP COLUMN "location_count";
  ALTER TABLE "accounts" DROP COLUMN "tax_exempt";
  ALTER TABLE "accounts" DROP COLUMN "tax_exemption_reference";
  ALTER TABLE "accounts" DROP COLUMN "service_location_summary";
  ALTER TABLE "sequence_enrollments" DROP COLUMN "sequence_definition_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "crm_sequences_id";
  DROP TYPE "public"."enum_accounts_billing_terms";
  DROP TYPE "public"."enum_crm_sequences_steps_step_type";
  DROP TYPE "public"."enum_crm_sequences_steps_delay_unit";
  DROP TYPE "public"."enum_crm_sequences_steps_task_type";
  DROP TYPE "public"."enum_crm_sequences_steps_task_priority";
  DROP TYPE "public"."enum_crm_sequences_status";
  DROP TYPE "public"."enum_crm_sequences_audience";
  DROP TYPE "public"."enum_crm_sequences_trigger";`)
}
