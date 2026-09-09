module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.integration-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  testTimeout: 60000,
  moduleNameMapper: {
    '^@card-domain/(.*)$': '<rootDir>/libs/card-domain/src/$1',
    '^@contracts/(.*)$': '<rootDir>/libs/contracts/src/$1',
    '^@database/(.*)$': '<rootDir>/libs/database/src/$1',
    '^@kafka/(.*)$': '<rootDir>/libs/kafka/src/$1',
    '^@observability/(.*)$': '<rootDir>/libs/observability/src/$1',
    '^@shared/(.*)$': '<rootDir>/libs/shared/src/$1',
  },
};
