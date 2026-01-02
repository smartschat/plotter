const globals = require('globals');

module.exports = [
    {
        files: ['js/app.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                katex: 'readonly',
                Parser: 'readonly',
                Plotter: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'eqeqeq': ['error', 'always']
        }
    },
    {
        files: ['js/parser.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                math: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^Parser$', caughtErrorsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'eqeqeq': ['error', 'always']
        }
    },
    {
        files: ['js/plotter.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                Plotly: 'readonly',
                Parser: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^Plotter$', caughtErrorsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'eqeqeq': ['error', 'always']
        }
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.node,
                Parser: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'eqeqeq': ['error', 'always']
        }
    }
];
