import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "account_id" integer;
  ALTER TABLE "quotes" ADD COLUMN "account_id" integer;
  ALTER TABLE "invoices" ADD COLUMN "account_id" integer;
  ALTER TABLE "service_plans" ADD COLUMN "account_id" integer;
  ALTER TABLE "service_appointments" ADD COLUMN "account_id" integer;
  ALTER TABLE "users" ADD CONSTRAINT "users_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_account_idx" ON "users" USING btree ("account_id");
  CREATE INDEX "quotes_account_idx" ON "quotes" USING btree ("account_id");
  CREATE INDEX "invoices_account_idx" ON "invoices" USING btree ("account_id");
  CREATE INDEX "service_plans_account_idx" ON "service_plans" USING btree ("account_id");
  CREATE INDEX "service_appointments_account_idx" ON "service_appointments" USING btree ("account_id");

  UPDATE "users" AS "u"
  SET "account_id" = "a"."id"
  FROM "accounts" AS "a"
  WHERE "u"."account_id" IS NULL
    AND (
      "a"."customer_user_id" = "u"."id"
      OR LOWER(COALESCE("a"."billing_email", '')) = LOWER(COALESCE("u"."email", ''))
    );

  UPDATE "quotes" AS "q"
  SET "account_id" = "a"."id"
  FROM "accounts" AS "a"
  WHERE "q"."account_id" IS NULL
    AND (
      "a"."customer_user_id" = "q"."customer_user_id"
      OR LOWER(COALESCE("a"."billing_email", '')) = LOWER(COALESCE("q"."customer_email", ''))
      OR LOWER(COALESCE("a"."accounts_payable_email", '')) = LOWER(COALESCE("q"."customer_email", ''))
    );

  UPDATE "invoices" AS "i"
  SET "account_id" = "a"."id"
  FROM "accounts" AS "a"
  WHERE "i"."account_id" IS NULL
    AND (
      "a"."customer_user_id" = "i"."customer_user_id"
      OR LOWER(COALESCE("a"."billing_email", '')) = LOWER(COALESCE("i"."customer_email", ''))
      OR LOWER(COALESCE("a"."accounts_payable_email", '')) = LOWER(COALESCE("i"."customer_email", ''))
    );

  UPDATE "service_plans" AS "sp"
  SET "account_id" = "a"."id"
  FROM "accounts" AS "a"
  WHERE "sp"."account_id" IS NULL
    AND (
      "a"."customer_user_id" = "sp"."customer_user_id"
      OR LOWER(COALESCE("a"."billing_email", '')) = LOWER(COALESCE("sp"."customer_email", ''))
      OR LOWER(COALESCE("a"."accounts_payable_email", '')) = LOWER(COALESCE("sp"."customer_email", ''))
    );

  UPDATE "service_appointments" AS "sa"
  SET "account_id" = "a"."id"
  FROM "accounts" AS "a"
  WHERE "sa"."account_id" IS NULL
    AND (
      "a"."customer_user_id" = "sa"."customer_user_id"
      OR LOWER(COALESCE("a"."billing_email", '')) = LOWER(COALESCE("sa"."customer_email", ''))
      OR LOWER(COALESCE("a"."accounts_payable_email", '')) = LOWER(COALESCE("sa"."customer_email", ''))
    );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP CONSTRAINT "users_account_id_accounts_id_fk";
  ALTER TABLE "quotes" DROP CONSTRAINT "quotes_account_id_accounts_id_fk";
  ALTER TABLE "invoices" DROP CONSTRAINT "invoices_account_id_accounts_id_fk";
  ALTER TABLE "service_plans" DROP CONSTRAINT "service_plans_account_id_accounts_id_fk";
  ALTER TABLE "service_appointments" DROP CONSTRAINT "service_appointments_account_id_accounts_id_fk";
  DROP INDEX "users_account_idx";
  DROP INDEX "quotes_account_idx";
  DROP INDEX "invoices_account_idx";
  DROP INDEX "service_plans_account_idx";
  DROP INDEX "service_appointments_account_idx";
  ALTER TABLE "users" DROP COLUMN "account_id";
  ALTER TABLE "quotes" DROP COLUMN "account_id";
  ALTER TABLE "invoices" DROP COLUMN "account_id";
  ALTER TABLE "service_plans" DROP COLUMN "account_id";
  ALTER TABLE "service_appointments" DROP COLUMN "account_id";`)
}
