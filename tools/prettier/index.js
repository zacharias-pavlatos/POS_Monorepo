/** @type {import('prettier').Config} **/

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const config = {
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
  printWidth: 90,
  tabWidth: 2,
  arrowParens: 'avoid',
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  semi: true,
  endOfLine: 'lf',
};

export default config;
