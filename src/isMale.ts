import { guessGender, type GuessOptions } from "./guessGender";

/** `true` only when the name is confidently male. Takes the same options as `guessGender`. */
export function isMale(input: string | null | undefined, options?: GuessOptions): boolean {
	return guessGender(input, options).gender === "male";
}
