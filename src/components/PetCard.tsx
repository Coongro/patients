/**
 * Tarjeta resumen de una mascota.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { usePet } from '../hooks/usePet.js';
import type { PetCardProps } from '../types/components.js';
import { calculateAge } from '../utils/age.js';
import { formatSpecies, formatStatus, formatSex, SPECIES_EMOJI } from '../utils/labels.js';

const React = getHostReact();

export function PetCard(props: PetCardProps) {
  const {
    petId,
    pet: petProp,
    showOwner: _showOwner = false,
    extraInfo,
    actions: cardActions = [],
    onClick,
    className = '',
  } = props;

  const { pet: fetchedPet, loading } = usePet(petProp ? null : petId);
  const pet = petProp ?? fetchedPet;

  if (loading) {
    return React.createElement(
      'div',
      { className: `rounded-xl border border-[var(--cg-border)] p-4 ${className}` },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3' },
        React.createElement('div', {
          className: 'w-10 h-10 rounded-full bg-[var(--cg-skeleton)] animate-pulse',
        }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5 flex-1' },
          React.createElement('div', {
            className: 'h-4 w-32 rounded bg-[var(--cg-skeleton)] animate-pulse',
          }),
          React.createElement('div', {
            className: 'h-3 w-20 rounded bg-[var(--cg-skeleton)] animate-pulse',
          })
        )
      )
    );
  }

  if (!pet) {
    return React.createElement(
      'div',
      {
        className: `rounded-xl border border-[var(--cg-border)] p-4 text-center text-sm text-[var(--cg-text-muted)] ${className}`,
      },
      'Paciente no encontrado'
    );
  }

  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾';
  const age = calculateAge(pet.birth_date);

  const infoItems = [formatSpecies(pet.species), pet.breed, formatSex(pet.sex), age].filter(
    Boolean
  );

  return React.createElement(
    'div',
    {
      className: `rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-[var(--cg-accent)] hover:shadow-sm' : ''
      } ${className}`,
      onClick: onClick ? () => onClick(pet) : undefined,
    },

    // Header
    React.createElement(
      'div',
      { className: 'flex items-center gap-3' },
      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-lg flex-shrink-0',
        },
        emoji
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col min-w-0 flex-1' },
        React.createElement(
          'span',
          { className: 'text-sm font-medium text-[var(--cg-text)] truncate' },
          pet.name
        ),
        React.createElement(
          'span',
          { className: 'text-xs text-[var(--cg-text-muted)]' },
          infoItems.join(' · ')
        )
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
    ),

    // Extra info
    extraInfo &&
      React.createElement(
        'div',
        { className: 'mt-3 pt-3 border-t border-[var(--cg-border)]' },
        extraInfo as React.ReactNode
      ),

    // Acciones
    cardActions.length > 0 &&
      React.createElement(
        'div',
        { className: 'mt-3 pt-3 border-t border-[var(--cg-border)] flex gap-2' },
        cardActions
          .filter((a) => !a.hidden || !a.hidden(pet))
          .map((action, i) =>
            React.createElement(
              'button',
              {
                key: i,
                onClick: (e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  action.onClick(pet);
                },
                className: `px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  action.variant === 'destructive'
                    ? 'text-[var(--cg-danger)] border border-[var(--cg-danger)] hover:bg-[var(--cg-danger-bg)]'
                    : 'text-[var(--cg-text)] border border-[var(--cg-border)] hover:bg-[var(--cg-bg-hover)]'
                }`,
              },
              action.label
            )
          )
      )
  );
}
