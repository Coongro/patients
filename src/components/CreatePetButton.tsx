/**
 * Botón para crear paciente. Abre un FormDialogSubmit con PetForm.
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
  const [saving, setSaving] = useState(false);

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

    // Modal con footer sticky vía FormDialogSubmit
    React.createElement(UI.FormDialogSubmit, {
      open,
      onOpenChange: setOpen,
      title: label,
      size: 'lg',
      submitLabel: 'Crear paciente',
      onCancel: () => setOpen(false),
      disabled: saving,
      children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
        React.createElement(PetForm, {
          defaults,
          onSuccess: handleSuccess,
          formRef,
          hideActions: true,
          onSavingChange: setSaving,
        }),
    })
  );
}
