import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_billing_mode" AS ENUM('autopay_subscription', 'send_invoice_terms', 'send_invoice_due_on_receipt', 'manual_internal');
  CREATE TYPE "public"."enum_accounts_billing_rollup_mode" AS ENUM('per_service', 'monthly_consolidated', 'subscription');
  CREATE TYPE "public"."enum_accounts_portal_access_mode" AS ENUM('none', 'stripe_only', 'app_and_stripe');
  CREATE TYPE "public"."enum_billing_events_event_type" AS ENUM('invoice_synced', 'invoice_sent', 'invoice_viewed', 'invoice_paid', 'invoice_overdue', 'payment_recorded', 'discount_applied', 'credit_issued', 'refund_issued', 'write_off_applied', 'portal_session_created', 'webhook_received', 'subscription_synced');
  CREATE TYPE "public"."enum_billing_events_source_system" AS ENUM('stripe', 'internal');
  CREATE TYPE "public"."enum_billing_events_payment_source" AS ENUM('stripe', 'onsite', 'check', 'cash', 'bank_transfer', 'other');
  CREATE TYPE "public"."enum_invoices_payment_collection_method" AS ENUM('charge_automatically', 'send_invoice');
  CREATE TYPE "public"."enum_invoices_delivery_status" AS ENUM('draft', 'queued', 'sent', 'viewed', 'failed');
  CREATE TYPE "public"."enum_invoices_payment_source" AS ENUM('stripe', 'onsite', 'check', 'cash', 'bank_transfer', 'other');
  CREATE TYPE "public"."enum_service_plans_billing_mode" AS ENUM('autopay_subscription', 'subscription_send_invoice', 'monthly_consolidated', 'per_service_invoice');
  CREATE TYPE "public"."enum_service_plans_collection_method" AS ENUM('charge_automatically', 'send_invoice');
  CREATE TYPE "public"."enum_service_appointments_billable_status" AS ENUM('not_billable', 'ready_to_bill', 'billed', 'paid_onsite');
  ALTER TYPE "public"."enum_invoices_status" ADD VALUE 'partially_paid' BEFORE 'overdue';
  ALTER TYPE "public"."enum_invoices_status" ADD VALUE 'refunded' BEFORE 'void';
  ALTER TYPE "public"."enum_invoices_status" ADD VALUE 'uncollectible' BEFORE 'void';
  CREATE TABLE "billing_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_label" varchar NOT NULL,
  	"event_type" "enum_billing_events_event_type" NOT NULL,
  	"source_system" "enum_billing_events_source_system" DEFAULT 'internal' NOT NULL,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"account_id" integer,
  	"invoice_id" integer,
  	"service_plan_id" integer,
  	"service_appointment_id" integer,
  	"customer_user_id" integer,
  	"actor_id" integer,
  	"payment_source" "enum_billing_events_payment_source",
  	"amount" numeric,
  	"currency" varchar DEFAULT 'usd',
  	"payment_reference" varchar,
  	"stripe_event_i_d" varchar,
  	"stripe_object_i_d" varchar,
  	"processed_at" timestamp(3) with time zone,
  	"reason" varchar,
  	"notes" varchar,
  	"payload_snapshot" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "accounts" ADD COLUMN "billing_mode" "enum_accounts_billing_mode" DEFAULT 'send_invoice_due_on_receipt';
  ALTER TABLE "accounts" ADD COLUMN "billing_rollup_mode" "enum_accounts_billing_rollup_mode" DEFAULT 'per_service';
  ALTER TABLE "accounts" ADD COLUMN "portal_access_mode" "enum_accounts_portal_access_mode" DEFAULT 'app_and_stripe';
  ALTER TABLE "accounts" ADD COLUMN "billing_terms_days" numeric DEFAULT 0;
  ALTER TABLE "accounts" ADD COLUMN "stripe_customer_i_d" varchar;
  ALTER TABLE "accounts" ADD COLUMN "stripe_default_payment_method_i_d" varchar;
  ALTER TABLE "accounts" ADD COLUMN "billing_portal_last_shared_at" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "payment_collection_method" "enum_invoices_payment_collection_method" DEFAULT 'send_invoice';
  ALTER TABLE "invoices" ADD COLUMN "delivery_status" "enum_invoices_delivery_status" DEFAULT 'draft';
  ALTER TABLE "invoices" ADD COLUMN "payment_source" "enum_invoices_payment_source";
  ALTER TABLE "invoices" ADD COLUMN "billing_period_start" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "billing_period_end" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "paid_at" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "discount_amount" numeric DEFAULT 0;
  ALTER TABLE "invoices" ADD COLUMN "credit_amount" numeric DEFAULT 0;
  ALTER TABLE "invoices" ADD COLUMN "refunded_amount" numeric DEFAULT 0;
  ALTER TABLE "invoices" ADD COLUMN "write_off_amount" numeric DEFAULT 0;
  ALTER TABLE "invoices" ADD COLUMN "paid_out_of_band" boolean DEFAULT false;
  ALTER TABLE "invoices" ADD COLUMN "stripe_customer_i_d" varchar;
  ALTER TABLE "invoices" ADD COLUMN "stripe_invoice_i_d" varchar;
  ALTER TABLE "invoices" ADD COLUMN "stripe_invoice_status" varchar;
  ALTER TABLE "invoices" ADD COLUMN "stripe_hosted_invoice_u_r_l" varchar;
  ALTER TABLE "invoices" ADD COLUMN "stripe_payment_intent_i_d" varchar;
  ALTER TABLE "invoices" ADD COLUMN "last_stripe_event_i_d" varchar;
  ALTER TABLE "invoices" ADD COLUMN "last_stripe_sync_at" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "payment_reference" varchar;
  ALTER TABLE "invoices" ADD COLUMN "adjustment_reason" varchar;
  ALTER TABLE "service_plans" ADD COLUMN "billing_mode" "enum_service_plans_billing_mode" DEFAULT 'autopay_subscription';
  ALTER TABLE "service_plans" ADD COLUMN "collection_method" "enum_service_plans_collection_method" DEFAULT 'charge_automatically';
  ALTER TABLE "service_plans" ADD COLUMN "billing_terms_days" numeric DEFAULT 0;
  ALTER TABLE "service_plans" ADD COLUMN "auto_renew" boolean DEFAULT true;
  ALTER TABLE "service_plans" ADD COLUMN "payment_method_required" boolean DEFAULT true;
  ALTER TABLE "service_plans" ADD COLUMN "stripe_customer_i_d" varchar;
  ALTER TABLE "service_plans" ADD COLUMN "stripe_subscription_i_d" varchar;
  ALTER TABLE "service_plans" ADD COLUMN "stripe_subscription_status" varchar;
  ALTER TABLE "service_plans" ADD COLUMN "current_period_start" timestamp(3) with time zone;
  ALTER TABLE "service_plans" ADD COLUMN "current_period_end" timestamp(3) with time zone;
  ALTER TABLE "service_plans" ADD COLUMN "next_invoice_at" timestamp(3) with time zone;
  ALTER TABLE "service_appointments" ADD COLUMN "billable_status" "enum_service_appointments_billable_status" DEFAULT 'ready_to_bill';
  ALTER TABLE "service_appointments" ADD COLUMN "billable_amount" numeric;
  ALTER TABLE "service_appointments" ADD COLUMN "billing_batch_key" varchar;
  ALTER TABLE "service_appointments" ADD COLUMN "invoice_id" integer;
  ALTER TABLE "service_appointments" ADD COLUMN "completed_at" timestamp(3) with time zone;
  ALTER TABLE "service_appointments" ADD COLUMN "onsite_payment_captured" boolean DEFAULT false;
  ALTER TABLE "service_appointments" ADD COLUMN "onsite_payment_amount" numeric;
  ALTER TABLE "service_appointments" ADD COLUMN "onsite_payment_reference" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "billing_events_id" integer;
  ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_service_plan_id_service_plans_id_fk" FOREIGN KEY ("service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_service_appointment_id_service_appointments_id_fk" FOREIGN KEY ("service_appointment_id") REFERENCES "public"."service_appointments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "billing_events_account_idx" ON "billing_events" USING btree ("account_id");
  CREATE INDEX "billing_events_invoice_idx" ON "billing_events" USING btree ("invoice_id");
  CREATE INDEX "billing_events_service_plan_idx" ON "billing_events" USING btree ("service_plan_id");
  CREATE INDEX "billing_events_service_appointment_idx" ON "billing_events" USING btree ("service_appointment_id");
  CREATE INDEX "billing_events_customer_user_idx" ON "billing_events" USING btree ("customer_user_id");
  CREATE INDEX "billing_events_actor_idx" ON "billing_events" USING btree ("actor_id");
  CREATE UNIQUE INDEX "billing_events_stripe_event_i_d_idx" ON "billing_events" USING btree ("stripe_event_i_d");
  CREATE INDEX "billing_events_updated_at_idx" ON "billing_events" USING btree ("updated_at");
  CREATE INDEX "billing_events_created_at_idx" ON "billing_events" USING btree ("created_at");
  ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_billing_events_fk" FOREIGN KEY ("billing_events_id") REFERENCES "public"."billing_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "service_appointments_invoice_idx" ON "service_appointments" USING btree ("invoice_id");
  CREATE INDEX "payload_locked_documents_rels_billing_events_id_idx" ON "payload_locked_documents_rels" USING btree ("billing_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "billing_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "billing_events" CASCADE;
  ALTER TABLE "service_appointments" DROP CONSTRAINT "service_appointments_invoice_id_invoices_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_billing_events_fk";
  
  ALTER TABLE "invoices" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'open'::text;
  DROP TYPE "public"."enum_invoices_status";
  CREATE TYPE "public"."enum_invoices_status" AS ENUM('draft', 'open', 'paid', 'overdue', 'void');
  ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."enum_invoices_status";
  ALTER TABLE "invoices" ALTER COLUMN "status" SET DATA TYPE "public"."enum_invoices_status" USING "status"::"public"."enum_invoices_status";
  DROP INDEX "service_appointments_invoice_idx";
  DROP INDEX "payload_locked_documents_rels_billing_events_id_idx";
  ALTER TABLE "accounts" DROP COLUMN "billing_mode";
  ALTER TABLE "accounts" DROP COLUMN "billing_rollup_mode";
  ALTER TABLE "accounts" DROP COLUMN "portal_access_mode";
  ALTER TABLE "accounts" DROP COLUMN "billing_terms_days";
  ALTER TABLE "accounts" DROP COLUMN "stripe_customer_i_d";
  ALTER TABLE "accounts" DROP COLUMN "stripe_default_payment_method_i_d";
  ALTER TABLE "accounts" DROP COLUMN "billing_portal_last_shared_at";
  ALTER TABLE "invoices" DROP COLUMN "payment_collection_method";
  ALTER TABLE "invoices" DROP COLUMN "delivery_status";
  ALTER TABLE "invoices" DROP COLUMN "payment_source";
  ALTER TABLE "invoices" DROP COLUMN "billing_period_start";
  ALTER TABLE "invoices" DROP COLUMN "billing_period_end";
  ALTER TABLE "invoices" DROP COLUMN "paid_at";
  ALTER TABLE "invoices" DROP COLUMN "discount_amount";
  ALTER TABLE "invoices" DROP COLUMN "credit_amount";
  ALTER TABLE "invoices" DROP COLUMN "refunded_amount";
  ALTER TABLE "invoices" DROP COLUMN "write_off_amount";
  ALTER TABLE "invoices" DROP COLUMN "paid_out_of_band";
  ALTER TABLE "invoices" DROP COLUMN "stripe_customer_i_d";
  ALTER TABLE "invoices" DROP COLUMN "stripe_invoice_i_d";
  ALTER TABLE "invoices" DROP COLUMN "stripe_invoice_status";
  ALTER TABLE "invoices" DROP COLUMN "stripe_hosted_invoice_u_r_l";
  ALTER TABLE "invoices" DROP COLUMN "stripe_payment_intent_i_d";
  ALTER TABLE "invoices" DROP COLUMN "last_stripe_event_i_d";
  ALTER TABLE "invoices" DROP COLUMN "last_stripe_sync_at";
  ALTER TABLE "invoices" DROP COLUMN "payment_reference";
  ALTER TABLE "invoices" DROP COLUMN "adjustment_reason";
  ALTER TABLE "service_plans" DROP COLUMN "billing_mode";
  ALTER TABLE "service_plans" DROP COLUMN "collection_method";
  ALTER TABLE "service_plans" DROP COLUMN "billing_terms_days";
  ALTER TABLE "service_plans" DROP COLUMN "auto_renew";
  ALTER TABLE "service_plans" DROP COLUMN "payment_method_required";
  ALTER TABLE "service_plans" DROP COLUMN "stripe_customer_i_d";
  ALTER TABLE "service_plans" DROP COLUMN "stripe_subscription_i_d";
  ALTER TABLE "service_plans" DROP COLUMN "stripe_subscription_status";
  ALTER TABLE "service_plans" DROP COLUMN "current_period_start";
  ALTER TABLE "service_plans" DROP COLUMN "current_period_end";
  ALTER TABLE "service_plans" DROP COLUMN "next_invoice_at";
  ALTER TABLE "service_appointments" DROP COLUMN "billable_status";
  ALTER TABLE "service_appointments" DROP COLUMN "billable_amount";
  ALTER TABLE "service_appointments" DROP COLUMN "billing_batch_key";
  ALTER TABLE "service_appointments" DROP COLUMN "invoice_id";
  ALTER TABLE "service_appointments" DROP COLUMN "completed_at";
  ALTER TABLE "service_appointments" DROP COLUMN "onsite_payment_captured";
  ALTER TABLE "service_appointments" DROP COLUMN "onsite_payment_amount";
  ALTER TABLE "service_appointments" DROP COLUMN "onsite_payment_reference";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "billing_events_id";
  DROP TYPE "public"."enum_accounts_billing_mode";
  DROP TYPE "public"."enum_accounts_billing_rollup_mode";
  DROP TYPE "public"."enum_accounts_portal_access_mode";
  DROP TYPE "public"."enum_billing_events_event_type";
  DROP TYPE "public"."enum_billing_events_source_system";
  DROP TYPE "public"."enum_billing_events_payment_source";
  DROP TYPE "public"."enum_invoices_payment_collection_method";
  DROP TYPE "public"."enum_invoices_delivery_status";
  DROP TYPE "public"."enum_invoices_payment_source";
  DROP TYPE "public"."enum_service_plans_billing_mode";
  DROP TYPE "public"."enum_service_plans_collection_method";
  DROP TYPE "public"."enum_service_appointments_billable_status";`)
}
