export type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const E2E_GRID_SEARCH = 'e2e';
export const FALLBACK_GRID_SEARCH = 'test';

/** Grid search that should return zero rows. */
export const INVALID_GRID_SEARCH = 'zzz-invalid-no-match-xyz';

/** Long but syntactically valid email — triggers max-length validation on save */
export const LONG_VALID_FORMAT_EMAIL =
  'aaaaaaaaaaaa@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.aaaaaaaaaaaaaa';

export const VALID_TEST_EMAIL = 'e2e.valid@pieq.ai';
export const VALID_FIRST_NAME = 'Etwoe';
export const VALID_LAST_NAME = 'Automation';

const INVALID_NAME_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?0-9]/;

export function hasInvalidNameCharacters(name: string): boolean {
  return INVALID_NAME_CHARS.test(name);
}

const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

export function randomValidPersonName(): { firstName: string; lastName: string } {
  return {
    firstName: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
    lastName: LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)],
  };
}
