/**
 * @fileoverview ESLint 配置文件
 * @description 复习系统核心引擎的代码质量检查配置
 * @author thiskee
 * 
 * 任务 1.3 完成文件
 * 配置 ESLint 规则和代码质量检查
 */
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-redeclare': 'off',
    'no-unused-vars': 'off'
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }
} 