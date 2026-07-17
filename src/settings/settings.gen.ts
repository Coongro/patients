/**
 * AUTO-GENERADO por Coongro Builder — NO editar a mano.
 * Se regenera al guardar la página de settings desde /dev/builder.
 * La lógica de negocio va en un hook de dominio que consume esto.
 */
/* eslint-disable */

import { useSettings } from '@coongro/plugin-sdk';

function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

function toEnum<T extends string>(v: unknown, options: readonly T[], fallback: T): T {
  return typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T) : fallback;
}

export const DEFAULTS_SPECIES = {
  Perro: 'Perro',
  Gato: 'Gato',
  Ave: 'Ave',
  Reptil: 'Reptil',
  Roedor: 'Roedor',
  Otro: 'Otro',
} as const;

/** Tipo de cada setting por su key punteada (para getSetting). */
export interface PatientsSettingsByKey {
  'patients.species.dog': boolean;
  'patients.species.cat': boolean;
  'patients.species.bird': boolean;
  'patients.species.reptile': boolean;
  'patients.species.rodent': boolean;
  'patients.species.other': boolean;
  'patients.defaults.species': 'Perro' | 'Gato' | 'Ave' | 'Reptil' | 'Roedor' | 'Otro';
  'patients.behavior.openDetailOnCreate': boolean;
  'patients.behavior.hideDeceased': boolean;
  'patients.behavior.showCompleteness': boolean;
  'patients.required.sex': boolean;
  'patients.required.birthDate': boolean;
}

/** Settings del plugin con defaults aplicados y coerción por tipo. */
export interface PatientsSettings {
  /** Perro — Habilitar especie Perro · `patients.species.dog` · default: `true` */
  readonly speciesDog: boolean;
  /** Gato — Habilitar especie Gato · `patients.species.cat` · default: `true` */
  readonly speciesCat: boolean;
  /** Ave — Habilitar especie Ave · `patients.species.bird` · default: `false` */
  readonly speciesBird: boolean;
  /** Reptil — Habilitar especie Reptil · `patients.species.reptile` · default: `false` */
  readonly speciesReptile: boolean;
  /** Roedor — Habilitar especie Roedor · `patients.species.rodent` · default: `false` */
  readonly speciesRodent: boolean;
  /** Otro — Habilitar especie Otro (exóticos, etc.) · `patients.species.other` · default: `true` */
  readonly speciesOther: boolean;
  /** Especie por defecto — Especie preseleccionada al crear un paciente · `patients.defaults.species` · default: `"Perro"` */
  readonly defaultsSpecies: 'Perro' | 'Gato' | 'Ave' | 'Reptil' | 'Roedor' | 'Otro';
  /** Abrir ficha al crear — Al crear un paciente, abrir automáticamente su ficha de detalle · `patients.behavior.openDetailOnCreate` · default: `true` */
  readonly behaviorOpenDetailOnCreate: boolean;
  /** Ocultar pacientes fallecidos — Excluir pacientes fallecidos de la búsqueda y listado por defecto · `patients.behavior.hideDeceased` · default: `true` */
  readonly behaviorHideDeceased: boolean;
  /** Indicador de completitud — Mostrar qué porcentaje del perfil del paciente está completo · `patients.behavior.showCompleteness` · default: `false` */
  readonly behaviorShowCompleteness: boolean;
  /** Sexo obligatorio — Requerir sexo al crear o editar un paciente · `patients.required.sex` · default: `false` */
  readonly requiredSex: boolean;
  /** Edad o fecha de nacimiento obligatoria — Requerir la edad del paciente al crear o editarlo. Se puede cargar como fecha exacta o como edad aproximada (lo habitual cuando no se conoce la fecha de nacimiento). · `patients.required.birthDate` · default: `false` */
  readonly requiredBirthDate: boolean;
}

