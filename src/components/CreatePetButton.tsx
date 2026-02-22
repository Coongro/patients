/**
 * Botón para crear paciente. Abre un FormDialog con PetForm.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { CreatePetButtonProps } from '../types/components.js';
import type { Pet } from '../types/pet.js';

import { PetForm } from './PetForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

export function CreatePetButton(props: CreatePetButtonProps) {
  const {
    defaults = {},
    label = 'Nuevo paciente',
    onSuccess,
    variant = 'primary',
    className = '',
  } = props;

  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(
    (pet: Pet) => {
      setOpen(false);
      onSuccess?.(pet);
    },
    [onSuccess]
  );

  const isPrimary = variant === 'primary';

  return React.createElement(
    React.Fragment,
    null,

    // Botón
    React.createElement(
      UI.Button,
      {
        type: 'button',
        variant: isPrimary ? 'brand' : 'outline',
        onClick: () => setOpen(true),
        className: `gap-2 ${className}`,
      },
      React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 20 }),
      label
    ),

    // Modal
    React.createElement(
      UI.FormDialog,
      {
        open,
        onOpenChange: setOpen,
        title: label,
        size: 'lg',
      },
      React.createElement(PetForm, {
        defaults,
        onSuccess: handleSuccess,
        onCancel: () => setOpen(false),
      })
    )
  );
}
