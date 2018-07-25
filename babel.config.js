"use strict";

module.exports = {
  env: {
    test: {
      presets: ["react-native"]
    },
    production: {
      plugins: [
        "@babel/plugin-syntax-flow",
        "@babel/plugin-syntax-jsx",
        "@babel/plugin-syntax-class-properties",
        "@babel/plugin-syntax-object-rest-spread",
        "@babel/plugin-proposal-optional-chaining"
      ]
    }
  }
};
