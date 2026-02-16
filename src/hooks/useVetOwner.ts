/**
 * Hook para obtener datos veterinarios de un dueño por contact_id.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { VetOwner } from '../types/vet-owner.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseVetOwnerResult {
  vetOwner: VetOwner | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVetOwner(contactId: string | null | undefined): UseVetOwnerResult {
  const [vetOwner, setVetOwner] = useState<VetOwner | null>(null);
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
    if (!contactId) {
      setVetOwner(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<VetOwner | undefined>('patients.owners.getByContactId', {
        contactId,
      });
      if (!mountedRef.current) return;
      setVetOwner(result ?? null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar datos del dueño');
      setVetOwner(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { vetOwner, loading, error, refetch: fetch };
}
