// The API runs in a child process (tests/server.js): Jest's sandbox breaks the MongoDB driver handshake.
module.exports = {
  testEnvironment: 'node',
  transform: {},
  globalSetup: './globalSetup.js',
  globalTeardown: './globalTeardown.js',
  testTimeout: 30000,
};
