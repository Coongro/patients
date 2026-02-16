/**
 * Selector/buscador de mascota.
 * Sigue el mismo patrón que ContactPicker.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { usePet } from '../hooks/usePet.js';
import { usePets } from '../hooks/usePets.js';
import type { PetPickerProps } from '../types/components.js';
import { calculateAge } from '../utils/age.js';
import { formatSpecies, SPECIES_EMOJI } from '../utils/labels.js';

const React = getHostReact();
const { useState, useCallback, useRef, useEffect } = React;

export function PetPicker(props: PetPickerProps) {
  const {
    filters = {},
    value,
    onChange,
    placeholder = 'Buscar mascota...',
    disabled = false,
    className = '',
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading, search } = usePets({ ...filters, pageSize: 10 });
  const { pet: selectedPet } = usePet(value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    (e: { target: { value: string } }) => {
      const val = e.target.value;
      setQuery(val);
      search(val);
    },
    [search]
  );

  const handleSelect = useCallback(
    (pet: { id: string; name: string; species: string }) => {
      onChange?.(pet as unknown as Parameters<NonNullable<typeof onChange>>[0]);
      setOpen(false);
      setQuery('');
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange?.(null);
    setQuery('');
  }, [onChange]);

  return React.createElement(
    'div',
    { ref: containerRef, className: `relative ${className}` },

    value && selectedPet
      ? React.createElement(
          'div',
          {
            className:
              'flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--cg-input-border)] bg-[var(--cg-input-bg)]',
          },
          React.createElement(
            'span',
            { className: 'text-sm' },
            SPECIES_EMOJI[selectedPet.species] ?? '🐾'
          ),
          React.createElement(
            'span',
            { className: 'flex-1 text-sm text-[var(--cg-text)] truncate' },
            selectedPet.name
          ),
          !disabled &&
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: handleClear,
                className:
                  'p-1 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]',
              },
              React.createElement(
                'svg',
                {
                  width: 14,
                  height: 14,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
              )
            )
        )
      : React.createElement('input', {
          type: 'text',
          value: query,
          onChange: handleSearch,
          onFocus: () => setOpen(true),
          placeholder,
          disabled,
          className:
            'w-full h-9 px-3 text-sm rounded-lg border border-[var(--cg-input-border)] bg-[var(--cg-input-bg)] text-[var(--cg-text)] placeholder:text-[var(--cg-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--cg-border-focus)] disabled:opacity-50',
        }),

    open &&
      React.createElement(
        'div',
        {
          className:
            'absolute z-50 top-full mt-1 w-full max-h-[240px] overflow-y-auto rounded-lg border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-lg',
        },
        loading
          ? React.createElement(
              'div',
              { className: 'p-4 text-center text-sm text-[var(--cg-text-muted)]' },
              'Buscando...'
            )
          : data.length === 0
            ? React.createElement(
                'div',
                { className: 'p-4 text-center text-sm text-[var(--cg-text-muted)]' },
                query ? 'Sin resultados' : 'Escribí para buscar'
              )
            : data.map((pet) =>
                React.createElement(
                  'button',
                  {
                    key: pet.id,
                    type: 'button',
                    onClick: () => handleSelect(pet),
                    className:
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--cg-bg-hover)] transition-colors',
                  },
                  React.createElement(
                    'span',
                    { className: 'text-sm' },
                    SPECIES_EMOJI[pet.species] ?? '🐾'
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex flex-col min-w-0' },
                    React.createElement(
                      'span',
                      { className: 'text-sm text-[var(--cg-text)] truncate' },
                      pet.name
                    ),
                    React.createElement(
                      'span',
                      { className: 'text-xs text-[var(--cg-text-muted)] truncate' },
                      [pet.breed || formatSpecies(pet.species), calculateAge(pet.birth_date)]
                        .filter(Boolean)
                        .join(' · ')
                    )
                  )
                )
              )
      )
  );
}
