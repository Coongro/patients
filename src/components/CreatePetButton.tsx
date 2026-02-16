/**
 * Botón para crear paciente. Abre un modal con PetForm.
 * Sigue el mismo patrón que CreateContactButton.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import type { CreatePetButtonProps } from '../types/components.js';
import type { Pet } from '../types/pet.js';

import { PetForm } from './PetForm.js';

const React = getHostReact();
const { useState, useCallback, useEffect } = React;

export function CreatePetButton(props: CreatePetButtonProps) {
  const {
    defaults = {},
    label = 'Nuevo paciente',
    onSuccess,
    variant = 'primary',
    className = '',
  } = props;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

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

    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setOpen(true),
        className: `flex items-center justify-center gap-2 h-[59px] rounded-lg text-xl font-bold transition-colors ${
          isPrimary
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'border border-[var(--cg-border)] text-[var(--cg-text)] hover:bg-[var(--cg-bg-hover)]'
        } ${className}`,
      },
      React.createElement(
        'svg',
        {
          width: 20,
          height: 20,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2.5,
        },
        React.createElement('path', { d: 'M12 5v14M5 12h14' })
      ),
      label
    ),

    open &&
      React.createElement(
        'div',
        {
          className: 'fixed inset-0 z-[300] flex items-center justify-center',
          onClick: (e: { target: EventTarget | null; currentTarget: EventTarget | null }) => {
            if (e.target === e.currentTarget) setOpen(false);
          },
        },
        React.createElement('div', {
          className: 'absolute inset-0 bg-[var(--cg-bg-overlay)]',
        }),
        React.createElement(
          'div',
          {
            className:
              'relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-xl',
          },
          React.createElement(
            'div',
            {
              className:
                'flex items-center justify-between px-6 py-4 border-b border-[var(--cg-border)]',
            },
            React.createElement(
              'h2',
              { className: 'text-lg font-semibold text-[var(--cg-text)]' },
              label
            ),
            React.createElement(
              'button',
              {
                onClick: () => setOpen(false),
                className:
                  'p-1.5 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]',
              },
              React.createElement(
                'svg',
                {
                  width: 18,
                  height: 18,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
              )
            )
          ),
          React.createElement(
            'div',
            { className: 'p-6' },
            React.createElement(PetForm, {
              defaults,
              onSuccess: handleSuccess,
              onCancel: () => setOpen(false),
            })
          )
        )
      )
  );
}
