jest.mock("react-native", () => {
  function animation(value, { toValue }) {
    return {
      start(fn) {
        value.setValue(toValue);
        fn && fn();
      }
    };
  }
  return Object.assign(require.requireActual("react-native"), {
    Value: function(curr) {
      this.curr = curr;
      this.setValue = value => {
        this.curr = value;
      };
    },
    spring: animation
  });
});

import React from "react";
import Navigator from "../src/Navigator";
import ReactTestUtils from "react-dom/test-utils";

const screensConfig = {
  Home: function Home() {
    return null;
  }
};

test("test", () => {
  ReactTestUtils.renderIntoDocument(
    <Navigator
      screensConfig={screensConfig}
      initialState={[[{ screen: "Home" }]]}
    />
  );
});
