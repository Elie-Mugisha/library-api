module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: ".*\\.spec\\.(t|j)s$",
  transform: {
    "^.+\\.(t|j)s$": 'ts-jest'
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: 'node'
};