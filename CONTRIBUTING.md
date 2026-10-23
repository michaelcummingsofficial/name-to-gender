# Contributing

Thank you for considering contributing to `name-to-gender`!

## Development

1. Clone the repo.
2. Install dependencies: `pnpm install`.
3. Make your changes in `src/`.
4. Lint and typecheck: `pnpm lint`. `pnpm format` fixes what it can.
5. Run tests: `pnpm test`.
6. Build: `pnpm build`.

## Updating the dataset

The files in `src/data/` are generated from the public-domain US Social Security
Administration baby-names dataset. Don't edit them by hand.

The **Update data** workflow rebuilds them every June 1, after the SSA publishes
the previous year in May, and opens a pull request. You can also run it from the
Actions tab. To refresh the data locally:

1. Download `names.zip` from <https://www.ssa.gov/oact/babynames/names.zip>.
   ssa.gov rejects plain `curl`. Use a browser, or on macOS run
   `nscurl -o names.zip https://www.ssa.gov/oact/babynames/names.zip`.
2. Unzip the `yobXXXX.txt` files into `scripts/source/`.
3. Run `pnpm build:data`.

See `scripts/build-data.ts` for the aggregation logic and the data format.

## Testing

We use `vitest`. Ensure all tests pass before submitting a PR. If you add new
features, please add corresponding tests in `test/index.test.ts`.

## Release

Bump the version in `package.json` and merge to `main`. CI publishes to npm
automatically when the version changes.
