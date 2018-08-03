"use strict";

const { haste } = require("react-native/jest-preset");

haste.defaultPlatform = "android";

module.exports = {
  preset: "react-native",
  haste,
  modulePathIgnorePatterns: ["<rootDir>/playground"]
};
