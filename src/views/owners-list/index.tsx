/**
 * Lista de dueños. Usa ContactsTable de @coongro/contacts con columna extra de mascotas.
 */
import { ContactsTable, CreateContactButton } from '@coongro/contacts';
import type { Contact } from '@coongro/contacts';
import { getHostReact, getHostUI, usePlugin, actions } from '@coongro/plugin-sdk';

import type { Pet } from '../../types/pet.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback } = React;

export function OwnersListView() {
  const { views } = usePlugin();
  const [petCounts, setPetCounts] = useState<Record<string, number>>({});

  // Cargar conteo de mascotas por dueño
  useEffect(() => {
    void (async () => {
      try {
        const allPets = await actions.execute<Pet[]>('patients.pets.search', {
          limit: 10000,
        });
        const counts: Record<string, number> = {};
        for (const pet of allPets) {
          counts[pet.owner_id] = (counts[pet.owner_id] ?? 0) + 1;
        }
        setPetCounts(counts);
      } catch {
        // Silenciar error, solo es UI extra
      }
    })();
  }, []);

  const handleRowClick = useCallback(
    (contact: Contact) => {
      views.open('patients.owner-detail.open', { contactId: contact.id });
    },
    [views]
  );

  const handleOwnerCreated = useCallback(
    (contact: Contact) => {
      views.open('patients.owner-detail.open', { contactId: contact.id });
    },
    [views]
  );

  return (
    <div className="font-inter min-h-screen bg-cg-bg-secondary p-6">
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cg-text">Dueños</h1>
            <p className="text-sm text-cg-text-muted mt-1">Contactos que son dueños de mascotas</p>
          </div>
          <div className="w-48">
            <CreateContactButton
              label="Nuevo dueño"
              defaults={{ type: 'person' }}
              onSuccess={handleOwnerCreated}
            />
          </div>
        </div>

        <div className="bg-cg-bg rounded-xl border border-cg-border p-6 shadow-sm">
          <ContactsTable
            filters={{ type: 'person' }}
            columns={[
              { key: 'name', header: 'Nombre' },
              { key: 'phone', header: 'Teléfono', render: (c: Contact) => c.phone ?? '—' },
              { key: 'email', header: 'Email', render: (c: Contact) => c.email ?? '—' },
              {
                key: 'is_active',
                header: 'Estado',
                render: (c: Contact) =>
                  React.createElement(
                    UI.Badge,
                    { variant: c.is_active ? 'success-soft' : 'secondary', size: 'sm' },
                    c.is_active ? 'Activo' : 'Inactivo'
                  ),
              },
            ]}
            pageSize={20}
            onRowClick={handleRowClick}
            extraColumns={[
              {
                key: 'pet_count',
                header: 'Mascotas',
                render: (contact: Contact) => {
                  const count = petCounts[contact.id] ?? 0;
                  return count > 0
                    ? React.createElement(
                        'span',
                        { className: 'inline-flex items-center gap-1' },
                        count,
                        React.createElement(UI.DynamicIcon, { icon: 'PawPrint', size: 14 })
                      )
                    : '—';
                },
              },
            ]}
            extraActions={[
              {
                label: 'Ver',
                onClick: (contact: Contact) =>
                  views.open('patients.owner-detail.open', { contactId: contact.id }),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
