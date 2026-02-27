CREATE TYPE "public"."order_item_status" AS ENUM('new', 'sent', 'preparing', 'ready', 'served', 'voided');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('open', 'closed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."check_status" AS ENUM('open', 'partially_paid', 'paid', 'voided');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."printer_connection_type" AS ENUM('network', 'usb', 'bluetooth');--> statement-breakpoint
CREATE TYPE "public"."table_session_status" AS ENUM('active', 'closed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."table_session_type" AS ENUM('dine_in', 'tab', 'takeaway', 'delivery');--> statement-breakpoint
CREATE TABLE "zone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"color" varchar(7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dining_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"zone_id" uuid NOT NULL,
	"label" varchar(50) NOT NULL,
	"capacity" integer DEFAULT 4 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"table_session_id" uuid NOT NULL,
	"order_number" serial NOT NULL,
	"opened_by_id" text NOT NULL,
	"status" "order_status" DEFAULT 'open' NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"tax_total" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"product_price" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"item_total" integer NOT NULL,
	"status" "order_item_status" DEFAULT 'new' NOT NULL,
	"round" integer,
	"seat_number" integer,
	"added_by_id" text,
	"notes" text,
	"fired_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"voided_by_id" text,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_item_modifier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"order_item_id" uuid NOT NULL,
	"modifier_id" uuid NOT NULL,
	"modifier_name" varchar(255) NOT NULL,
	"modifier_price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "check" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"label" varchar(100),
	"status" "check_status" DEFAULT 'open' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"tax_total" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"created_by_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"frozen_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "check_discount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"check_id" uuid NOT NULL,
	"offer_id" uuid,
	"offer_name_snapshot" varchar(255),
	"discount_type" "discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"computed_amount" integer NOT NULL,
	"applied_by_id" text NOT NULL,
	"approved_by_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "check_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"check_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"check_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'completed' NOT NULL,
	"amount" integer NOT NULL,
	"tip_amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"external_reference" varchar(255),
	"processed_by_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "printer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"connection_type" "printer_connection_type" NOT NULL,
	"ip_address" varchar(45),
	"port" integer,
	"model" varchar(255),
	"workstation_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "table_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"status" "table_session_status" DEFAULT 'active' NOT NULL,
	"type" "table_session_type" DEFAULT 'dine_in' NOT NULL,
	"name" varchar(255),
	"guest_count" integer DEFAULT 1 NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_by_user_id" text,
	"closed_at" timestamp with time zone,
	"closed_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "table_session_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"table_session_id" uuid NOT NULL,
	"table_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"joined_by_user_id" text,
	"left_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_discount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid,
	"offer_id" uuid,
	"offer_name_snapshot" varchar(255),
	"discount_type" "discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"priority_snapshot" integer DEFAULT 0 NOT NULL,
	"is_stackable_snapshot" boolean DEFAULT false NOT NULL,
	"applied_by_id" text NOT NULL,
	"approved_by_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "catalog" RENAME COLUMN "available_from" TO "from_date";--> statement-breakpoint
ALTER TABLE "catalog" RENAME COLUMN "available_until" TO "to_date";--> statement-breakpoint
ALTER TABLE "catalog" RENAME COLUMN "active_days_of_week" TO "week_days";--> statement-breakpoint
ALTER TABLE "category" RENAME COLUMN "active_from" TO "from_date";--> statement-breakpoint
ALTER TABLE "category" RENAME COLUMN "active_until" TO "to_date";--> statement-breakpoint
ALTER TABLE "category" RENAME COLUMN "active_days_of_week" TO "week_days";--> statement-breakpoint
ALTER TABLE "category" RENAME COLUMN "start_time" TO "from_time";--> statement-breakpoint
ALTER TABLE "category" RENAME COLUMN "end_time" TO "to_time";--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "discount_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "check_discount" ALTER COLUMN "discount_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "order_discount" ALTER COLUMN "discount_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."discount_type";--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'fixed_price');--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "discount_type" SET DATA TYPE "public"."discount_type" USING "discount_type"::"public"."discount_type";--> statement-breakpoint
ALTER TABLE "check_discount" ALTER COLUMN "discount_type" SET DATA TYPE "public"."discount_type" USING "discount_type"::"public"."discount_type";--> statement-breakpoint
ALTER TABLE "order_discount" ALTER COLUMN "discount_type" SET DATA TYPE "public"."discount_type" USING "discount_type"::"public"."discount_type";--> statement-breakpoint
ALTER TABLE "restaurant" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "restaurant" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "restaurant" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "restaurant" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "restaurant" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workstation" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workstation" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workstation" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workstation" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workstation" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "catalog" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "catalog" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "catalog" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "catalog" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "catalog" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "category_product" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "category_product" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "category_product" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "category_product" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "category_product" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "base_price" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "modifier" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "modifier" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_group" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_group" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "modifier_group" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_group" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "modifier_group" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "valid_from" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "valid_until" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offer" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer_category" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer_category" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offer_category" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer_category" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offer_category" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer_product" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer_product" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offer_product" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offer_product" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offer_product" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "catalog" ADD COLUMN "from_time" time;--> statement-breakpoint
ALTER TABLE "catalog" ADD COLUMN "to_time" time;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "from_date" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "to_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "week_days" integer[];--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "from_time" time;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "to_time" time;--> statement-breakpoint
ALTER TABLE "modifier" ADD COLUMN "referenced_product_id" uuid;--> statement-breakpoint
ALTER TABLE "zone" ADD CONSTRAINT "zone_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_table" ADD CONSTRAINT "dining_table_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_table" ADD CONSTRAINT "dining_table_zone_id_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zone"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_table_session_id_table_session_id_fk" FOREIGN KEY ("table_session_id") REFERENCES "public"."table_session"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_opened_by_id_user_id_fk" FOREIGN KEY ("opened_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_added_by_id_user_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_voided_by_id_user_id_fk" FOREIGN KEY ("voided_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_modifier" ADD CONSTRAINT "order_item_modifier_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_modifier" ADD CONSTRAINT "order_item_modifier_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_modifier" ADD CONSTRAINT "order_item_modifier_modifier_id_modifier_id_fk" FOREIGN KEY ("modifier_id") REFERENCES "public"."modifier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check" ADD CONSTRAINT "check_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check" ADD CONSTRAINT "check_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check" ADD CONSTRAINT "check_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discount" ADD CONSTRAINT "check_discount_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discount" ADD CONSTRAINT "check_discount_check_id_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discount" ADD CONSTRAINT "check_discount_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discount" ADD CONSTRAINT "check_discount_applied_by_id_user_id_fk" FOREIGN KEY ("applied_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discount" ADD CONSTRAINT "check_discount_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_item" ADD CONSTRAINT "check_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_item" ADD CONSTRAINT "check_item_check_id_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_item" ADD CONSTRAINT "check_item_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_check_id_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_processed_by_id_user_id_fk" FOREIGN KEY ("processed_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_workstation_id_workstation_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "public"."workstation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session" ADD CONSTRAINT "table_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session" ADD CONSTRAINT "table_session_opened_by_user_id_user_id_fk" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session" ADD CONSTRAINT "table_session_closed_by_user_id_user_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session_table" ADD CONSTRAINT "table_session_table_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session_table" ADD CONSTRAINT "table_session_table_table_session_id_table_session_id_fk" FOREIGN KEY ("table_session_id") REFERENCES "public"."table_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session_table" ADD CONSTRAINT "table_session_table_table_id_dining_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."dining_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session_table" ADD CONSTRAINT "table_session_table_joined_by_user_id_user_id_fk" FOREIGN KEY ("joined_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_session_table" ADD CONSTRAINT "table_session_table_left_by_user_id_user_id_fk" FOREIGN KEY ("left_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount" ADD CONSTRAINT "order_discount_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount" ADD CONSTRAINT "order_discount_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount" ADD CONSTRAINT "order_discount_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount" ADD CONSTRAINT "order_discount_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount" ADD CONSTRAINT "order_discount_applied_by_id_user_id_fk" FOREIGN KEY ("applied_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount" ADD CONSTRAINT "order_discount_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "zone_org_name_unique" ON "zone" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_zone_org_active" ON "zone" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_zone_org_order" ON "zone" USING btree ("organization_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "table_org_label_unique" ON "dining_table" USING btree ("organization_id","label");--> statement-breakpoint
CREATE INDEX "idx_table_zone" ON "dining_table" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "idx_table_org_active" ON "dining_table" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_dining_table_zone_order" ON "dining_table" USING btree ("zone_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_order_session_status" ON "order" USING btree ("table_session_id","status");--> statement-breakpoint
CREATE INDEX "idx_order_org_opened" ON "order" USING btree ("organization_id","opened_at");--> statement-breakpoint
CREATE INDEX "idx_order_org_status" ON "order" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_order_opened_by" ON "order" USING btree ("opened_by_id");--> statement-breakpoint
CREATE INDEX "idx_order_item_order" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_item_status" ON "order_item" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_order_item_round" ON "order_item" USING btree ("order_id","round");--> statement-breakpoint
CREATE INDEX "idx_order_item_product" ON "order_item" USING btree ("organization_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_order_item_modifier_item" ON "order_item_modifier" USING btree ("order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "check_order_number_unique" ON "check" USING btree ("order_id","number");--> statement-breakpoint
CREATE INDEX "idx_check_order" ON "check" USING btree ("organization_id","order_id");--> statement-breakpoint
CREATE INDEX "idx_check_org_status" ON "check" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_check_discount_check" ON "check_discount" USING btree ("organization_id","check_id");--> statement-breakpoint
CREATE INDEX "idx_check_discount_offer" ON "check_discount" USING btree ("organization_id","offer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "check_item_check_order_item_unique" ON "check_item" USING btree ("check_id","order_item_id");--> statement-breakpoint
CREATE INDEX "idx_check_item_check" ON "check_item" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "idx_check_item_order_item" ON "check_item" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_check_item_org_check" ON "check_item" USING btree ("organization_id","check_id");--> statement-breakpoint
CREATE INDEX "idx_check_item_org_order_item" ON "check_item" USING btree ("organization_id","order_item_id");--> statement-breakpoint
CREATE INDEX "idx_payment_check" ON "payment" USING btree ("organization_id","check_id");--> statement-breakpoint
CREATE INDEX "idx_payment_status" ON "payment" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_payment_processed_at" ON "payment" USING btree ("organization_id","processed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "printer_org_name_unique" ON "printer" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_printer_org_active" ON "printer" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_printer_org_workstation" ON "printer" USING btree ("organization_id","workstation_id");--> statement-breakpoint
CREATE INDEX "idx_table_session_org_status" ON "table_session" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_table_session_org_opened_at" ON "table_session" USING btree ("organization_id","opened_at");--> statement-breakpoint
CREATE INDEX "idx_table_session_org_type" ON "table_session" USING btree ("organization_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "table_one_active_session_unique" ON "table_session_table" USING btree ("organization_id","table_id") WHERE "table_session_table"."left_at" is null and "table_session_table"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_session_tables_current" ON "table_session_table" USING btree ("organization_id","table_session_id","left_at");--> statement-breakpoint
CREATE INDEX "idx_session_table_history" ON "table_session_table" USING btree ("organization_id","table_id","joined_at");--> statement-breakpoint
CREATE INDEX "idx_session_table_session_joined" ON "table_session_table" USING btree ("organization_id","table_session_id","joined_at");--> statement-breakpoint
CREATE INDEX "idx_order_discount_order" ON "order_discount" USING btree ("organization_id","order_id");--> statement-breakpoint
CREATE INDEX "idx_order_discount_item" ON "order_discount" USING btree ("organization_id","order_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_discount_offer" ON "order_discount" USING btree ("organization_id","offer_id");--> statement-breakpoint
ALTER TABLE "modifier" ADD CONSTRAINT "modifier_referenced_product_id_product_id_fk" FOREIGN KEY ("referenced_product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_org_name_unique" ON "product" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_modifier_product_ref" ON "modifier" USING btree ("referenced_product_id");