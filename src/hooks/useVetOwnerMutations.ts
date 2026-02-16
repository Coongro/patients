/**
 * Hook para operaciones de mutación de datos veterinarios del dueño.
 */
import { getHostReact, actions, usePlugin } from '@coongro/plugin-sdk';

import type { VetOwner, VetOwnerCreateData, VetOwnerUpdateData } from '../types/vet-owner.js';

const React = getHostReact();
const { useState, useCallback } = React;

export interface UseVetOwnerMutationsResult {
  saving: boolean;
  create: (data: VetOwnerCreateData) => Promise<VetOwner | null>;
  update: (id: string, data: VetOwnerUpdateData) => Promise<VetOwner | null>;
  ensureOwner: (contactId: string, data?: Partial<VetOwnerCreateData>) => Promise<VetOwner | null>;
}

export function useVetOwnerMutations(): UseVetOwnerMutationsResult {
  const { toast } = usePlugin();
  const [saving, setSaving] = useState(false);

  const create = useCallback(
    async (data: VetOwnerCreateData): Promise<VetOwner | null> => {
      setSaving(true);
      try {
        const result = await actions.execute<VetOwner[]>('patients.owners.create', { data });
        return result[0] ?? null;
      } catch (err) {
        toast.error(
          'Error',
          err instanceof Error ? err.message : 'No se pudo guardar datos del dueño'
        );
        return null;
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  const update = useCallback(
    async (id: string, data: VetOwnerUpdateData): Promise<VetOwner | null> => {
      setSaving(true);
      try {
        const result = await actions.execute<VetOwner[]>('patients.owners.update', { id, data });
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo actualizar');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  const ensureOwner = useCallback(
    async (contactId: string, data?: Partial<VetOwnerCreateData>): Promise<VetOwner | null> => {
      setSaving(true);
      try {
        const result = await actions.execute<VetOwner>('patients.owners.ensureOwner', {
          contactId,
          data,
        });
        return result;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo vincular dueño');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  return { saving, create, update, ensureOwner };
}
