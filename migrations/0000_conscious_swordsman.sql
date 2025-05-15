CREATE TYPE "public"."access_level" AS ENUM('read', 'write', 'admin');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('global', 'multi_network', 'network', 'firm');--> statement-breakpoint
CREATE TYPE "public"."role_name" AS ENUM('global_admin', 'multi_network_admin', 'network_admin', 'firm_admin', 'advisor');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'pending', 'suspended');--> statement-breakpoint
CREATE TABLE "advisor_auth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"advisor_id" integer NOT NULL,
	"firm_integration_config_id" integer,
	"integration_type" integer DEFAULT 1 NOT NULL,
	"access_token" varchar(1000) NOT NULL,
	"refresh_token" varchar(1000),
	"token_type" varchar(50) DEFAULT 'Bearer',
	"expires_at" timestamp with time zone,
	"scope" varchar(500),
	"additional_data" json DEFAULT '{}'::json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_integration_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"advisor_id" integer NOT NULL,
	"firm_integration_config_id" integer NOT NULL,
	"can_access" boolean DEFAULT false NOT NULL,
	"access_scope" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer NOT NULL,
	"symbol" varchar(20),
	"asset_type" varchar(50) NOT NULL,
	"quantity" varchar(50) NOT NULL,
	"market_value" varchar(50) NOT NULL,
	"valuation_date" timestamp NOT NULL,
	"source" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_advisor_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"advisor_id" integer NOT NULL,
	"relationship_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(100),
	"firm_id" integer NOT NULL,
	"primary_advisor_id" integer,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"age" integer NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"contact_info" json DEFAULT '{}'::json NOT NULL,
	"source" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_access_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"access_rules" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firm_data_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"firm_id" integer NOT NULL,
	"integration_type_id" integer NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"source_field" varchar(100) NOT NULL,
	"target_field" varchar(100) NOT NULL,
	"transformation_rule" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firm_integration_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_type_id" integer NOT NULL,
	"firm_id" integer NOT NULL,
	"credentials" json NOT NULL,
	"settings" json DEFAULT '{}'::json NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_data_storage" (
	"id" serial PRIMARY KEY NOT NULL,
	"firm_integration_config_id" integer NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"external_id" varchar(100),
	"raw_data" json NOT NULL,
	"mapped_data" json NOT NULL,
	"last_synced_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"api_version" varchar(20) NOT NULL,
	"endpoint_base_url" varchar(255) NOT NULL,
	"required_credentials" json NOT NULL,
	"default_field_mappings" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "organization_hierarchy" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_org_id" integer NOT NULL,
	"child_org_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "organization_type" NOT NULL,
	"parent_id" integer,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(100),
	"client_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"account_number" varchar(50),
	"account_type" varchar(50),
	"source" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" "role_name" NOT NULL,
	"permissions" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_data_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"data_access_policy_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role_id" integer,
	"organization_id" integer,
	"status" "status" DEFAULT 'active' NOT NULL,
	"wealthbox_user_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "advisor_auth_tokens" ADD CONSTRAINT "advisor_auth_tokens_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_auth_tokens" ADD CONSTRAINT "advisor_auth_tokens_firm_integration_config_id_firm_integration_configs_id_fk" FOREIGN KEY ("firm_integration_config_id") REFERENCES "public"."firm_integration_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_integration_access" ADD CONSTRAINT "advisor_integration_access_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_integration_access" ADD CONSTRAINT "advisor_integration_access_firm_integration_config_id_firm_integration_configs_id_fk" FOREIGN KEY ("firm_integration_config_id") REFERENCES "public"."firm_integration_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_advisor_relationships" ADD CONSTRAINT "client_advisor_relationships_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_advisor_relationships" ADD CONSTRAINT "client_advisor_relationships_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_firm_id_organizations_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_primary_advisor_id_users_id_fk" FOREIGN KEY ("primary_advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_policies" ADD CONSTRAINT "data_access_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_data_mappings" ADD CONSTRAINT "firm_data_mappings_firm_id_organizations_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_data_mappings" ADD CONSTRAINT "firm_data_mappings_integration_type_id_integration_types_id_fk" FOREIGN KEY ("integration_type_id") REFERENCES "public"."integration_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_integration_configs" ADD CONSTRAINT "firm_integration_configs_integration_type_id_integration_types_id_fk" FOREIGN KEY ("integration_type_id") REFERENCES "public"."integration_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_integration_configs" ADD CONSTRAINT "firm_integration_configs_firm_id_organizations_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_data_storage" ADD CONSTRAINT "integration_data_storage_firm_integration_config_id_firm_integration_configs_id_fk" FOREIGN KEY ("firm_integration_config_id") REFERENCES "public"."firm_integration_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_hierarchy" ADD CONSTRAINT "organization_hierarchy_parent_org_id_organizations_id_fk" FOREIGN KEY ("parent_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_hierarchy" ADD CONSTRAINT "organization_hierarchy_child_org_id_organizations_id_fk" FOREIGN KEY ("child_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_id_organizations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_data_access" ADD CONSTRAINT "user_data_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_data_access" ADD CONSTRAINT "user_data_access_data_access_policy_id_data_access_policies_id_fk" FOREIGN KEY ("data_access_policy_id") REFERENCES "public"."data_access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;