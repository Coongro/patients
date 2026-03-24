/**
 * Exportaciones server-only (drizzle-orm, repositories, schema tables).
 * NO importar desde el browser — usar '@coongro/patients' (entry principal) para hooks/componentes.
 */

export { petTable } from './schema/pet.js';
export type { PetRow, NewPetRow } from './schema/pet.js';
export { vetOwnerTable } from './schema/vet-owner.js';
export type { VetOwnerRow, NewVetOwnerRow } from './schema/vet-owner.js';
export { PetRepository } from './repositories/pet.repository.js';
export type { CountResult } from './repositories/pet.repository.js';
export { VetOwnerRepository } from './repositories/vet-owner.repository.js';
export type { VetOwnerSearchParams } from './repositories/vet-owner.repository.js';
