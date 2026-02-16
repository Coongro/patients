/**
 * Tabla de mascotas con búsqueda, filtros por especie/estado y paginación.
 * Sigue el mismo patrón que ContactsTable.
 */
import { getHostReact } from '@coongro/plugin-sdk';

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
} from '../utils/labels.js';

const React = getHostReact();
const { useState, useCallback, useMemo } = React;

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
        React.createElement('span', null, SPECIES_EMOJI[p.species] ?? '🐾'),
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
        'span',
        {
          className:
            p.status === 'active'
              ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--cg-success-bg)] text-[var(--cg-success)]'
              : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--cg-bg-tertiary)] text-[var(--cg-text-muted)]',
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
  } = props;

  const { settings: pSettings } = usePatientsSettings();

  const { data, loading, error, setFilters, setSort, pagination, nextPage, prevPage, refetch } =
    usePets({ ...initialFilters, pageSize });

  const [searchValue, setSearchValue] = useState('');
  const [activeSpeciesFilter, setActiveSpeciesFilter] = useState<string>(
    initialFilters?.species ?? ''
  );
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>(
    initialFilters?.status ?? ''
  );
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  // Filtrar columnas según settings de visibilidad
  const defaultColumns = useMemo(
    () => ALL_COLUMNS.filter((col) => pSettings.visibleColumns.has(col.key)),
    [pSettings.visibleColumns]
  );

  const allColumns = useMemo(
    () => [...(columns ?? defaultColumns), ...extraColumns],
    [columns, defaultColumns, extraColumns]
  );

  // Especies habilitadas para los botones de filtro
  const speciesFilterOptions = useMemo(
    () => ['', ...pSettings.enabledSpecies],
    [pSettings.enabledSpecies]
  );

  const handleSearch = useCallback(
    (e: { target: { value: string } }) => {
      const value = e.target.value;
      setSearchValue(value);
      setFilters({
        query: value || undefined,
        species: activeSpeciesFilter || undefined,
        status: activeStatusFilter || undefined,
      });
    },
    [setFilters, activeSpeciesFilter, activeStatusFilter]
  );

  const handleSpeciesFilter = useCallback(
    (species: string) => {
      setActiveSpeciesFilter(species);
      setFilters({
        query: searchValue || undefined,
        species: species || undefined,
        status: activeStatusFilter || undefined,
      });
    },
    [setFilters, searchValue, activeStatusFilter]
  );

  const handleStatusFilter = useCallback(
    (status: string) => {
      setActiveStatusFilter(status);
      setFilters({
        query: searchValue || undefined,
        species: activeSpeciesFilter || undefined,
        status: status || undefined,
      });
    },
    [setFilters, searchValue, activeSpeciesFilter]
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

  if (error) {
    return React.createElement(
      'div',
      { className: 'flex flex-col items-center justify-center py-12 gap-3' },
      React.createElement('p', { className: 'text-sm text-[var(--cg-danger)]' }, error),
      React.createElement(
        'button',
        {
          onClick: () => refetch(),
          className:
            'px-4 py-2 text-sm rounded-lg bg-[var(--cg-accent)] text-[var(--cg-text-inverse)] hover:bg-[var(--cg-accent-hover)] transition-colors',
        },
        'Reintentar'
      )
    );
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-4 ${className}` },

    // Barra de búsqueda y filtros
    React.createElement(
      'div',
      { className: 'flex flex-col gap-3' },
      // Búsqueda
      React.createElement(
        'div',
        { className: 'relative flex-1' },
        React.createElement(
          'svg',
          {
            className: 'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cg-text-muted)]',
            width: 16,
            height: 16,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2,
          },
          React.createElement('circle', { cx: 11, cy: 11, r: 8 }),
          React.createElement('path', { d: 'M21 21l-4.35-4.35' })
        ),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Buscar por nombre, raza, microchip...',
          value: searchValue,
          onChange: handleSearch,
          className:
            'w-full h-9 pl-10 pr-4 text-sm rounded-lg border border-[var(--cg-input-border)] bg-[var(--cg-input-bg)] text-[var(--cg-text)] placeholder:text-[var(--cg-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--cg-border-focus)]',
        })
      ),
      // Filtros de especie y estado
      React.createElement(
        'div',
        { className: 'flex items-center gap-4' },
        React.createElement(
          'div',
          { className: 'flex gap-1' },
          speciesFilterOptions.map((sp) =>
            React.createElement(
              'button',
              {
                key: sp,
                onClick: () => handleSpeciesFilter(sp),
                className: `px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  activeSpeciesFilter === sp
                    ? 'bg-[var(--cg-accent)] text-[var(--cg-text-inverse)]'
                    : 'bg-[var(--cg-bg-secondary)] text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-tertiary)]'
                }`,
              },
              sp === '' ? 'Todos' : formatSpecies(sp)
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'flex gap-1' },
          ['', 'active', 'deceased', 'referred', 'lost'].map((st) =>
            React.createElement(
              'button',
              {
                key: st,
                onClick: () => handleStatusFilter(st),
                className: `px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  activeStatusFilter === st
                    ? 'bg-[var(--cg-accent)] text-[var(--cg-text-inverse)]'
                    : 'bg-[var(--cg-bg-secondary)] text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-tertiary)]'
                }`,
              },
              st === '' ? 'Todos' : formatStatus(st)
            )
          )
        )
      )
    ),

    // Tabla
    React.createElement(
      'div',
      { className: 'overflow-x-auto rounded-lg border border-[var(--cg-border)]' },
      React.createElement(
        'table',
        { className: 'w-full' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            { className: 'bg-[var(--cg-bg-secondary)] border-b border-[var(--cg-border)]' },
            allColumns.map((col) => {
              const isSortable = SORTABLE_KEYS.has(col.key);
              const isActive = sortKey === col.key;
              const arrow = isActive ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
              return React.createElement(
                'th',
                {
                  key: col.key,
                  onClick: isSortable ? () => handleSort(col.key) : undefined,
                  className: `text-left p-3 text-xs font-medium uppercase tracking-wider ${
                    isSortable ? 'cursor-pointer select-none hover:text-[var(--cg-text)]' : ''
                  } ${isActive ? 'text-[var(--cg-text)]' : 'text-[var(--cg-text-muted)]'} ${col.className ?? ''}`,
                },
                col.header + arrow
              );
            }),
            extraActions.length > 0 &&
              React.createElement(
                'th',
                {
                  className:
                    'w-24 p-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--cg-text-muted)]',
                },
                'Acciones'
              )
          )
        ),
        React.createElement(
          'tbody',
          null,
          loading
            ? Array.from({ length: 5 }).map((_, i) =>
                React.createElement(
                  'tr',
                  { key: `skeleton-${i}`, className: 'border-b border-[var(--cg-border)]' },
                  Array.from({
                    length: allColumns.length + (extraActions.length > 0 ? 1 : 0),
                  }).map((_, j) =>
                    React.createElement(
                      'td',
                      { key: j, className: 'p-3' },
                      React.createElement('div', {
                        className: 'h-4 rounded bg-[var(--cg-skeleton)] animate-pulse',
                        style: { width: `${60 + Math.random() * 40}%` },
                      })
                    )
                  )
                )
              )
            : data.length === 0
              ? React.createElement(
                  'tr',
                  null,
                  React.createElement(
                    'td',
                    {
                      colSpan: allColumns.length + (extraActions.length > 0 ? 1 : 0),
                      className: 'p-12 text-center text-sm text-[var(--cg-text-muted)]',
                    },
                    emptyMessage
                  )
                )
              : data.map((pet) =>
                  React.createElement(
                    'tr',
                    {
                      key: pet.id,
                      onClick: () => onRowClick?.(pet),
                      className: `border-b border-[var(--cg-border)] transition-colors ${
                        onRowClick ? 'cursor-pointer hover:bg-[var(--cg-bg-hover)]' : ''
                      }`,
                    },
                    allColumns.map((col) =>
                      React.createElement(
                        'td',
                        {
                          key: col.key,
                          className: `p-3 text-sm text-[var(--cg-text)] ${col.className ?? ''}`,
                        },
                        col.render
                          ? (col.render(pet) as React.ReactNode)
                          : (((pet as unknown as Record<string, unknown>)[
                              col.key
                            ] as React.ReactNode) ?? '—')
                      )
                    ),
                    extraActions.length > 0 &&
                      React.createElement(
                        'td',
                        {
                          className: 'p-3 text-right',
                          onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
                        },
                        React.createElement(
                          'div',
                          { className: 'flex items-center justify-end gap-1' },
                          extraActions
                            .filter((a) => !a.hidden || !a.hidden(pet))
                            .map((action, i) =>
                              React.createElement(
                                'button',
                                {
                                  key: i,
                                  onClick: () => action.onClick(pet),
                                  title: action.label,
                                  className: `p-1.5 rounded-md text-xs transition-colors ${
                                    action.variant === 'destructive'
                                      ? 'text-[var(--cg-danger)] hover:bg-[var(--cg-danger-bg)]'
                                      : 'text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]'
                                  }`,
                                },
                                action.label
                              )
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
        { className: 'flex items-center justify-between text-sm text-[var(--cg-text-muted)]' },
        React.createElement(
          'span',
          null,
          `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} de ${pagination.total}`
        ),
        React.createElement(
          'div',
          { className: 'flex gap-2' },
          React.createElement(
            'button',
            {
              onClick: prevPage,
              disabled: pagination.page <= 1,
              className:
                'px-3 py-1.5 text-xs rounded-lg border border-[var(--cg-border)] hover:bg-[var(--cg-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
            },
            'Anterior'
          ),
          React.createElement(
            'button',
            {
              onClick: nextPage,
              disabled: pagination.page >= pagination.totalPages,
              className:
                'px-3 py-1.5 text-xs rounded-lg border border-[var(--cg-border)] hover:bg-[var(--cg-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
            },
            'Siguiente'
          )
        )
      )
  );
}
