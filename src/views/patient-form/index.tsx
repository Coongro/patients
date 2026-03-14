/**
 * Formulario de alta/edición de paciente.
 */
import { getHostReact, usePlugin } from '@coongro/plugin-sdk';

import { PetForm } from '../../components/PetForm.js';
import { usePatientsSettings } from '../../hooks/usePatientsSettings.js';
import type { Pet } from '../../types/pet.js';

const React = getHostReact();
const { useCallback } = React;

export function PatientFormView(props: { petId?: string }) {
  const { views } = usePlugin();
  const petId = props.petId ?? (views.params as Record<string, string>)?.petId;
  const { settings: pSettings } = usePatientsSettings();

  const handleSuccess = useCallback(
    (pet: Pet) => {
      if (pSettings.openDetailOnCreate || petId) {
        views.open('patients.detail.open', { petId: pet.id });
      } else {
        views.open('patients.list.open');
      }
    },
    [views, pSettings.openDetailOnCreate, petId]
  );

  const handleCancel = useCallback(() => {
    if (petId) {
      views.open('patients.detail.open', { petId });
    } else {
      views.open('patients.list.open');
    }
  }, [views, petId]);

  return (
    <div className="font-inter min-h-screen bg-cg-bg-secondary p-6">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cg-text">
            {petId ? 'Editar paciente' : 'Nuevo paciente'}
          </h1>
          <p className="text-sm text-cg-text-muted mt-1">
            {petId ? 'Modificar datos del paciente' : 'Registrar una nueva mascota'}
          </p>
        </div>
        <div className="bg-cg-bg rounded-xl border border-cg-border p-6 shadow-sm">
          <PetForm petId={petId} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
