ALTER TABLE "module_patients_vet_owners" DROP COLUMN IF EXISTS "preferred_vet";--> statement-breakpoint
ALTER TABLE "module_patients_vet_owners" ADD COLUMN "preferred_vet_staff_id" text;
