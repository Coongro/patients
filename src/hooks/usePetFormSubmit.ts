/**
 * Hook que encapsula la validación y submit del formulario de mascota.
 * Extrae la complejidad de PetForm para mantener el componente enfocado en UI.
 */
import { usePlugin, getHostReact } from '@coongro/plugin-sdk';

import type { Pet, PetCreateData } from '../types/pet.js';

import type { PatientsSettings } from './usePatientsSettings.js';
import { usePetMutations } from './usePetMutations.js';
import { useVetOwnerMutations } from './useVetOwnerMutations.js';

const { useCallback } = getHostReact();

const VALIDATION_TITLE = 'Validación';

interface UsePetFormSubmitOptions {
  petId?: string;
  settings: PatientsSettings;
  onSuccess?: (pet: Pet) => void;
}

function validateForm(
  formData: Record<string, unknown>,
  settings: PatientsSettings,
  toast: { error: (title: string, msg: string) => void }
): boolean {
  const name = (formData.name as string)?.trim();
  if (!name || name.length < 2) {
    toast.error(VALIDATION_TITLE, 'El nombre debe tener al menos 2 caracteres');
    return false;
  }

  if (!formData.owner_id) {
    toast.error(VALIDATION_TITLE, 'Debe seleccionar un dueño');
    return false;
  }

  if (settings.requireSex && !formData.sex) {
    toast.error(VALIDATION_TITLE, 'Debe seleccionar el sexo');
    return false;
  }

  const birthDate = formData.birth_date as string;
  if (settings.requireBirthDate && !birthDate) {
    toast.error(VALIDATION_TITLE, 'Debe indicar la fecha de nacimiento');
    return false;
  }
  if (birthDate && new Date(birthDate) > new Date()) {
    toast.error(VALIDATION_TITLE, 'La fecha de nacimiento no puede ser futura');
    return false;
  }

  if (settings.requireMicrochip && !formData.microchip_number) {
    toast.error(VALIDATION_TITLE, 'Debe indicar el número de microchip');
    return false;
  }

  const weight = formData.weight_kg ? Number(formData.weight_kg) : null;
  if (weight !== null && (weight <= 0 || weight >= 200)) {
    toast.error(VALIDATION_TITLE, 'El peso debe ser positivo y menor a 200 kg');
    return false;
  }

  return true;
}

function buildPetData(formData: Record<string, unknown>): PetCreateData {
  const allergies = (formData.allergies_list as string[])?.length
    ? (formData.allergies_list as string[])
    : null;
  const chronicConditions = (formData.chronic_list as string[])?.length
    ? (formData.chronic_list as string[])
    : null;
  const weight = formData.weight_kg ? Number(formData.weight_kg) : null;

  return {
    name: ((formData.name as string) ?? '').trim(),
    species: formData.species as string,
    breed: (formData.breed as string) || null,
    sex: (formData.sex as string) || null,
    color_markings: (formData.color_markings as string) || null,
    birth_date: (formData.birth_date as string) || null,
    weight_kg: weight ? String(weight) : null,
    microchip_number: (formData.microchip_number as string) || null,
    owner_id: formData.owner_id as string,
    photo_url: (formData.photo_url as string) || null,
    status: (formData.status as string) || 'active',
    reproductive_status: (formData.reproductive_status as string) || null,
    allergies,
    chronic_conditions: chronicConditions,
    notes: (formData.notes as string) || null,
    is_active: formData.is_active as boolean,
  };
}

export function usePetFormSubmit(options: UsePetFormSubmitOptions) {
  const { petId, settings, onSuccess } = options;
  const isEdit = !!petId;
  const { create, update, creating, updating } = usePetMutations();
  const { ensureOwner } = useVetOwnerMutations();
  const { toast } = usePlugin();

  const submit = useCallback(
    async (formData: Record<string, unknown>, vetData: Record<string, unknown>) => {
      if (!validateForm(formData, settings, toast)) return;

      try {
        const petData = buildPetData(formData);

        const result = isEdit && petId ? await update(petId, petData) : await create(petData);

        if (!result) return;

        const hasVetData = Object.values(vetData).some((v) => v);
        if (hasVetData) {
          const owner = await ensureOwner(result.owner_id, vetData as Record<string, string>);
          if (!owner) {
            toast.error(
              'Datos del dueño',
              'El paciente se guardó pero no se pudieron guardar los datos veterinarios del dueño.'
            );
          }
        }
        onSuccess?.(result);
      } catch {
        toast.error('Error', 'Ocurrió un error inesperado al guardar el paciente.');
      }
    },
    [settings, isEdit, petId, create, update, ensureOwner, onSuccess, toast]
  );

  return { submit, isSaving: creating || updating };
}
