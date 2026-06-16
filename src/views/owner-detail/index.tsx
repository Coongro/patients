/**
 * Ficha del dueño (Contacto Ficha — COONG-208).
 * Vista propia que replica el diseño aprobado: identidad + riel de contacto,
 * layout de 2 columnas (main: "Sus mascotas" + "Datos veterinarios"; aside:
 * "Notas" + metadata). No delega en el ContactDetail genérico — este es el
 * detalle específico del dueño veterinario. Reutiliza ui-components + tokens
 * cg-* (dark mode automático) y los hooks de datos de contacts/patients.
 */
import { ContactForm, useContact, useContactMutations } from '@coongro/contacts';
import type { Contact } from '@coongro/contacts';
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';
import { StaffBadge } from '@coongro/staff';

import { PetForm } from '../../components/PetForm.js';
import { usePetsByOwner } from '../../hooks/usePetsByOwner.js';
import { useVetOwner } from '../../hooks/useVetOwner.js';
import type { Pet } from '../../types/pet.js';
import { calculateAge } from '../../utils/age.js';
import { formatSpecies, formatSex, formatReferral, SPECIES_ICON } from '../../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

const SERIF = 'font-serif font-black tracking-tight';

/**
 * Breakpoint por JS (matchMedia). El layout de 2 columnas se aplica con estilos
 * inline, no con una clase arbitraria Tailwind: esa clase solo vive en el CSS
 * del plugin (inyectado con ref-counting) y a veces no cargó cuando la vista
 * rinde, dejando el aside abajo de forma intermitente. Inline es determinista.
 */
