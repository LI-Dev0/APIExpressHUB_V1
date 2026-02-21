module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'index.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  verbose: true
};
