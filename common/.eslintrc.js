rules = {
    'max-len': ['error', { code: 180, ignoreTemplateLiterals: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    'space-before-function-paren': ["warn", "never"],
    'no-multi-spaces': 'off', // I like to visually align things
    'no-unused-vars': 'off',  // doesn't appear to work with typescript
    'padded-blocks': 'off',
    'indent': ['warn', 4],
    'key-spacing': ['warn', {"beforeColon": false, "afterColon": true, "mode": "minimum" }]
  }

  if (process.env.NODE_ENV !== 'production') {
    rules = Object.assign(rules, {
        'no-debugger': 'error',
    })
  }

module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "standard"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": rules
};