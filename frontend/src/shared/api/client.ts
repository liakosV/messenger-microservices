export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Δεν υπάρχει σύνδεση. Δοκίμασε ξανά.');
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const details: Record<string, string> = {
      'One or more participants do not exist or are inactive':
        'Ένα ή περισσότερα UUID δεν ανήκουν σε ενεργούς χρήστες.',
      'Account details are already in use':
        'Αυτά τα στοιχεία χρησιμοποιούνται ήδη από άλλον λογαριασμό.',
      'Invalid credentials': 'Τα στοιχεία σύνδεσης ή ο κωδικός δεν είναι σωστά.',
      'Invalid request fields or JSON': 'Έλεγξε τα στοιχεία που συμπλήρωσες.',
    };
    const fallback =
      response.status === 401
        ? 'Η σύνδεσή σου έληξε. Συνδέσου ξανά.'
        : response.status === 403
          ? 'Δεν έχεις πρόσβαση σε αυτή την ενέργεια.'
          : response.status === 404
            ? 'Αυτό το στοιχείο δεν είναι πλέον διαθέσιμο.'
            : response.status >= 500
              ? 'Η υπηρεσία δεν είναι διαθέσιμη αυτή τη στιγμή. Δοκίμασε ξανά.'
              : 'Δεν ολοκληρώθηκε η ενέργεια. Έλεγξε τα στοιχεία και δοκίμασε ξανά.';
    throw new ApiError(response.status, details[problem.detail] || fallback);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const json = (body: unknown, method = 'POST'): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
