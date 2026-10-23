When installing dependencies, you must strictly adhere to the dependency types. We use pnpm as the package manager.

- Runtime Dependencies: This package ships with zero runtime dependencies, and the README promises it. Don't add one. Vendor a small, well-tested implementation instead, or ask first.
- Development Dependencies: Anything used only to build, test, lint, or regenerate data goes in with the `-D` flag.

pnpm blocks package lifecycle scripts by default. If a package needs its postinstall build step (like esbuild's native binary), add it to `allowBuilds` in `pnpm-workspace.yaml`.
