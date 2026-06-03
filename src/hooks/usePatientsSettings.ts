/**
 * Hook para cargar las configuraciones del plugin de pacientes.
 * Usa useSettings del SDK para reactividad automática.
 */
import { useSettings } from '@coongro/plugin-sdk';

export interface PatientsSettings {
  // Especies habilitadas
  enabledSpecies: Record<string, boolean>;

  // Comportamiento
  defaultSpecies: string;
  openDetailOnCreate: boolean;
  hideDeceased: boolean;
  showCompleteness: boolean;

  // Campos obligatorios
  requireSex: boolean;
  requireBirthDate: boolean;
  requireMicrochip: boolean;
}

/** Mapeo label español → código interno */
const SPECIES_LABEL_TO_CODE: Record<string, string> = {
  Perro: 'dog',
  Gato: 'cat',
  Ave: 'bird',
  Reptil: 'reptile',
  Roedor: 'rodent',
  Otro: 'other',
};

/** Especies disponibles y sus keys en settings */
const SPECIES_KEYS = ['dog', 'cat', 'bird', 'reptile', 'rodent', 'other'] as const;

/** Convierte valor desconocido a boolean (soporta string "true"/"false" de la API) */
function toBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return fallback;
}

/** Defaults cuando no hay settings guardados (mismos que el manifest) */
const DEFAULTS: Record<string, unknown> = {
  'patients.species.dog': true,
  'patients.species.cat': true,
  'patients.species.bird': false,
  'patients.species.reptile': false,
  'patients.species.rodent': false,
  'patients.species.other': true,
  'patients.defaults.species': 'Perro',
  'patients.behavior.openDetailOnCreate': true,
  'patients.behavior.hideDeceased': true,
  'patients.behavior.showCompleteness': false,
  'patients.required.sex': false,
  'patients.required.birthDate': false,
  'patients.required.microchip': false,
};

/**
 * Resuelve la especie por defecto garantizando que esté habilitada.
 * Si la especie configurada está deshabilitada (o no mapea a ningún código),
 * cae a la PRIMERA especie habilitada para que el Select de creación nunca
 * arranque vacío. Si no hay ninguna habilitada, devuelve '' (comportamiento
 * defensivo: el form muestra placeholder y obliga a elegir, en vez de
 * preseleccionar una especie inválida).
 */
function resolveDefaultSpecies(
  configured: string | undefined,
  enabledSpecies: Record<string, boolean>
): string {
  const code = SPECIES_LABEL_TO_CODE[String(configured)];
  if (code && enabledSpecies[code]) {
    return code;
  }
  const firstEnabled = SPECIES_KEYS.find((sp) => enabledSpecies[sp]);
  return firstEnabled ?? '';
}

function parseSettings(raw: Record<string, unknown>): PatientsSettings {
  const get = (key: string) => raw[key] ?? DEFAULTS[key];

  const enabledSpecies: Record<string, boolean> = {};
  for (const sp of SPECIES_KEYS) {
    enabledSpecies[sp] = toBool(
      get(`patients.species.${sp}`),
      DEFAULTS[`patients.species.${sp}`] as boolean
    );
  }

  return {
    enabledSpecies,
    defaultSpecies: resolveDefaultSpecies(String(get('patients.defaults.species')), enabledSpecies),
    openDetailOnCreate: toBool(get('patients.behavior.openDetailOnCreate'), true),
    hideDeceased: toBool(get('patients.behavior.hideDeceased'), true),
    showCompleteness: toBool(get('patients.behavior.showCompleteness'), false),
    requireSex: toBool(get('patients.required.sex'), false),
    requireBirthDate: toBool(get('patients.required.birthDate'), false),
    requireMicrochip: toBool(get('patients.required.microchip'), false),
  };
}

export function usePatientsSettings() {
  const { values, loading } = useSettings('patients.');

  return { settings: parseSettings(values), loading };
}
