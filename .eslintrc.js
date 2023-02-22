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
    '@typescript-eslint/quotes': 'off',

    'no-multi-spaces': 'off',
    'padded-blocks': 'off',

    'space-before-function-paren': 'off',
    '@typescript-eslint/space-before-function-paren': 'off',

    'no-trailing-spaces': 'off',
    '@typescript-eslint/no-trailing-spaces': 'off',

    'comma-dangle': ['warn', 'always-multiline'],
    '@typescript-eslint/comma-dangle': ['warn', 'always-multiline'],

    'import/consistent-type-specifier-style': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',

    '@typescript-eslint/no-unused-vars': 'off',
    'no-multiple-empty-lines': ['warn', {max: 2, maxEOF: 1}],
  },
}
