"use strict";

module.exports = {
  env: {
    test: {
      presets: ["module:metro-react-native-babel-preset"]
    },
    production: {
      plugins: [
        "@babel/plugin-syntax-flow",
        "@babel/plugin-transform-flow-strip-types",
        "@babel/plugin-syntax-jsx",
        "@babel/plugin-syntax-class-properties",
        "@babel/plugin-proposal-optional-chaining"
      ]
    }
  }
};
