/**
 * Tabla de mascotas con búsqueda, filtros por especie/estado y paginación.
 * Usa DataTable de ui-components para renderizado desktop + cards en móvil.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { usePatientsSettings } from '../hooks/usePatientsSettings.js';
import { usePets } from '../hooks/usePets.js';
import type { PetsTableProps } from '../types/components.js';
import type { SortDirection } from '../types/filters.js';
import type { Pet } from '../types/pet.js';
import { calculateAge } from '../utils/age.js';
import {
  formatSpecies,
  formatStatus,
  formatSex,
  formatReproductive,
  SPECIES_ICON,
  SPECIES_LABELS,
} from '../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useMemo, useEffect } = React;

const SORTABLE_KEYS = new Set(['name', 'species', 'breed', 'status', 'birth_date', 'created_at']);

export function PetsTable(props: PetsTableProps) {
  const {
    filters: initialFilters,
    columns: customColumns,
    extraColumns = [],
    extraActions = [],
    onRowClick,
    pageSize = 20,
    className = '',
    emptyMessage = 'No se encontraron pacientes',
    emptyStateAction,
  } = props;

  const { settings: pSettings } = usePatientsSettings();

  const { data, loading, error, setFilters, setSort, pagination, goToPage, refetch } = usePets({
    ...initialFilters,
    excludeStatus: pSettings.hideDeceased ? 'deceased' : undefined,
    pageSize,
  });

  const [searchValue, setSearchValue] = useState('');
  const [activeSpeciesFilter, setActiveSpeciesFilter] = useState<string>(
    initialFilters?.species ?? ''
  );
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>(
    initialFilters?.status ?? ''
  );
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  // Re-aplicar filtros cuando hideDeceased cambia en tiempo real
  useEffect(() => {
    setFilters({
      query: searchValue || undefined,
      species: activeSpeciesFilter || undefined,
      status: activeStatusFilter || undefined,
      excludeStatus: !activeStatusFilter && pSettings.hideDeceased ? 'deceased' : undefined,
    });
  }, [pSettings.hideDeceased]);

  const speciesFilterOptions = useMemo(
    () => [
      '',
      ...Object.keys(SPECIES_LABELS).filter((sp) => pSettings.enabledSpecies[sp] !== false),
    ],
    [pSettings.enabledSpecies]
  );

  // Centraliza la actualización de filtros
  const applyFilters = useCallback(
    (overrides: { query?: string; species?: string; status?: string }) => {
      const merged = {
        query: overrides.query ?? searchValue,
        species: overrides.species ?? activeSpeciesFilter,
        status: overrides.status ?? activeStatusFilter,
      };
      setFilters({
        query: merged.query || undefined,
        species: merged.species || undefined,
        status: merged.status || undefined,
        excludeStatus: !merged.status && pSettings.hideDeceased ? 'deceased' : undefined,
      });
    },
    [setFilters, searchValue, activeSpeciesFilter, activeStatusFilter, pSettings.hideDeceased]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      applyFilters({ query: value });
    },
    [applyFilters]
  );

  const handleSpeciesFilter = useCallback(
    (species: string) => {
      setActiveSpeciesFilter(species);
      applyFilters({ species });
    },
    [applyFilters]
  );

  const handleStatusFilter = useCallback(
    (status: string) => {
      setActiveStatusFilter(status);
      applyFilters({ status });
    },
    [applyFilters]
  );

  const handleSort = useCallback(
    (key: string, direction: 'asc' | 'desc' | null) => {
      if (!SORTABLE_KEYS.has(key)) return;
      setSortKey(direction ? key : '');
      setSortDir((direction ?? 'asc') as SortDirection);
      setSort(key, direction ?? 'asc');
    },
    [setSort]
  );

  // Columnas para DataTable
  const dtColumns = useMemo(() => {
    const base = customColumns ?? [
      {
        key: 'name',
        header: 'Nombre',
        sortable: true,
        render: (p: Pet) =>
          React.createElement(
            'div',
            { className: 'flex items-center gap-2' },
            React.createElement(UI.DynamicIcon, {
              icon: SPECIES_ICON[p.species] ?? 'PawPrint',
              size: 16,
            }),
            React.createElement('span', { className: 'font-medium' }, p.name)
          ),
      },
      {
        key: 'species',
        header: 'Especie',
        sortable: true,
        render: (p: Pet) => formatSpecies(p.species),
      },
      {
        key: 'breed',
        header: 'Raza',
        sortable: true,
        render: (p: Pet) => p.breed ?? '—',
      },
      {
        key: 'sex',
        header: 'Sexo',
        render: (p: Pet) => (p.sex ? formatSex(p.sex) : '—'),
      },
      {
        key: 'birth_date',
        header: 'Edad',
        sortable: true,
        render: (p: Pet) => calculateAge(p.birth_date) || '—',
      },
      {
        key: 'weight_kg',
        header: 'Peso',
        render: (p: Pet) => (p.weight_kg ? `${p.weight_kg} kg` : '—'),
      },
      {
        key: 'microchip_number',
        header: 'Microchip',
        render: (p: Pet) => p.microchip_number ?? '—',
      },
      {
        key: 'reproductive_status',
        header: 'Reproductivo',
        render: (p: Pet) =>
          p.reproductive_status ? formatReproductive(p.reproductive_status, p.sex) : '—',
      },
      {
        key: 'status',
        header: 'Estado',
        sortable: true,
        render: (p: Pet) =>
          React.createElement(
            UI.Badge,
            {
              variant: p.status === 'active' ? 'success-soft' : 'secondary',
              size: 'sm',
            },
            formatStatus(p.status)
          ),
      },
    ];

    return [...base, ...extraColumns];
  }, [customColumns, extraColumns]);

  // Acciones para DataTable
  const dtActions = useMemo(() => {
    if (extraActions.length === 0) return undefined;
    return extraActions.map((a) => ({
      label: a.label,
      onClick: a.onClick,
      variant: a.variant as 'ghost' | 'destructive' | undefined,
      hidden: a.hidden,
    }));
  }, [extraActions]);

  // Mobile render: cada mascota como card
  const mobileRender = useCallback(
    (pet: Pet) =>
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1' },
        // Nombre + icono
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(UI.DynamicIcon, {
            icon: SPECIES_ICON[pet.species] ?? 'PawPrint',
            size: 18,
          }),
          React.createElement('span', { className: 'font-medium text-sm' }, pet.name)
        ),
        // Especie · Raza
        React.createElement(
          'div',
          { className: 'text-xs', style: { color: 'var(--cg-text-muted)' } },
          [formatSpecies(pet.species), pet.breed].filter(Boolean).join(' · ')
        ),
        // Edad · Sexo
        React.createElement(
          'div',
          { className: 'text-xs', style: { color: 'var(--cg-text-muted)' } },
          [calculateAge(pet.birth_date), pet.sex ? formatSex(pet.sex) : null]
            .filter(Boolean)
            .join(' · ') || '—'
        ),
        // Estado badge
        React.createElement(
          'div',
          { className: 'mt-1' },
          React.createElement(
            UI.Badge,
            {
              variant: pet.status === 'active' ? 'success-soft' : 'secondary',
              size: 'sm',
            },
            formatStatus(pet.status)
          )
        )
      ),
    []
  );

  return React.createElement(UI.DataTable, {
    data,
    rowKey: (pet: Pet) => pet.id,
    loading,
    error: error ?? undefined,
    onRetry: () => refetch(),
    columns: dtColumns,
    searchPlaceholder: 'Buscar por nombre, raza, microchip...',
    searchValue,
    onSearchChange: handleSearch,
    filterSections: [
      {
        label: 'Especie',
        options: speciesFilterOptions.map((sp) => ({
          value: sp,
          label: sp === '' ? 'Todos' : formatSpecies(sp),
        })),
        value: activeSpeciesFilter,
        onChange: handleSpeciesFilter,
      },
      {
        label: 'Estado',
        options: ['', 'active', 'deceased', 'referred', 'lost'].map((st) => ({
          value: st,
          label: st === '' ? 'Todos' : formatStatus(st),
        })),
        value: activeStatusFilter,
        onChange: handleStatusFilter,
      },
    ],
    sortKey: sortKey || null,
    sortDirection: sortDir as 'asc' | 'desc' | null,
    onSortChange: handleSort,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
    },
    onPageChange: goToPage,
    actions: dtActions,
    onRowClick,
    emptyState: {
      title: emptyStateAction ? 'No hay pacientes aún' : emptyMessage,
      description: emptyStateAction
        ? 'Agrega tu primer paciente para empezar a gestionar historiales y citas.'
        : undefined,
      icon: emptyStateAction
        ? React.createElement(UI.DynamicIcon, { icon: 'PawPrint', size: 24 })
        : undefined,
      action: emptyStateAction,
      filteredTitle: emptyMessage,
      filteredDescription: 'Prueba con otros términos o ajusta los filtros.',
    },
    mobileRender,
    className,
  });
}
