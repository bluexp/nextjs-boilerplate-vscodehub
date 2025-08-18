const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const esmPackages = [
  "unified",
  "bail",
  "trough",
  "vfile",
  "vfile-message",
  "unist-util-stringify-position",
  "remark-parse",
  "mdast-util-from-markdown",
  "micromark",
  "micromark-util-combine-extensions",
  "micromark-util-symbol",
  "ccount",
  "decode-named-character-reference",
  "character-entities",
  "remark-gfm",
  "mdast-util-gfm",
  "micromark-extension-gfm",
  "mdast-util-find-and-replace",
  "unist-util-visit-parents",
  "unist-util-visit",
  "unist-util-is",
  "devlop",
  "is-plain-obj",
].join("|");

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Transform ESM packages and TS/JS files using Babel (next/babel + preset-env for Jest)
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "commonjs",
            },
          ],
          "next/babel",
        ],
      },
    ],
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(${esmPackages}))/`,
    "^.+\\.module\\.(css|sass|scss)$",
  ],
};

module.exports = createJestConfig(customJestConfig);