module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '@/(.*)$': '<rootDir>/src/$1',
        '@common/(.*)$': '<rootDir>/src/common/$1'
    },
    testPathIgnorePatterns: [
        '<rootDir>/src/sync/__tests__/helpers.ts'
    ],
    reporters: ['<rootDir>/jestreporter.js']
    // testTimeout: 10000
    // collectCoverage: true
}
