import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const vetOwnerTable = pgTable('module_patients_vet_owners', {
  id: uuid('id').primaryKey().notNull(),
  contact_id: text('contact_id').notNull(),
  preferred_vet_staff_id: text('preferred_vet_staff_id'),
  emergency_phone: text('emergency_phone'),
  referral_source: text('referral_source'),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type VetOwnerRow = typeof vetOwnerTable.$inferSelect;
export type NewVetOwnerRow = typeof vetOwnerTable.$inferInsert;
