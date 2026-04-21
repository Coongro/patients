/**
 * Tipos de datos veterinarios del dueño (bridge con contacts).
 */

export type ReferralSource = 'referral' | 'google' | 'social' | 'walk_in' | 'other';

export interface VetOwner {
  id: string;
  contact_id: string;
  preferred_vet_staff_id: string | null;
  emergency_phone: string | null;
  referral_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VetOwnerCreateData {
  id?: string;
  contact_id: string;
  preferred_vet_staff_id?: string | null;
  emergency_phone?: string | null;
  referral_source?: string | null;
  notes?: string | null;
}

export type VetOwnerUpdateData = Partial<Omit<VetOwnerCreateData, 'contact_id'>>;
