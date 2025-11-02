/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  moduleNameMapper: {
    '^@database/(.*)$': '<rootDir>/src/infrastructure/database/$1',
    '^@repositories/(.*)$': '<rootDir>/src/domain/repositories/$1',
    '^@entities/(.*)$': '<rootDir>/src/domain/entities/$1',
    '^@errors/(.*)$': '<rootDir>/src/domain/errors/$1',
    '^@dto/(.*)$': '<rootDir>/src/application/dto/$1',
    '^@use-cases/(.*)$': '<rootDir>/src/application/use-cases/$1',
    '^@external/(.*)$': '<rootDir>/src/infrastructure/external/$1',
    '^@http/(.*)$': '<rootDir>/src/infrastructure/http/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
