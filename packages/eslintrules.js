
module.exports = {
    rules: {
        'max-len': ['error', { code: 180, ignoreTemplateLiterals: true }],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',

        "no-useless-constructor": "off",
        '@typescript-eslint/no-useless-constructor': ['warn'],

        'space-before-function-paren': ['warn', {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'always'
        }],
        // 'no-useless-constructor': 'off', // this still fires when using private constructor args to set local
        'no-multi-spaces': 'off', // I like to visually align things
        'no-multiple-empty-lines': 'off',
        'key-spacing': 'off',
        'no-unused-vars': 'off',  // doesn't appear to work with typescript
        'padded-blocks': 'off',
        'no-debugger': 'off',
        'spaced-comment': 'off',
        'object-curly-spacing': ['warn', 'always', { objectsInObjects: false }],
        'array-bracket-spacing': 'warn',
        'comma-spacing': 'warn',
        'comma-dangle': 'warn',
        quotes: 'warn',
        indent: ['warn', 4, {
            SwitchCase: 1,
            CallExpression: { arguments: 'off' },
            FunctionDeclaration: { parameters: 'off' },
            FunctionExpression: { parameters: 'off' },
            ArrayExpression: 'off'
        }]
    }

    /*
    if (process.env.NODE_ENV === 'production') {
        rules = Object.assign(rules, {
            'no-debugger': 'error'
        })
    } */
}
