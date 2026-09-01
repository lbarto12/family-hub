import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import svelteParser from 'svelte-eslint-parser';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,

	// Elevated strict type safety layers
	...ts.configs.strictTypeChecked,
	...ts.configs.stylisticTypeChecked,

	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,

	// Global Workspace Directory Ignores
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'src/lib/paraglide/',
			'*.config.js',
			'*.config.ts',
			'.globals.d.ts'
		]
	},

	// FIX 1: Provide global projectService definitions for all parsed TS/JS matches
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			parser: ts.parser,
			parserOptions: {
				projectService: true
			}
		}
	},

	// Global environments & browser settings
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node, Bun: 'readonly' }
		},
		rules: {
			'no-undef': 'off'
		}
	},

	// Svelte Component Config Block
	{
		files: ['**/*.svelte'],
		plugins: {
			svelte,
			'@typescript-eslint': ts.plugin
		},
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: ts.parser,
				projectService: true,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_'
				}
			]
		}
	},

	// Core Application Strict Type Rules Architecture
	{
		files: ['**/*.ts', '**/*.js'],
		plugins: {
			import: pluginImport,
			'@typescript-eslint': ts.plugin
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					bun: true
				}
			}
		},
		rules: {
			'@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
			'import/no-relative-packages': 'error',
			'import/no-useless-path-segments': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',

			// Hardened type locks
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unsafe-argument': 'error',
			'@typescript-eslint/no-unsafe-assignment': 'error',

			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true
				}
			]
		}
	},

	// FIX 2: Prevent type-checking errors inside isolated ambient types (like app.d.ts)
	{
		files: ['**/*.d.ts'],
		...ts.configs.disableTypeChecked
	},

	// Script Boundary Safety
	{
		files: ['scripts/**/*.ts'],
		...ts.configs.disableTypeChecked,
		rules: {
			'@typescript-eslint/no-floating-promises': 'off',
			'@typescript-eslint/no-misused-promises': 'off'
		}
	}
);
