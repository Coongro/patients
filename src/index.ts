/**
 * @coongro/patients — Bloque de gestión de pacientes veterinarios
 *
 * Exporta:
 * - Schema y tipos de la base de datos
 * - Repositories para operaciones CRUD
 * - Hooks React para datos
 * - Componentes React reutilizables
 * - Tipos de props para extensión por bloques
 * - Utilidades (calculateAge, labels)
 */

// Schema + Repository → exportados via subpath '@coongro/patients/server'
// NO exportar aquí: contienen imports de drizzle-orm que no corren en el browser
export type { PetRow, NewPetRow } from './schema/pet.js';
export type { VetOwnerRow, NewVetOwnerRow } from './schema/vet-owner.js';
export type { CountResult } from './repositories/pet.repository.js';
export type { VetOwnerSearchParams } from './repositories/vet-owner.repository.js';

// Types
export type {
  Pet,
  PetCreateData,
  PetUpdateData,
  Species,
  PetStatus,
  PetSex,
  ReproductiveStatus,
} from './types/pet.js';
export type {
  VetOwner,
  VetOwnerCreateData,
  VetOwnerUpdateData,
  ReferralSource,
} from './types/vet-owner.js';
export type { PetFilters, VetOwnerFilters, SortDirection } from './types/filters.js';
export type {
  PetsTableProps,
  PetFormProps,
  PetCardProps,
  PetDetailProps,
  PetPickerProps,
  PetStatsProps,
  CreatePetButtonProps,
} from './types/components.js';

// Hooks
export { usePets } from './hooks/usePets.js';
export type { UsePetsOptions, UsePetsResult } from './hooks/usePets.js';
export { usePet } from './hooks/usePet.js';
export type { UsePetResult } from './hooks/usePet.js';
export { usePetMutations } from './hooks/usePetMutations.js';
export type { UsePetMutationsResult } from './hooks/usePetMutations.js';
export { usePetsByOwner } from './hooks/usePetsByOwner.js';
export type { UsePetsByOwnerResult } from './hooks/usePetsByOwner.js';
export { usePetStats } from './hooks/usePetStats.js';
export type { PetStatsData } from './hooks/usePetStats.js';
export { useVetOwner } from './hooks/useVetOwner.js';
export type { UseVetOwnerResult } from './hooks/useVetOwner.js';
export { useVetOwnerMutations } from './hooks/useVetOwnerMutations.js';
export type { UseVetOwnerMutationsResult } from './hooks/useVetOwnerMutations.js';

// Components
export { PetsTable } from './components/PetsTable.js';
export { PetForm } from './components/PetForm.js';
export { PetCard } from './components/PetCard.js';
export { PetDetail } from './components/PetDetail.js';
export { PetPicker } from './components/PetPicker.js';
export { PetStats } from './components/PetStats.js';
export { CreatePetButton } from './components/CreatePetButton.js';

// Settings
export { usePatientsSettings } from './hooks/usePatientsSettings.js';
export type { PatientsSettings } from './hooks/usePatientsSettings.js';

// Utils
export { calculateAge } from './utils/age.js';
export {
  formatSpecies,
  formatStatus,
  formatSex,
  formatReproductive,
  formatReferral,
  SPECIES_LABELS,
  STATUS_LABELS,
  SEX_LABELS,
  REPRODUCTIVE_LABELS,
  REFERRAL_LABELS,
  SPECIES_ICON,
} from './utils/labels.js';
