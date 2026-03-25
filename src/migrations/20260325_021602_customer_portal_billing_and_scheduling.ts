import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_invoices_status" AS ENUM('draft', 'open', 'paid', 'overdue', 'void');
  CREATE TYPE "public"."enum_service_plans_status" AS ENUM('draft', 'active', 'paused', 'cancelled');
  CREATE TYPE "public"."enum_service_plans_preferred_window" AS ENUM('morning', 'afternoon', 'flexible');
  CREATE TYPE "public"."enum_service_appointments_status" AS ENUM('requested', 'confirmed', 'reschedule_requested', 'completed', 'cancelled');
  CREATE TYPE "public"."enum_service_appointments_arrival_window" AS ENUM('morning', 'afternoon', 'flexible');
  CREATE TYPE "public"."enum_service_appointments_request_source" AS ENUM('portal', 'admin', 'phone', 'subscription_auto');
  CREATE TYPE "public"."enum_service_plan_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__service_plan_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "invoices_line_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"description" varchar NOT NULL,
  	"amount" numeric NOT NULL
  );
  
  CREATE TABLE "invoices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"invoice_number" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_invoices_status" DEFAULT 'open' NOT NULL,
  	"issue_date" timestamp(3) with time zone,
  	"due_date" timestamp(3) with time zone,
  	"customer_user_id" integer,
  	"customer_email" varchar NOT NULL,
  	"customer_name" varchar,
  	"service_address_street1" varchar,
  	"service_address_street2" varchar,
  	"service_address_city" varchar,
  	"service_address_state" varchar DEFAULT 'TX',
  	"service_address_postal_code" varchar,
  	"total" numeric NOT NULL,
  	"balance_due" numeric NOT NULL,
  	"payment_url" varchar,
  	"related_quote_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_service_plans_status" DEFAULT 'active' NOT NULL,
  	"anchor_date" timestamp(3) with time zone,
  	"preferred_window" "enum_service_plans_preferred_window" DEFAULT 'flexible',
  	"customer_user_id" integer NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"customer_name" varchar,
  	"service_address_street1" varchar,
  	"service_address_street2" varchar,
  	"service_address_city" varchar,
  	"service_address_state" varchar DEFAULT 'TX',
  	"service_address_postal_code" varchar,
  	"source_quote_id" integer,
  	"service_summary" varchar,
  	"single_job_amount" numeric NOT NULL,
  	"discount_percent" numeric DEFAULT 20 NOT NULL,
  	"visits_per_year" numeric DEFAULT 2 NOT NULL,
  	"billing_installments_per_year" numeric DEFAULT 12 NOT NULL,
  	"discounted_visit_amount" numeric,
  	"annual_plan_amount" numeric,
  	"installment_amount" numeric,
  	"cadence_months" numeric,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_appointments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_service_appointments_status" DEFAULT 'requested' NOT NULL,
  	"arrival_window" "enum_service_appointments_arrival_window" DEFAULT 'flexible',
  	"request_source" "enum_service_appointments_request_source" DEFAULT 'portal',
  	"customer_user_id" integer NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"customer_name" varchar,
  	"service_address_street1" varchar,
  	"service_address_street2" varchar,
  	"service_address_city" varchar,
  	"service_address_state" varchar DEFAULT 'TX',
  	"service_address_postal_code" varchar,
  	"requested_date" timestamp(3) with time zone,
  	"scheduled_start" timestamp(3) with time zone,
  	"scheduled_end" timestamp(3) with time zone,
  	"related_quote_id" integer,
  	"service_plan_id" integer,
  	"customer_notes" varchar,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_plan_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"minimum_visits_per_year" numeric DEFAULT 2,
  	"discount_percent_off_single_job" numeric DEFAULT 20,
  	"billing_installments_per_year" numeric DEFAULT 12,
  	"default_cadence_months" numeric DEFAULT 6,
  	"customer_summary" varchar DEFAULT 'Recurring plans default to two visits per year at a 20% discount from normal one-off pricing, billed in equal installments across the year.',
  	"_status" "enum_service_plan_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_service_plan_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_minimum_visits_per_year" numeric DEFAULT 2,
  	"version_discount_percent_off_single_job" numeric DEFAULT 20,
  	"version_billing_installments_per_year" numeric DEFAULT 12,
  	"version_default_cadence_months" numeric DEFAULT 6,
  	"version_customer_summary" varchar DEFAULT 'Recurring plans default to two visits per year at a 20% discount from normal one-off pricing, billed in equal installments across the year.',
  	"version__status" "enum__service_plan_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "quotes" ADD COLUMN "customer_user_id" integer;
  ALTER TABLE "users" ADD COLUMN "phone" varchar;
  ALTER TABLE "users" ADD COLUMN "company" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_address_street1" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_address_street2" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_address_city" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_address_state" varchar DEFAULT 'TX';
  ALTER TABLE "users" ADD COLUMN "billing_address_postal_code" varchar;
  ALTER TABLE "users" ADD COLUMN "service_address_street1" varchar;
  ALTER TABLE "users" ADD COLUMN "service_address_street2" varchar;
  ALTER TABLE "users" ADD COLUMN "service_address_city" varchar;
  ALTER TABLE "users" ADD COLUMN "service_address_state" varchar DEFAULT 'TX';
  ALTER TABLE "users" ADD COLUMN "service_address_postal_code" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoices_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "service_plans_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "service_appointments_id" integer;
  ALTER TABLE "invoices_line_items" ADD CONSTRAINT "invoices_line_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_related_quote_id_quotes_id_fk" FOREIGN KEY ("related_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_source_quote_id_quotes_id_fk" FOREIGN KEY ("source_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_related_quote_id_quotes_id_fk" FOREIGN KEY ("related_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_service_plan_id_service_plans_id_fk" FOREIGN KEY ("service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "invoices_line_items_order_idx" ON "invoices_line_items" USING btree ("_order");
  CREATE INDEX "invoices_line_items_parent_id_idx" ON "invoices_line_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");
  CREATE INDEX "invoices_customer_user_idx" ON "invoices" USING btree ("customer_user_id");
  CREATE INDEX "invoices_related_quote_idx" ON "invoices" USING btree ("related_quote_id");
  CREATE INDEX "invoices_updated_at_idx" ON "invoices" USING btree ("updated_at");
  CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");
  CREATE INDEX "service_plans_customer_user_idx" ON "service_plans" USING btree ("customer_user_id");
  CREATE INDEX "service_plans_source_quote_idx" ON "service_plans" USING btree ("source_quote_id");
  CREATE INDEX "service_plans_updated_at_idx" ON "service_plans" USING btree ("updated_at");
  CREATE INDEX "service_plans_created_at_idx" ON "service_plans" USING btree ("created_at");
  CREATE INDEX "service_appointments_customer_user_idx" ON "service_appointments" USING btree ("customer_user_id");
  CREATE INDEX "service_appointments_related_quote_idx" ON "service_appointments" USING btree ("related_quote_id");
  CREATE INDEX "service_appointments_service_plan_idx" ON "service_appointments" USING btree ("service_plan_id");
  CREATE INDEX "service_appointments_updated_at_idx" ON "service_appointments" USING btree ("updated_at");
  CREATE INDEX "service_appointments_created_at_idx" ON "service_appointments" USING btree ("created_at");
  CREATE INDEX "service_plan_settings__status_idx" ON "service_plan_settings" USING btree ("_status");
  CREATE INDEX "_service_plan_settings_v_version_version__status_idx" ON "_service_plan_settings_v" USING btree ("version__status");
  CREATE INDEX "_service_plan_settings_v_created_at_idx" ON "_service_plan_settings_v" USING btree ("created_at");
  CREATE INDEX "_service_plan_settings_v_updated_at_idx" ON "_service_plan_settings_v" USING btree ("updated_at");
  CREATE INDEX "_service_plan_settings_v_latest_idx" ON "_service_plan_settings_v" USING btree ("latest");
  CREATE INDEX "_service_plan_settings_v_autosave_idx" ON "_service_plan_settings_v" USING btree ("autosave");
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoices_fk" FOREIGN KEY ("invoices_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_plans_fk" FOREIGN KEY ("service_plans_id") REFERENCES "public"."service_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_appointments_fk" FOREIGN KEY ("service_appointments_id") REFERENCES "public"."service_appointments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "quotes_customer_user_idx" ON "quotes" USING btree ("customer_user_id");
  CREATE INDEX "payload_locked_documents_rels_invoices_id_idx" ON "payload_locked_documents_rels" USING btree ("invoices_id");
  CREATE INDEX "payload_locked_documents_rels_service_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("service_plans_id");
  CREATE INDEX "payload_locked_documents_rels_service_appointments_id_idx" ON "payload_locked_documents_rels" USING btree ("service_appointments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "invoices_line_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "invoices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_appointments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_plan_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_service_plan_settings_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "invoices_line_items" CASCADE;
  DROP TABLE "invoices" CASCADE;
  DROP TABLE "service_plans" CASCADE;
  DROP TABLE "service_appointments" CASCADE;
  DROP TABLE "service_plan_settings" CASCADE;
  DROP TABLE "_service_plan_settings_v" CASCADE;
  ALTER TABLE "quotes" DROP CONSTRAINT "quotes_customer_user_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_invoices_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_service_plans_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_service_appointments_fk";
  
  DROP INDEX "quotes_customer_user_idx";
  DROP INDEX "payload_locked_documents_rels_invoices_id_idx";
  DROP INDEX "payload_locked_documents_rels_service_plans_id_idx";
  DROP INDEX "payload_locked_documents_rels_service_appointments_id_idx";
  ALTER TABLE "quotes" DROP COLUMN "customer_user_id";
  ALTER TABLE "users" DROP COLUMN "phone";
  ALTER TABLE "users" DROP COLUMN "company";
  ALTER TABLE "users" DROP COLUMN "billing_address_street1";
  ALTER TABLE "users" DROP COLUMN "billing_address_street2";
  ALTER TABLE "users" DROP COLUMN "billing_address_city";
  ALTER TABLE "users" DROP COLUMN "billing_address_state";
  ALTER TABLE "users" DROP COLUMN "billing_address_postal_code";
  ALTER TABLE "users" DROP COLUMN "service_address_street1";
  ALTER TABLE "users" DROP COLUMN "service_address_street2";
  ALTER TABLE "users" DROP COLUMN "service_address_city";
  ALTER TABLE "users" DROP COLUMN "service_address_state";
  ALTER TABLE "users" DROP COLUMN "service_address_postal_code";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoices_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "service_plans_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "service_appointments_id";
  DROP TYPE "public"."enum_invoices_status";
  DROP TYPE "public"."enum_service_plans_status";
  DROP TYPE "public"."enum_service_plans_preferred_window";
  DROP TYPE "public"."enum_service_appointments_status";
  DROP TYPE "public"."enum_service_appointments_arrival_window";
  DROP TYPE "public"."enum_service_appointments_request_source";
  DROP TYPE "public"."enum_service_plan_settings_status";
  DROP TYPE "public"."enum__service_plan_settings_v_version_status";`)
}
