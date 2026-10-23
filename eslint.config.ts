import tsParser from "@typescript-eslint/parser";
import importXPlugin from "eslint-plugin-import-x";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsParser
		},
		plugins: {
			"import-x": importXPlugin
		},
		rules: {
			"curly": ["error", "all"],
			"import-x/first": "error",
			"padding-line-between-statements": [
				"error",
				{ blankLine: "never", prev: "*", next: "block-like" },
				{ blankLine: "never", prev: "*", next: "return" },
				{ blankLine: "always", prev: "block-like", next: "*" },
				{ blankLine: "any", prev: "*", next: "function" },
				{ blankLine: "any", prev: "function", next: "*" },
				{ blankLine: "any", prev: "*", next: "export" },
				{ blankLine: "any", prev: "export", next: "*" },
				{ blankLine: "always", prev: "import", next: "*" },
				{ blankLine: "never", prev: "import", next: "import" },
				{ blankLine: "never", prev: "directive", next: "import" }
			]
		}
	},
	globalIgnores(["dist/**", "src/data/**"])
]);
