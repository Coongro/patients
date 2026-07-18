/**
 * Tipos de mascota para uso en componentes y hooks.
 */

export type Species = 'dog' | 'cat' | 'bird' | 'reptile' | 'rodent' | 'other';
export type PetStatus = 'active' | 'deceased' | 'referred' | 'lost';
export type PetSex = 'male' | 'female' | 'unknown';
export type ReproductiveStatus = 'intact' | 'neutered' | 'spayed';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  color_markings: string | null;
  birth_date: string | null;
  birth_date_estimated: boolean;
  weight_kg: string | null;
  microchip_number: string | null;
  owner_id: string;
  photo_url: string | null;
  status: string;
  reproductive_status: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetCreateData {
  id?: string;
  name: string;
  species: string;
  breed?: string | null;
  sex?: string | null;
  color_markings?: string | null;
  birth_date?: string | null;
  birth_date_estimated?: boolean;
  weight_kg?: string | null;
  microchip_number?: string | null;
  owner_id: string;
  photo_url?: string | null;
  status?: string;
  reproductive_status?: string | null;
  allergies?: string[] | null;
  chronic_conditions?: string[] | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  is_active?: boolean;
}

export type PetUpdateData = Partial<PetCreateData>;
