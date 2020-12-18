module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '@/(.*)$': '<rootDir>/src/$1',
        'sctypes/lib/(.*)$': '<rootDir>/../common/types/$1',
        '@scdb': '<rootDir>/../common/db',
        '@scdb/(.*)$': '<rootDir>/../common/db/$1'
    },
    testPathIgnorePatterns: [
        'helpers.ts',
        '<rootDir>/tsbuild/*'
    ],
    reporters: ['<rootDir>/scripts/jestreporter.js']
}
