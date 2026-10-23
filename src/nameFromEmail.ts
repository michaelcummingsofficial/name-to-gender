/**
 * Pull the likely first name out of an email address, for lists that have nothing
 * else: `"jane.doe@gmail.com"` -> `"jane"`. The local part is split on dots,
 * underscores, plus signs, and digits, and the first piece is returned.
 *
 * Returns `null` when there is no `@` or the first piece is a single letter
 * (`"j.doe@..."`). A local part with no separators (`"jdoe"`) is returned as is,
 * and usually comes back from `guessGender` as `"unknown"`.
 *
 * @example
 * guessGender(nameFromEmail("jane.doe@gmail.com")).gender; // "female"
 */
export function nameFromEmail(email: string | null | undefined): string | null {
	const local = email?.match(/([^\s<@]+)@/)?.[1];
	const first = local?.split(/[._+\d]+/).find(Boolean);
	return first && first.length > 1 ? first : null;
}
