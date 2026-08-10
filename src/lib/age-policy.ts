export const ENKAMBA_MINIMUM_AGE = 16;

export function calculateAgeFromDateOfBirth(dateOfBirth?: string | null, now = new Date()) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDifference = now.getMonth() - birthDate.getMonth();
  const dayDifference = now.getDate() - birthDate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  return age;
}

export function isUnderMinimumAge(dateOfBirth?: string | null) {
  const age = calculateAgeFromDateOfBirth(dateOfBirth);
  return age !== null && age < ENKAMBA_MINIMUM_AGE;
}
