module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    node: true,
    jest: true,
    es2020: true
  },
  rules: {
    // Turn off the base rule as it can report incorrect errors
    'no-unused-vars': 'off',
    // Use TypeScript-aware version instead
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true,
        'args': 'after-used'
      }
    ]
  }
};