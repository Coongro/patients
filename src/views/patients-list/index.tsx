/**
 * Vista principal: lista de pacientes con stats, filtros y búsqueda.
 */
import { getHostReact, usePlugin } from '@coongro/plugin-sdk';

import { CreatePetButton } from '../../components/CreatePetButton.js';
import { PetsTable } from '../../components/PetsTable.js';
import { PetStats } from '../../components/PetStats.js';
import type { Pet } from '../../types/pet.js';

const React = getHostReact();
const { useCallback } = React;

export function PatientsListView() {
  const { views } = usePlugin();

  const handleRowClick = useCallback(
    (pet: Pet) => {
      views.open('patients.detail.open', { petId: pet.id });
    },
    [views]
  );

  const handleCreated = useCallback(
    (pet: Pet) => {
      views.open('patients.detail.open', { petId: pet.id });
    },
    [views]
  );

  return (
    <div className="font-inter min-h-screen bg-cg-bg-secondary p-6">
      <div className="w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cg-text">Pacientes</h1>
            <p className="text-sm text-cg-text-muted mt-1">
              Gestión de mascotas y pacientes veterinarios
            </p>
          </div>
          <CreatePetButton onSuccess={handleCreated} />
        </div>

        {/* Stats */}
        <PetStats layout="row" />

        {/* Tabla */}
        <div className="bg-cg-bg rounded-xl border border-cg-border p-6 shadow-sm">
          <PetsTable
            pageSize={20}
            onRowClick={handleRowClick}
            extraActions={[
              {
                label: 'Ver',
                onClick: (pet: Pet) => views.open('patients.detail.open', { petId: pet.id }),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
