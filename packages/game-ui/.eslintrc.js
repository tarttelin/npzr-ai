module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    browser: true,
    jest: true,
    es2020: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // React specific rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Disable some rules for tests
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true,
        'args': 'after-used'
      }
    ]
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', 'src/setupTests.ts'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
};