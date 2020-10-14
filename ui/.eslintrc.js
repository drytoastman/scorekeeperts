let rules = {
    'max-len': ['error', { code: 180, ignoreTemplateLiterals: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    'space-before-function-paren': ['warn', 'never'],
    'no-multi-spaces': 'off',
    'no-multiple-empty-lines': 'off',
    'no-debugger': 'off',
    'key-spacing': 'off',
    'spaced-comment': 'off',
    indent: ['warn', 4, { SwitchCase: 1 }],
    'vue/no-unused-components': 'warn',
    'object-curly-spacing': ['warn', 'always', { objectsInObjects: false }],
    'array-bracket-spacing': 'warn',
    'comma-dangle': 'warn'
}

if (process.env.NODE_ENV === 'production') {
    rules = Object.assign(rules, {
        'no-debugger': 'error'
    })
}

module.exports = {
    root: true,
    env: {
        node: true
    },
    parserOptions: {
        ecmaVersion: 2020,
        parser: '@typescript-eslint/parser'
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/essential',
        '@vue/standard',
        '@vue/typescript/recommended'
    ],
    rules: rules,
    overrides: [{
        files: ['*.vue', '*.js'],
        rules: {
            // most vue files are not typescript, and .js definitely isn't
            '@typescript-eslint/explicit-module-boundary-types': 'off'
        }
    }],
    globals: {
        grecaptcha: true,
        paypal: true,
        SqPaymentForm: true
    }
}
