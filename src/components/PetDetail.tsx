/**
 * Vista detallada de una mascota con secciones extensibles.
 * Usa ContactCard de @coongro/contacts para la sección del dueño.
 */
import { ContactCard } from '@coongro/contacts';
import { getHostReact } from '@coongro/plugin-sdk';

import { usePet } from '../hooks/usePet.js';
import { usePetsByOwner } from '../hooks/usePetsByOwner.js';
import { useVetOwner } from '../hooks/useVetOwner.js';
import type { PetDetailProps } from '../types/components.js';
import { calculateAge } from '../utils/age.js';
import {
  formatSpecies,
  formatStatus,
  formatSex,
  formatReproductive,
  formatReferral,
  SPECIES_EMOJI,
} from '../utils/labels.js';

const React = getHostReact();

export function PetDetail(props: PetDetailProps) {
  const {
    petId,
    extraSections = [],
    extraActions = [],
    onEdit,
    onDelete,
    onBack,
    onNavigate,
    className = '',
  } = props;

  const { pet, loading, error, refetch } = usePet(petId);
  const { vetOwner } = useVetOwner(pet?.owner_id);
  const { pets: siblingPets } = usePetsByOwner(pet?.owner_id);

  // Filtrar la mascota actual de los hermanos
  const otherPets = siblingPets.filter((p) => p.id !== petId);

  if (loading) {
    return React.createElement(
      'div',
      { className: `flex flex-col gap-6 ${className}` },
      React.createElement(
        'div',
        { className: 'flex items-center gap-4' },
        React.createElement('div', {
          className: 'w-16 h-16 rounded-full bg-[var(--cg-skeleton)] animate-pulse',
        }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          React.createElement('div', {
            className: 'h-6 w-48 rounded bg-[var(--cg-skeleton)] animate-pulse',
          }),
          React.createElement('div', {
            className: 'h-4 w-24 rounded bg-[var(--cg-skeleton)] animate-pulse',
          })
        )
      ),
      Array.from({ length: 4 }).map((_, i) =>
        React.createElement('div', {
          key: i,
          className: 'h-10 rounded-lg bg-[var(--cg-skeleton)] animate-pulse',
        })
      )
    );
  }

  if (error || !pet) {
    return React.createElement(
      'div',
      { className: 'flex flex-col items-center py-12 gap-3' },
      React.createElement(
        'p',
        { className: 'text-sm text-[var(--cg-text-muted)]' },
        error ?? 'Paciente no encontrado'
      ),
      React.createElement(
        'button',
        {
          onClick: refetch,
          className:
            'px-4 py-2 text-sm rounded-lg bg-[var(--cg-accent)] text-[var(--cg-text-inverse)]',
        },
        'Reintentar'
      )
    );
  }

  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾';
  const age = calculateAge(pet.birth_date);
  const hasAlerts =
    (pet.allergies && pet.allergies.length > 0) ||
    (pet.chronic_conditions && pet.chronic_conditions.length > 0);

  const infoFields = [
    { label: 'Especie', value: formatSpecies(pet.species) },
    { label: 'Raza', value: pet.breed },
    { label: 'Sexo', value: formatSex(pet.sex) },
    { label: 'Edad', value: age },
    { label: 'Peso', value: pet.weight_kg ? `${pet.weight_kg} kg` : null },
    { label: 'Color/Señas', value: pet.color_markings },
    { label: 'Microchip', value: pet.microchip_number },
    { label: 'Estado reproductivo', value: formatReproductive(pet.reproductive_status) },
  ].filter((f) => f.value);

  const sortedSections = [...extraSections].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  return React.createElement(
    'div',
    { className: `flex flex-col gap-6 ${className}` },

    // Botón volver + acciones
    React.createElement(
      'div',
      { className: 'flex items-center justify-between' },
      onBack &&
        React.createElement(
          'button',
          {
            onClick: onBack,
            className:
              'flex items-center gap-1 text-sm text-[var(--cg-text-muted)] hover:text-[var(--cg-text)] transition-colors',
          },
          React.createElement(
            'svg',
            {
              width: 16,
              height: 16,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 2,
            },
            React.createElement('path', { d: 'M19 12H5M12 19l-7-7 7-7' })
          ),
          'Volver'
        ),
      React.createElement(
        'div',
        { className: 'flex gap-2' },
        onEdit &&
          React.createElement(
            'button',
            {
              onClick: () => onEdit(pet),
              className:
                'px-4 py-2 text-sm rounded-lg border border-[var(--cg-border)] text-[var(--cg-text)] hover:bg-[var(--cg-bg-hover)] transition-colors',
            },
            'Editar'
          ),
        onDelete &&
          React.createElement(
            'button',
            {
              onClick: () => onDelete(pet),
              className:
                'px-4 py-2 text-sm rounded-lg text-[var(--cg-danger)] border border-[var(--cg-danger)] hover:bg-[var(--cg-danger-bg)] transition-colors',
            },
            'Eliminar'
          ),
        extraActions.map((action, i) =>
          React.createElement(
            'button',
            {
              key: i,
              onClick: () => action.onClick(pet),
              className:
                'px-4 py-2 text-sm rounded-lg border border-[var(--cg-border)] text-[var(--cg-text)] hover:bg-[var(--cg-bg-hover)] transition-colors',
            },
            action.label
          )
        )
      )
    ),

    // Header: emoji + nombre + info
    React.createElement(
      'div',
      { className: 'flex items-center gap-4' },
      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-3xl flex-shrink-0',
        },
        emoji
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col flex-1 min-w-0' },
        React.createElement(
          'h2',
          { className: 'text-xl font-semibold text-[var(--cg-text)] truncate' },
          `${pet.name} — ${pet.breed || formatSpecies(pet.species)}`
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 mt-1 flex-wrap' },
          age &&
            React.createElement('span', { className: 'text-sm text-[var(--cg-text-muted)]' }, age),
          formatSex(pet.sex) &&
            React.createElement(
              'span',
              { className: 'text-sm text-[var(--cg-text-muted)]' },
              `· ${formatSex(pet.sex)}`
            ),
          pet.weight_kg &&
            React.createElement(
              'span',
              { className: 'text-sm text-[var(--cg-text-muted)]' },
              `· ${pet.weight_kg} kg`
            ),
          React.createElement(
            'span',
            {
              className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                pet.status === 'active'
                  ? 'bg-[var(--cg-success-bg)] text-[var(--cg-success)]'
                  : 'bg-[var(--cg-bg-tertiary)] text-[var(--cg-text-muted)]'
              }`,
            },
            formatStatus(pet.status)
          )
        )
      )
    ),

    // Alertas médicas
    hasAlerts &&
      React.createElement(
        'div',
        {
          className: 'rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3',
        },
        React.createElement('span', { className: 'text-lg' }, '⚠️'),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1' },
          React.createElement(
            'span',
            { className: 'text-sm font-medium text-amber-800' },
            'Alertas médicas'
          ),
          pet.allergies &&
            pet.allergies.length > 0 &&
            React.createElement(
              'span',
              { className: 'text-sm text-amber-700' },
              `Alergias: ${pet.allergies.join(', ')}`
            ),
          pet.chronic_conditions &&
            pet.chronic_conditions.length > 0 &&
            React.createElement(
              'span',
              { className: 'text-sm text-amber-700' },
              `Condiciones: ${pet.chronic_conditions.join(', ')}`
            )
        )
      ),

    // Info básica
    React.createElement(
      'div',
      { className: 'rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4' },
      React.createElement(
        'h3',
        { className: 'text-sm font-medium text-[var(--cg-text-muted)] mb-3' },
        'Información'
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 gap-3' },
        infoFields.map((field) =>
          React.createElement(
            'div',
            { key: field.label, className: 'flex flex-col gap-0.5' },
            React.createElement(
              'span',
              { className: 'text-xs text-[var(--cg-text-muted)]' },
              field.label
            ),
            React.createElement('span', { className: 'text-sm text-[var(--cg-text)]' }, field.value)
          )
        )
      )
    ),

    // Sección dueño (usando ContactCard de contacts)
    React.createElement(
      'div',
      { className: 'rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4' },
      React.createElement(
        'h3',
        { className: 'text-sm font-medium text-[var(--cg-text-muted)] mb-3' },
        'Dueño'
      ),
      React.createElement(ContactCard, {
        contactId: pet.owner_id,
        showFields: ['phone', 'email', 'address'],
        extraInfo: vetOwner
          ? React.createElement(
              'div',
              { className: 'flex flex-col gap-1 text-xs' },
              vetOwner.emergency_phone &&
                React.createElement(
                  'span',
                  { className: 'text-[var(--cg-text)]' },
                  `Emergencia: ${vetOwner.emergency_phone}`
                ),
              vetOwner.preferred_vet &&
                React.createElement(
                  'span',
                  { className: 'text-[var(--cg-text)]' },
                  `Vet preferido: ${vetOwner.preferred_vet}`
                ),
              vetOwner.referral_source &&
                React.createElement(
                  'span',
                  { className: 'text-[var(--cg-text)]' },
                  `Llegó por: ${formatReferral(vetOwner.referral_source)}`
                )
            )
          : undefined,
        onClick: onNavigate
          ? () => onNavigate('patients.owner-detail.open', { contactId: pet.owner_id })
          : undefined,
      })
    ),

    // Otras mascotas del dueño
    otherPets.length > 0 &&
      React.createElement(
        'div',
        { className: 'rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)] mb-3' },
          'Otras mascotas del dueño'
        ),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          otherPets.map((sibling) =>
            React.createElement(
              'div',
              {
                key: sibling.id,
                className:
                  'flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--cg-bg-hover)] cursor-pointer transition-colors',
                onClick: () => onNavigate?.('patients.detail.open', { petId: sibling.id }),
              },
              React.createElement('span', null, SPECIES_EMOJI[sibling.species] ?? '🐾'),
              React.createElement(
                'span',
                { className: 'text-sm text-[var(--cg-text)]' },
                sibling.name
              ),
              React.createElement(
                'span',
                { className: 'text-xs text-[var(--cg-text-muted)]' },
                `${sibling.breed || formatSpecies(sibling.species)}, ${calculateAge(sibling.birth_date) || '?'}`
              )
            )
          )
        )
      ),

    // Notas
    pet.notes &&
      React.createElement(
        'div',
        { className: 'rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)] mb-3' },
          'Notas'
        ),
        React.createElement(
          'p',
          { className: 'text-sm text-[var(--cg-text)] whitespace-pre-wrap' },
          pet.notes
        )
      ),

    // Secciones extra del bloque
    sortedSections.map((section, i) =>
      React.createElement(
        'div',
        {
          key: i,
          className: 'rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4',
        },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)] mb-3' },
          section.title
        ),
        section.render() as React.ReactNode
      )
    ),

    // Botones de acción futura (placeholder)
    React.createElement(
      'div',
      { className: 'flex gap-2' },
      React.createElement(
        'button',
        {
          disabled: true,
          className:
            'px-4 py-2 text-sm rounded-lg border border-[var(--cg-border)] text-[var(--cg-text-muted)] opacity-50 cursor-not-allowed',
        },
        'Nueva Consulta'
      ),
      React.createElement(
        'button',
        {
          disabled: true,
          className:
            'px-4 py-2 text-sm rounded-lg border border-[var(--cg-border)] text-[var(--cg-text-muted)] opacity-50 cursor-not-allowed',
        },
        'Nuevo Turno'
      )
    ),

    // Metadata
    React.createElement(
      'div',
      { className: 'text-xs text-[var(--cg-text-subtle)] flex gap-4' },
      React.createElement('span', null, `Creado: ${new Date(pet.created_at).toLocaleDateString()}`),
      React.createElement(
        'span',
        null,
        `Actualizado: ${new Date(pet.updated_at).toLocaleDateString()}`
      )
    )
  );
}
