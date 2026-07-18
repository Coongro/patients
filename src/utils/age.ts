/**
 * Calcula la edad a partir de una fecha de nacimiento.
 * Retorna formato "X años, Y meses" o "X meses" si < 1 año.
 */
export function calculateAge(birthDate: string | null): string {
  if (!birthDate) return '';

  const birth = new Date(birthDate);
  const now = new Date();

  if (isNaN(birth.getTime()) || birth > now) return '';

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  if (years === 0) {
    return months <= 1 ? '1 mes' : `${months} meses`;
  }

  const yearStr = years === 1 ? '1 año' : `${years} años`;
  if (months === 0) return yearStr;
  const monthStr = months === 1 ? '1 mes' : `${months} meses`;
  return `${yearStr}, ${monthStr}`;
}

/**
 * Deriva una fecha de nacimiento APROXIMADA a partir de una edad (años + meses), anclada al
 * primer día del mes resultante. Se usa cuando no se conoce la fecha exacta (lo habitual).
 * Retorna ISO `yyyy-mm-dd`.
 */
export function ageToBirthDate(years: number, months: number): string {
  const now = new Date();
  const totalMonths = (Number(years) || 0) * 12 + (Number(months) || 0);
  const d = new Date(now.getFullYear(), now.getMonth() - totalMonths, 1);
  return d.toISOString().slice(0, 10);
}

/** Descompone una fecha de nacimiento en años + meses (para prellenar el modo "edad aproximada"). */
export function birthDateToAge(birthDate: string | null): { years: number; months: number } {
  if (!birthDate) return { years: 0, months: 0 };
  const birth = new Date(birthDate);
  const now = new Date();
  if (isNaN(birth.getTime()) || birth > now) return { years: 0, months: 0 };
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

/**
 * Edad para mostrar. Si es estimada, se presenta aproximada ("~X años") — no tiene sentido
 * mostrar meses de precisión sobre una fecha inventada.
 */
export function formatAge(birthDate: string | null, estimated = false): string {
  if (!birthDate) return '';
  if (!estimated) return calculateAge(birthDate);
  const { years, months } = birthDateToAge(birthDate);
  if (years === 0) return months <= 1 ? '~1 mes' : `~${months} meses`;
  return years === 1 ? '~1 año' : `~${years} años`;
}
