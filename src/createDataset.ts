import { DATA_YEARS } from "./data/years";

export interface Counts {
	male: number;
	female: number;
}

/** An inclusive range of birth years, such as `[1985, 2008]`. */
export type BirthYears = readonly [from: number, to: number];

const [FIRST_YEAR, LAST_YEAR] = DATA_YEARS;

/**
 * Share of a decade that falls inside `born`, measured against the years the data
 * covers. A range that splits a decade takes that fraction of the decade's births.
 */
function decadeWeight(decade: number, born: BirthYears | undefined): number {
	if (!born) {
		return 1;
	}

	const start = FIRST_YEAR + decade * 10;
	const end = Math.min(start + 9, LAST_YEAR);
	const overlap = Math.min(end, born[1]) - Math.max(start, born[0]) + 1;
	return Math.max(0, overlap) / (end - start + 1);
}

function buildIndex(encoded: string): Map<string, string> {
	const index = new Map<string, string>();
	let previous = "";
	for (const record of encoded.split(" ")) {
		const decadesStart = record.search(/[A-Z]/);
		const name = previous.slice(0, record.charCodeAt(0) - 48) + record.slice(1, decadesStart);
		index.set(name, record.slice(decadesStart));
		previous = name;
	}

	return index;
}

/**
 * Decodes the format written by `scripts/build-data.ts` into a lookup that returns a
 * name's birth counts, optionally limited to `born`, or `undefined` when the name
 * isn't in the data. Records are indexed on the first lookup instead of on import,
 * so loading the package stays cheap for code paths that never call it.
 */
export function createDataset(encoded: string) {
	let index: Map<string, string> | undefined;
	return function lookupCounts(name: string, born?: BirthYears): Counts | undefined {
		if (born && !(born[0] <= born[1])) {
			throw new RangeError(`born must be [from, to] with from <= to, got [${born.join(", ")}]`);
		}

		index ??= buildIndex(encoded);
		const decades = index.get(name);
		if (decades === undefined) {
			return undefined;
		}

		const firstDecade = decades.charCodeAt(0) - 65;
		let male = 0;
		let female = 0;
		decades
			.slice(1)
			.split(";")
			.forEach((pair, offset) => {
				const weight = decadeWeight(firstDecade + offset, born);
				const [maleCount = "", femaleCount = ""] = pair.split(",");
				male += weight * (Number.parseInt(maleCount, 36) || 0);
				female += weight * (Number.parseInt(femaleCount, 36) || 0);
			});
		return { male: Math.round(male), female: Math.round(female) };
	};
}
