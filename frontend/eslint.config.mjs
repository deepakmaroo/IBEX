// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  {
    ignores: [
      '**/node_modules/*',
      '**/dist/*',
      '**/out/*',
      '**/.webpack/*',
      'tsconfig.json',
    ]
  },
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins:{
      'import':importPlugin
    }, 
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest', // ou un numéro précis (e.g., 2022)
        sourceType: 'module',
      },
      globals: {
        // définit les globales spécifiques à Node.js
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      }

    }
  }
  

);
