/**
 * Labels de dominio para la UI.
 */

/**
 * Taxonomía de especies — **fuente única** del sistema (COONG-225 #9).
 *
 * Pacientes es el dueño de la taxonomía; vet-pharmacy y vaccination la duplicaban
 * (lista + normalizador). Ahora la importan de `@coongro/patients`. Los maps de
 * label/icon se DERIVAN de acá para que no haya copias que se desincronicen.
 */
export interface SpeciesDef {
  /** Código interno persistido (dog, cat, …). */
  code: string;
  /** Etiqueta en español. */
  label: string;
  /** Nombre de icono Lucide. */
  icon: string;
}

export const SPECIES: readonly SpeciesDef[] = [
  { code: 'dog', label: 'Perro', icon: 'Dog' },
  { code: 'cat', label: 'Gato', icon: 'Cat' },
  { code: 'bird', label: 'Ave', icon: 'Bird' },
  { code: 'reptile', label: 'Reptil', icon: 'Turtle' },
  { code: 'rodent', label: 'Roedor', icon: 'Rabbit' },
  { code: 'other', label: 'Otro', icon: 'PawPrint' },
];

export const SPECIES_LABELS: Record<string, string> = Object.fromEntries(
  SPECIES.map((s) => [s.code, s.label])
);

/** Defaults de especies habilitadas (alineado con el manifest de settings). */
export const SPECIES_ENABLED_DEFAULT: Record<string, boolean> = {
  dog: true,
  cat: true,
  bird: false,
  reptile: false,
  rodent: false,
  other: true,
};

/**
 * Normaliza un texto libre de especie (taxonomía SENASA en mayúscula/plural,
 * "canino"/"felino"/ganado, etc.) al código interno de Pacientes. El ganado
 * (bovino/equino/porcino/ovino) no tiene equivalente de mascota → 'other'.
 * Reemplaza el `senasaSpeciesToCode` que vet-pharmacy y vaccination duplicaban.
 */
export function speciesCodeFromText(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes('canino') || t.includes('perro')) return 'dog';
  if (t.includes('felino') || t.includes('gato')) return 'cat';
  if (t.includes('ave') || t.includes('avi')) return 'bird';
  if (t.includes('reptil')) return 'reptile';
  if (t.includes('roedor')) return 'rodent';
  return 'other';
}

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

/** Mapeo especie → nombre de icono Lucide. Derivado de SPECIES (fuente única). */
export const SPECIES_ICON: Record<string, string> = Object.fromEntries(
  SPECIES.map((s) => [s.code, s.icon])
);

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

export function formatReproductive(status: string | null, sex?: string | null): string {
  if (!status) return '';
  // Esterilizado: el label depende del SEXO, no del valor guardado (neutered/spayed). Así un
  // macho no aparece como "Esterilizada" si el dato quedó en 'spayed' (la vet marcó este caso).
  if (status === 'neutered' || status === 'spayed') {
    if (sex === 'male') return 'Castrado';
    if (sex === 'female') return 'Esterilizada';
    return 'Esterilizado/a';
  }
  return REPRODUCTIVE_LABELS[status] ?? status;
}

export function formatReferral(source: string | null): string {
  if (!source) return '';
  return REFERRAL_LABELS[source] ?? source;
}
