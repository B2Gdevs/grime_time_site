import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_organizations_kind" AS ENUM('staff', 'customer');
  CREATE TYPE "public"."enum_organizations_status" AS ENUM('active', 'locked', 'disabled');
  CREATE TYPE "public"."enum_organizations_provider" AS ENUM('app', 'clerk', 'supabase');
  CREATE TYPE "public"."enum_organizations_sync_source" AS ENUM('app', 'clerk', 'webhook');
  CREATE TYPE "public"."enum_organization_memberships_role_template" AS ENUM('staff-owner', 'staff-admin', 'staff-operator', 'customer-admin', 'customer-member');
  CREATE TYPE "public"."enum_organization_memberships_status" AS ENUM('active', 'suspended', 'revoked');
  CREATE TYPE "public"."enum_organization_memberships_sync_source" AS ENUM('app', 'clerk', 'webhook', 'bootstrap');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'sendEmployeeNotification' BEFORE 'processSequenceEnrollmentStep';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'sendEmployeeNotification' BEFORE 'processSequenceEnrollmentStep';
  CREATE TABLE "organizations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"kind" "enum_organizations_kind" DEFAULT 'customer' NOT NULL,
  	"status" "enum_organizations_status" DEFAULT 'active' NOT NULL,
  	"provider" "enum_organizations_provider" DEFAULT 'app' NOT NULL,
  	"clerk_org_i_d" varchar,
  	"sync_source" "enum_organizations_sync_source" DEFAULT 'app' NOT NULL,
  	"last_synced_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "organization_memberships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"role_template" "enum_organization_memberships_role_template" DEFAULT 'customer-member' NOT NULL,
  	"status" "enum_organization_memberships_status" DEFAULT 'active' NOT NULL,
  	"sync_source" "enum_organization_memberships_sync_source" DEFAULT 'app' NOT NULL,
  	"clerk_membership_i_d" varchar,
  	"last_synced_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "organizations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "organization_memberships_id" integer;
  ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");
  CREATE UNIQUE INDEX "organizations_clerk_org_i_d_idx" ON "organizations" USING btree ("clerk_org_i_d");
  CREATE INDEX "organizations_updated_at_idx" ON "organizations" USING btree ("updated_at");
  CREATE INDEX "organizations_created_at_idx" ON "organizations" USING btree ("created_at");
  CREATE INDEX "organization_memberships_organization_idx" ON "organization_memberships" USING btree ("organization_id");
  CREATE INDEX "organization_memberships_user_idx" ON "organization_memberships" USING btree ("user_id");
  CREATE UNIQUE INDEX "organization_memberships_org_user_unique_idx" ON "organization_memberships" USING btree ("organization_id","user_id");
  CREATE UNIQUE INDEX "organization_memberships_clerk_membership_i_d_idx" ON "organization_memberships" USING btree ("clerk_membership_i_d");
  CREATE INDEX "organization_memberships_updated_at_idx" ON "organization_memberships" USING btree ("updated_at");
  CREATE INDEX "organization_memberships_created_at_idx" ON "organization_memberships" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organization_memberships_fk" FOREIGN KEY ("organization_memberships_id") REFERENCES "public"."organization_memberships"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_organizations_id_idx" ON "payload_locked_documents_rels" USING btree ("organizations_id");
  CREATE INDEX "payload_locked_documents_rels_organization_memberships_i_idx" ON "payload_locked_documents_rels" USING btree ("organization_memberships_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "organization_memberships" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "organizations" CASCADE;
  DROP TABLE "organization_memberships" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_organizations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_organization_memberships_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'sendCustomerNotification', 'processSequenceEnrollmentStep', 'scanOverdueInvoices', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'sendCustomerNotification', 'processSequenceEnrollmentStep', 'scanOverdueInvoices', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_organizations_id_idx";
  DROP INDEX "payload_locked_documents_rels_organization_memberships_i_idx";
  DROP INDEX "organization_memberships_org_user_unique_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "organizations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "organization_memberships_id";
  DROP TYPE "public"."enum_organizations_kind";
  DROP TYPE "public"."enum_organizations_status";
  DROP TYPE "public"."enum_organizations_provider";
  DROP TYPE "public"."enum_organizations_sync_source";
  DROP TYPE "public"."enum_organization_memberships_role_template";
  DROP TYPE "public"."enum_organization_memberships_status";
  DROP TYPE "public"."enum_organization_memberships_sync_source";`)
}
