module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
        jest: true
    },
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    extends: [
        'standard',
        'plugin:@typescript-eslint/recommended',
        '../eslintrules.js'
    ],
    plugins: [
        '@typescript-eslint'
    ],
    parserOptions: {
        ecmaVersion: 2020,
        parser: '@typescript-eslint/parser'
    }
}
