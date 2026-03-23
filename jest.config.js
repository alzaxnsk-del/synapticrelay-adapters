/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/packages'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@synapticrelay/core$': '<rootDir>/packages/core/src',
    '^@synapticrelay/core/(.*)$': '<rootDir>/packages/core/src/$1',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'adapters/*/src/**/*.ts',
    'tools/*/src/**/*.ts',
    '!**/*.d.ts',
  ],
};