/** Nombre de prop → key punteada del manifest. */
export const SETTING_KEYS = {
  speciesDog: 'patients.species.dog',
  speciesCat: 'patients.species.cat',
  speciesBird: 'patients.species.bird',
  speciesReptile: 'patients.species.reptile',
  speciesRodent: 'patients.species.rodent',
  speciesOther: 'patients.species.other',
  defaultsSpecies: 'patients.defaults.species',
  behaviorOpenDetailOnCreate: 'patients.behavior.openDetailOnCreate',
  behaviorHideDeceased: 'patients.behavior.hideDeceased',
  behaviorShowCompleteness: 'patients.behavior.showCompleteness',
  requiredSex: 'patients.required.sex',
  requiredBirthDate: 'patients.required.birthDate',
} as const;

/** Valores por defecto (los mismos del manifest). */
export const SETTING_DEFAULTS = {
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
} as const;

const COERCE: {
  [K in keyof PatientsSettingsByKey]: (values: Record<string, unknown>) => PatientsSettingsByKey[K];
} = {
  'patients.species.dog': (values) => toBool(values['patients.species.dog'], true),
  'patients.species.cat': (values) => toBool(values['patients.species.cat'], true),
  'patients.species.bird': (values) => toBool(values['patients.species.bird'], false),
  'patients.species.reptile': (values) => toBool(values['patients.species.reptile'], false),
  'patients.species.rodent': (values) => toBool(values['patients.species.rodent'], false),
  'patients.species.other': (values) => toBool(values['patients.species.other'], true),
  'patients.defaults.species': (values) =>
    toEnum(
      values['patients.defaults.species'],
      ['Perro', 'Gato', 'Ave', 'Reptil', 'Roedor', 'Otro'],
      'Perro'
    ),
  'patients.behavior.openDetailOnCreate': (values) =>
    toBool(values['patients.behavior.openDetailOnCreate'], true),
  'patients.behavior.hideDeceased': (values) =>
    toBool(values['patients.behavior.hideDeceased'], true),
  'patients.behavior.showCompleteness': (values) =>
    toBool(values['patients.behavior.showCompleteness'], false),
  'patients.required.sex': (values) => toBool(values['patients.required.sex'], false),
  'patients.required.birthDate': (values) => toBool(values['patients.required.birthDate'], false),
};

/** Lee UNA setting tipada desde los valores crudos del tenant (para handlers). */
export function getSetting<K extends keyof PatientsSettingsByKey>(
  values: Record<string, unknown>,
  key: K
): PatientsSettingsByKey[K] {
  return COERCE[key](values);
}

/** Construye el objeto tipado desde los valores crudos (sin hook: handlers/tests). */
export function readPatientsSettings(values: Record<string, unknown>): PatientsSettings {
  return {
    speciesDog: COERCE['patients.species.dog'](values),
    speciesCat: COERCE['patients.species.cat'](values),
    speciesBird: COERCE['patients.species.bird'](values),
    speciesReptile: COERCE['patients.species.reptile'](values),
    speciesRodent: COERCE['patients.species.rodent'](values),
    speciesOther: COERCE['patients.species.other'](values),
    defaultsSpecies: COERCE['patients.defaults.species'](values),
    behaviorOpenDetailOnCreate: COERCE['patients.behavior.openDetailOnCreate'](values),
    behaviorHideDeceased: COERCE['patients.behavior.hideDeceased'](values),
    behaviorShowCompleteness: COERCE['patients.behavior.showCompleteness'](values),
    requiredSex: COERCE['patients.required.sex'](values),
    requiredBirthDate: COERCE['patients.required.birthDate'](values),
  };
}

/**
 * Hook reactivo: settings tipadas del plugin con defaults aplicados.
 * Envolvé esto en un hook de dominio si necesitás lógica de negocio.
 */
export function usePatientsSettings(): { settings: PatientsSettings; loading: boolean } {
  const { values, loading } = useSettings('patients.');
  return { settings: readPatientsSettings(values), loading };
}
