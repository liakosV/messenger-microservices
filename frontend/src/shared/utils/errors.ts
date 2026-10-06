export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Δεν ολοκληρώθηκε η ενέργεια. Δοκίμασε ξανά.';
}
