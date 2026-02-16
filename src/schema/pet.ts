import { sql } from 'drizzle-orm';
import { boolean, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const petTable = pgTable('module_patients_pets', {
  id: uuid('id').primaryKey().notNull(),
  name: text('name').notNull(),
  species: text('species').notNull(),
  breed: text('breed'),
  sex: text('sex'),
  color_markings: text('color_markings'),
  birth_date: text('birth_date'),
  weight_kg: numeric('weight_kg'),
  microchip_number: text('microchip_number'),
  owner_id: text('owner_id').notNull(),
  photo_url: text('photo_url'),
  status: text('status').notNull(),
  reproductive_status: text('reproductive_status'),
  allergies: jsonb('allergies'),
  chronic_conditions: jsonb('chronic_conditions'),
  tags: jsonb('tags'),
  metadata: jsonb('metadata'),
  notes: text('notes'),
  is_active: boolean('is_active').notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type PetRow = typeof petTable.$inferSelect;
export type NewPetRow = typeof petTable.$inferInsert;
