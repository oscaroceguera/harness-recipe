import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,mjs}"],
    ignores: ["**/*.spec.{ts,tsx}"],
    rules: {
      "max-lines": [
        "error",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["{{src}}app/**/*.{ts,tsx}", "{{src}}lib/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "shared", pattern: "{{src}}app/components", partialMatch: false },
        { type: "api", pattern: "{{src}}app/api", partialMatch: false },
        {
          type: "route",
          pattern: "{{src}}app/*",
          capture: ["route"],
          partialMatch: false,
        },
        { type: "lib", pattern: "{{src}}lib", partialMatch: false },
      ],
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*"],
              message: "Import through `@/` instead of `../`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["{{src}}app/**/*.{ts,tsx}", "{{src}}lib/**/*.{ts,tsx}"],
    ignores: ["**/*.spec.{ts,tsx}"],
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          policies: [
            {
              from: {
                element: { types: { anyOf: ["route", "shared", "lib"] } },
              },
              disallow: { to: { element: { type: "route" } } },
            },
            {
              from: { element: { type: "lib" } },
              disallow: {
                to: {
                  element: { types: { anyOf: ["shared", "api", "route"] } },
                },
              },
            },
          ],
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
  ]),
]);

export default eslintConfig;
