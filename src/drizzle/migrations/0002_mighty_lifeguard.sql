CREATE TABLE "permissions" (
	"name" varchar(100) PRIMARY KEY NOT NULL,
	"description" text,
	"resource" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_name" varchar(100) NOT NULL,
	"permission_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_name_roles_name_fk" FOREIGN KEY ("role_name") REFERENCES "public"."roles"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_name_permissions_name_fk" FOREIGN KEY ("permission_name") REFERENCES "public"."permissions"("name") ON DELETE cascade ON UPDATE no action;