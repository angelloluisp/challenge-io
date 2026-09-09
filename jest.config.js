module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'apps/**/src/**/*.(t|j)s',
    'libs/**/src/**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/*.dto.ts',
    '!**/*.interface.ts',
    '!**/generated/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@card-domain/(.*)$': '<rootDir>/libs/card-domain/src/$1',
    '^@contracts/(.*)$': '<rootDir>/libs/contracts/src/$1',
    '^@database/(.*)$': '<rootDir>/libs/database/src/$1',
    '^@kafka/(.*)$': '<rootDir>/libs/kafka/src/$1',
    '^@observability/(.*)$': '<rootDir>/libs/observability/src/$1',
    '^@shared/(.*)$': '<rootDir>/libs/shared/src/$1',
  },
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
