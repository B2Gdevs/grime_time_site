import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_status" AS ENUM('prospect', 'active', 'inactive', 'archived');
  CREATE TYPE "public"."enum_accounts_account_type" AS ENUM('residential', 'commercial', 'hoa_multifamily', 'municipal', 'other');
  CREATE TYPE "public"."enum_contacts_roles" AS ENUM('primary', 'billing', 'onsite', 'decision_maker', 'other');
  CREATE TYPE "public"."enum_contacts_status" AS ENUM('active', 'unsubscribed', 'do_not_contact', 'inactive');
  CREATE TYPE "public"."enum_contacts_preferred_contact_method" AS ENUM('email', 'phone', 'text', 'any');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'working', 'qualified', 'disqualified', 'converted');
  CREATE TYPE "public"."enum_leads_priority" AS ENUM('low', 'medium', 'high', 'urgent');
  CREATE TYPE "public"."enum_leads_source" AS ENUM('instant_quote', 'contact_request', 'schedule_request', 'phone_call', 'referral', 'repeat_customer', 'manual');
  CREATE TYPE "public"."enum_leads_temperature" AS ENUM('cold', 'warm', 'hot');
  CREATE TYPE "public"."enum_opportunities_status" AS ENUM('open', 'won', 'lost');
  CREATE TYPE "public"."enum_opportunities_stage" AS ENUM('new_lead', 'qualified', 'quoted', 'follow_up', 'scheduling', 'won', 'lost');
  CREATE TYPE "public"."enum_opportunities_priority" AS ENUM('low', 'medium', 'high', 'urgent');
  CREATE TYPE "public"."enum_crm_activities_activity_type" AS ENUM('note', 'call', 'email', 'text', 'task_event', 'appointment', 'system');
  CREATE TYPE "public"."enum_crm_activities_direction" AS ENUM('inbound', 'outbound', 'internal', 'system');
  CREATE TYPE "public"."enum_crm_tasks_status" AS ENUM('open', 'in_progress', 'waiting', 'completed', 'canceled');
  CREATE TYPE "public"."enum_crm_tasks_priority" AS ENUM('low', 'medium', 'high', 'urgent');
  CREATE TYPE "public"."enum_crm_tasks_task_type" AS ENUM('call', 'email', 'text', 'quote_follow_up', 'billing_follow_up', 'scheduling', 'general');
  CREATE TYPE "public"."enum_sequence_enrollments_status" AS ENUM('queued', 'active', 'paused', 'completed', 'exited', 'failed');
  CREATE TABLE "accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"status" "enum_accounts_status" DEFAULT 'prospect' NOT NULL,
  	"account_type" "enum_accounts_account_type" DEFAULT 'residential' NOT NULL,
  	"owner_id" integer,
  	"primary_contact_id" integer,
  	"customer_user_id" integer,
  	"billing_email" varchar,
  	"service_address_street1" varchar,
  	"service_address_street2" varchar,
  	"service_address_city" varchar,
  	"service_address_state" varchar DEFAULT 'TX',
  	"service_address_postal_code" varchar,
  	"billing_address_street1" varchar,
  	"billing_address_street2" varchar,
  	"billing_address_city" varchar,
  	"billing_address_state" varchar DEFAULT 'TX',
  	"billing_address_postal_code" varchar,
  	"active_quote_id" integer,
  	"active_service_plan_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contacts_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_contacts_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "contacts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"owner_id" integer,
  	"status" "enum_contacts_status" DEFAULT 'active' NOT NULL,
  	"preferred_contact_method" "enum_contacts_preferred_contact_method" DEFAULT 'any',
  	"account_id" integer,
  	"linked_user_id" integer,
  	"last_contact_at" timestamp(3) with time zone,
  	"next_action_at" timestamp(3) with time zone,
  	"stale_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"priority" "enum_leads_priority" DEFAULT 'medium' NOT NULL,
  	"source" "enum_leads_source" DEFAULT 'manual' NOT NULL,
  	"temperature" "enum_leads_temperature" DEFAULT 'warm',
  	"customer_name" varchar NOT NULL,
  	"customer_email" varchar,
  	"customer_phone" varchar,
  	"owner_id" integer,
  	"next_action_at" timestamp(3) with time zone,
  	"stale_at" timestamp(3) with time zone,
  	"service_address_street1" varchar,
  	"service_address_street2" varchar,
  	"service_address_city" varchar,
  	"service_address_state" varchar DEFAULT 'TX',
  	"service_address_postal_code" varchar,
  	"service_summary" varchar,
  	"related_quote_id" integer,
  	"account_id" integer,
  	"contact_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "opportunities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_opportunities_status" DEFAULT 'open' NOT NULL,
  	"stage" "enum_opportunities_stage" DEFAULT 'new_lead' NOT NULL,
  	"priority" "enum_opportunities_priority" DEFAULT 'medium' NOT NULL,
  	"owner_id" integer,
  	"value" numeric,
  	"expected_close_date" timestamp(3) with time zone,
  	"last_activity_at" timestamp(3) with time zone,
  	"lead_id" integer,
  	"account_id" integer,
  	"contact_id" integer,
  	"quote_id" integer,
  	"next_action" varchar,
  	"next_action_at" timestamp(3) with time zone,
  	"close_reason" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "crm_activities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"activity_type" "enum_crm_activities_activity_type" DEFAULT 'note' NOT NULL,
  	"direction" "enum_crm_activities_direction" DEFAULT 'internal' NOT NULL,
  	"owner_id" integer,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"body" varchar,
  	"lead_id" integer,
  	"account_id" integer,
  	"contact_id" integer,
  	"opportunity_id" integer,
  	"related_task_id" integer,
  	"quote_id" integer,
  	"invoice_id" integer,
  	"service_plan_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "crm_tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_crm_tasks_status" DEFAULT 'open' NOT NULL,
  	"priority" "enum_crm_tasks_priority" DEFAULT 'medium' NOT NULL,
  	"task_type" "enum_crm_tasks_task_type" DEFAULT 'general' NOT NULL,
  	"owner_id" integer,
  	"due_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone,
  	"stale_at" timestamp(3) with time zone,
  	"lead_id" integer,
  	"account_id" integer,
  	"contact_id" integer,
  	"opportunity_id" integer,
  	"quote_id" integer,
  	"invoice_id" integer,
  	"service_plan_id" integer,
  	"service_appointment_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sequence_enrollments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"sequence_key" varchar NOT NULL,
  	"status" "enum_sequence_enrollments_status" DEFAULT 'queued' NOT NULL,
  	"step_index" numeric DEFAULT 0 NOT NULL,
  	"next_run_at" timestamp(3) with time zone,
  	"last_run_at" timestamp(3) with time zone,
  	"owner_id" integer,
  	"lead_id" integer,
  	"account_id" integer,
  	"contact_id" integer,
  	"opportunity_id" integer,
  	"last_error" varchar,
  	"exit_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "internal_ops_settings" ALTER COLUMN "chart_disclaimer" SET DEFAULT 'Illustrative sample trend for layout only. Connect real accounting and first-party CRM data in a later phase.';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "accounts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contacts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leads_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "opportunities_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "crm_activities_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "crm_tasks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sequence_enrollments_id" integer;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_primary_contact_id_contacts_id_fk" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_active_quote_id_quotes_id_fk" FOREIGN KEY ("active_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_active_service_plan_id_service_plans_id_fk" FOREIGN KEY ("active_service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contacts_roles" ADD CONSTRAINT "contacts_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_linked_user_id_users_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_related_quote_id_quotes_id_fk" FOREIGN KEY ("related_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_related_task_id_crm_tasks_id_fk" FOREIGN KEY ("related_task_id") REFERENCES "public"."crm_tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_service_plan_id_service_plans_id_fk" FOREIGN KEY ("service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_service_plan_id_service_plans_id_fk" FOREIGN KEY ("service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_service_appointment_id_service_appointments_id_fk" FOREIGN KEY ("service_appointment_id") REFERENCES "public"."service_appointments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "accounts_owner_idx" ON "accounts" USING btree ("owner_id");
  CREATE INDEX "accounts_primary_contact_idx" ON "accounts" USING btree ("primary_contact_id");
  CREATE INDEX "accounts_customer_user_idx" ON "accounts" USING btree ("customer_user_id");
  CREATE INDEX "accounts_active_quote_idx" ON "accounts" USING btree ("active_quote_id");
  CREATE INDEX "accounts_active_service_plan_idx" ON "accounts" USING btree ("active_service_plan_id");
  CREATE INDEX "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
  CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
  CREATE INDEX "contacts_roles_order_idx" ON "contacts_roles" USING btree ("order");
  CREATE INDEX "contacts_roles_parent_idx" ON "contacts_roles" USING btree ("parent_id");
  CREATE INDEX "contacts_owner_idx" ON "contacts" USING btree ("owner_id");
  CREATE INDEX "contacts_account_idx" ON "contacts" USING btree ("account_id");
  CREATE INDEX "contacts_linked_user_idx" ON "contacts" USING btree ("linked_user_id");
  CREATE INDEX "contacts_updated_at_idx" ON "contacts" USING btree ("updated_at");
  CREATE INDEX "contacts_created_at_idx" ON "contacts" USING btree ("created_at");
  CREATE INDEX "leads_owner_idx" ON "leads" USING btree ("owner_id");
  CREATE INDEX "leads_related_quote_idx" ON "leads" USING btree ("related_quote_id");
  CREATE INDEX "leads_account_idx" ON "leads" USING btree ("account_id");
  CREATE INDEX "leads_contact_idx" ON "leads" USING btree ("contact_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "opportunities_owner_idx" ON "opportunities" USING btree ("owner_id");
  CREATE INDEX "opportunities_lead_idx" ON "opportunities" USING btree ("lead_id");
  CREATE INDEX "opportunities_account_idx" ON "opportunities" USING btree ("account_id");
  CREATE INDEX "opportunities_contact_idx" ON "opportunities" USING btree ("contact_id");
  CREATE INDEX "opportunities_quote_idx" ON "opportunities" USING btree ("quote_id");
  CREATE INDEX "opportunities_updated_at_idx" ON "opportunities" USING btree ("updated_at");
  CREATE INDEX "opportunities_created_at_idx" ON "opportunities" USING btree ("created_at");
  CREATE INDEX "crm_activities_owner_idx" ON "crm_activities" USING btree ("owner_id");
  CREATE INDEX "crm_activities_lead_idx" ON "crm_activities" USING btree ("lead_id");
  CREATE INDEX "crm_activities_account_idx" ON "crm_activities" USING btree ("account_id");
  CREATE INDEX "crm_activities_contact_idx" ON "crm_activities" USING btree ("contact_id");
  CREATE INDEX "crm_activities_opportunity_idx" ON "crm_activities" USING btree ("opportunity_id");
  CREATE INDEX "crm_activities_related_task_idx" ON "crm_activities" USING btree ("related_task_id");
  CREATE INDEX "crm_activities_quote_idx" ON "crm_activities" USING btree ("quote_id");
  CREATE INDEX "crm_activities_invoice_idx" ON "crm_activities" USING btree ("invoice_id");
  CREATE INDEX "crm_activities_service_plan_idx" ON "crm_activities" USING btree ("service_plan_id");
  CREATE INDEX "crm_activities_updated_at_idx" ON "crm_activities" USING btree ("updated_at");
  CREATE INDEX "crm_activities_created_at_idx" ON "crm_activities" USING btree ("created_at");
  CREATE INDEX "crm_tasks_owner_idx" ON "crm_tasks" USING btree ("owner_id");
  CREATE INDEX "crm_tasks_lead_idx" ON "crm_tasks" USING btree ("lead_id");
  CREATE INDEX "crm_tasks_account_idx" ON "crm_tasks" USING btree ("account_id");
  CREATE INDEX "crm_tasks_contact_idx" ON "crm_tasks" USING btree ("contact_id");
  CREATE INDEX "crm_tasks_opportunity_idx" ON "crm_tasks" USING btree ("opportunity_id");
  CREATE INDEX "crm_tasks_quote_idx" ON "crm_tasks" USING btree ("quote_id");
  CREATE INDEX "crm_tasks_invoice_idx" ON "crm_tasks" USING btree ("invoice_id");
  CREATE INDEX "crm_tasks_service_plan_idx" ON "crm_tasks" USING btree ("service_plan_id");
  CREATE INDEX "crm_tasks_service_appointment_idx" ON "crm_tasks" USING btree ("service_appointment_id");
  CREATE INDEX "crm_tasks_updated_at_idx" ON "crm_tasks" USING btree ("updated_at");
  CREATE INDEX "crm_tasks_created_at_idx" ON "crm_tasks" USING btree ("created_at");
  CREATE INDEX "sequence_enrollments_owner_idx" ON "sequence_enrollments" USING btree ("owner_id");
  CREATE INDEX "sequence_enrollments_lead_idx" ON "sequence_enrollments" USING btree ("lead_id");
  CREATE INDEX "sequence_enrollments_account_idx" ON "sequence_enrollments" USING btree ("account_id");
  CREATE INDEX "sequence_enrollments_contact_idx" ON "sequence_enrollments" USING btree ("contact_id");
  CREATE INDEX "sequence_enrollments_opportunity_idx" ON "sequence_enrollments" USING btree ("opportunity_id");
  CREATE INDEX "sequence_enrollments_updated_at_idx" ON "sequence_enrollments" USING btree ("updated_at");
  CREATE INDEX "sequence_enrollments_created_at_idx" ON "sequence_enrollments" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contacts_fk" FOREIGN KEY ("contacts_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_opportunities_fk" FOREIGN KEY ("opportunities_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_crm_activities_fk" FOREIGN KEY ("crm_activities_id") REFERENCES "public"."crm_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_crm_tasks_fk" FOREIGN KEY ("crm_tasks_id") REFERENCES "public"."crm_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sequence_enrollments_fk" FOREIGN KEY ("sequence_enrollments_id") REFERENCES "public"."sequence_enrollments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");
  CREATE INDEX "payload_locked_documents_rels_contacts_id_idx" ON "payload_locked_documents_rels" USING btree ("contacts_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_opportunities_id_idx" ON "payload_locked_documents_rels" USING btree ("opportunities_id");
  CREATE INDEX "payload_locked_documents_rels_crm_activities_id_idx" ON "payload_locked_documents_rels" USING btree ("crm_activities_id");
  CREATE INDEX "payload_locked_documents_rels_crm_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("crm_tasks_id");
  CREATE INDEX "payload_locked_documents_rels_sequence_enrollments_id_idx" ON "payload_locked_documents_rels" USING btree ("sequence_enrollments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "accounts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contacts_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "opportunities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "crm_activities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "crm_tasks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sequence_enrollments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "accounts" CASCADE;
  DROP TABLE "contacts_roles" CASCADE;
  DROP TABLE "contacts" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "opportunities" CASCADE;
  DROP TABLE "crm_activities" CASCADE;
  DROP TABLE "crm_tasks" CASCADE;
  DROP TABLE "sequence_enrollments" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_accounts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contacts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_leads_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_opportunities_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_crm_activities_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_crm_tasks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sequence_enrollments_fk";
  
  DROP INDEX "payload_locked_documents_rels_accounts_id_idx";
  DROP INDEX "payload_locked_documents_rels_contacts_id_idx";
  DROP INDEX "payload_locked_documents_rels_leads_id_idx";
  DROP INDEX "payload_locked_documents_rels_opportunities_id_idx";
  DROP INDEX "payload_locked_documents_rels_crm_activities_id_idx";
  DROP INDEX "payload_locked_documents_rels_crm_tasks_id_idx";
  DROP INDEX "payload_locked_documents_rels_sequence_enrollments_id_idx";
  ALTER TABLE "internal_ops_settings" ALTER COLUMN "chart_disclaimer" SET DEFAULT 'Illustrative sample trend for layout only — connect real accounting or CRM data in a later phase.';
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "accounts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contacts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "leads_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "opportunities_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "crm_activities_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "crm_tasks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sequence_enrollments_id";
  DROP TYPE "public"."enum_accounts_status";
  DROP TYPE "public"."enum_accounts_account_type";
  DROP TYPE "public"."enum_contacts_roles";
  DROP TYPE "public"."enum_contacts_status";
  DROP TYPE "public"."enum_contacts_preferred_contact_method";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_leads_priority";
  DROP TYPE "public"."enum_leads_source";
  DROP TYPE "public"."enum_leads_temperature";
  DROP TYPE "public"."enum_opportunities_status";
  DROP TYPE "public"."enum_opportunities_stage";
  DROP TYPE "public"."enum_opportunities_priority";
  DROP TYPE "public"."enum_crm_activities_activity_type";
  DROP TYPE "public"."enum_crm_activities_direction";
  DROP TYPE "public"."enum_crm_tasks_status";
  DROP TYPE "public"."enum_crm_tasks_priority";
  DROP TYPE "public"."enum_crm_tasks_task_type";
  DROP TYPE "public"."enum_sequence_enrollments_status";`)
}
