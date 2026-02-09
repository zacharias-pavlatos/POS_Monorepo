CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'fixed_price', 'bogo');--> statement-breakpoint
CREATE TYPE "public"."offer_scope" AS ENUM('product', 'category', 'order');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_role" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cuisine_type" varchar(100),
	"website" text,
	"image" text,
	"country_code" varchar(2) NOT NULL,
	"vat_number" varchar(50) NOT NULL,
	"tax_office" varchar(255) NOT NULL,
	"profession" varchar(255) NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"state" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"street_address" text NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"longitude" numeric(10, 8) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "workstation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"color" varchar(7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"internal_notes" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"available_from" time,
	"available_until" time,
	"active_days_of_week" integer[],
	"color" varchar(7),
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"catalog_id" uuid NOT NULL,
	"workstation_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"internal_notes" text,
	"color" varchar(7),
	"image" text,
	"serving_order" integer DEFAULT 0 NOT NULL,
	"active_from" timestamp NOT NULL,
	"active_until" timestamp,
	"active_days_of_week" integer[],
	"start_time" time,
	"end_time" time,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "category_product" (
	"category_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "category_product_category_id_product_id_pk" PRIMARY KEY("category_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"workstation_id" uuid,
	"barcode" varchar(100),
	"name" varchar(255) NOT NULL,
	"description" text,
	"image" text,
	"preparation_time" integer,
	"base_price" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "modifier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_price" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "modifier_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "modifier_option_dependency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"modifier_id" uuid NOT NULL,
	"depends_on_modifier_id" uuid NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "uq_mod_deps" UNIQUE("organization_id","modifier_id","depends_on_modifier_id")
);
--> statement-breakpoint
CREATE TABLE "offer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"scope" "offer_scope" NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp,
	"active_days_of_week" integer[],
	"start_time" time,
	"end_time" time,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_stackable" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_redemptions" integer,
	"current_redemptions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "offer_category" (
	"organization_id" text NOT NULL,
	"offer_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "offer_category_offer_id_category_id_pk" PRIMARY KEY("offer_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "offer_product" (
	"organization_id" text NOT NULL,
	"offer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "offer_product_offer_id_product_id_pk" PRIMARY KEY("offer_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_role" ADD CONSTRAINT "organization_role_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workstation" ADD CONSTRAINT "workstation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog" ADD CONSTRAINT "catalog_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_catalog_id_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_workstation_id_workstation_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "public"."workstation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_product" ADD CONSTRAINT "category_product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_product" ADD CONSTRAINT "category_product_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_product" ADD CONSTRAINT "category_product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_workstation_id_workstation_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "public"."workstation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier" ADD CONSTRAINT "modifier_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier" ADD CONSTRAINT "modifier_modifier_group_id_modifier_group_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD CONSTRAINT "modifier_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD CONSTRAINT "modifier_group_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ADD CONSTRAINT "modifier_option_dependency_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ADD CONSTRAINT "modifier_option_dependency_modifier_id_modifier_id_fk" FOREIGN KEY ("modifier_id") REFERENCES "public"."modifier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option_dependency" ADD CONSTRAINT "modifier_option_dependency_depends_on_modifier_id_modifier_id_fk" FOREIGN KEY ("depends_on_modifier_id") REFERENCES "public"."modifier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_category" ADD CONSTRAINT "offer_category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_category" ADD CONSTRAINT "offer_category_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_category" ADD CONSTRAINT "offer_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_product" ADD CONSTRAINT "offer_product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_product" ADD CONSTRAINT "offer_product_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_product" ADD CONSTRAINT "offer_product_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizationRole_organizationId_idx" ON "organization_role" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organizationRole_role_idx" ON "organization_role" USING btree ("role");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_org_unique" ON "restaurant" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_org_vat_unique" ON "restaurant" USING btree ("organization_id","vat_number");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_org_email_unique" ON "restaurant" USING btree ("organization_id","email");--> statement-breakpoint
CREATE INDEX "idx_restaurant_location" ON "restaurant" USING btree ("city","state","country_code");--> statement-breakpoint
CREATE UNIQUE INDEX "workstation_org_name_unique" ON "workstation" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_workstation_org_active" ON "workstation" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_workstation_org_order" ON "workstation" USING btree ("organization_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_org_name_unique" ON "catalog" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_catalog_org_active" ON "catalog" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_catalog_org_order" ON "catalog" USING btree ("organization_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "category_org_name_unique" ON "category" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_category_org_active" ON "category" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_category_org_serving" ON "category" USING btree ("organization_id","serving_order");--> statement-breakpoint
CREATE INDEX "idx_category_workstation" ON "category" USING btree ("workstation_id");--> statement-breakpoint
CREATE INDEX "idx_category_catalog_serving" ON "category" USING btree ("catalog_id","serving_order");--> statement-breakpoint
CREATE INDEX "idx_category_product_org_cat" ON "category_product" USING btree ("organization_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_category_product_org_prod" ON "category_product" USING btree ("organization_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_category_product_order" ON "category_product" USING btree ("category_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_product_org_active" ON "product" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_product_org_name" ON "product" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_product_workstation" ON "product" USING btree ("workstation_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_group" ON "modifier" USING btree ("modifier_group_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_order" ON "modifier" USING btree ("modifier_group_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_modifier_group_product" ON "modifier_group" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_group_order" ON "modifier_group" USING btree ("product_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_mod_deps_modifier" ON "modifier_option_dependency" USING btree ("organization_id","modifier_id");--> statement-breakpoint
CREATE INDEX "idx_mod_deps_depends_on" ON "modifier_option_dependency" USING btree ("organization_id","depends_on_modifier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offer_org_name_unique" ON "offer" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_offer_org_active" ON "offer" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_offer_dates" ON "offer" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_offer_priority" ON "offer" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_offer_category_org_offer" ON "offer_category" USING btree ("organization_id","offer_id");--> statement-breakpoint
CREATE INDEX "idx_offer_category_org_cat" ON "offer_category" USING btree ("organization_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_offer_product_org_offer" ON "offer_product" USING btree ("organization_id","offer_id");--> statement-breakpoint
CREATE INDEX "idx_offer_product_org_prod" ON "offer_product" USING btree ("organization_id","product_id");