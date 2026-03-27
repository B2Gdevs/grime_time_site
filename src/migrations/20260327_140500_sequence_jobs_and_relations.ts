import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'sendCustomerNotification';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'processSequenceEnrollmentStep';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'scanOverdueInvoices';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'sendCustomerNotification';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'processSequenceEnrollmentStep';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'scanOverdueInvoices';
  ALTER TABLE "sequence_enrollments" ADD COLUMN "quote_id" integer;
  ALTER TABLE "sequence_enrollments" ADD COLUMN "invoice_id" integer;
  ALTER TABLE "sequence_enrollments" ADD COLUMN "service_appointment_id" integer;
  ALTER TABLE "sequence_enrollments" ADD COLUMN "service_plan_id" integer;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_service_appointment_id_service_appointments_id_fk" FOREIGN KEY ("service_appointment_id") REFERENCES "public"."service_appointments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_service_plan_id_service_plans_id_fk" FOREIGN KEY ("service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "sequence_enrollments_quote_idx" ON "sequence_enrollments" USING btree ("quote_id");
  CREATE INDEX "sequence_enrollments_invoice_idx" ON "sequence_enrollments" USING btree ("invoice_id");
  CREATE INDEX "sequence_enrollments_service_appointment_idx" ON "sequence_enrollments" USING btree ("service_appointment_id");
  CREATE INDEX "sequence_enrollments_service_plan_idx" ON "sequence_enrollments" USING btree ("service_plan_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sequence_enrollments" DROP CONSTRAINT "sequence_enrollments_quote_id_quotes_id_fk";
  ALTER TABLE "sequence_enrollments" DROP CONSTRAINT "sequence_enrollments_invoice_id_invoices_id_fk";
  ALTER TABLE "sequence_enrollments" DROP CONSTRAINT "sequence_enrollments_service_appointment_id_service_appointments_id_fk";
  ALTER TABLE "sequence_enrollments" DROP CONSTRAINT "sequence_enrollments_service_plan_id_service_plans_id_fk";
  DROP INDEX "sequence_enrollments_quote_idx";
  DROP INDEX "sequence_enrollments_invoice_idx";
  DROP INDEX "sequence_enrollments_service_appointment_idx";
  DROP INDEX "sequence_enrollments_service_plan_idx";
  ALTER TABLE "sequence_enrollments" DROP COLUMN "quote_id";
  ALTER TABLE "sequence_enrollments" DROP COLUMN "invoice_id";
  ALTER TABLE "sequence_enrollments" DROP COLUMN "service_appointment_id";
  ALTER TABLE "sequence_enrollments" DROP COLUMN "service_plan_id";`)
}
