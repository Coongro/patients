/**
 * Hook para obtener una mascota individual por ID.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { Pet } from '../types/pet.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UsePetResult {
  pet: Pet | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePet(id: string | null | undefined): UsePetResult {
  const [pet, setPet] = useState<Pet | null>(null);
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
    if (!id) {
      setPet(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<Pet | undefined>('patients.pets.getById', { id });
      if (!mountedRef.current) return;
      setPet(result ?? null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar paciente');
      setPet(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { pet, loading, error, refetch: fetch };
}
