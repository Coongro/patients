/**
 * Tarjetas de estadísticas de pacientes.
 * Usa StatCard + Skeleton de la librería UI compartida.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { usePetStats } from '../hooks/usePetStats.js';
import type { PetStatsProps, StatDef } from '../types/components.js';
import { formatSpecies, SPECIES_EMOJI } from '../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();

export function PetStats(props: PetStatsProps) {
  const { layout = 'row', extraStats = [], className = '' } = props;

  const { stats, loading, error } = usePetStats();

  if (error) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Error',
      message: 'Error al cargar estadísticas',
    });
  }

  const cards: StatDef[] = [];

  if (stats) {
    cards.push({
      label: 'Total',
      value: stats.total,
      icon: 'paw',
      footer: 'Pacientes registrados',
    });
  }

  cards.push(...extraStats);

  const gridClass = layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex gap-4 overflow-x-auto';

  return React.createElement(
    'div',
    { className: `${gridClass} ${className}` },
    loading
      ? Array.from({ length: 3 }).map((_, i) =>
          React.createElement(UI.Skeleton, {
            key: i,
            className: 'flex-1 min-w-[280px] h-[236px] rounded-2xl',
          })
        )
      : cards.map((card, i) =>
          React.createElement(UI.StatCard, {
            key: i,
            label: card.label,
            value: card.value,
            className: 'flex-1 min-w-[280px] max-w-xs',
            icon: React.createElement('span', { className: 'text-2xl' }, SPECIES_EMOJI[card.icon] ?? '🐾'),
            footer: card.footer ?? undefined,
          })
        )
  );
}
