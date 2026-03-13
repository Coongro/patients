/**
 * Ficha completa del paciente.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { PetDetail } from '../../components/PetDetail.js';
import { PetForm } from '../../components/PetForm.js';
import type { Pet } from '../../types/pet.js';

const React = getHostReact();
const UI = getHostUI();
const { useCallback, useState } = React;

export function PatientDetailView(props: { petId?: string }) {
  const { views, toast } = usePlugin();
  const petId = props.petId ?? (views.params as Record<string, string>)?.petId;

  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBack = useCallback(() => {
    views.open('patients.list.open');
  }, [views]);

  const handleEdit = useCallback((_pet: Pet) => {
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false);
    setRefreshKey((k: number) => k + 1);
    toast.success('Paciente actualizado', 'Los datos se guardaron correctamente');
  }, [toast]);

  const handleDelete = useCallback(
    (pet: Pet) => {
      toast.warning('Confirmar', `¿Eliminar a ${pet.name}?`);
    },
    [toast]
  );

  const handleNavigate = useCallback(
    (viewId: string, params?: Record<string, unknown>) => {
      views.open(viewId, params);
    },
    [views]
  );

  if (!petId) {
    return React.createElement(
      'div',
      { className: 'p-6 text-center text-sm text-cg-text-muted' },
      'No se especificó un paciente.'
    );
  }

  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      { className: 'w-full' },
      React.createElement(PetDetail, {
        key: refreshKey,
        petId,
        onBack: handleBack,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onNavigate: handleNavigate,
      })
    ),

    // Modal de edición
    React.createElement(
      UI.FormDialog,
      {
        open: showEditModal,
        onOpenChange: setShowEditModal,
        title: 'Editar paciente',
        size: 'lg',
      },
      React.createElement(PetForm, {
        petId,
        onSuccess: handleEditSuccess,
        onCancel: () => setShowEditModal(false),
      })
    )
  );
}
