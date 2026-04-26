/**
 * Props para todos los componentes reutilizables de patients.
 * Reutiliza ColumnDef, ActionDef, etc. de @coongro/contacts.
 */
import type { ColumnDef, ActionDef, FieldDef, SectionDef, StatDef } from '@coongro/contacts';
import type { ReactNode, Ref } from 'react';

import type { PetFilters } from './filters.js';
import type { Pet, PetCreateData } from './pet.js';

// Re-exportar tipos de contacts para conveniencia
export type { ColumnDef, ActionDef, FieldDef, SectionDef, StatDef };

// ---------------------------------------------------------------------------
// PetsTable
// ---------------------------------------------------------------------------

export interface PetsTableProps {
  filters?: PetFilters;
  columns?: ColumnDef<Pet>[];
  extraColumns?: ColumnDef<Pet>[];
  extraActions?: ActionDef<Pet>[];
  onRowClick?: (pet: Pet) => void;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  /** Acción (botón) mostrada en el empty state cuando no hay pacientes registrados */
  emptyStateAction?: ReactNode;
}

// ---------------------------------------------------------------------------
// PetForm
// ---------------------------------------------------------------------------

export interface PetFormProps {
  petId?: string;
  defaults?: Partial<PetCreateData>;
  onSuccess?: (pet: Pet) => void;
  onCancel?: () => void;
  className?: string;
  /** Ref al elemento <form>. El caller puede disparar submit con `formRef.current?.requestSubmit()` */
  formRef?: Ref<HTMLFormElement>;
  /** Si es true, el form no renderiza sus propios botones (los pone el caller en el footer del dialog) */
  hideActions?: boolean;
  /** Notifica al caller cuando cambia el estado de guardado */
  onSavingChange?: (saving: boolean) => void;
}

// ---------------------------------------------------------------------------
// PetCard
// ---------------------------------------------------------------------------

export interface PetCardProps {
  petId?: string;
  pet?: Pet;
  showOwner?: boolean;
  extraInfo?: unknown;
  actions?: ActionDef<Pet>[];
  onClick?: (pet: Pet) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// PetDetail
// ---------------------------------------------------------------------------

export interface PetDetailProps {
  petId: string;
  extraSections?: SectionDef[];
  extraActions?: ActionDef<Pet>[];
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
  onBack?: () => void;
  onNavigate?: (viewId: string, params?: Record<string, unknown>) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// PetPicker
// ---------------------------------------------------------------------------

export interface PetPickerProps {
  filters?: PetFilters;
  value?: string | null;
  onChange?: (pet: Pet | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// PetStats
// ---------------------------------------------------------------------------

export interface PetStatsProps {
  layout?: 'row' | 'grid';
  extraStats?: StatDef[];
  className?: string;
}

// ---------------------------------------------------------------------------
// CreatePetButton
// ---------------------------------------------------------------------------

export interface CreatePetButtonProps {
  defaults?: Partial<PetCreateData>;
  label?: string;
  onSuccess?: (pet: Pet) => void;
  variant?: 'primary' | 'outline';
  className?: string;
}
