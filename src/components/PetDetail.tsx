/**
 * Vista detallada de una mascota con secciones extensibles.
 * Usa ContactCard de @coongro/contacts para la sección del dueño.
 */
import { ContactCard } from '@coongro/contacts';
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { usePatientsSettings } from '../hooks/usePatientsSettings.js';
import { usePet } from '../hooks/usePet.js';
import { usePetsByOwner } from '../hooks/usePetsByOwner.js';
import { useVetOwner } from '../hooks/useVetOwner.js';
import type { PetDetailProps } from '../types/components.js';
import type { Pet } from '../types/pet.js';
import { calculateAge } from '../utils/age.js';
import {
  formatSpecies,
  formatStatus,
  formatSex,
  formatReproductive,
  formatReferral,
  SPECIES_EMOJI,
} from '../utils/labels.js';

import { PetCard } from './PetCard.js';

const React = getHostReact();
const UI = getHostUI();

/** Campos del perfil con sus labels — fuente única para info y completitud */
const PROFILE_FIELDS: Array<{ key: keyof Pet; label: string; format?: (v: unknown) => string }> = [
  { key: 'species', label: 'Especie', format: (v) => formatSpecies(v as string) },
  { key: 'breed', label: 'Raza' },
  { key: 'sex', label: 'Sexo', format: (v) => formatSex(v as string) },
  { key: 'birth_date', label: 'Edad', format: (v) => calculateAge(v as string) || '' },
  { key: 'weight_kg', label: 'Peso', format: (v) => (v ? `${String(v)} kg` : '') },
  { key: 'color_markings', label: 'Color/Señas' },
  { key: 'microchip_number', label: 'Microchip' },
  {
    key: 'reproductive_status',
    label: 'Estado reproductivo',
    format: (v) => formatReproductive(v as string),
  },
];

function getInfoFields(pet: Pet) {
  return PROFILE_FIELDS.map((f) => ({
    label: f.label,
    value: f.format ? f.format(pet[f.key]) : (pet[f.key] as string | null),
  })).filter((f) => f.value);
}

