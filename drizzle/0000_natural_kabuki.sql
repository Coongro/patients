CREATE TABLE "module_patients_pets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"species" text NOT NULL,
	"breed" text,
	"sex" text,
	"color_markings" text,
	"birth_date" text,
	"weight_kg" numeric,
	"microchip_number" text,
	"owner_id" text NOT NULL,
	"photo_url" text,
	"status" text NOT NULL,
	"reproductive_status" text,
	"allergies" jsonb,
	"chronic_conditions" jsonb,
	"tags" jsonb,
	"metadata" jsonb,
	"notes" text,
	"is_active" boolean NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_patients_vet_owners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"preferred_vet" text,
	"emergency_phone" text,
	"referral_source" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
