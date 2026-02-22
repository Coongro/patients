/**
 * Selector/buscador de mascota.
 * Usa UI.Combobox con busqueda server-side via usePets.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { usePet } from '../hooks/usePet.js';
import { usePets } from '../hooks/usePets.js';
import type { PetPickerProps } from '../types/components.js';
import type { Pet } from '../types/pet.js';
import { calculateAge } from '../utils/age.js';
import { formatSpecies, SPECIES_EMOJI } from '../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();
const { useCallback, useEffect, useMemo } = React;

function petSubtitle(pet: Pet): string {
  return [pet.breed || formatSpecies(pet.species), calculateAge(pet.birth_date)]
    .filter(Boolean)
    .join(' · ');
}

/** Contenido interno del dropdown — accede al contexto del Combobox para la busqueda */
function PetSearchContent({
  filters,
  onResults,
}: {
  filters: PetPickerProps['filters'];
  onResults: (pets: Pet[]) => void;
}) {
  const { debouncedSearch, setLoading } = UI.useComboboxContext();
  const { data, loading, search: doSearch } = usePets({ ...filters, pageSize: 10 });

  // Sincronizar busqueda debounced del Combobox con el hook server-side
  useEffect(() => {
    doSearch(debouncedSearch);
  }, [debouncedSearch, doSearch]);

  // Propagar loading al trigger del Combobox (spinner a la derecha del input)
  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  // Notificar resultados al padre para resolver petId → Pet
  useEffect(() => {
    onResults(data);
  }, [data, onResults]);

  return React.createElement(
    UI.ComboboxContent,
    null,
    loading
      ? React.createElement(UI.ComboboxEmpty, null, 'Buscando...')
      : data.length === 0
        ? React.createElement(
            UI.ComboboxEmpty,
            null,
            debouncedSearch ? 'Sin resultados' : 'Escribí para buscar',
          )
        : data.map((pet) =>
            React.createElement(
              UI.ComboboxItem,
              {
                key: pet.id,
                value: pet.id,
                subtitle: petSubtitle(pet),
                icon: React.createElement('span', null, SPECIES_EMOJI[pet.species] ?? '🐾'),
              },
              pet.name,
            ),
          ),
  );
}

export function PetPicker({
  filters = {},
  value,
  onChange,
  placeholder = 'Buscar mascota...',
  disabled = false,
  className = '',
}: PetPickerProps) {
  const { pet: selectedPet } = usePet(value);
  const resultsRef = React.useRef<Pet[]>([]);

  const handleResults = useCallback((pets: Pet[]) => {
    resultsRef.current = pets;
  }, []);

  const handleSelect = useCallback(
    (petId: string) => {
      if (!petId) return;
      const pet = resultsRef.current.find((p) => p.id === petId);
      if (pet) onChange?.(pet);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange?.(null);
  }, [onChange]);

  // Si hay mascota seleccionada, mostrar chip; sino, mostrar combobox
  if (value && selectedPet) {
    return React.createElement(
      'div',
      { className },
      React.createElement(
        UI.Chip,
        {
          icon: React.createElement('span', null, SPECIES_EMOJI[selectedPet.species] ?? '🐾'),
          onRemove: !disabled ? handleClear : undefined,
          size: 'md',
        },
        selectedPet.name,
      ),
    );
  }

  return React.createElement(
    UI.Combobox,
    {
      value: '',
      onValueChange: handleSelect,
      debounceMs: 200,
      disabled,
      className,
    },
    React.createElement(UI.ComboboxChipTrigger, { placeholder }),
    React.createElement(PetSearchContent, { filters, onResults: handleResults }),
  );
}
