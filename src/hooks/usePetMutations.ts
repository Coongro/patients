/**
 * Hook para operaciones de mutación de mascotas (crear, editar, eliminar).
 */
import { getHostReact, actions, usePlugin } from '@coongro/plugin-sdk';

import type { Pet, PetCreateData, PetUpdateData } from '../types/pet.js';

const React = getHostReact();
const { useState, useCallback } = React;

export interface UsePetMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: PetCreateData) => Promise<Pet | null>;
  update: (id: string, data: PetUpdateData) => Promise<Pet | null>;
  remove: (id: string) => Promise<boolean>;
  softDelete: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;
}

export function usePetMutations(): UsePetMutationsResult {
  const { toast } = usePlugin();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = useCallback(
    async (data: PetCreateData): Promise<Pet | null> => {
      setCreating(true);
      try {
        const result = await actions.execute<Pet[]>('patients.pets.create', { data });
        toast.success('Paciente creado', data.name);
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo crear el paciente');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [toast]
  );

  const update = useCallback(
    async (id: string, data: PetUpdateData): Promise<Pet | null> => {
      setUpdating(true);
      try {
        const result = await actions.execute<Pet[]>('patients.pets.update', { id, data });
        toast.success('Paciente actualizado', '');
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo actualizar');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [toast]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('patients.pets.delete', { id });
        toast.success('Paciente eliminado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [toast]
  );

  const softDelete = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('patients.pets.softDelete', { id });
        toast.success('Paciente archivado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo archivar');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [toast]
  );

  const restore = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await actions.execute('patients.pets.restore', { id });
        toast.success('Paciente restaurado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo restaurar');
        return false;
      }
    },
    [toast]
  );

  return { creating, updating, deleting, create, update, remove, softDelete, restore };
}
