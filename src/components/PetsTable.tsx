/**
 * Tabla de mascotas con búsqueda, filtros por especie/estado y paginación.
 * Usa DataTable genérico de @coongro/ui-components.
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
  SPECIES_EMOJI,
  SPECIES_LABELS,
} from '../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useMemo, useEffect } = React;

type ColumnDef = {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: Pet) => unknown;
  className?: string;
};

/** Todas las columnas posibles — se filtran según settings */
const ALL_COLUMNS: ColumnDef[] = [
  {
    key: 'name',
    header: 'Nombre',
    sortable: true,
    render: (p) =>
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement('span', null, SPECIES_EMOJI[p.species] ?? '🐾'),
        React.createElement('span', { className: 'font-medium' }, p.name)
      ),
  },
  { key: 'species', header: 'Especie', sortable: true, render: (p) => formatSpecies(p.species) },
  { key: 'breed', header: 'Raza', sortable: true, render: (p) => p.breed ?? '—' },
  { key: 'sex', header: 'Sexo', render: (p) => (p.sex ? formatSex(p.sex) : '—') },
  {
    key: 'birth_date',
    header: 'Edad',
    sortable: true,
    render: (p) => calculateAge(p.birth_date) || '—',
  },
  { key: 'weight_kg', header: 'Peso', render: (p) => (p.weight_kg ? `${p.weight_kg} kg` : '—') },
  { key: 'microchip_number', header: 'Microchip', render: (p) => p.microchip_number ?? '—' },
  {
    key: 'reproductive_status',
    header: 'Reproductivo',
    render: (p) => (p.reproductive_status ? formatReproductive(p.reproductive_status) : '—'),
  },
  {
    key: 'status',
    header: 'Estado',
    sortable: true,
    render: (p) =>
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

export function PetsTable(props: PetsTableProps) {
  const {
    filters: initialFilters,
    columns,
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

  const allColumns = useMemo(
    () => [...(columns ?? ALL_COLUMNS), ...extraColumns],
    [columns, extraColumns]
  );

  const speciesFilterOptions = useMemo(() => ['', ...Object.keys(SPECIES_LABELS)], []);

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

  const handleSortChange = useCallback(
    (key: string, dir: 'asc' | 'desc' | null) => {
      setSortKey(dir ? key : '');
      setSortDir((dir ?? 'asc') as SortDirection);
      if (dir) {
        setSort(key, dir as SortDirection);
      } else {
        setSort('', 'asc');
      }
    },
    [setSort]
  );

  // Mapear extraActions del plugin al formato DataTable
  const dataTableActions = useMemo(
    () =>
      extraActions.map((a) => ({
        label: a.label,
        onClick: a.onClick,
        variant: a.variant === 'destructive' ? 'destructive' : ('ghost' as const),
        hidden: a.hidden,
      })),
    [extraActions]
  );

  return React.createElement(UI.DataTable, {
    data,
    loading,
    error,
    onRetry: () => refetch(),
    columns: allColumns,
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
    sortKey,
    sortDirection: sortDir,
    onSortChange: handleSortChange,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
    },
    onPageChange: goToPage,
    actions: dataTableActions.length > 0 ? dataTableActions : undefined,
    onRowClick,
    emptyState: {
      title: 'No hay pacientes aún',
      description: 'Agrega tu primer paciente para empezar a gestionar historiales y citas.',
      icon: React.createElement('span', { className: 'text-2xl' }, '🐾'),
      action: emptyStateAction,
      filteredTitle: emptyMessage,
      filteredDescription: 'Prueba con otros términos o ajusta los filtros.',
    },
    className,
  });
}
