/**
 * Vista detallada de una mascota con secciones extensibles.
 * Rediseño 2026-06 (COONG-208) — layout de ficha con header de identidad por
 * especie, banner de estado, alertas médicas, grilla de info y secciones de
 * módulos inyectados. Reutiliza ui-components + tokens cg-* (dark mode automático).
 * Usa ContactCard de @coongro/contacts para la sección del dueño.
 */
import { useContact } from '@coongro/contacts';
import { getHostReact, getHostUI, useViewContributions } from '@coongro/plugin-sdk';
import { StaffBadge } from '@coongro/staff';

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
  SPECIES_ICON,
} from '../utils/labels.js';

import { PetCard } from './PetCard.js';

const React = getHostReact();
const UI = getHostUI();

/** Título serif (Noto Serif JP, weight 900) — identidad visual del producto */
const SERIF = 'font-serif font-black tracking-tight';

/**
 * Breakpoint por JS (matchMedia). El layout de 2 columnas se decide acá y se
 * aplica con estilos inline, NO con una clase Tailwind: la clase arbitraria
 * `lg:grid-cols-[...]` solo vive en el CSS del plugin, que se inyecta con
 * ref-counting y a veces aún no cargó cuando la vista rinde (carrera lista→
 * detalle) — eso hacía que el aside cayera abajo de forma intermitente. Inline
 * + matchMedia es determinista sin importar qué stylesheet esté cargado.
 */
