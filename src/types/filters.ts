/**
 * Filtros para búsqueda de mascotas.
 */
export type SortDirection = 'asc' | 'desc';

export interface PetFilters {
  query?: string;
  species?: string;
  status?: string;
  breed?: string;
  ownerId?: string;
  tags?: string[];
  isActive?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: SortDirection;
}

export interface VetOwnerFilters {
  query?: string;
  referralSource?: string;
  limit?: number;
  offset?: number;
}
