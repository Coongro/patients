/**
 * Hook para cargar las configuraciones del plugin de pacientes.
 * Usa useSettings del SDK para reactividad automática.
 */
import { useSettings } from '@coongro/plugin-sdk';

export interface PatientsSettings {
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

// Mapeo temporal: label español → código interno (workaround hasta Coongro/Coongro#314)
const SPECIES_LABEL_TO_CODE: Record<string, string> = {
  Perro: 'dog',
  Gato: 'cat',
  Ave: 'bird',
  Reptil: 'reptile',
  Roedor: 'rodent',
  Otro: 'other',
};

/** Convierte valor desconocido a boolean (soporta string "true"/"false" de la API) */
function toBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return fallback;
}

/** Defaults cuando no hay settings guardados (mismos que el manifest) */
const DEFAULTS: Record<string, unknown> = {
  'patients.defaults.species': 'Perro',
  'patients.behavior.openDetailOnCreate': true,
  'patients.behavior.hideDeceased': true,
  'patients.behavior.showCompleteness': false,
  'patients.required.sex': false,
  'patients.required.birthDate': false,
  'patients.required.microchip': false,
};

function parseSettings(raw: Record<string, unknown>): PatientsSettings {
  const get = (key: string) => raw[key] ?? DEFAULTS[key];

  return {
    defaultSpecies: SPECIES_LABEL_TO_CODE[String(get('patients.defaults.species'))] ?? 'dog',
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
