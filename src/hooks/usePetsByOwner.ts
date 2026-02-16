/**
 * Hook para obtener las mascotas de un dueño específico.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { Pet } from '../types/pet.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UsePetsByOwnerResult {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePetsByOwner(ownerId: string | null | undefined): UsePetsByOwnerResult {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    if (!ownerId) {
      setPets([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<Pet[]>('patients.pets.listByOwner', { ownerId });
      if (!mountedRef.current) return;
      setPets(result);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar mascotas');
      setPets([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { pets, loading, error, refetch: fetch };
}