function useMinWidth(px: number): boolean {
  const { useState, useEffect } = React;
  const query = `(min-width:${px}px)`;
  const [match, setMatch] = useState<boolean>(
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

/** Paleta de avatar por especie — fondo suave + trazo, todo en tokens cg-* */
const SPECIES_PALETTE: Record<string, string> = {
  dog: 'bg-cg-gold-lt text-cg-gold-deep',
  cat: 'bg-cg-sky-lt text-cg-sky-deep',
  bird: 'bg-cg-pink-lt text-cg-pink-deep',
  reptile: 'bg-cg-teal-soft text-cg-teal-deep',
  rodent: 'bg-cg-bg-hover text-cg-text-secondary',
  other: 'bg-cg-bg-hover text-cg-text-secondary',
};

/** Estado del paciente → variante de badge + banner contextual */
const STATUS_CONFIG: Record<
  string,
  { badge: string; banner: { cls: string; icon: string; text: string } | null }
> = {
  active: { badge: 'success-soft', banner: null },
  deceased: {
    badge: 'secondary',
    banner: {
      cls: 'bg-cg-neutral-950 text-cg-white',
      icon: 'HeartPulse',
      text: 'Paciente fallecido · la ficha queda como registro histórico de solo lectura.',
    },
  },
  referred: {
    badge: 'warning-soft',
    banner: {
      cls: 'bg-cg-gold-soft text-cg-gold-deep',
      icon: 'Compass',
      text: 'Paciente derivado a otro profesional · seguimiento fuera de esta clínica.',
    },
  },
  lost: {
    badge: 'danger-soft',
    banner: {
      cls: 'bg-cg-red-soft text-cg-red-deep',
      icon: 'Siren',
      text: 'Paciente reportado como perdido · activá el protocolo de búsqueda si reingresa.',
    },
  },
};

/** Campos del perfil con su icono y label — fuente única para info y completitud */
const PROFILE_FIELDS: Array<{
  key: keyof Pet;
  label: string;
  icon: string;
  mono?: boolean;
  format?: (v: unknown) => string;
}> = [
  { key: 'species', label: 'Especie', icon: 'PawPrint', format: (v) => formatSpecies(v as string) },
  { key: 'breed', label: 'Raza', icon: 'Dna' },
  { key: 'sex', label: 'Sexo', icon: 'VenusAndMars', format: (v) => formatSex(v as string) },
  {
    key: 'birth_date',
    label: 'Edad',
    icon: 'Cake',
    format: (v) => calculateAge(v as string) || '',
  },
  { key: 'weight_kg', label: 'Peso', icon: 'Weight', format: (v) => (v ? `${String(v)} kg` : '') },
  { key: 'color_markings', label: 'Color y señas', icon: 'Palette' },
  { key: 'microchip_number', label: 'Microchip', icon: 'ScanLine', mono: true },
  {
    key: 'reproductive_status',
    label: 'Estado reproductivo',
    icon: 'HeartPulse',
    format: (v) => formatReproductive(v as string),
  },
];

function getInfoFields(pet: Pet) {
  return PROFILE_FIELDS.map((f) => ({
    label: f.label,
    icon: f.key === 'species' ? (SPECIES_ICON[pet.species] ?? 'PawPrint') : f.icon,
    mono: f.mono,
    value: f.format ? f.format(pet[f.key]) : (pet[f.key] as string | null),
  })).filter((f) => f.value);
}

function calculateCompleteness(pet: Pet): { percentage: number; missing: string[] } {
  const missing: string[] = [];
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

/** Eyebrow uppercase reutilizable (label de sección / metadata) */
function eyebrow(text: string, className = 'text-cg-text-muted') {
  return React.createElement(
    'div',
    {
      className: `text-[11px] font-bold uppercase tracking-[0.08em] ${className}`,
    },
    text
  );
}

/** Línea de dato del panel del dueño: chip de icono + valor (+ subtexto opcional) */
function ownerLine(icon: string, value: string, sub?: string) {
  return React.createElement(
    'div',
    { className: 'flex gap-3 items-start' },
    React.createElement(
      'span',
      {
        className:
          'w-7 h-7 rounded-md flex-shrink-0 inline-flex items-center justify-center bg-cg-bg-hover text-cg-text-muted',
      },
      React.createElement(UI.DynamicIcon, { icon, size: 14 })
    ),
    React.createElement(
      'div',
      { className: 'min-w-0 text-[13px] text-cg-text leading-snug break-words' },
      value,
      sub && React.createElement('div', { className: 'text-[11px] text-cg-text-muted mt-0.5' }, sub)
    )
  );
}

/** Card de sección con header (icono + eyebrow + título + link opcional) y cuerpo */
function SectionCard(opts: {
  icon: string;
  title: string;
  eyebrow?: string;
  injected?: boolean;
  action?: { label: string; onClick: () => void };
  children?: React.ReactNode;
  key?: string | number;
}) {
  return React.createElement(
    UI.Card,
    { key: opts.key, className: 'p-0 overflow-hidden' },
    React.createElement(
      'div',
      { className: 'flex items-center gap-3 px-6 py-4 border-b border-cg-border' },
      React.createElement(
        'span',
        {
          className:
            'w-8 h-8 rounded-md flex-shrink-0 inline-flex items-center justify-center bg-cg-bg-hover border border-cg-border text-cg-text-secondary',
        },
        React.createElement(UI.DynamicIcon, { icon: opts.icon, size: 16 })
      ),
      React.createElement(
        'div',
        { className: 'min-w-0 flex-1' },
        opts.eyebrow &&
          eyebrow(
            opts.eyebrow,
            opts.injected ? 'text-cg-gold-deep mb-0.5' : 'text-cg-text-muted mb-0.5'
          ),
        React.createElement('div', { className: `${SERIF} text-lg leading-none` }, opts.title)
      ),
      opts.action &&
        React.createElement(
          'button',
          {
            onClick: opts.action.onClick,
            className:
              'inline-flex items-center gap-1 flex-shrink-0 text-[13px] font-semibold text-cg-gold-deep px-2 py-1 rounded-md transition-colors hover:bg-cg-gold-soft',
          },
          opts.action.label,
          React.createElement(UI.DynamicIcon, { icon: 'ChevronRight', size: 14 })
        )
    ),
    React.createElement('div', { className: 'px-6 py-5' }, opts.children)
  );
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
  const { contact: owner } = useContact(pet?.owner_id);
  const { pets: siblingPets } = usePetsByOwner(pet?.owner_id);
  const twoCol = useMinWidth(1024);

  // Secciones que otros plugins inyectan en la ficha (ej. Vacunación, farmacia).
  const { sections: contributedSections } = useViewContributions('patients.detail.open', {
    petId,
    pet,
  });

  const otherPets = siblingPets.filter((p) => p.id !== petId);

  if (loading) {
    return React.createElement(
      'div',
      { className: `flex flex-col gap-6 ${className}` },
      React.createElement(
        'div',
        { className: 'flex items-center gap-4' },
        React.createElement(UI.Skeleton, { className: 'w-28 h-28 rounded-2xl' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          React.createElement(UI.Skeleton, { className: 'h-8 w-48' }),
          React.createElement(UI.Skeleton, { className: 'h-4 w-32' })
        )
      ),
      Array.from({ length: 4 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'h-10 rounded-lg' })
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

  const speciesIcon = SPECIES_ICON[pet.species] ?? 'PawPrint';
  const palette = SPECIES_PALETTE[pet.species] ?? SPECIES_PALETTE.other;
  const status = STATUS_CONFIG[pet.status] ?? STATUS_CONFIG.active;
  const dim = pet.status === 'deceased';
  const age = calculateAge(pet.birth_date);
  const hasAlerts =
    (pet.allergies && pet.allergies.length > 0) ||
    (pet.chronic_conditions && pet.chronic_conditions.length > 0);

  const infoFields = getInfoFields(pet);
  const sortedSections = [...extraSections, ...contributedSections].sort(
    (a, b) => (a.order ?? 50) - (b.order ?? 50)
  );

  const vitalChips = [
    age && { icon: 'Cake', value: age },
    formatSex(pet.sex) && { icon: 'VenusAndMars', value: formatSex(pet.sex) },
    pet.weight_kg && { icon: 'Weight', value: `${pet.weight_kg} kg` },
  ].filter(Boolean) as Array<{ icon: string; value: string }>;

  // ── Action bar ──
  const actionBar = React.createElement(
    'div',
    { className: 'flex items-center gap-3 flex-wrap' },
    onBack &&
      React.createElement(
        UI.Button,
        { variant: 'ghost', onClick: onBack, className: 'gap-1.5' },
        React.createElement(UI.DynamicIcon, { icon: 'ArrowLeft', size: 16 }),
        'Volver a Pacientes'
      ),
    React.createElement('div', { className: 'flex-1' }),
    React.createElement(
      'div',
      { className: 'flex gap-2 flex-wrap' },
      extraActions.map((action, i) =>
        React.createElement(
          UI.Button,
          {
            key: `xa-${i}`,
            variant: action.variant ?? 'default',
            size: 'sm',
            onClick: () => action.onClick(pet),
          },
          action.icon && React.createElement(UI.DynamicIcon, { icon: action.icon, size: 14 }),
          action.label
        )
      ),
      onEdit &&
        React.createElement(
          UI.Button,
          { variant: 'outline', size: 'sm', onClick: () => onEdit(pet), className: 'gap-1.5' },
          React.createElement(UI.DynamicIcon, { icon: 'Pencil', size: 14 }),
          'Editar'
        ),
      onDelete &&
        React.createElement(
          UI.Button,
          {
            variant: 'destructive',
            size: 'sm',
            onClick: () => onDelete(pet),
            className: 'gap-1.5',
          },
          React.createElement(UI.DynamicIcon, { icon: 'Trash2', size: 14 }),
          'Eliminar'
        )
    )
  );

  // ── Banner de estado ──
  const statusBanner =
    status.banner &&
    React.createElement(
      'div',
      {
        className: `flex items-center gap-3.5 rounded-xl px-5 py-3.5 ${status.banner.cls}`,
      },
      React.createElement(UI.DynamicIcon, { icon: status.banner.icon, size: 18 }),
      React.createElement(
        'div',
        { className: 'text-sm font-medium' },
        React.createElement(
          'strong',
          { className: 'uppercase tracking-wide text-[11px] mr-2 font-bold' },
          formatStatus(pet.status)
        ),
        status.banner.text
      )
    );

  // ── Header de identidad ──
  const identityHeader = React.createElement(
    UI.Card,
    { className: `p-7 flex items-center gap-6 ${dim ? 'opacity-80' : ''}` },
    React.createElement(
      'div',
      {
        className: `w-28 h-28 rounded-2xl flex-shrink-0 inline-flex items-center justify-center ${
          dim ? 'bg-cg-bg-hover text-cg-text-muted grayscale' : palette
        }`,
      },
      React.createElement(UI.DynamicIcon, { icon: speciesIcon, size: 56 })
    ),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement(
        'div',
        { className: 'flex items-start gap-4' },
        React.createElement(
          'div',
          { className: 'flex-1 min-w-0' },
          React.createElement('h1', { className: `${SERIF} text-3xl leading-none m-0` }, pet.name),
          React.createElement(
            'div',
            { className: 'text-sm text-cg-text-secondary mt-2' },
            [pet.breed, formatSpecies(pet.species)].filter(Boolean).join(' · ')
          )
        ),
        React.createElement(
          UI.Badge,
          { variant: status.badge, size: 'sm' },
          formatStatus(pet.status)
        )
      ),
      vitalChips.length > 0 &&
        React.createElement(
          'div',
          { className: 'flex gap-2 mt-4 flex-wrap' },
          vitalChips.map((c, i) =>
            React.createElement(
              'span',
              {
                key: i,
                className:
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cg-bg-hover border border-cg-border text-sm font-medium text-cg-text',
              },
              React.createElement(UI.DynamicIcon, {
                icon: c.icon,
                size: 14,
                className: 'text-cg-text-muted',
              }),
              c.value
            )
          )
        )
    )
  );

  // ── Alertas médicas ──
  const alertsCard =
    hasAlerts &&
    React.createElement(
      'div',
      { className: 'rounded-xl border border-cg-gold-lt bg-cg-gold-soft p-5' },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3 mb-4' },
        React.createElement(
          'span',
          {
            className:
              'w-9 h-9 rounded-lg flex-shrink-0 inline-flex items-center justify-center bg-cg-gold text-cg-neutral-950',
          },
          React.createElement(UI.DynamicIcon, { icon: 'TriangleAlert', size: 18 })
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'div',
            { className: `${SERIF} text-base leading-none` },
            'Alertas médicas'
          ),
          React.createElement(
            'div',
            { className: 'text-xs text-cg-gold-deep mt-1' },
            'Revisar antes de medicar o intervenir'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 sm:grid-cols-2 gap-5' },
        pet.allergies &&
          pet.allergies.length > 0 &&
          React.createElement(
            'div',
            null,
            eyebrow('Alergias', 'text-cg-gold-deep mb-2'),
            React.createElement(
              'div',
              { className: 'flex flex-wrap gap-1.5' },
              pet.allergies.map((a, i) =>
                React.createElement(
                  'span',
                  {
                    key: i,
                    className:
                      'inline-flex items-center px-2.5 py-1 rounded-md bg-cg-red-soft text-cg-red-deep border border-cg-red-lt text-xs font-medium',
                  },
                  a
                )
              )
            )
          ),
        pet.chronic_conditions &&
          pet.chronic_conditions.length > 0 &&
          React.createElement(
            'div',
            null,
            eyebrow('Condiciones crónicas', 'text-cg-gold-deep mb-2'),
            React.createElement(
              'div',
              { className: 'flex flex-wrap gap-1.5' },
              pet.chronic_conditions.map((c, i) =>
                React.createElement(
                  'span',
                  {
                    key: i,
                    className:
                      'inline-flex items-center px-2.5 py-1 rounded-md bg-cg-surface text-cg-gold-deep border border-cg-gold-lt text-xs font-medium',
                  },
                  c
                )
              )
            )
          )
      )
    );

  // ── Completitud (gated por settings) ──
  const completeness =
    pSettings.showCompleteness &&
    (() => {
      const { percentage, missing } = calculateCompleteness(pet);
      if (percentage >= 100) return null;
      return React.createElement(
        UI.Card,
        { className: 'p-4 flex flex-col gap-1.5' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement(
            'span',
            { className: 'text-sm font-medium text-cg-text' },
            'Completitud del perfil'
          ),
          React.createElement('span', { className: 'text-sm text-cg-text-muted' }, `${percentage}%`)
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
      );
    })();

  // ── Info básica ──
  const infoCard = React.createElement(
    SectionCard,
    { icon: 'Info', eyebrow: 'REGISTRO', title: 'Información básica' },
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4' },
      infoFields.map((f) =>
        React.createElement(
          'div',
          { key: f.label, className: 'flex gap-3 items-start' },
          React.createElement(
            'span',
            {
              className:
                'w-8 h-8 rounded-md flex-shrink-0 inline-flex items-center justify-center bg-cg-bg-hover text-cg-text-muted',
            },
            React.createElement(UI.DynamicIcon, { icon: f.icon, size: 15 })
          ),
          React.createElement(
            'div',
            { className: 'min-w-0' },
            eyebrow(f.label, 'text-cg-text-muted mb-1'),
            React.createElement(
              'div',
              { className: `text-sm text-cg-text ${f.mono ? 'font-mono tracking-wide' : ''}` },
              f.value
            )
          )
        )
      )
    )
  );

  // ── Notas ──
  const notesCard =
    pet.notes &&
    React.createElement(
      SectionCard,
      { icon: 'Pencil', eyebrow: 'OBSERVACIONES', title: 'Notas' },
      React.createElement(
        'p',
        {
          className:
            'text-sm leading-relaxed text-cg-text-secondary m-0 max-w-2xl whitespace-pre-wrap',
        },
        pet.notes
      )
    );

  // ── Secciones de módulos inyectados ──
  const moduleSections =
    sortedSections.length > 0 &&
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'div',
        { className: 'flex items-center gap-3.5 pt-2' },
        React.createElement('span', { className: 'flex-1 h-px bg-cg-border' }),
        React.createElement(
          'span',
          {
            className:
              'text-[11px] font-bold uppercase tracking-[0.08em] text-cg-text-muted whitespace-nowrap',
          },
          'Módulos del kit veterinario'
        ),
        React.createElement('span', { className: 'flex-1 h-px bg-cg-border' })
      ),
      sortedSections.map((section, i) => {
        // Las contribuciones pueden declarar icon/viewId/actionLabel (COONG-210)
        // para asociar la sección a su módulo y enlazar a su registro propio.
        const meta = section as {
          icon?: string;
          viewId?: string;
          actionLabel?: string;
        };
        const action =
          meta.viewId && onNavigate
            ? {
                label: meta.actionLabel ?? 'Ver',
                onClick: () => onNavigate(meta.viewId),
              }
            : undefined;
        return React.createElement(
          SectionCard,
          {
            key: i,
            icon: meta.icon ?? 'Puzzle',
            eyebrow: 'MÓDULO',
            title: section.title,
            injected: true,
            action,
          },
          section.render() as React.ReactNode
        );
      })
    );

  // ── Aside: dueño (panel propio de la ficha, no el ContactCard genérico) ──
  const ownerInitials = owner
    ? owner.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('') || '?'
    : '';
  const hasVetBlock =
    vetOwner &&
    (vetOwner.emergency_phone || vetOwner.preferred_vet_staff_id || vetOwner.referral_source);
  const ownerCard = owner
    ? React.createElement(
        UI.Card,
        { className: 'p-0 overflow-hidden' },
        // Header clickeable → ficha del dueño
        React.createElement(
          'button',
          {
            className:
              'w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-cg-bg-hover',
            onClick: onNavigate
              ? () => onNavigate('patients.owner-detail.open', { contactId: pet.owner_id })
              : undefined,
          },
          React.createElement(
            'span',
            {
              className:
                'w-10 h-10 rounded-full flex-shrink-0 inline-flex items-center justify-center bg-cg-text text-cg-text-inverse font-serif font-black text-sm',
            },
            ownerInitials
          ),
          React.createElement(
            'div',
            { className: 'flex-1 min-w-0' },
            eyebrow('Dueño', 'text-cg-text-muted mb-0.5'),
            React.createElement(
              'div',
              { className: 'text-[15px] font-medium text-cg-text truncate' },
              owner.name
            )
          ),
          React.createElement(UI.DynamicIcon, {
            icon: 'ChevronRight',
            size: 16,
            className: 'text-cg-text-muted',
          })
        ),
        // Datos de contacto
        (owner.phone || owner.email || owner.address) &&
          React.createElement(
            'div',
            { className: 'flex flex-col gap-3 px-5 py-4 border-t border-cg-border' },
            owner.phone && ownerLine('Phone', owner.phone),
            owner.email && ownerLine('Mail', owner.email),
            owner.address && ownerLine('MapPin', owner.address)
          ),
        // Bloque veterinario
        hasVetBlock &&
          React.createElement(
            'div',
            {
              className:
                'flex flex-col gap-3 px-5 py-4 border-t border-cg-border bg-cg-bg-secondary',
            },
            vetOwner.emergency_phone &&
              ownerLine('Siren', vetOwner.emergency_phone, 'Teléfono de emergencia'),
            vetOwner.preferred_vet_staff_id &&
              React.createElement(
                'div',
                { className: 'flex gap-3 items-start' },
                React.createElement(
                  'span',
                  {
                    className:
                      'w-7 h-7 rounded-md flex-shrink-0 inline-flex items-center justify-center bg-cg-bg-hover text-cg-text-muted',
                  },
                  React.createElement(UI.DynamicIcon, { icon: 'Stethoscope', size: 14 })
                ),
                React.createElement(
                  'div',
                  { className: 'min-w-0' },
                  React.createElement(
                    'div',
                    { className: 'text-[11px] text-cg-text-muted mb-1' },
                    'Vet preferido'
                  ),
                  React.createElement(StaffBadge, {
                    staffId: vetOwner.preferred_vet_staff_id,
                    variant: 'compact',
                  })
                )
              ),
            vetOwner.referral_source &&
              ownerLine('Compass', formatReferral(vetOwner.referral_source), 'Cómo llegó')
          )
      )
    : React.createElement(
        UI.Card,
        { className: 'p-4' },
        React.createElement(
          'div',
          { className: 'flex items-center gap-3' },
          React.createElement(UI.Skeleton, { className: 'w-10 h-10 rounded-full' }),
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1.5 flex-1' },
            React.createElement(UI.Skeleton, { className: 'h-4 w-28' }),
            React.createElement(UI.Skeleton, { className: 'h-3 w-20' })
          )
        )
      );

  const otherPetsCard =
    otherPets.length > 0 &&
    React.createElement(
      UI.Card,
      { className: 'p-0 overflow-hidden' },
      React.createElement(
        'div',
        { className: 'px-5 pt-4 pb-2' },
        eyebrow('Otras mascotas del dueño', 'text-cg-text-muted')
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col gap-2 px-3 pb-3' },
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
    );

  const metaFooter = React.createElement(
    'div',
    { className: 'px-1 text-[11px] leading-relaxed text-cg-text-muted' },
    React.createElement(
      'div',
      null,
      `Alta del paciente · ${new Date(pet.created_at).toLocaleDateString('es-AR')}`
    ),
    React.createElement(
      'div',
      null,
      `Última modificación · ${new Date(pet.updated_at).toLocaleDateString('es-AR')}`
    )
  );

  // ── Composición ──
  // Layout en estilos inline (no clases Tailwind del plugin) para que el grid
  // de 2 columnas sea determinista aunque el CSS del plugin aún no haya cargado.
  return React.createElement(
    'div',
    {
      className,
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      },
    },
    actionBar,
    statusBanner,
    React.createElement(
      'div',
      {
        style: twoCol
          ? {
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 344px',
              gap: 20,
              alignItems: 'start',
            }
          : { display: 'flex', flexDirection: 'column', gap: 14 },
      },
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 } },
        identityHeader,
        alertsCard,
        completeness,
        infoCard,
        notesCard,
        moduleSections
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
        ownerCard,
        otherPetsCard,
        metaFooter
      )
    )
  );
}
