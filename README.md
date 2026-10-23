# name-to-gender

**Predict the gender of a first name from US Social Security birth data.** Give it a name. It returns a gender, a probability, and the birth counts behind the guess.

[![npm version](https://img.shields.io/npm/v/name-to-gender.svg)](https://www.npmjs.com/package/name-to-gender)
[![npm downloads](https://img.shields.io/npm/dm/name-to-gender.svg)](https://www.npmjs.com/package/name-to-gender)
[![bundle size](https://img.shields.io/bundlephobia/minzip/name-to-gender)](https://bundlephobia.com/package/name-to-gender)
[![license](https://img.shields.io/github/license/michaelcummingsofficial/name-to-gender)](https://github.com/michaelcummingsofficial/name-to-gender/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/michaelcummingsofficial/name-to-gender?style=social)](https://github.com/michaelcummingsofficial/name-to-gender)

`name-to-gender` is a gender detection and gender prediction library for Node.js and TypeScript. Give it a name like `"Adam"` or `"Mary"` and it returns `"male"`, `"female"`, or `"unknown"`, along with a probability you can threshold on. It reads real birth records instead of guessing from spelling. The data ships with the package, and there are **zero runtime dependencies**.

```ts
import { guessGender } from "name-to-gender";

guessGender("Adam");
// {
//   gender: "male",
//   probability: 0.996,
//   counts: { male: 580378, female: 2075 },
//   name: "adam"
// }
```

## Features

- **Accurate.** Backed by 105,000+ names and US birth counts from 1880 to 2025, so common names resolve correctly instead of being guessed from spelling.
- **Tuned to your audience.** Limit the counts to a range of birth years, so a name is judged by the people who carry it today.
- **Confidence scores.** Every result carries a probability and the raw `{ male, female }` counts, so you decide where to draw the line.
- **Unisex-aware.** Threshold low-confidence names like `Casey` or `Jordan` down to `"unknown"` with a single option.
- **Forgiving input.** Handles full names, `Last, First`, titles, initials, casing, accents, and punctuation.
- **TypeScript-first.** Full types, with ESM and CommonJS builds and zero dependencies.
- **Offline.** Every lookup runs locally, with no API calls or rate limits.

## Install

```sh
npm install name-to-gender
```

```sh
pnpm add name-to-gender
```

```sh
yarn add name-to-gender
```

## Usage

### `guessGender(name, options?)`

The main entry point. Pass a name, get back a gender, a probability, and the counts.

```ts
import { guessGender } from "name-to-gender";

guessGender("Mary");
// { gender: "female", probability: 0.996, counts: { male: 15173, female: 4141481 }, name: "mary" }

// Messy input is handled: full names, casing, accents, and punctuation.
guessGender("  José Martinez ").gender; // "male"  (uses the first name, folds accents)
guessGender("Smith, Jane").name; // "jane"
guessGender("Dr. J. Michael Fox").name; // "michael"  (skips titles and initials)
guessGender("Jean-Luc").name; // "jeanluc"  (joined, the way the SSA stores it)
guessGender("D'Angelo").name; // "dangelo"
guessGender("Łukasz").name; // "lukasz"
guessGender("::Jenni♥fer::").name; // "jennifer"

// Names not in the dataset return "unknown" with a zero probability.
guessGender("Xyzzy");
// { gender: "unknown", probability: 0, counts: { male: 0, female: 0 }, name: "xyzzy" }
```

Input that has no usable first name returns `"unknown"` with a `null` name. That covers a title followed only by a surname (`"Mrs. Smith"`), names in a non-Latin script, and email addresses.

### Options

| Option           | Default | What it does                                                                     |
| ---------------- | ------- | -------------------------------------------------------------------------------- |
| `born`           | all     | Only count people born in this inclusive range of years, such as `[1985, 2008]`. |
| `minProbability` | `0`     | Report guesses at or below this probability as `"unknown"`.                      |
| `minCount`       | `0`     | Report names with fewer total births than this as `"unknown"`.                   |

The `probability` and `counts` are returned even when a threshold turns the guess into `"unknown"`, so you can see why.

### Limiting to a range of birth years

Names change over time. All-time counts weigh a baby born in 1900 the same as one born in 2000, which can hide how a name is used today. Pass `born` to count only the years that match your audience:

```ts
guessGender("Leslie"); // female, probability 0.71
guessGender("Leslie", { born: [1985, 2008] }); // female, probability 0.94
```

Counts are stored per decade. A range that splits a decade takes a proportional share of its births, so `counts` are estimates in that case.

### Thresholding unisex names

Some names are unisex. Pass `minProbability` to treat low-confidence guesses as `"unknown"` while still seeing the underlying numbers:

```ts
guessGender("Casey"); // gender: "male" (≈60% male)
guessGender("Casey", { minProbability: 0.9 }); // gender: "unknown", probability: 0.6, counts: {...}
```

### Thresholding rare names

About half the names in the data have fewer than 50 births in total. A name seen 127 times, all male, comes back at a probability of `1`, which clears any `minProbability`. Pass `minCount` to ask for more evidence:

```ts
guessGender("Aaban", { minProbability: 0.8 }); // gender: "male", probability: 1, counts: { male: 127, female: 0 }
guessGender("Aaban", { minProbability: 0.8, minCount: 500 }); // gender: "unknown"
```

### `nameFromEmail(email)`

For lists that only have an email address. It takes the part before the `@`, splits it on dots, underscores, plus signs, and digits, and returns the first piece. It returns `null` when that piece is a single letter, as in `j.doe@...`.

```ts
import { guessGender, nameFromEmail } from "name-to-gender";

nameFromEmail("jane.doe@gmail.com"); // "jane"
guessGender(nameFromEmail("jane.doe@gmail.com")).gender; // "female"
```

`guessGender` itself returns `"unknown"` for an email address rather than guessing from it.

### `isMale(name, options?)` / `isFemale(name, options?)`

Convenience booleans. Both return `false` for unknown or below-threshold names.

```ts
import { isMale, isFemale } from "name-to-gender";

isMale("Ryan"); // true
isFemale("Ryan"); // false
```

### Result shape

```ts
interface GenderGuess {
	gender: "male" | "female" | "unknown";
	probability: number; // share of births for the majority sex, in [0.5, 1]; 0 when there are no births
	counts: { male: number; female: number };
	name: string | null; // the name that was looked up
}
```

`probability` is `0.5` on an exact tie. When a name misses `minProbability` or `minCount`, `gender` is `"unknown"` and `probability` is still the real share.

### `DATA_YEARS`

The first and last birth years in the bundled data.

```ts
import { DATA_YEARS } from "name-to-gender";

DATA_YEARS; // [1880, 2025]
```

### Lite build

The full dataset adds about 1.6 MB to your bundle. `name-to-gender/lite` keeps only the 52,000 names with 50 or more births, which cuts that to 1.2 MB. Its API is the same. The names it drops are the ones with the least evidence, and they return `"unknown"` instead.

```ts
import { guessGender } from "name-to-gender/lite";
```

Either build parses its data on the first lookup, not on import.

## How it works

`name-to-gender` is **data-driven, not rule-based**. It finds the first name in the input, looks it up in a table of US births by name, sex, and decade, and reports the majority sex along with its share. There are no `"ends in -a means female"` heuristics, which is why it resolves names like Adam, Joshua, and Andrea correctly.

The dataset is built from the public-domain [US Social Security Administration baby-names data](https://www.ssa.gov/oact/babynames/), from 1880 through 2025, covering 105,000+ names. It works best for US and English-context names. The SSA publishes a new year each May, and a scheduled workflow rebuilds the data from it. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for how to regenerate it by hand.

## Comparison with other packages

There are several similar packages on npm. Here is how they line up.

| Package                                                                                  | Data                 | Last updated | Confidence score | TypeScript types |
| ---------------------------------------------------------------------------------------- | -------------------- | ------------ | ---------------- | ---------------- |
| [`gender`](https://www.npmjs.com/package/gender)                                         | US Census            | 2013         | yes              | no               |
| [`gender-guess`](https://www.npmjs.com/package/gender-guess)                             | SSA 1930–2013        | 2014         | yes              | no               |
| [`gender-detection`](https://www.npmjs.com/package/gender-detection)                     | mixed                | 2018         | no               | no               |
| [`gender-detection-from-name`](https://www.npmjs.com/package/gender-detection-from-name) | mixed                | 2025         | no               | no               |
| [**`name-to-gender`**](https://www.npmjs.com/package/name-to-gender)                     | **US SSA 1880–2025** | **2026**     | **yes**          | **yes**          |

If you are migrating from one of the packages above, `guessGender(name)` is the closest drop-in. It returns a label like the others, plus the probability and counts they leave out.

## FAQ

### How do I get the gender of a name in JavaScript or TypeScript?

Install `name-to-gender` and call `guessGender("Alex")`. You get back `{ gender, probability, counts, name }`. No API key and no network request are required.

### How accurate is it?

Accuracy depends on the name. Strongly gendered names like Mary or John resolve at well over 99% confidence. Unisex names like Casey or Jordan land closer to 50%, and the returned `probability` tells you how confident the guess is so you can threshold accordingly. If your audience is a particular age, set `born` to match it. Some names stay hard to call even then: most women named Jessica go by Jess but are recorded as Jessica, so `Jess` reads as male.

### Does it work offline, without an API?

Yes. The full dataset is bundled in the package, so every lookup is local, synchronous, and free. There are no rate limits or external calls.

### Can it handle full names, accents, and messy input?

Yes. It reads `Last, First` order, skips titles like `Dr.` and initials like `J.`, folds accents (`José` to `jose`, `Łukasz` to `lukasz`), lowercases, and strips punctuation before looking the name up. Hyphenated names are tried whole first, so `Jean-Luc` is not mistaken for `Jean`.

### What about unisex or non-binary names?

The library reports the statistical male/female split from US birth records. For unisex names the probability sits near 0.5. Use the `minProbability` option to fold low-confidence names into `"unknown"` rather than forcing a binary label.

### What data is it based on?

Public-domain [US Social Security Administration baby-names data](https://www.ssa.gov/oact/babynames/), summed per decade from 1880 through the year in `DATA_YEARS`. The SSA leaves out names given to fewer than 5 babies in a year. It is tuned for US and English-context names.

## Use cases

- Personalizing greetings, salutations, and email copy
- Enriching CRM, analytics, and demographic data
- Pre-filling or validating form fields
- Audience segmentation and reporting
- Cleaning and labeling datasets for machine learning

## License

MIT © [Michael Cummings](https://www.michaelcummin.gs)
