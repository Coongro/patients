/**
 * Ficha del dueño. Usa ContactDetail de @coongro/contacts con secciones extra.
 */
import { ContactDetail, ContactForm } from '@coongro/contacts';
import type { Contact } from '@coongro/contacts';
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { PetCard } from '../../components/PetCard.js';
import { PetForm } from '../../components/PetForm.js';
import { usePetsByOwner } from '../../hooks/usePetsByOwner.js';
import { useVetOwner } from '../../hooks/useVetOwner.js';
import type { Pet } from '../../types/pet.js';
import { formatReferral } from '../../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

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
      views.open('patients.owner-detail.open', { contactId });
    },
    [views, contactId]
  );

  const handleAddPetSuccess = useCallback(
    (_pet: Pet) => {
      setShowAddPetModal(false);
      void refreshPets();
    },
    [refreshPets]
  );

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
    return React.createElement(
      'div',
      { className: 'p-6 text-center text-sm text-cg-text-muted' },
      'No se especificó un dueño.'
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
            ? React.createElement(UI.EmptyState, {
                title: 'Este dueño no tiene mascotas registradas',
              })
            : pets.map((pet) =>
                React.createElement(PetCard, {
                  key: pet.id,
                  pet,
                  onClick: handleNavigateToPet,
                })
              ),
          React.createElement(
            UI.Button,
            {
              variant: 'outline',
              onClick: handleAddPet,
              className: 'gap-2 border-dashed',
            },
            React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 14 }),
            'Agregar nueva mascota'
          )
        ),
    },
  ].filter(Boolean) as Array<{ title: string; order: number; render: () => unknown }>;

  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      { className: 'w-full flex flex-col gap-4' },
      // Botón volver
      React.createElement(
        UI.Button,
        {
          variant: 'ghost',
          onClick: handleBack,
          className: 'gap-1 w-fit',
        },
        React.createElement(UI.DynamicIcon, { icon: 'ArrowLeft', size: 16 }),
        'Volver'
      ),

      React.createElement(ContactDetail, {
        contactId,
        extraSections,
        onEdit: handleEdit,
      })
    ),

    // Modal editar dueño
    React.createElement(
      UI.FormDialog,
      {
        open: showEditModal,
        onOpenChange: setShowEditModal,
        title: 'Editar dueño',
        size: 'md',
      },
      React.createElement(ContactForm, {
        contactId,
        hiddenFields: ['type'],
        onSuccess: handleEditSuccess,
        onCancel: () => setShowEditModal(false),
      })
    ),

    // Modal agregar mascota
    React.createElement(
      UI.FormDialog,
      {
        open: showAddPetModal,
        onOpenChange: setShowAddPetModal,
        title: 'Nueva mascota',
        size: 'lg',
      },
      React.createElement(PetForm, {
        defaults: { owner_id: contactId },
        onSuccess: handleAddPetSuccess,
        onCancel: () => setShowAddPetModal(false),
      })
    )
  );
}

function renderField(label: string, value: string) {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-0.5' },
    React.createElement('span', { className: 'text-xs text-cg-text-muted' }, label),
    React.createElement('span', { className: 'text-sm text-cg-text' }, value)
  );
}
