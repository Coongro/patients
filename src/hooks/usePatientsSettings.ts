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
};

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
    defaultSpecies: SPECIES_LABEL_TO_CODE[get('patients.defaults.species') as string] ?? 'dog',
    openDetailOnCreate: get('patients.behavior.openDetailOnCreate') as boolean,
    hideDeceased: get('patients.behavior.hideDeceased') as boolean,
    showCompleteness: get('patients.behavior.showCompleteness') as boolean,
    requireSex: get('patients.required.sex') as boolean,
    requireBirthDate: get('patients.required.birthDate') as boolean,
    requireMicrochip: get('patients.required.microchip') as boolean,
  };
}

export function usePatientsSettings() {
  const { values, loading } = useSettings('patients.');

  return { settings: parseSettings(values), loading };
}
