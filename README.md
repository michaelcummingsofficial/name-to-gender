# name-to-gender

**Predict the gender of a first name from US Social Security birth data.** A fast, accurate, zero-dependency library for Node.js and TypeScript that turns a name into a gender, a confidence probability, and the raw birth counts behind every guess.

[![npm version](https://img.shields.io/npm/v/name-to-gender.svg)](https://www.npmjs.com/package/name-to-gender)
[![npm downloads](https://img.shields.io/npm/dm/name-to-gender.svg)](https://www.npmjs.com/package/name-to-gender)
[![bundle size](https://img.shields.io/bundlephobia/minzip/name-to-gender)](https://bundlephobia.com/package/name-to-gender)
[![license](https://img.shields.io/github/license/michaelcummingsofficial/name-to-gender)](https://github.com/michaelcummingsofficial/name-to-gender/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/michaelcummingsofficial/name-to-gender?style=social)](https://github.com/michaelcummingsofficial/name-to-gender)

`name-to-gender` is a gender detection and gender prediction library that infers gender from a person's first name. Give it a name like `"Adam"` or `"Mary"` and it returns `"male"`, `"female"`, or `"unknown"`, along with a probability you can threshold on. It is data-driven rather than rule-based, ships its dataset offline with the package, and has **zero runtime dependencies**.

```ts
import { guessGender } from "name-to-gender";

guessGender("Adam");
// {
//   gender: "male",
//   probability: 0.996,
//   counts: { male: 523494, female: 2002 },
//   name: "adam"
// }
```

## Features

- **Accurate.** Backed by 91,000+ names and all-time US birth counts, so common names resolve correctly instead of being guessed from spelling.
- **Confidence scores.** Every result carries a probability and the raw `{ male, female }` counts, so you decide where to draw the line.
- **Unisex-aware.** Threshold low-confidence names like `Casey` or `Jordan` down to `"unknown"` with a single option.
- **Forgiving input.** Handles full names, casing, accents, and punctuation out of the box.
- **TypeScript-first.** Full types, ESM and CommonJS builds, tree-shakeable, **zero dependencies**.
- **Offline.** No API calls, no network, no rate limits. The data ships in the package.

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
// { gender: "female", probability: 0.995, counts: { male: 7732, female: 1467208 }, name: "mary" }

// Messy input is handled: full names, casing, accents, and punctuation.
guessGender("  José Martinez ").gender; // "male"  (uses the first token, folds accents)
guessGender("::Jenni♥fer::").name; // "jennifer"

// Names not in the dataset return "unknown" with a zero probability.
guessGender("Xyzzy");
// { gender: "unknown", probability: 0, counts: { male: 0, female: 0 }, name: "xyzzy" }
```

### Thresholding unisex names

Some names are unisex. Pass `minProbability` to treat low-confidence guesses as `"unknown"` while still seeing the underlying numbers:

```ts
guessGender("Casey"); // gender: "male" (≈59% male)
guessGender("Casey", { minProbability: 0.9 }); // gender: "unknown", probability: 0.59, counts: {...}
```

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
  probability: number; // P(gender), in [0.5, 1]; 0 when unknown
  counts: { male: number; female: number };
  name: string | null; // the normalized name that was looked up
}
```

## How it works

`name-to-gender` is **data-driven, not rule-based**. It normalizes the input to a first-name token, looks it up in a table of all-time US births by name and sex, and reports the majority sex along with its share. There are no `"ends in -a means female"` heuristics, which is why it resolves names like Adam, Joshua, and Andrea correctly.

The dataset is built from the public-domain [US Social Security Administration baby-names data](https://www.ssa.gov/oact/babynames/), aggregated across every birth year from 1880 to the present into 91,000+ names. It works best for US and English-context names. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for how to regenerate it from the latest SSA release.

## Comparison with other packages

There are several similar packages on npm. Here is how they line up. `name-to-gender` aims to be the best, most current, and typed.

| Package                                                                                  | Data                  | Last updated | Confidence score | TypeScript types |
| ---------------------------------------------------------------------------------------- | --------------------- | ------------ | ---------------- | ---------------- |
| [`gender`](https://www.npmjs.com/package/gender)                                         | US Census             | 2013         | yes              | no               |
| [`gender-guess`](https://www.npmjs.com/package/gender-guess)                             | SSA 1930–2013         | 2014         | yes              | no               |
| [`gender-detection`](https://www.npmjs.com/package/gender-detection)                     | mixed                 | 2018         | no               | no               |
| [`gender-detection-from-name`](https://www.npmjs.com/package/gender-detection-from-name) | mixed                 | 2025         | no               | no               |
| [**`name-to-gender`**](https://www.npmjs.com/package/name-to-gender)                     | **US SSA, all years** | **current**  | **yes**          | **yes**          |

If you are migrating from one of the packages above, `guessGender(name)` is the closest drop-in. It returns a label like the others, plus the probability and counts they leave out.

## FAQ

### How do I get the gender of a name in JavaScript or TypeScript?

Install `name-to-gender` and call `guessGender("Alex")`. You get back `{ gender, probability, counts, name }`. No API key and no network request are required.

### How accurate is it?

Accuracy depends on the name. Strongly gendered names like Mary or John resolve at well over 99% confidence. Unisex names like Casey or Jordan land near 50%, and the returned `probability` tells you exactly how confident the guess is so you can threshold accordingly.

### Does it work offline, without an API?

Yes. The full dataset is bundled in the package, so every lookup is local, synchronous, and free. There are no rate limits or external calls.

### Can it handle full names, accents, and messy input?

Yes. It extracts the first-name token, folds accents (`José` to `jose`), lowercases, and strips punctuation before looking the name up.

### What about unisex or non-binary names?

The library reports the statistical male/female split from US birth records. For unisex names the probability sits near 0.5. Use the `minProbability` option to fold low-confidence names into `"unknown"` rather than forcing a binary label.

### What data is it based on?

Public-domain [US Social Security Administration baby-names data](https://www.ssa.gov/oact/babynames/), summed across all birth years from 1880 onward. It is tuned for US and English-context names.

## Use cases

- Personalizing greetings, salutations, and email copy
- Enriching CRM, analytics, and demographic data
- Pre-filling or validating form fields
- Audience segmentation and reporting
- Cleaning and labeling datasets for machine learning

## License

MIT © [Michael Cummings](https://www.michaelcummin.gs)
