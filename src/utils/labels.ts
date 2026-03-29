/**
 * Labels de dominio para la UI.
 */

export const SPECIES_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  reptile: 'Reptil',
  rodent: 'Roedor',
  other: 'Otro',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  deceased: 'Fallecido',
  referred: 'Derivado',
  lost: 'Perdido',
};

export const SEX_LABELS: Record<string, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Desconocido',
};

export const REPRODUCTIVE_LABELS: Record<string, string> = {
  intact: 'Entero/a',
  neutered: 'Castrado',
  spayed: 'Esterilizada',
};

export const REFERRAL_LABELS: Record<string, string> = {
  referral: 'Recomendación',
  google: 'Google',
  social: 'Redes sociales',
  walk_in: 'Pasó por el local',
  other: 'Otro',
};

/** Mapeo especie → nombre de icono Lucide (coherente con manifest settings) */
export const SPECIES_ICON: Record<string, string> = {
  dog: 'Dog',
  cat: 'Cat',
  bird: 'Bird',
  reptile: 'Turtle',
  rodent: 'Rabbit',
  other: 'PawPrint',
};

/** Convierte un mapa de labels a opciones para Select */
export function toSelectOptions(
  labels: Record<string, string>
): Array<{ label: string; value: string }> {
  return Object.entries(labels).map(([value, label]) => ({ label, value }));
}

export function formatSpecies(species: string): string {
  return SPECIES_LABELS[species] ?? species;
}

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatSex(sex: string | null): string {
  if (!sex) return '';
  return SEX_LABELS[sex] ?? sex;
}

export function formatReproductive(status: string | null): string {
  if (!status) return '';
  return REPRODUCTIVE_LABELS[status] ?? status;
}

export function formatReferral(source: string | null): string {
  if (!source) return '';
  return REFERRAL_LABELS[source] ?? source;
}
