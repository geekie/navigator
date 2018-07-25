"use strict";

const path = require("path");
const blacklist = require("metro/src/blacklist");

module.exports = {
  getBlacklistRE() {
    return blacklist([
      new RegExp(path.join(__dirname, "..", "node_modules", ".*"))
    ]);
  },
  extraNodeModules: {
    react: path.join(__dirname, "node_modules", "react")
  }
};
