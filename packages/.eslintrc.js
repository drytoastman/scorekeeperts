module.exports = {
    env: {
        es6: true,
        node: true,
        jest: true
    },
    extends: [
        'plugin:vue/essential',
        '@vue/standard',
        '@vue/typescript/recommended'
    ],
    globals: {
        grecaptcha: true,
        paypal: true,
        SqPaymentForm: true
    },
    ignorePatterns: ['**/dist/*', '**/dist_electron/*', '**/build/*', '**/tsbuild/*', '**/scripts/*'],
    overrides: [{
        files: [
          '*.vue'
        ],
        rules: {
            '@typescript-eslint/explicit-module-boundary-types': 'off'
        }
    }],
    parser: 'vue-eslint-parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        parser: '@typescript-eslint/parser' // feeds under main parser (vue file parse)
    },
    root: true,
    rules: {
        'array-bracket-spacing': 'warn',
        'comma-dangle': 'warn',
        'comma-spacing': 'warn',
        indent: ['warn', 4, {
            SwitchCase: 1,
            CallExpression: { arguments: 'off' },
            FunctionDeclaration: { parameters: 'off' },
            FunctionExpression: { parameters: 'off' },
            ArrayExpression: 'off'
        }],
        'key-spacing': 'off',
        'max-len': ['error', { code: 180, ignoreTemplateLiterals: true }],
        'no-debugger': (process.env.NODE_ENV === 'production') ? 'error' : 'off',
        'no-multi-spaces': 'off', // I like to visually align things
        'no-multiple-empty-lines': 'off',
        'no-unused-vars': 'off',  // doesn't appear to work with typescript
        'no-useless-constructor': 'off',  // defer to @typescript version
        'object-curly-spacing': ['warn', 'always', { objectsInObjects: false }],
        'padded-blocks': 'off',
        quotes: 'warn',
        'space-before-function-paren': ['warn', {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'always'
        }],
        'spaced-comment': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-useless-constructor': ['warn'],
        'vue/no-unused-components': 'warn',
        'vue/no-unused-vars': 'warn'
    }
}
