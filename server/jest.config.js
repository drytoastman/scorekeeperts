module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '@/(.*)$': '<rootDir>/src/$1',
        '@common/(.*)$': '<rootDir>/src/common/$1'
    },
    testPathIgnorePatterns: [
        'helpers.ts',
        '<rootDir>/tsbuild/*'
    ],
    reporters: ['<rootDir>/scripts/jestreporter.js']
}
