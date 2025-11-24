export default {
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: [
    "**/*.mjs",
    "!**/node_modules/**",
    "!**/spec/**",
    "!**/coverage/**",
    "!**/start.mjs/**",
    "!**/app.mjs/**",
  ],
  coverageReporters: ["text", "lcov"],
};
