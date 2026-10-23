import { describe, expect, it } from "vitest";
import { createDataset } from "../src/createDataset";
import liteData from "../src/data/us-lite";
import { DATA_YEARS, guessGender, isFemale, isMale, nameFromEmail, normalizeName } from "../src/index";

describe("guessGender", () => {
	it("classifies unambiguous male and female names", () => {
		expect(guessGender("John").gender).toBe("male");
		expect(guessGender("Mary").gender).toBe("female");
	});

	// Other popular packages tag these female. Getting them right is the reason this package exists.
	it.each(["Adam", "Chris", "Ryan", "Aaron", "Justin", "Kyle", "Tyler", "Nathan", "Isaac", "Jesse"])("classifies %s as male", (name) => {
		expect(guessGender(name).gender).toBe("male");
	});

	it("returns a probability and the raw counts", () => {
		const result = guessGender("Adam");
		expect(result.gender).toBe("male");
		expect(result.probability).toBeGreaterThan(0.99);
		expect(result.counts.male).toBeGreaterThan(result.counts.female);
		expect(result.name).toBe("adam");
	});

	it("is case-insensitive and trims whitespace", () => {
		expect(guessGender("  JENNIFER ").gender).toBe("female");
		expect(guessGender("jennifer").gender).toBe("female");
	});

	it("uses only the first name of a full name", () => {
		const result = guessGender("Tim Johnson");
		expect(result.gender).toBe("male");
		expect(result.name).toBe("tim");
	});

	it("folds accents and strips punctuation/emoji", () => {
		expect(guessGender("José").gender).toBe("male");
		expect(guessGender("::Jenni♥fer::").name).toBe("jennifer");
	});

	it("looks up hyphenated names joined, the way the SSA stores them", () => {
		// "Jean" alone is 95% female.
		expect(guessGender("Jean-Luc")).toMatchObject({ gender: "male", name: "jeanluc" });
		expect(guessGender("Anne-Marie").name).toBe("annemarie");
		expect(guessGender("Mary–Kate").name).toBe("marykate");
	});

	it("falls back to the first half of a hyphenated name the data doesn't have", () => {
		expect(guessGender("Anne-Xyzzy")).toMatchObject({ gender: "female", name: "anne" });
	});

	it("drops apostrophes the way the SSA does", () => {
		expect(guessGender("D'Angelo")).toMatchObject({ gender: "male", name: "dangelo" });
		expect(guessGender("D’Angelo").name).toBe("dangelo");
	});

	it("transliterates letters that have no accent to strip", () => {
		expect(guessGender("Łukasz")).toMatchObject({ gender: "male", name: "lukasz" });
		expect(guessGender("Søren")).toMatchObject({ gender: "male", name: "soren" });
	});

	it("returns unknown for names not in the dataset", () => {
		const result = guessGender("Xyzzy");
		expect(result.gender).toBe("unknown");
		expect(result.probability).toBe(0);
		expect(result.name).toBe("xyzzy");
	});

	it("returns unknown with a null name for empty/garbage input", () => {
		for (const input of [null, undefined, "", "   ", "♥♥♥", "Иван", "李"]) {
			const result = guessGender(input);
			expect(result.gender).toBe("unknown");
			expect(result.name).toBe(null);
		}
	});

	it("returns unknown for an email address instead of guessing from a mangled one", () => {
		expect(guessGender("jane.doe@gmail.com")).toMatchObject({ gender: "unknown", name: null });
	});

	it("downgrades low-confidence guesses to unknown when minProbability is set", () => {
		// Casey is genuinely unisex (~60% male); a high bar should reject it.
		expect(guessGender("Casey").gender).not.toBe("unknown");
		const strict = guessGender("Casey", { minProbability: 0.9 });
		expect(strict.gender).toBe("unknown");
		expect(strict.counts.male).toBeGreaterThan(0);
		expect(strict.probability).toBeGreaterThan(0.5);
	});

	it("downgrades names with little data to unknown when minCount is set", () => {
		const rare = guessGender("Aaban");
		expect(rare).toMatchObject({ gender: "male", probability: 1 });
		expect(guessGender("Aaban", { minProbability: 0.8, minCount: 500 })).toMatchObject({ gender: "unknown", probability: 1 });
		expect(guessGender("Adam", { minCount: 500 }).gender).toBe("male");
	});

	describe("born", () => {
		it("counts only births in the range", () => {
			const allTime = guessGender("Leslie");
			const recent = guessGender("Leslie", { born: [1985, 2008] });
			expect(allTime.probability).toBeLessThan(0.75);
			expect(recent).toMatchObject({ gender: "female" });
			expect(recent.probability).toBeGreaterThan(0.9);
			expect(recent.counts.female).toBeLessThan(allTime.counts.female);
		});

		it("takes a proportional share of a decade the range splits", () => {
			const decade = guessGender("Mary", { born: [1990, 1999] }).counts.female;
			const half = guessGender("Mary", { born: [1990, 1994] }).counts.female;
			expect(half).toBe(Math.round(decade / 2));
		});

		it("returns unknown when the name has no births in the range", () => {
			expect(guessGender("Aaden", { born: [1880, 1950] })).toMatchObject({ gender: "unknown", probability: 0, name: "aaden" });
		});

		it("rejects a reversed range", () => {
			expect(() => guessGender("Mary", { born: [2008, 1985] })).toThrow(RangeError);
		});
	});
});

