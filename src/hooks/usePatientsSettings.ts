/**
 * Hook de dominio para las configuraciones del plugin de pacientes.
 * Consume la capa tipada generada (`settings.gen.ts`) y le agrega la lógica de
 * negocio propia: el mapeo de especies habilitadas y la resolución de la
 * especie por defecto garantizando que esté habilitada.
 */
import { useSettings } from '@coongro/plugin-sdk';

import { readPatientsSettings } from '../settings/settings.gen.js';

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

export function usePatientsSettings() {
  const { values, loading } = useSettings('patients.');
  const raw = readPatientsSettings(values);

  const enabledSpecies: Record<string, boolean> = {
    dog: raw.speciesDog,
    cat: raw.speciesCat,
    bird: raw.speciesBird,
    reptile: raw.speciesReptile,
    rodent: raw.speciesRodent,
    other: raw.speciesOther,
  };

  const settings: PatientsSettings = {
    enabledSpecies,
    defaultSpecies: resolveDefaultSpecies(raw.defaultsSpecies, enabledSpecies),
    openDetailOnCreate: raw.behaviorOpenDetailOnCreate,
    hideDeceased: raw.behaviorHideDeceased,
    showCompleteness: raw.behaviorShowCompleteness,
    requireSex: raw.requiredSex,
    requireBirthDate: raw.requiredBirthDate,
  };

  return { settings, loading };
}
