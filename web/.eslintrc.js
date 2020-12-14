module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
        jest: true
    },
    globals: {
        grecaptcha: true,
        paypal: true,
        SqPaymentForm: true
    },
    extends: [
        'plugin:vue/essential',
        '@vue/standard',
        '@vue/typescript/recommended',
        '../eslintrules.js'
    ],
    overrides: [{
        files: [
            '*.vue',
            '*.js'
        ],
        rules: {
            '@typescript-eslint/explicit-module-boundary-types': 'off'
        }
    }],
    rules: {
        'vue/no-unused-components': 'warn',
        'vue/no-unused-vars': 'warn'
    },
    parserOptions: {
        ecmaVersion: 2020,
        parser: '@typescript-eslint/parser'
    }
}
