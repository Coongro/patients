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
