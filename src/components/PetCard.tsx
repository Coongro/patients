/**
 * Tarjeta resumen de una mascota.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { usePet } from '../hooks/usePet.js';
import type { PetCardProps } from '../types/components.js';
import { formatAge } from '../utils/age.js';
import { formatSpecies, formatStatus, formatSex, SPECIES_ICON } from '../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();

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
      UI.Card,
      { className: `p-4 ${className}` },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3' },
        React.createElement(UI.Skeleton, { className: 'w-10 h-10 rounded-full' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5 flex-1' },
          React.createElement(UI.Skeleton, { className: 'h-4 w-32' }),
          React.createElement(UI.Skeleton, { className: 'h-3 w-20' })
        )
      )
    );
  }

  if (!pet) {
    return React.createElement(
      UI.Card,
      { className: `p-4 ${className}` },
      React.createElement(UI.EmptyState, { title: 'Paciente no encontrado' })
    );
  }

  const speciesIcon = SPECIES_ICON[pet.species] ?? 'PawPrint';
  const age = formatAge(pet.birth_date, pet.birth_date_estimated);
  const infoItems = [formatSpecies(pet.species), pet.breed, formatSex(pet.sex), age].filter(
    Boolean
  );

  return React.createElement(
    UI.Card,
    {
      className: `p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-cg-accent hover:shadow-sm' : ''
      } ${className}`,
      onClick: onClick ? () => onClick(pet) : undefined,
    },

    // Header
    React.createElement(
      'div',
      { className: 'flex items-center gap-3' },
      React.createElement(UI.Avatar, {
        size: 'md',
        icon: React.createElement(UI.DynamicIcon, {
          icon: speciesIcon,
          size: 20,
          className: 'text-cg-text-muted',
        }),
        className: 'bg-cg-bg-tertiary',
      }),
      React.createElement(
        'div',
        { className: 'flex flex-col min-w-0 flex-1' },
        React.createElement(
          'span',
          { className: 'text-sm font-medium text-cg-text truncate' },
          pet.name
        ),
        React.createElement(
          'span',
          { className: 'text-xs text-cg-text-muted' },
          infoItems.join(' · ')
        )
      ),
      React.createElement(
        UI.Badge,
        {
          variant: pet.status === 'active' ? 'success-soft' : 'secondary',
          size: 'sm',
        },
        formatStatus(pet.status)
      )
    ),

    // Extra info
    extraInfo &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(UI.Separator, { className: 'mt-3' }),
        React.createElement('div', { className: 'mt-3' }, extraInfo as React.ReactNode)
      ),

    // Acciones
    cardActions.length > 0 &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(UI.Separator, { className: 'mt-3' }),
        React.createElement(
          'div',
          { className: 'mt-3 flex gap-2' },
          cardActions
            .filter((a) => !a.hidden || !a.hidden(pet))
            .map((action, i) =>
              React.createElement(
                UI.Button,
                {
                  key: i,
                  variant: action.variant === 'destructive' ? 'destructive' : 'outline',
                  size: 'xs',
                  onClick: (e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    action.onClick(pet);
                  },
                },
                action.label
              )
            )
        )
      )
  );
}
