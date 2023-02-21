module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'standard-with-typescript',
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/object-curly-spacing': ['warn', 'never'],
    'object-curly-spacing': ['warn', 'never'],
    '@typescript-eslint/space-before-function-paren': ['warn', 'never'],

    'no-trailing-spaces': 'off',
    '@typescript-eslint/no-trailing-spaces': 'off',

    'comma-dangle': ['warn', 'always-multiline'],
    '@typescript-eslint/comma-dangle': ['warn', 'always-multiline'],

    'import/consistent-type-specifier-style': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
  },
}
