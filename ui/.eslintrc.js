rules = {
    'max-len': ['error', { code: 180, ignoreTemplateLiterals: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    'space-before-function-paren': ["warn", "never"],
    'no-multi-spaces': 'off',
    'no-multiple-empty-lines': 'off',
    indent: ['warn', 4]
}

if (process.env.NODE_ENV !== 'production') {
    rules = Object.assign(rules, {
        'no-debugger': 'error',
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
        "plugin:@typescript-eslint/recommended",
        'plugin:vue/essential',
        '@vue/standard',
        '@vue/typescript/recommended'
    ],
    rules: rules
}
