/**
 * Hook para obtener estadísticas de pacientes.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface PetStatsData {
  total: number;
  bySpecies: Array<{ label: string; count: number }>;
  byStatus: Array<{ label: string; count: number }>;
}

export interface UsePetStatsOptions {
  /**
   * Excluye pacientes fallecidos de los conteos, igual que el listado los
   * oculta cuando el setting `hideDeceased` está activo. Mantener el mismo
   * criterio evita que el Total / KPI "Activos" del dashboard se infle.
   */
  excludeDeceased?: boolean;
}

export function usePetStats(options: UsePetStatsOptions = {}): {
  stats: PetStatsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { excludeDeceased = false } = options;
  const [stats, setStats] = useState<PetStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bySpecies, byStatus] = await Promise.all([
        actions.execute<Array<{ label: string; count: number }>>('patients.pets.countBySpecies', {
          excludeDeceased,
        }),
        actions.execute<Array<{ label: string; count: number }>>('patients.pets.countByStatus', {
          excludeDeceased,
        }),
      ]);

      if (!mountedRef.current) return;

      const total = bySpecies.reduce((sum, item) => sum + item.count, 0);

      setStats({ total, bySpecies, byStatus });
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [excludeDeceased]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}
