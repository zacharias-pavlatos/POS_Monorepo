// This configuration only applies to the package manager root.
/** @type {import("eslint").Linter.Config} */

const config = {
  ignorePatterns: ["apps/**", "packages/**"],
  extends: ["@repo/eslint/library.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
}
export default config;
