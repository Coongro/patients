/**
 * Ficha del dueño. Usa ContactDetail de @coongro/contacts con secciones extra.
 */
import { ContactDetail, ContactForm } from '@coongro/contacts';
import type { Contact } from '@coongro/contacts';
import { getHostReact, usePlugin } from '@coongro/plugin-sdk';

import { PetCard } from '../../components/PetCard.js';
import { PetForm } from '../../components/PetForm.js';
import { usePetsByOwner } from '../../hooks/usePetsByOwner.js';
import { useVetOwner } from '../../hooks/useVetOwner.js';
import type { Pet } from '../../types/pet.js';
import { formatReferral } from '../../utils/labels.js';

const React = getHostReact();
const { useState, useCallback, useEffect } = React;

export function OwnerDetailView(props: { contactId?: string }) {
  const { views } = usePlugin();
  const contactId = props.contactId ?? (views.params as Record<string, string>)?.contactId;

  const { pets, refetch: refreshPets } = usePetsByOwner(contactId);
  const { vetOwner } = useVetOwner(contactId);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);

  const handleBack = useCallback(() => {
    views.open('patients.owners.open');
  }, [views]);

  const handleEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(
    (_contact: Contact) => {
      setShowEditModal(false);
      // Recargar la vista para ver datos actualizados
      views.open('patients.owner-detail.open', { contactId });
    },
    [views, contactId]
  );

  const handleAddPetSuccess = useCallback(
    (_pet: Pet) => {
      setShowAddPetModal(false);
      refreshPets();
    },
    [refreshPets]
  );

  // Cerrar modales con ESC
  useEffect(() => {
    if (!showEditModal && !showAddPetModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEditModal(false);
        setShowAddPetModal(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showEditModal, showAddPetModal]);

  const handleNavigateToPet = useCallback(
    (pet: Pet) => {
      views.open('patients.detail.open', { petId: pet.id });
    },
    [views]
  );

  const handleAddPet = useCallback(() => {
    setShowAddPetModal(true);
  }, []);

  if (!contactId) {
    return (
      <div className="p-6 text-center text-sm text-[var(--cg-text-muted)]">
        No se especificó un dueño.
      </div>
    );
  }

  // Secciones extra para ContactDetail
  const extraSections = [
    // Datos veterinarios
    vetOwner
      ? {
          title: 'Datos veterinarios',
          order: 5,
          render: () =>
            React.createElement(
              'div',
              { className: 'grid grid-cols-2 gap-3' },
              vetOwner.emergency_phone && renderField('Tel. emergencia', vetOwner.emergency_phone),
              vetOwner.preferred_vet && renderField('Vet preferido', vetOwner.preferred_vet),
              vetOwner.referral_source &&
                renderField('Llegó por', formatReferral(vetOwner.referral_source)),
              vetOwner.notes && renderField('Notas vet', vetOwner.notes)
            ),
        }
      : null,

    // Mascotas
    {
      title: 'Mascotas',
      order: 10,
      render: () =>
        React.createElement(
          'div',
          { className: 'flex flex-col gap-3' },
          pets.length === 0
            ? React.createElement(
                'p',
                { className: 'text-sm text-[var(--cg-text-muted)]' },
                'Este dueño no tiene mascotas registradas'
              )
            : pets.map((pet) =>
                React.createElement(PetCard, {
                  key: pet.id,
                  pet,
                  onClick: handleNavigateToPet,
                })
              ),
          React.createElement(
            'button',
            {
              onClick: handleAddPet,
              className:
                'flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-dashed border-[var(--cg-border)] text-[var(--cg-text-muted)] hover:border-[var(--cg-accent)] hover:text-[var(--cg-accent)] transition-colors',
            },
            React.createElement(
              'svg',
              {
                width: 14,
                height: 14,
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 2,
              },
              React.createElement('path', { d: 'M12 5v14M5 12h14' })
            ),
            'Agregar nueva mascota'
          )
        ),
    },
  ].filter(Boolean) as Array<{ title: string; order: number; render: () => unknown }>;

  return (
    <div className="font-inter min-h-screen bg-[var(--cg-bg-secondary)] p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {/* Botón volver */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-[var(--cg-text-muted)] hover:text-[var(--cg-text)] transition-colors w-fit"
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <ContactDetail contactId={contactId} extraSections={extraSections} onEdit={handleEdit} />
      </div>

      {showEditModal &&
        React.createElement(
          'div',
          {
            className: 'fixed inset-0 z-[300] flex items-center justify-center',
            onClick: (e: React.MouseEvent) => {
              if (e.target === e.currentTarget) setShowEditModal(false);
            },
          },
          React.createElement('div', {
            className: 'absolute inset-0 bg-[var(--cg-bg-overlay)]',
          }),
          React.createElement(
            'div',
            {
              className:
                'relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-xl animate-in fade-in-0 zoom-in-95',
            },
            React.createElement(
              'div',
              {
                className:
                  'flex items-center justify-between px-6 py-4 border-b border-[var(--cg-border)]',
              },
              React.createElement(
                'h2',
                { className: 'text-lg font-semibold text-[var(--cg-text)]' },
                'Editar dueño'
              ),
              React.createElement(
                'button',
                {
                  onClick: () => setShowEditModal(false),
                  className:
                    'p-1.5 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]',
                },
                React.createElement(
                  'svg',
                  {
                    width: 18,
                    height: 18,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                  },
                  React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'p-6' },
              React.createElement(ContactForm, {
                contactId,
                hiddenFields: ['type'],
                onSuccess: handleEditSuccess,
                onCancel: () => setShowEditModal(false),
              })
            )
          )
        )}

      {showAddPetModal &&
        React.createElement(
          'div',
          {
            className: 'fixed inset-0 z-[300] flex items-center justify-center',
            onClick: (e: React.MouseEvent) => {
              if (e.target === e.currentTarget) setShowAddPetModal(false);
            },
          },
          React.createElement('div', {
            className: 'absolute inset-0 bg-[var(--cg-bg-overlay)]',
          }),
          React.createElement(
            'div',
            {
              className:
                'relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-xl animate-in fade-in-0 zoom-in-95',
            },
            React.createElement(
              'div',
              {
                className:
                  'flex items-center justify-between px-6 py-4 border-b border-[var(--cg-border)]',
              },
              React.createElement(
                'h2',
                { className: 'text-lg font-semibold text-[var(--cg-text)]' },
                'Nueva mascota'
              ),
              React.createElement(
                'button',
                {
                  onClick: () => setShowAddPetModal(false),
                  className:
                    'p-1.5 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]',
                },
                React.createElement(
                  'svg',
                  {
                    width: 18,
                    height: 18,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                  },
                  React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'p-6' },
              React.createElement(PetForm, {
                defaults: { owner_id: contactId },
                onSuccess: handleAddPetSuccess,
                onCancel: () => setShowAddPetModal(false),
              })
            )
          )
        )}
    </div>
  );
}

function renderField(label: string, value: string) {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-0.5' },
    React.createElement('span', { className: 'text-xs text-[var(--cg-text-muted)]' }, label),
    React.createElement('span', { className: 'text-sm text-[var(--cg-text)]' }, value)
  );
}
