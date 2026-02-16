/**
 * Hook para cargar las configuraciones del plugin de pacientes.
 * Usa settings.getAll('patients.') para traer todo de una vez.
 */
import { getHostReact, settings } from '@coongro/plugin-sdk';

const React = getHostReact();
const { useState, useEffect } = React;

export interface PatientsSettings {
  // Especies habilitadas
  enabledSpecies: string[];
  defaultSpecies: string;

  // Campos obligatorios
  requireMicrochip: boolean;
  requireSex: boolean;
  requireBirthDate: boolean;

  // Columnas visibles en la tabla
  visibleColumns: Set<string>;

  // Comportamiento
  openDetailOnCreate: boolean;
}

const SPECIES_KEYS: Record<string, string> = {
  'patients.species.dog': 'dog',
  'patients.species.cat': 'cat',
  'patients.species.bird': 'bird',
  'patients.species.reptile': 'reptile',
  'patients.species.rodent': 'rodent',
  'patients.species.other': 'other',
};

const COLUMN_KEYS: Record<string, string> = {
  'patients.table.columns.breed': 'breed',
  'patients.table.columns.sex': 'sex',
  'patients.table.columns.weight': 'weight_kg',
  'patients.table.columns.microchip': 'microchip_number',
  'patients.table.columns.status': 'status',
  'patients.table.columns.birthDate': 'birth_date',
  'patients.table.columns.reproductive': 'reproductive_status',
};

/** Defaults cuando no hay settings guardados (mismos que el manifest) */
const DEFAULTS: Record<string, unknown> = {
  'patients.species.dog': true,
  'patients.species.cat': true,
  'patients.species.bird': false,
  'patients.species.reptile': false,
  'patients.species.rodent': false,
  'patients.species.other': true,
  'patients.defaults.species': 'dog',
  'patients.required.microchip': false,
  'patients.required.sex': false,
  'patients.required.birthDate': false,
  'patients.table.columns.breed': true,
  'patients.table.columns.sex': false,
  'patients.table.columns.weight': false,
  'patients.table.columns.microchip': false,
  'patients.table.columns.status': true,
  'patients.table.columns.birthDate': true,
  'patients.table.columns.reproductive': false,
  'patients.behavior.openDetailOnCreate': true,
};

function parseSettings(raw: Record<string, unknown>): PatientsSettings {
  const get = (key: string) => raw[key] ?? DEFAULTS[key];

  // Especies habilitadas
  const enabledSpecies: string[] = [];
  for (const [settingKey, speciesCode] of Object.entries(SPECIES_KEYS)) {
    if (get(settingKey)) enabledSpecies.push(speciesCode);
  }

  // Columnas visibles (name y species siempre visibles)
  const visibleColumns = new Set<string>(['name', 'species']);
  for (const [settingKey, colKey] of Object.entries(COLUMN_KEYS)) {
    if (get(settingKey)) visibleColumns.add(colKey);
  }

  return {
    enabledSpecies,
    defaultSpecies: (get('patients.defaults.species') as string) || 'dog',
    requireMicrochip: get('patients.required.microchip') as boolean,
    requireSex: get('patients.required.sex') as boolean,
    requireBirthDate: get('patients.required.birthDate') as boolean,
    visibleColumns,
    openDetailOnCreate: get('patients.behavior.openDetailOnCreate') as boolean,
  };
}

/** Settings parseados por defecto (antes de cargar desde la API) */
const DEFAULT_SETTINGS = parseSettings({});

export function usePatientsSettings() {
  const [data, setData] = useState<PatientsSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const raw = await settings.getAll('patients.');
        if (!cancelled) setData(parseSettings(raw));
      } catch {
        // Si falla, usar defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { settings: data, loading };
}
