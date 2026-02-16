/**
 * Ficha completa del paciente.
 */
import { getHostReact, usePlugin } from '@coongro/plugin-sdk';

import { PetDetail } from '../../components/PetDetail.js';
import { PetForm } from '../../components/PetForm.js';
import type { Pet } from '../../types/pet.js';

const React = getHostReact();
const { useCallback, useState, useEffect } = React;

export function PatientDetailView(props: { petId?: string }) {
  const { views, toast } = usePlugin();
  const petId = props.petId ?? (views.params as Record<string, string>)?.petId;

  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBack = useCallback(() => {
    views.open('patients.list.open');
  }, [views]);

  const handleEdit = useCallback(
    (_pet: Pet) => {
      setShowEditModal(true);
    },
    []
  );

  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false);
    setRefreshKey((k: number) => k + 1);
    toast.success('Paciente actualizado', 'Los datos se guardaron correctamente');
  }, [toast]);

  // Cerrar modal con ESC
  useEffect(() => {
    if (!showEditModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEditModal(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showEditModal]);

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
    return (
      <div className="p-6 text-center text-sm text-[var(--cg-text-muted)]">
        No se especificó un paciente.
      </div>
    );
  }

  return (
    <div className="font-inter min-h-screen bg-[var(--cg-bg-secondary)] p-6">
      <div className="max-w-3xl mx-auto">
        <PetDetail
          key={refreshKey}
          petId={petId}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNavigate={handleNavigate}
        />
      </div>

      {showEditModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          onClick={(e: React.MouseEvent) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div className="absolute inset-0 bg-[var(--cg-bg-overlay)]" />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cg-border)]">
              <h2 className="text-lg font-semibold text-[var(--cg-text)]">Editar paciente</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <PetForm
                petId={petId}
                onSuccess={handleEditSuccess}
                onCancel={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