function calculateCompleteness(pet: Pet): { percentage: number; missing: string[] } {
  const missing: string[] = [];
  // name siempre está completo (es obligatorio), se cuenta aparte
  const fields = [{ key: 'name' as keyof Pet, label: 'Nombre' }, ...PROFILE_FIELDS];
  for (const f of fields) {
    const val = pet[f.key];
    if (val === null || val === undefined || val === '') {
      missing.push(f.label);
    }
  }
  const filled = fields.length - missing.length;
  return { percentage: Math.round((filled / fields.length) * 100), missing };
}

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

  const { settings: pSettings } = usePatientsSettings();
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
        React.createElement(UI.Skeleton, { className: 'w-16 h-16 rounded-full' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          React.createElement(UI.Skeleton, { className: 'h-6 w-48' }),
          React.createElement(UI.Skeleton, { className: 'h-4 w-24' })
        )
      ),
      Array.from({ length: 4 }).map((_, i) =>
        React.createElement(UI.Skeleton, {
          key: i,
          className: 'h-10 rounded-lg',
        })
      )
    );
  }

  if (error || !pet) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Error',
      message: error ?? 'Paciente no encontrado',
      onRetry: refetch,
    });
  }

  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾';
  const age = calculateAge(pet.birth_date);
  const hasAlerts =
    (pet.allergies && pet.allergies.length > 0) ||
    (pet.chronic_conditions && pet.chronic_conditions.length > 0);

  const infoFields = getInfoFields(pet);

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
          UI.Button,
          {
            variant: 'ghost',
            onClick: onBack,
            className: 'gap-1',
          },
          React.createElement(UI.DynamicIcon, { icon: 'ArrowLeft', size: 16 }),
          'Volver'
        ),
      React.createElement(
        'div',
        { className: 'flex gap-2' },
        onEdit &&
          React.createElement(
            UI.Button,
            {
              variant: 'outline',
              onClick: () => onEdit(pet),
            },
            'Editar'
          ),
        onDelete &&
          React.createElement(
            UI.Button,
            {
              variant: 'destructive',
              onClick: () => onDelete(pet),
            },
            'Eliminar'
          ),
        extraActions.map((action, i) =>
          React.createElement(
            UI.Button,
            {
              key: i,
              variant: 'outline',
              onClick: () => action.onClick(pet),
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
      React.createElement(UI.Avatar, {
        size: 'lg',
        icon: React.createElement('span', null, emoji),
        className: 'bg-emerald-100',
      }),
      React.createElement(
        'div',
        { className: 'flex flex-col flex-1 min-w-0' },
        React.createElement(
          'h2',
          { className: 'text-xl font-semibold text-cg-text truncate' },
          `${pet.name} — ${pet.breed || formatSpecies(pet.species)}`
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 mt-1 flex-wrap' },
          age && React.createElement('span', { className: 'text-sm text-cg-text-muted' }, age),
          formatSex(pet.sex) &&
            React.createElement(
              'span',
              { className: 'text-sm text-cg-text-muted' },
              `· ${formatSex(pet.sex)}`
            ),
          pet.weight_kg &&
            React.createElement(
              'span',
              { className: 'text-sm text-cg-text-muted' },
              `· ${pet.weight_kg} kg`
            ),
          React.createElement(
            UI.Badge,
            {
              variant: pet.status === 'active' ? 'success-soft' : 'secondary',
              size: 'sm',
            },
            formatStatus(pet.status)
          )
        )
      )
    ),

    // Indicador de completitud
    pSettings.showCompleteness &&
      (() => {
        const { percentage, missing } = calculateCompleteness(pet);
        if (percentage >= 100) return null;
        return React.createElement(
          UI.Card,
          { className: 'p-4 flex items-center gap-4' },
          React.createElement(
            'div',
            { className: 'flex-1 flex flex-col gap-1' },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between' },
              React.createElement(
                'span',
                { className: 'text-sm font-medium text-cg-text' },
                'Completitud del perfil'
              ),
              React.createElement(
                'span',
                { className: 'text-sm text-cg-text-muted' },
                `${percentage}%`
              )
            ),
            React.createElement(
              'div',
              { className: 'w-full bg-cg-bg-secondary rounded-full h-2' },
              React.createElement('div', {
                className: 'bg-cg-accent rounded-full h-2 transition-all',
                style: { width: `${percentage}%` },
              })
            ),
            missing.length > 0 &&
              React.createElement(
                'span',
                { className: 'text-xs text-cg-text-muted' },
                `Faltan: ${missing.join(', ')}`
              )
          )
        );
      })(),

    // Alertas médicas
    hasAlerts &&
      React.createElement(
        UI.Card,
        {
          className: 'p-4 border-cg-warning-border bg-cg-warning-bg flex items-start gap-3',
        },
        React.createElement('span', { className: 'text-lg' }, '⚠️'),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1' },
          React.createElement(
            'span',
            { className: 'text-sm font-medium text-cg-warning-text' },
            'Alertas médicas'
          ),
          pet.allergies &&
            pet.allergies.length > 0 &&
            React.createElement(
              'span',
              { className: 'text-sm text-cg-warning-text/80' },
              `Alergias: ${pet.allergies.join(', ')}`
            ),
          pet.chronic_conditions &&
            pet.chronic_conditions.length > 0 &&
            React.createElement(
              'span',
              { className: 'text-sm text-cg-warning-text/80' },
              `Condiciones: ${pet.chronic_conditions.join(', ')}`
            )
        )
      ),

    // Info básica
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      sectionTitle('Información'),
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 gap-3' },
        infoFields.map((field) =>
          React.createElement(
            'div',
            { key: field.label, className: 'flex flex-col gap-0.5' },
            React.createElement('span', { className: 'text-xs text-cg-text-muted' }, field.label),
            React.createElement('span', { className: 'text-sm text-cg-text' }, field.value)
          )
        )
      )
    ),

    // Sección dueño (usando ContactCard de contacts)
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      sectionTitle('Dueño'),
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
                  { className: 'text-cg-text' },
                  `Emergencia: ${vetOwner.emergency_phone}`
                ),
              vetOwner.preferred_vet &&
                React.createElement(
                  'span',
                  { className: 'text-cg-text' },
                  `Vet preferido: ${vetOwner.preferred_vet}`
                ),
              vetOwner.referral_source &&
                React.createElement(
                  'span',
                  { className: 'text-cg-text' },
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
        UI.Card,
        { className: 'p-4' },
        sectionTitle('Otras mascotas del dueño'),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          otherPets.map((sibling) =>
            React.createElement(PetCard, {
              key: sibling.id,
              pet: sibling,
              onClick: onNavigate
                ? () => onNavigate('patients.detail.open', { petId: sibling.id })
                : undefined,
            })
          )
        )
      ),

    // Notas
    pet.notes &&
      React.createElement(
        UI.Card,
        { className: 'p-4' },
        sectionTitle('Notas'),
        React.createElement(
          'p',
          { className: 'text-sm text-cg-text whitespace-pre-wrap' },
          pet.notes
        )
      ),

    // Secciones extra del bloque
    sortedSections.map((section, i) =>
      React.createElement(
        UI.Card,
        { key: i, className: 'p-4' },
        sectionTitle(section.title),
        section.render() as React.ReactNode
      )
    ),

    // Metadata
    React.createElement(
      'div',
      { className: 'text-xs text-cg-text-subtle flex gap-4' },
      React.createElement('span', null, `Creado: ${new Date(pet.created_at).toLocaleDateString()}`),
      React.createElement(
        'span',
        null,
        `Actualizado: ${new Date(pet.updated_at).toLocaleDateString()}`
      )
    )
  );
}

/** Renderiza el título de sección usado en cada Card */
function sectionTitle(text: string) {
  return React.createElement(
    'h3',
    { className: 'text-sm font-medium text-cg-text-muted mb-3' },
    text
  );
}
