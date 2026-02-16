/**
 * Tarjetas de estadísticas de pacientes.
 * Sigue el mismo patrón que ContactStats.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { usePetStats } from '../hooks/usePetStats.js';
import type { PetStatsProps, StatDef } from '../types/components.js';
import { formatSpecies, SPECIES_EMOJI } from '../utils/labels.js';

const React = getHostReact();

const DEFAULT_COLORS: Record<string, string> = {
  total: '#D1FAE5',
  dog: '#DBEAFE',
  cat: '#FEF3C7',
  other: '#E5E7EB',
};

export function PetStats(props: PetStatsProps) {
  const { layout = 'row', extraStats = [], className = '' } = props;

  const { stats, loading, error } = usePetStats();

  if (error) {
    return React.createElement(
      'div',
      { className: 'text-sm text-[var(--cg-danger)] text-center py-4' },
      'Error al cargar estadísticas'
    );
  }

  const cards: StatDef[] = [];

  if (stats) {
    cards.push({
      label: 'Total',
      value: stats.total,
      icon: 'paw',
      color: DEFAULT_COLORS.total,
      footer: 'Pacientes registrados',
    });

    for (const item of stats.bySpecies) {
      cards.push({
        label: formatSpecies(item.label),
        value: item.count,
        icon: item.label,
        color: DEFAULT_COLORS[item.label] ?? DEFAULT_COLORS.other,
      });
    }
  }

  cards.push(...extraStats);

  const gridClass = layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex gap-4 overflow-x-auto';

  return React.createElement(
    'div',
    { className: `${gridClass} ${className}` },
    loading
      ? Array.from({ length: 3 }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className:
              'flex-1 min-w-[240px] h-[200px] rounded-2xl border border-[#707070] bg-white animate-pulse',
          })
        )
      : cards.map((card, i) =>
          React.createElement(
            'div',
            {
              key: i,
              className:
                'flex flex-col justify-center items-start px-6 gap-3 rounded-2xl flex-1 min-w-[240px] h-[200px] bg-white border border-[#707070]',
            },
            React.createElement(
              'div',
              { className: 'flex items-center gap-[10px] w-full' },
              React.createElement(
                'span',
                { className: 'text-black font-medium text-xl leading-tight flex-1' },
                card.label
              ),
              React.createElement(
                'div',
                {
                  className:
                    'flex items-center justify-center w-[50px] h-[50px] rounded-lg border border-[#707070] flex-shrink-0 text-2xl',
                  style: { backgroundColor: card.color ?? DEFAULT_COLORS.total },
                },
                SPECIES_EMOJI[card.icon] ?? '🐾'
              )
            ),
            React.createElement(
              'span',
              { className: 'text-black font-medium text-5xl leading-tight' },
              card.value
            ),
            React.createElement(
              'span',
              { className: 'text-black/50 text-sm h-5' },
              card.footer ?? '\u00A0'
            )
          )
        )
  );
}