function useMinWidth(px: number): boolean {
  const { useState: useS, useEffect } = React;
  const query = `(min-width:${px}px)`;
  const [match, setMatch] = useS<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatch(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return match;
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  person: 'Persona',
  company: 'Empresa',
  other: 'Otro',
};

/** Paleta de avatar por especie (igual que la ficha de paciente) */
const SPECIES_PALETTE: Record<string, string> = {
  dog: 'bg-cg-gold-lt text-cg-gold-deep',
  cat: 'bg-cg-sky-lt text-cg-sky-deep',
  bird: 'bg-cg-pink-lt text-cg-pink-deep',
  reptile: 'bg-cg-teal-soft text-cg-teal-deep',
  rodent: 'bg-cg-bg-hover text-cg-text-secondary',
  other: 'bg-cg-bg-hover text-cg-text-secondary',
};

function eyebrow(text: string, className = 'text-cg-text-muted') {
  return React.createElement(
    'div',
    { className: `text-[11px] font-bold uppercase tracking-[0.08em] ${className}` },
    text
  );
}

/** Header de sección: caja de icono + eyebrow + título serif (variante dorada) */
function sectionHead(opts: { icon: string; eyebrowText: string; title: string; gold?: boolean }) {
  return React.createElement(
    'div',
    { className: 'flex items-center gap-3 px-6 py-4 border-b border-cg-border' },
    React.createElement(
      'span',
      {
        className: `w-9 h-9 rounded-md flex-shrink-0 inline-flex items-center justify-center border ${
          opts.gold
            ? 'bg-cg-gold-soft border-cg-gold-lt text-cg-gold-deep'
            : 'bg-cg-bg-hover border-cg-border text-cg-text-secondary'
        }`,
      },
      React.createElement(UI.DynamicIcon, { icon: opts.icon, size: 17 })
    ),
    React.createElement(
      'div',
      { className: 'min-w-0 flex-1' },
      eyebrow(
        opts.eyebrowText,
        opts.gold ? 'text-cg-gold-deep mb-0.5' : 'text-cg-text-muted mb-0.5'
      ),
      React.createElement('div', { className: `${SERIF} text-lg leading-none` }, opts.title)
    )
  );
}

/** Celda de campo (icono + label + valor) para riel de contacto y datos vet */
function fieldCell(opts: { icon: string; label: string; value: React.ReactNode; mono?: boolean }) {
  return React.createElement(
    'div',
    { className: 'flex gap-3 items-start' },
    React.createElement(
      'span',
      {
        className:
          'w-8 h-8 rounded-md flex-shrink-0 inline-flex items-center justify-center bg-cg-surface border border-cg-border text-cg-text-muted',
      },
      React.createElement(UI.DynamicIcon, { icon: opts.icon, size: 15 })
    ),
    React.createElement(
      'div',
      { className: 'min-w-0' },
      eyebrow(opts.label, 'text-cg-text-muted mb-1'),
      typeof opts.value === 'string'
        ? React.createElement(
            'div',
            {
              className: `text-sm text-cg-text break-words ${opts.mono ? 'font-mono tracking-wide' : ''}`,
            },
            opts.value
          )
        : opts.value
    )
  );
}

/** Tarjeta de mascota del dueño (clickeable) con paleta por especie */
function OwnerPetCard(props: { pet: Pet; onClick: (pet: Pet) => void }) {
  const { pet, onClick } = props;
  const palette = SPECIES_PALETTE[pet.species] ?? SPECIES_PALETTE.other;
  const icon = SPECIES_ICON[pet.species] ?? 'PawPrint';
  const age = calculateAge(pet.birth_date);
  const sex = formatSex(pet.sex);
  const inactive = pet.status !== 'active';

  const chip = (label: string, opts?: { icon?: string; warn?: boolean }) =>
    React.createElement(
      'span',
      {
        className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium ${
          opts?.warn ? 'bg-cg-gold-soft text-cg-gold-deep' : 'bg-cg-bg-hover text-cg-text-secondary'
        }`,
      },
      opts?.icon &&
        React.createElement(UI.DynamicIcon, {
          icon: opts.icon,
          size: 12,
          className: opts.warn ? undefined : 'text-cg-text-muted',
        }),
      label
    );

  return React.createElement(
    'button',
    {
      className:
        'w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-cg-surface border border-cg-border text-left transition-colors hover:border-cg-text-secondary',
      onClick: () => onClick(pet),
    },
    React.createElement(
      'span',
      {
        className: `w-14 h-14 rounded-lg flex-shrink-0 inline-flex items-center justify-center ${palette}`,
      },
      React.createElement(UI.DynamicIcon, { icon, size: 28 })
    ),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement(
        'div',
        { className: `${SERIF} text-[19px] leading-tight text-cg-text` },
        pet.name
      ),
      React.createElement(
        'div',
        { className: 'text-[12.5px] text-cg-text-muted mt-0.5' },
        [pet.breed, formatSpecies(pet.species)].filter(Boolean).join(' · ')
      ),
      React.createElement(
        'div',
        { className: 'flex flex-wrap gap-1.5 mt-2' },
        age && chip(age, { icon: 'Cake' }),
        sex && chip(sex, { icon: 'VenusAndMars' }),
        inactive && chip(pet.status, { warn: true })
      )
    ),
    React.createElement(UI.DynamicIcon, {
      icon: 'ChevronRight',
      size: 16,
      className: 'text-cg-text-muted flex-shrink-0',
    })
  );
}

export function OwnerDetailView(props: { contactId?: string }) {
  const { views } = usePlugin();
  const contactId = props.contactId ?? (views.params as Record<string, string>)?.contactId;

  const { contact, loading, refetch: refetchContact } = useContact(contactId);
  const { pets, refetch: refreshPets } = usePetsByOwner(contactId);
  const { vetOwner } = useVetOwner(contactId);
  const twoCol = useMinWidth(1024);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);
  const { softDelete: softDeleteContact, deleting } = useContactMutations();

  const handleBack = useCallback(() => {
    views.open('patients.owners.open');
  }, [views]);

  const handleEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const ok = await softDeleteContact(confirmDelete.id);
    if (ok) {
      setConfirmDelete(null);
      views.open('patients.owners.open');
    }
  }, [confirmDelete, softDeleteContact, views]);

  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false);
    void refetchContact();
  }, [refetchContact]);

  const handleAddPetSuccess = useCallback(() => {
    setShowAddPetModal(false);
    void refreshPets();
  }, [refreshPets]);

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

  // ── Action bar ──
  const actionBar = React.createElement(
    'div',
    { className: 'flex items-center gap-3 flex-wrap' },
    React.createElement(
      UI.Button,
      { variant: 'ghost', onClick: handleBack, className: 'gap-1.5' },
      React.createElement(UI.DynamicIcon, { icon: 'ArrowLeft', size: 16 }),
      'Volver a Dueños'
    ),
    React.createElement('div', { className: 'flex-1' }),
    contact &&
      React.createElement(
        UI.Button,
        { variant: 'outline', size: 'sm', onClick: handleEdit, className: 'gap-1.5' },
        React.createElement(UI.DynamicIcon, { icon: 'Pencil', size: 14 }),
        'Editar'
      ),
    contact &&
      React.createElement(
        UI.Button,
        {
          variant: 'destructive',
          size: 'sm',
          onClick: () => setConfirmDelete(contact),
          className: 'gap-1.5',
        },
        React.createElement(UI.DynamicIcon, { icon: 'Trash2', size: 14 }),
        'Eliminar'
      )
  );

  // ── Loading ──
  if (loading && !contact) {
    return React.createElement(
      'div',
      { className: 'font-sans min-h-screen bg-cg-bg-secondary p-6' },
      React.createElement(
        'div',
        {
          style: {
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          },
        },
        actionBar,
        React.createElement(
          UI.Card,
          { className: 'p-7 flex items-center gap-6' },
          React.createElement(UI.Skeleton, { className: 'w-24 h-24 rounded-2xl' }),
          React.createElement(
            'div',
            { className: 'flex flex-col gap-2 flex-1' },
            React.createElement(UI.Skeleton, { className: 'h-8 w-56' }),
            React.createElement(UI.Skeleton, { className: 'h-4 w-24' })
          )
        )
      )
    );
  }

  if (!contact) {
    return React.createElement(
      'div',
      { className: 'p-6 text-center text-sm text-cg-text-muted' },
      'Dueño no encontrado.'
    );
  }

  const typeLabel = CONTACT_TYPE_LABELS[contact.type] ?? contact.type;
  const initials =
    contact.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || '?';

  const contactFields = [
    { icon: 'Phone', label: 'Teléfono', value: contact.phone },
    { icon: 'Mail', label: 'Email', value: contact.email },
    { icon: 'MapPin', label: 'Dirección', value: contact.address },
    {
      icon: 'IdCard',
      label: 'Documento',
      mono: true,
      value: contact.document_number
        ? `${contact.document_type ?? ''} ${contact.document_number}`.trim()
        : null,
    },
  ].filter((f) => f.value);

  const petCount = pets.length;

  // ── Banner inactivo ──
  const inactiveBanner =
    !contact.is_active &&
    React.createElement(
      'div',
      {
        className:
          'flex items-center gap-3.5 rounded-xl px-5 py-3.5 bg-cg-neutral-950 text-cg-white',
      },
      React.createElement(UI.DynamicIcon, { icon: 'ShieldOff', size: 18 }),
      React.createElement(
        'div',
        { className: 'text-sm font-medium' },
        React.createElement(
          'strong',
          { className: 'uppercase tracking-wide text-[11px] mr-2 font-bold' },
          'Contacto inactivo'
        ),
        'No recibe recordatorios automáticos ni campañas. Reactivalo para volver a operarlo con normalidad.'
      )
    );

  // ── Card de identidad ──
  const identityCard = React.createElement(
    UI.Card,
    { className: `p-0 overflow-hidden ${contact.is_active ? '' : 'opacity-90'}` },
    React.createElement(
      'div',
      { className: 'flex items-center gap-6 px-7 py-6' },
      React.createElement(
        'span',
        {
          className: `w-24 h-24 rounded-2xl flex-shrink-0 inline-flex items-center justify-center bg-cg-text text-cg-text-inverse ${SERIF} text-3xl`,
        },
        initials
      ),
      React.createElement(
        'div',
        { className: 'flex-1 min-w-0' },
        eyebrow(typeLabel, 'text-cg-text-muted mb-1.5'),
        React.createElement(
          'h1',
          { className: `${SERIF} text-3xl leading-none m-0` },
          contact.name
        ),
        React.createElement(
          'div',
          { className: 'mt-3' },
          React.createElement(
            UI.Badge,
            { variant: contact.is_active ? 'success-soft' : 'secondary', size: 'sm' },
            contact.is_active ? 'Activo' : 'Inactivo'
          )
        )
      )
    ),
    contactFields.length > 0 &&
      React.createElement(
        'div',
        {
          className:
            'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-7 py-5 border-t border-cg-border bg-cg-bg-hover',
        },
        contactFields.map((f) =>
          React.createElement(fieldCell, {
            key: f.label,
            icon: f.icon,
            label: f.label,
            value: f.value,
            mono: f.mono,
          })
        )
      )
  );

  // ── Sus mascotas (hero) ──
  const petsHero = React.createElement(
    UI.Card,
    { className: 'p-0 overflow-hidden' },
    sectionHead({
      icon: 'PawPrint',
      eyebrowText:
        petCount === 0
          ? 'Sin mascotas'
          : `${petCount} ${petCount === 1 ? 'mascota registrada' : 'mascotas registradas'}`,
      title: 'Sus mascotas',
    }),
    React.createElement(
      'div',
      { className: 'px-6 py-5' },
      petCount === 0
        ? React.createElement(UI.EmptyState, {
            icon: React.createElement(UI.DynamicIcon, {
              icon: 'PawPrint',
              size: 24,
              className: 'text-cg-text-muted',
            }),
            title: 'Este dueño no tiene mascotas registradas',
            description: 'Cargá su primera mascota para empezar la ficha clínica.',
            action: React.createElement(
              UI.Button,
              { variant: 'default', onClick: handleAddPet, className: 'gap-2' },
              React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 14 }),
              'Agregar nueva mascota'
            ),
          })
        : React.createElement(
            'div',
            { className: 'flex flex-col gap-3' },
            React.createElement(
              'div',
              { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
              pets.map((pet) =>
                React.createElement(OwnerPetCard, {
                  key: pet.id,
                  pet,
                  onClick: handleNavigateToPet,
                })
              )
            ),
            React.createElement(
              UI.Button,
              {
                variant: 'outline',
                onClick: handleAddPet,
                className: 'gap-2 border-dashed w-full',
              },
              React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 14 }),
              'Agregar nueva mascota'
            )
          )
    )
  );

  // ── Datos veterinarios ── (siempre visible; con estado vacío si no hay datos)
  const vetFields = [
    vetOwner?.emergency_phone &&
      fieldCell({
        icon: 'Siren',
        label: 'Teléfono de emergencia',
        value: vetOwner.emergency_phone,
      }),
    vetOwner?.preferred_vet_staff_id &&
      fieldCell({
        icon: 'Stethoscope',
        label: 'Veterinario preferido',
        value: React.createElement(StaffBadge, {
          staffId: vetOwner.preferred_vet_staff_id,
          variant: 'compact',
        }),
      }),
    vetOwner?.referral_source &&
      fieldCell({
        icon: 'Compass',
        label: 'Cómo llegó',
        value: formatReferral(vetOwner.referral_source),
      }),
  ].filter(Boolean);

  const vetCard = React.createElement(
    UI.Card,
    { className: 'p-0 overflow-hidden' },
    sectionHead({
      icon: 'Stethoscope',
      eyebrowText: 'Kit veterinario',
      title: 'Datos veterinarios',
      gold: true,
    }),
    vetFields.length > 0
      ? React.createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-6 py-5' },
          ...vetFields
        )
      : React.createElement(
          'div',
          { className: 'px-6 py-6 text-sm text-cg-text-muted' },
          'Sin datos veterinarios cargados. Editá el dueño para agregar teléfono de emergencia, veterinario preferido o cómo llegó.'
        ),
    vetOwner?.notes &&
      React.createElement(
        'div',
        { className: 'px-6 py-4 border-t border-cg-border bg-cg-bg-hover' },
        eyebrow('Notas veterinarias', 'text-cg-text-muted mb-1.5'),
        React.createElement(
          'p',
          { className: 'm-0 text-sm leading-relaxed text-cg-text-secondary whitespace-pre-wrap' },
          vetOwner.notes
        )
      )
  );

  // ── Aside: notas generales ── (siempre visible; con estado vacío)
  const notesCard = React.createElement(
    UI.Card,
    { className: 'p-0 overflow-hidden' },
    React.createElement(
      'div',
      { className: 'flex items-center gap-2.5 px-5 pt-4 pb-1' },
      React.createElement(UI.DynamicIcon, {
        icon: 'StickyNote',
        size: 14,
        className: 'text-cg-text-muted',
      }),
      eyebrow('Notas')
    ),
    React.createElement(
      'p',
      {
        className: `m-0 px-5 pb-5 text-sm leading-relaxed whitespace-pre-wrap ${
          contact.notes ? 'text-cg-text-secondary' : 'text-cg-text-muted italic'
        }`,
      },
      contact.notes || 'Sin notas registradas.'
    )
  );

  // ── Aside: metadata ──
  const metaCard = React.createElement(
    'div',
    { className: 'px-1 flex flex-col gap-2' },
    React.createElement(
      'div',
      { className: 'flex justify-between gap-3 text-[11px]' },
      React.createElement('span', { className: 'text-cg-text-muted' }, 'Alta del contacto'),
      React.createElement(
        'strong',
        { className: 'text-cg-text-secondary font-medium' },
        new Date(contact.created_at).toLocaleDateString('es-AR')
      )
    ),
    React.createElement(
      'div',
      { className: 'flex justify-between gap-3 text-[11px]' },
      React.createElement('span', { className: 'text-cg-text-muted' }, 'Última modificación'),
      React.createElement(
        'strong',
        { className: 'text-cg-text-secondary font-medium' },
        new Date(contact.updated_at).toLocaleDateString('es-AR')
      )
    )
  );

  return React.createElement(
    'div',
    { className: 'font-sans min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      {
        style: {
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        },
      },
      actionBar,
      inactiveBanner,
      identityCard,
      React.createElement(
        'div',
        {
          // Layout inline (no clase arbitraria del CSS del plugin) → determinista
          // aunque el stylesheet del plugin aún no haya cargado.
          style: twoCol
            ? {
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 320px',
                gap: 20,
                alignItems: 'start',
              }
            : { display: 'flex', flexDirection: 'column', gap: 14 },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 } },
          petsHero,
          vetCard
        ),
        React.createElement(
          'aside',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              ...(twoCol ? { position: 'sticky', top: 4 } : {}),
            },
          },
          notesCard,
          metaCard
        )
      )
    ),

    // Modal editar dueño
    React.createElement(UI.FormDialogSubmit, {
      open: showEditModal,
      onOpenChange: setShowEditModal,
      title: 'Editar dueño',
      size: 'md',
      submitLabel: 'Guardar cambios',
      onCancel: () => setShowEditModal(false),
      children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
        React.createElement(ContactForm, {
          contactId,
          hiddenFields: ['type'],
          onSuccess: handleEditSuccess,
          formRef,
          hideActions: true,
        }),
    }),

    // Modal agregar mascota
    React.createElement(UI.FormDialogSubmit, {
      open: showAddPetModal,
      onOpenChange: setShowAddPetModal,
      title: 'Nueva mascota',
      size: 'lg',
      submitLabel: 'Crear mascota',
      onCancel: () => setShowAddPetModal(false),
      children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
        React.createElement(PetForm, {
          defaults: { owner_id: contactId },
          onSuccess: handleAddPetSuccess,
          formRef,
          hideActions: true,
        }),
    }),

    // Confirmar eliminación
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement((UI as any).ConfirmDialog, {
      open: !!confirmDelete,
      onOpenChange: (open: boolean) => {
        if (!open) setConfirmDelete(null);
      },
      title: 'Eliminar dueño',
      description: confirmDelete
        ? React.createElement(
            React.Fragment,
            null,
            '¿Eliminar a ',
            React.createElement('strong', null, confirmDelete.name),
            '?'
          )
        : '',
      confirmLabel: 'Eliminar',
      loading: deleting,
      onConfirm: () => void handleConfirmDelete(),
    })
  );
}
