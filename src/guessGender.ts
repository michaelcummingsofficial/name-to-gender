import type { BirthYears, Counts } from "./createDataset";
import { lookupCounts } from "./lookupCounts";
import { normalizeName } from "./normalizeName";

export type { BirthYears, Counts } from "./createDataset";

export type Gender = "male" | "female" | "unknown";

export interface GenderGuess {
	/** Predicted gender. `"unknown"` when the name isn't in the data, splits exactly 50/50, or misses `minProbability` or `minCount`. */
	gender: Gender;
	/**
	 * Share of births that belong to the majority sex, in `[0.5, 1]`. It is still
	 * reported when the guess misses `minProbability` or `minCount`, `0.5` on an
	 * exact tie, and `0` only when there are no births to go on.
	 */
	probability: number;
	/** US birth counts backing the guess: all-time, or within `born` when it is set. */
	counts: Counts;
	/** The name that was looked up (e.g. `"jeanluc"` for "Jean-Luc"), or `null` when no first name could be found in the input. */
	name: string | null;
}

export interface GuessOptions {
	/** Report guesses at or below this probability as `"unknown"`. Default `0`. */
	minProbability?: number;
	/**
	 * Report names with fewer total births than this as `"unknown"`, so a name seen
	 * a handful of times can't pass `minProbability` at 100%. Default `0`.
	 */
	minCount?: number;
	/**
	 * Only count people born in this inclusive range of years, such as
	 * `[1985, 2008]`. Names shift over time, so a range that matches your audience
	 * is more accurate than all-time counts. Data is stored per decade, so a range
	 * that splits a decade takes a proportional share of its births.
	 */
	born?: BirthYears;
}

const NO_COUNTS: Counts = { male: 0, female: 0 };

/**
 * Hyphenated names are stored joined ("jeanluc"), so try that before falling back
 * to the first half for compounds the data doesn't have.
 */
function findCounts(normalized: string, born: BirthYears | undefined): { name: string; counts: Counts } {
	const hyphen = normalized.indexOf("-");
	const candidates = hyphen === -1 ? [normalized] : [normalized.replaceAll("-", ""), normalized.slice(0, hyphen)];
	for (const name of candidates) {
		const counts = lookupCounts(name, born);
		if (counts) {
			return { name, counts };
		}
	}

	return { name: candidates[0]!, counts: NO_COUNTS };
}

/**
 * Guess the gender of a first name from US Social Security birth data.
 *
 * @example
 * guessGender("Adam");
 * // { gender: "male", probability: 0.996, counts: { male: 580378, female: 2075 }, name: "adam" }
 *
 * guessGender("Leslie", { born: [1985, 2008] }).probability; // 0.94
 */
export function guessGender(input: string | null | undefined, options: GuessOptions = {}): GenderGuess {
	const normalized = normalizeName(input);
	if (!normalized) {
		return { gender: "unknown", probability: 0, counts: NO_COUNTS, name: null };
	}

	const { name, counts } = findCounts(normalized, options.born);
	const { male, female } = counts;
	const total = male + female;
	if (total === 0 || male === female) {
		return { gender: "unknown", probability: total === 0 ? 0 : 0.5, counts, name };
	}

	const probability = Math.max(male, female) / total;
	const confident = probability > (options.minProbability ?? 0) && total >= (options.minCount ?? 0);
	const gender: Gender = !confident ? "unknown" : male > female ? "male" : "female";
	return { gender, probability, counts, name };
}
