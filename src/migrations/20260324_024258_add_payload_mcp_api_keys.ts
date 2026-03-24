import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_quotes_status" AS ENUM('draft', 'sent', 'accepted', 'lost');
  CREATE TYPE "public"."enum_quotes_service_lines_service_type" AS ENUM('house_wash', 'soft_wash', 'roof_cleaning', 'window_cleaning', 'concrete_cleaning', 'driveway_walkway_cleaning', 'fence_cleaning', 'deck_patio_cleaning', 'gutter_cleaning', 'rust_stain_treatment', 'other');
  CREATE TYPE "public"."enum_quotes_service_lines_tax_category" AS ENUM('building_grounds_cleaning', 'pressure_washing_maintenance', 'window_washing', 'manual_review_required');
  CREATE TYPE "public"."enum_quotes_property_type" AS ENUM('residential', 'commercial', 'new_residential_construction', 'hoa_multi_unit', 'other');
  CREATE TYPE "public"."enum_quotes_soiling_level" AS ENUM('light', 'medium', 'heavy');
  CREATE TYPE "public"."enum_quotes_pricing_tax_decision" AS ENUM('collect_sales_tax', 'homebuilder_exception', 'exemption_certificate', 'manual_review_required');
  CREATE TABLE "quotes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_quotes_status" DEFAULT 'draft',
  	"valid_until" timestamp(3) with time zone,
  	"customer_name" varchar,
  	"customer_email" varchar,
  	"customer_phone" varchar,
  	"service_address_street1" varchar,
  	"service_address_street2" varchar,
  	"service_address_city" varchar,
  	"service_address_state" varchar DEFAULT 'TX',
  	"service_address_postal_code" varchar,
  	"property_type" "enum_quotes_property_type" DEFAULT 'residential',
  	"job_size" varchar,
  	"surface_description" varchar,
  	"soiling_level" "enum_quotes_soiling_level",
  	"access_notes" varchar,
  	"pricing_discount_amount" numeric DEFAULT 0,
  	"pricing_tax_decision" "enum_quotes_pricing_tax_decision" DEFAULT 'collect_sales_tax',
  	"pricing_tax_rate_percent" numeric DEFAULT 0,
  	"pricing_tax_decision_notes" varchar,
  	"pricing_subtotal" numeric,
  	"pricing_taxable_subtotal" numeric,
  	"pricing_sales_tax_amount" numeric,
  	"pricing_total" numeric,
  	"internal_notes" varchar,
  	"source_submission_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quotes_service_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"service_type" "enum_quotes_service_lines_service_type" DEFAULT 'house_wash' NOT NULL,
  	"description" varchar NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"unit" varchar DEFAULT 'job',
  	"unit_price" numeric NOT NULL,
  	"line_total" numeric,
  	"taxable" boolean DEFAULT true,
  	"tax_category" "enum_quotes_service_lines_tax_category" DEFAULT 'building_grounds_cleaning'
  );
  
  CREATE TABLE "payload_mcp_api_keys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"categories_find" boolean DEFAULT false,
  	"categories_create" boolean DEFAULT false,
  	"categories_update" boolean DEFAULT false,
  	"media_find" boolean DEFAULT false,
  	"media_create" boolean DEFAULT false,
  	"media_update" boolean DEFAULT false,
  	"pages_find" boolean DEFAULT false,
  	"pages_create" boolean DEFAULT false,
  	"pages_update" boolean DEFAULT false,
  	"posts_find" boolean DEFAULT false,
  	"posts_create" boolean DEFAULT false,
  	"posts_update" boolean DEFAULT false,
  	"quotes_find" boolean DEFAULT false,
  	"footer_find" boolean DEFAULT false,
  	"footer_update" boolean DEFAULT false,
  	"header_find" boolean DEFAULT false,
  	"header_update" boolean DEFAULT false,
  	"pricing_find" boolean DEFAULT false,
  	"pricing_update" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quotes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_source_submission_id_form_submissions_id_fk" FOREIGN KEY ("source_submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quotes_service_lines" ADD CONSTRAINT "quotes_service_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quotes_fk" FOREIGN KEY ("quotes_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "quotes_source_submission_idx" ON "quotes" USING btree ("source_submission_id");
  CREATE INDEX "quotes_updated_at_idx" ON "quotes" USING btree ("updated_at");
  CREATE INDEX "quotes_created_at_idx" ON "quotes" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_quotes_id_idx" ON "payload_locked_documents_rels" USING btree ("quotes_id");
  CREATE INDEX "quotes_service_lines_order_idx" ON "quotes_service_lines" USING btree ("_order");
  CREATE INDEX "quotes_service_lines_parent_id_idx" ON "quotes_service_lines" USING btree ("_parent_id");
  CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "quotes_source_submission_idx";
  DROP INDEX "quotes_updated_at_idx";
  DROP INDEX "quotes_created_at_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quotes_fk";
  ALTER TABLE "quotes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quotes_service_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_mcp_api_keys" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "quotes" CASCADE;
  DROP TABLE "quotes_service_lines" CASCADE;
  DROP TABLE "payload_mcp_api_keys" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk";
  
  DROP INDEX "payload_locked_documents_rels_quotes_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
  DROP INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quotes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_mcp_api_keys_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "payload_mcp_api_keys_id";
  DROP TYPE "public"."enum_quotes_status";
  DROP TYPE "public"."enum_quotes_service_lines_service_type";
  DROP TYPE "public"."enum_quotes_service_lines_tax_category";
  DROP TYPE "public"."enum_quotes_property_type";
  DROP TYPE "public"."enum_quotes_soiling_level";
  DROP TYPE "public"."enum_quotes_pricing_tax_decision";`)
}
