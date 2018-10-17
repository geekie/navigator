"use strict";

module.exports = {
  preset: "react-native",
  haste: Object.assign({}, require("react-native/jest-preset").haste, {
    defaultPlatform: "android"
  }),
  modulePathIgnorePatterns: ["<rootDir>/playground"],
  setupFiles: ["<rootDir>/tests/setup.js"]
};
