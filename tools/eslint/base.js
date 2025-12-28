import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import turboPlugin from 'eslint-plugin-turbo';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const baseConfig = [
  // Core JS rules (no-unused-vars, no-undef, etc.)
  js.configs.recommended,

  // Disables ESLint rules that conflict with Prettier
  eslintConfigPrettier,

  // TypeScript-specific rules (@typescript-eslint/*)
  ...tseslint.configs.recommended,

  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin,
    },
    rules: {
      // === Turbo ===
      // Warns when using env vars not declared in turbo.json
      'turbo/no-undeclared-env-vars': 'warn',

      // === Whitespace ===
      // Only allow 1 empty line between code blocks, none at start/end of file
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      // Require 1 empty line after all imports before code starts
      'import/newline-after-import': ['error', { count: 1 }],

      // === TypeScript ===
      // Use `import type { X }` instead of `import { X }` for type-only imports
      // 'separate-type-imports' puts them on their own line: `import type { X }`
      // vs 'inline-type-imports' which does: `import { type X, Y }`
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // Enforce naming conventions:
      // - Interfaces: PascalCase (e.g., UserProps)
      // - Type aliases: PascalCase (e.g., UserId)
      // - Enums: PascalCase (e.g., Status)
      // - Enum members: UPPER_CASE (e.g., ACTIVE, PENDING)
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
      ],

      // === Code Style ===
      // Use `const` when variable is never reassigned
      'prefer-const': 'error',

      // Merge duplicate imports from same module
      // 'prefer-inline': false keeps type imports separate
      'import/no-duplicates': ['error', { 'prefer-inline': false }],

      // === Import Order ===
      // Enforces consistent import ordering with groups and newlines
      'import/order': [
        'error',
        {
          // Order of import groups (top to bottom)
          groups: [
            'builtin', // Node.js built-ins: fs, path, etc.
            'external', // npm packages: react, lodash, etc.
            'internal', // Monorepo/aliased: @repo/*, @/*
            [
              // Parent directory: ../
              'parent',
              // Same directory: ./
              'sibling',
              // Index file: ./index]
              'index',
              // Type-only imports (at the bottom)
            ],
            'type',
          ],
          pathGroups: [
            // React always first in external group
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react-*', group: 'external', position: 'before' },

            // Next.js right after React
            { pattern: 'next', group: 'external', position: 'before' },
            { pattern: 'next/**', group: 'external', position: 'before' },

            // Monorepo packages (@repo/ui, @repo/db, etc.)
            { pattern: '@repo/**', group: 'internal', position: 'before' },

            // App-level aliases (@/components, @/lib, etc.)
            { pattern: '@/**', group: 'internal', position: 'after' },
          ],

          // Don't apply pathGroups to built-in modules
          pathGroupsExcludedImportTypes: ['builtin'],

          // Add empty line between each group
          'newlines-between': 'always',

          // Sort imports alphabetically within each group
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // === Custom ===
      // Forbid direct process.env usage — use centralized env.ts instead
      // This ensures type-safe env vars and single source of truth
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: 'Do not use process.env directly. Use env.ts instead.',
        },
      ],
    },
  },

  // Converts all errors to warnings during development
  // Remove this in CI/production if you want hard failures
  {
    plugins: {
      onlyWarn,
    },
  },

  // Ignore built output
  {
    ignores: ['dist/**'],
  },
];
