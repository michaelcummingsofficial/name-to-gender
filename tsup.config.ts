import { join } from "node:path";
import { defineConfig, type Options } from "tsup";

const shared: Options = {
	format: ["esm", "cjs"],
	dts: true,
	minify: true
};
/** Builds the same source against the smaller dataset, so the two entry points can't drift apart. */
const liteData: NonNullable<Options["esbuildPlugins"]>[number] = {
	name: "lite-data",
	setup(build) {
		build.onResolve({ filter: /^\.\/data\/us$/ }, (args) => ({ path: join(args.resolveDir, "data", "us-lite.ts") }));
	}
};

export default defineConfig([
	// Both configs build at once into dist/, so each cleans only its own files.
	{ ...shared, entry: { index: "src/index.ts" }, clean: ["index.*"] },
	{ ...shared, entry: { lite: "src/index.ts" }, clean: ["lite.*"], esbuildPlugins: [liteData] }
]);
