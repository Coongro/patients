import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/schema/pet.ts', './src/schema/vet-owner.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
});