describe("isMale / isFemale", () => {
	it("are mutually exclusive for gendered names", () => {
		expect(isMale("Adam")).toBe(true);
		expect(isFemale("Adam")).toBe(false);
		expect(isFemale("Mary")).toBe(true);
		expect(isMale("Mary")).toBe(false);
	});

	it("both return false for unknown names", () => {
		expect(isMale("Xyzzy")).toBe(false);
		expect(isFemale("Xyzzy")).toBe(false);
	});
});

describe("normalizeName", () => {
	it("extracts a clean first name", () => {
		expect(normalizeName("Tim Johnson")).toBe("tim");
		expect(normalizeName("  José ")).toBe("jose");
		expect(normalizeName("D'Angelo")).toBe("dangelo");
		expect(normalizeName("Jean-Luc Picard")).toBe("jean-luc");
		expect(normalizeName("MARY")).toBe("mary");
		expect(normalizeName("Straße")).toBe("strasse");
	});

	it("reads Last, First order", () => {
		expect(normalizeName("Smith, Jane")).toBe("jane");
		expect(normalizeName("Smith, Dr. Jane")).toBe("jane");
		expect(normalizeName("Jane Smith, PhD")).toBe("jane");
		expect(normalizeName("Jane Smith, Jr.")).toBe("jane");
	});

	it("skips titles and initials", () => {
		expect(normalizeName("Dr. Jane Smith")).toBe("jane");
		expect(normalizeName("J. Michael")).toBe("michael");
		expect(normalizeName("J.R. Michael Smith")).toBe("michael");
		expect(normalizeName("Mr. J. Michael Smith")).toBe("michael");
	});

	it("returns null when a title is followed only by a surname", () => {
		expect(normalizeName("Mrs. Smith")).toBe(null);
		expect(normalizeName("Dr. J. Smith")).toBe(null);
	});

	it("keeps a lone title or initial rather than returning nothing", () => {
		expect(normalizeName("Gen")).toBe("gen");
		expect(normalizeName("J")).toBe("j");
	});

	it("returns null when nothing usable remains", () => {
		expect(normalizeName(null)).toBe(null);
		expect(normalizeName("")).toBe(null);
		expect(normalizeName("123 ♥")).toBe(null);
		expect(normalizeName("Иван Smith")).toBe(null);
		expect(normalizeName("jane@example.com")).toBe(null);
	});
});

describe("nameFromEmail", () => {
	it("takes the first part of the local part", () => {
		expect(nameFromEmail("jane.doe@gmail.com")).toBe("jane");
		expect(nameFromEmail("jane_doe@gmail.com")).toBe("jane");
		expect(nameFromEmail("jane+news@gmail.com")).toBe("jane");
		expect(nameFromEmail("jane1990@gmail.com")).toBe("jane");
		expect(nameFromEmail("Jane Doe <jane.doe@gmail.com>")).toBe("jane");
		expect(guessGender(nameFromEmail("Jean-Luc.Picard@starfleet.org")).name).toBe("jeanluc");
	});

	it("returns null without an @ or when the first part is an initial", () => {
		expect(nameFromEmail("jane.doe")).toBe(null);
		expect(nameFromEmail("j.doe@gmail.com")).toBe(null);
		expect(nameFromEmail(null)).toBe(null);
	});
});

describe("data", () => {
	it("covers 1880 through a recent SSA release", () => {
		expect(DATA_YEARS[0]).toBe(1880);
		expect(DATA_YEARS[1]).toBeGreaterThanOrEqual(2025);
	});

	it("leaves rare names out of the lite build", () => {
		const lookupLite = createDataset(liteData);
		expect(lookupLite("aaban")).toBeDefined();
		expect(lookupLite("adam")).toEqual(guessGender("Adam").counts);
		expect(lookupLite("aabid")).toBeUndefined();
	});
});
