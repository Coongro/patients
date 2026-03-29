/**
 * Tabla de mascotas con búsqueda, filtros por especie/estado y paginación.
 * Usa componentes UI compartidos (Table, ButtonGroup, Input, etc.).
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

type ColumnDef = {
  key: string;
  header: string;
  render?: (item: Pet) => unknown;
  className?: string;
};

const SORTABLE_KEYS = new Set(['name', 'species', 'breed', 'status', 'birth_date', 'created_at']);

/** Todas las columnas posibles — se filtran según settings */
const ALL_COLUMNS: ColumnDef[] = [
  {
    key: 'name',
    header: 'Nombre',
    render: (p) =>
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
  { key: 'species', header: 'Especie', render: (p) => formatSpecies(p.species) },
  { key: 'breed', header: 'Raza', render: (p) => p.breed ?? '—' },
  { key: 'sex', header: 'Sexo', render: (p) => (p.sex ? formatSex(p.sex) : '—') },
  { key: 'birth_date', header: 'Edad', render: (p) => calculateAge(p.birth_date) || '—' },
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

  const {
    data,
    loading,
    error,
    setFilters,
    setSort,
    pagination,
    nextPage,
    prevPage,
    goToPage,
    refetch,
  } = usePets({
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

  const hasActiveFilters =
    searchValue !== '' || activeSpeciesFilter !== '' || activeStatusFilter !== '';

  const allColumns = useMemo(
    () => [...(columns ?? ALL_COLUMNS), ...extraColumns],
    [columns, extraColumns]
  );

  const speciesFilterOptions = useMemo(
    () => [
      '',
      ...Object.keys(SPECIES_LABELS).filter((sp) => pSettings.enabledSpecies[sp] !== false),
    ],
    [pSettings.enabledSpecies]
  );

  // Centraliza la actualización de filtros evitando duplicación
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
        // Si no hay filtro de estado explícito y hideDeceased está activo, excluir fallecidos
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
    (key: string) => {
      if (!SORTABLE_KEYS.has(key)) return;
      const newDir: SortDirection = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
      setSortKey(key);
      setSortDir(newDir);
      setSort(key, newDir);
    },
    [sortKey, sortDir, setSort]
  );

  /** Retorna la dirección de sort para TableHead: undefined = no sortable, false = sortable sin orden */
  function getSortDirection(colKey: string): 'asc' | 'desc' | false | undefined {
    if (!SORTABLE_KEYS.has(colKey)) return undefined;
    return sortKey === colKey ? (sortDir as 'asc' | 'desc') : false;
  }

  const totalColSpan = allColumns.length + (extraActions.length > 0 ? 1 : 0);

  if (error) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Error',
      message: error,
      onRetry: () => refetch(),
    });
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-4 ${className}` },

    // Barra de búsqueda y filtros
    React.createElement(UI.FilterBar, {
      searchValue,
      onSearchChange: handleSearch,
      searchPlaceholder: 'Buscar por nombre, raza, microchip...',
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
      hasActiveFilters,
    }),

    // Tabla
    React.createElement(
      UI.Table,
      null,
      // Header
      React.createElement(
        UI.TableHeader,
        null,
        React.createElement(
          UI.TableRow,
          null,
          allColumns.map((col) =>
            React.createElement(
              UI.TableHead,
              {
                key: col.key,
                sortDirection: getSortDirection(col.key),
                onSort: () => handleSort(col.key),
                className: col.className,
              },
              col.header
            )
          ),
          extraActions.length > 0 &&
            React.createElement(UI.TableHead, { className: 'w-24 text-right' }, 'Acciones')
        )
      ),
      // Body
      React.createElement(
        UI.TableBody,
        null,
        loading
          ? Array.from({ length: 5 }).map((_, i) =>
              React.createElement(
                UI.TableRow,
                { key: `skeleton-${i}` },
                Array.from({ length: totalColSpan }).map((_, j) =>
                  React.createElement(
                    UI.TableCell,
                    { key: j },
                    React.createElement(UI.Skeleton, { className: 'h-4' })
                  )
                )
              )
            )
          : data.length === 0
            ? React.createElement(
                UI.TableRow,
                null,
                React.createElement(
                  UI.TableCell,
                  { colSpan: totalColSpan, className: 'p-0' },
                  !hasActiveFilters && emptyStateAction
                    ? React.createElement(UI.EmptyState, {
                        title: 'No hay pacientes aún',
                        description:
                          'Agrega tu primer paciente para empezar a gestionar historiales y citas.',
                        icon: React.createElement(UI.DynamicIcon, { icon: 'PawPrint', size: 24 }),
                        action: emptyStateAction,
                      })
                    : React.createElement(UI.EmptyState, {
                        title: emptyMessage,
                        description: hasActiveFilters
                          ? 'Prueba con otros términos o ajusta los filtros.'
                          : undefined,
                      })
                )
              )
            : data.map((pet) =>
                React.createElement(
                  UI.TableRow,
                  {
                    key: pet.id,
                    onClick: onRowClick ? () => onRowClick(pet) : undefined,
                    className: onRowClick ? 'cursor-pointer' : '',
                  },
                  allColumns.map((col) =>
                    React.createElement(
                      UI.TableCell,
                      { key: col.key, className: col.className },
                      col.render
                        ? (col.render(pet) as React.ReactNode)
                        : (((pet as unknown as Record<string, unknown>)[
                            col.key
                          ] as React.ReactNode) ?? '—')
                    )
                  ),
                  extraActions.length > 0 &&
                    React.createElement(
                      UI.TableCell,
                      {
                        className: 'text-right',
                        onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
                      },
                      React.createElement(
                        'div',
                        { className: 'flex items-center justify-end gap-1' },
                        extraActions
                          .filter((a) => !a.hidden || !a.hidden(pet))
                          .map((action, i) =>
                            React.createElement(
                              UI.Button,
                              {
                                key: i,
                                variant: action.variant === 'destructive' ? 'destructive' : 'ghost',
                                size: 'xs',
                                onClick: () => action.onClick(pet),
                                title: action.label,
                              },
                              action.label
                            )
                          )
                      )
                    )
                )
              )
      )
    ),

    // Paginación
    !loading &&
      data.length > 0 &&
      React.createElement(
        'div',
        { className: 'flex items-center justify-between text-sm text-cg-text-muted' },
        React.createElement(
          'span',
          null,
          `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} de ${pagination.total}`
        ),
        React.createElement(
          UI.Pagination,
          null,
          React.createElement(
            UI.PaginationContent,
            null,
            React.createElement(
              UI.PaginationItem,
              null,
              React.createElement(UI.PaginationPrevious, {
                onClick: prevPage,
                disabled: pagination.page <= 1,
              })
            ),
            ...buildPageNumbers(pagination.page, pagination.totalPages).map((item, i) =>
              React.createElement(
                UI.PaginationItem,
                { key: i },
                item === '...'
                  ? React.createElement(UI.PaginationEllipsis)
                  : React.createElement(
                      UI.PaginationLink,
                      {
                        isActive: item === pagination.page,
                        onClick: () => goToPage(item),
                      },
                      item
                    )
              )
            ),
            React.createElement(
              UI.PaginationItem,
              null,
              React.createElement(UI.PaginationNext, {
                onClick: nextPage,
                disabled: pagination.page >= pagination.totalPages,
              })
            )
          )
        )
      )
  );
}

/** Genera lista de números de página con elipsis para la paginación */
function buildPageNumbers(current: number, total: number): Array<number | '...'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | '...'> = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
