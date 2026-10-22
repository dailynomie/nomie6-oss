module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  // Formatting is Prettier's job (see .prettierrc). ESLint keeps the correctness rules only.
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
    {
      files: ['*.spec.js', '*.test.js'],
      rules: {
        'quotes': 'off',
        'semi': 'off',
      },
    },
  ],
  plugins: ['svelte3'],
  settings: {
    'svelte3/typescript': true,
  },
};
