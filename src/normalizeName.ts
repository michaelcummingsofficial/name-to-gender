const TITLES = new Set([
	"adm",
	"capt",
	"cmdr",
	"col",
	"cpl",
	"dame",
	"dr",
	"fr",
	"gen",
	"hon",
	"lady",
	"lord",
	"lt",
	"maj",
	"miss",
	"mister",
	"mlle",
	"mme",
	"mr",
	"mrs",
	"ms",
	"mx",
	"prof",
	"professor",
	"pvt",
	"rev",
	"sgt",
	"sir",
	"sra",
	"srta"
]);
const SUFFIXES = new Set(["cpa", "dds", "dmd", "dvm", "esq", "ii", "iii", "iv", "jd", "jr", "md", "mba", "phd", "rn", "sr"]);
// Letters that NFKD doesn't split into a base letter plus an accent.
const LETTERS: Record<string, string> = { æ: "ae", ð: "d", đ: "d", ħ: "h", ı: "i", ł: "l", ŋ: "n", ø: "o", œ: "oe", ß: "ss", þ: "th", ŧ: "t" };
const NON_ASCII_LETTER = /[^\P{L}a-z]/u;

/** The SSA spelling of a token: letters only, with internal hyphens kept for compound names. */
function key(token: string): string {
	return token.replace(/[^a-z-]/g, "").replace(/^-+|-+$/g, "");
}

function tokenize(text: string): string[] {
	return text.split(/\s+/).filter((token) => key(token) !== "" || NON_ASCII_LETTER.test(token));
}

function isInitial(token: string): boolean {
	return key(token).length === 1 || /^(?:[a-z]\.)+$/.test(token);
}

/**
 * Reduce arbitrary input to the lowercase first name to look up, or `null` when
 * none can be found. Hyphens are kept so callers can try "jean-luc" whole before
 * its first half; apostrophes are dropped the way the SSA files drop them.
 *
 *   "  José Martinez "  -> "jose"
 *   "Smith, Jane"       -> "jane"
 *   "Dr. J. Michael Fox" -> "michael"
 *   "D'Angelo"          -> "dangelo"
 *   "Łukasz"            -> "lukasz"
 *   "Mrs. Smith"        -> null (only a surname follows the title)
 *   "Иван", "a@b.com"   -> null
 */
export function normalizeName(input: string | null | undefined): string | null {
	if (!input || input.includes("@")) {
		return null;
	}

	const folded = input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/\p{M}/gu, "")
		.replace(/[æðđħıłŋøœßþŧ]/g, (letter) => LETTERS[letter]!)
		.replace(/[\u2010-\u2015]/g, "-");
	const comma = folded.indexOf(",");
	const afterComma = comma === -1 ? [] : tokenize(folded.slice(comma + 1));
	const lastFirst = afterComma.some((token) => !SUFFIXES.has(key(token)));
	const tokens = lastFirst ? afterComma : tokenize(comma === -1 ? folded : folded.slice(0, comma));
	let index = 0;
	while (index < tokens.length - 1 && TITLES.has(key(tokens[index]!))) {
		index++;
	}

	const titled = index > 0;
	while (index < tokens.length - 1 && isInitial(tokens[index]!)) {
		index++;
	}

	// In "First Last" order, a title followed by one word is almost always a surname.
	if (titled && !lastFirst && index === tokens.length - 1) {
		return null;
	}

	const token = tokens[index];
	if (token === undefined || NON_ASCII_LETTER.test(token)) {
		return null;
	}

	return key(token) || null;
}
