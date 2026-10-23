import { guessGender, type GuessOptions } from "./guessGender";

/** `true` only when the name is confidently female. Takes the same options as `guessGender`. */
export function isFemale(input: string | null | undefined, options?: GuessOptions): boolean {
	return guessGender(input, options).gender === "female";
}
