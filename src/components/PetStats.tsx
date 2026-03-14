/**
 * Tarjetas de estadísticas de pacientes.
 * Usa StatCardRow de la librería UI compartida.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { usePetStats } from '../hooks/usePetStats.js';
import type { PetStatsProps, StatDef } from '../types/components.js';
import { SPECIES_EMOJI, SPECIES_LABELS } from '../utils/labels.js';

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
    cards.push({ label: 'Total', value: stats.total, icon: '' });

    const activeCount = stats.byStatus.find((s) => s.label === 'active')?.count ?? 0;
    cards.push({ label: 'Activos', value: activeCount, icon: '' });

    // Tarjeta por especie — solo si hay al menos uno
    for (const sp of stats.bySpecies) {
      if (sp.count > 0) {
        cards.push({
          label: SPECIES_LABELS[sp.label] ?? sp.label,
          value: sp.count,
          icon: sp.label,
        });
      }
    }
  }

  cards.push(...extraStats);

  return React.createElement(UI.StatCardRow, {
    cards: cards.map((c) => ({
      label: c.label,
      value: c.value,
      icon: SPECIES_EMOJI[c.icon] ?? (c.icon || undefined),
      footer: c.footer ?? undefined,
    })),
    loading,
    skeletonCount: 4,
    layout,
    className,
  });
}
