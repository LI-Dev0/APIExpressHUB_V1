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
      branches: 28,
      functions: 50,
      lines: 50,
      statements: 48
    }
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  verbose: true
};
