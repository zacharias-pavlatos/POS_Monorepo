CREATE TYPE "public"."selection_type" AS ENUM('single', 'multiple');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_price" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"selection_type" "selection_type" DEFAULT 'single' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "modifier_option_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modifier_id" uuid NOT NULL,
	"depends_on_modifier_id" uuid NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "uq_mod_deps" UNIQUE("modifier_id","depends_on_modifier_id")
);
--> statement-breakpoint
CREATE TABLE "modifiers" (
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
ALTER TABLE "category" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option_dependencies" ADD CONSTRAINT "modifier_option_dependencies_modifier_id_modifiers_id_fk" FOREIGN KEY ("modifier_id") REFERENCES "public"."modifiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option_dependencies" ADD CONSTRAINT "modifier_option_dependencies_depends_on_modifier_id_modifiers_id_fk" FOREIGN KEY ("depends_on_modifier_id") REFERENCES "public"."modifiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_modifier_group_id_modifier_groups_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_product" ON "modifier_groups" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_order" ON "modifier_groups" USING btree ("product_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_mod_deps_modifier" ON "modifier_option_dependencies" USING btree ("modifier_id");--> statement-breakpoint
CREATE INDEX "idx_mod_deps_depends_on" ON "modifier_option_dependencies" USING btree ("depends_on_modifier_id");--> statement-breakpoint
CREATE INDEX "idx_modifiers_group" ON "modifiers" USING btree ("modifier_group_id");--> statement-breakpoint
CREATE INDEX "idx_modifiers_order" ON "modifiers" USING btree ("modifier_group_id","display_order");