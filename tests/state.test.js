jest.mock("Animated", () =>
  Object.assign(require.requireActual("Animated"), {
    View: ({ children }) => children,
    spring(value, { toValue }) {
      return {
        start(fn) {
          value.setValue(toValue);
          fn && fn();
        }
      };
    }
  })
);

jest.mock("BackHandler");

import React from "react";
import { BackHandler } from "react-native";
import renderer from "react-test-renderer";
import Navigator from "../src/Navigator";

function Foo() {
  return "Foo";
}

function Bar() {
  return "Bar";
}

function Baz() {
  return "Baz";
}

function Spam() {
  return "Spam";
}

function getLast(arr) {
  return arr[arr.length - 1];
}

describe("state", () => {
  let testRenderer;

  afterEach(() => {
    testRenderer?.unmount();
    testRenderer = null;
  });

  function render(initialState) {
    testRenderer = renderer.create(
      <Navigator
        screensConfig={{ Foo, Bar, Baz, Spam }}
        initialState={initialState}
      />
    );

    function find() {
      return testRenderer.root.findAll(
        node =>
          node.type === Foo ||
          node.type === Bar ||
          node.type === Baz ||
          node.type === Spam
      );
    }

    return {
      navigator: getLast(find()).props.navigator,
      getScreens() {
        return testRenderer.toJSON();
      }
    };
  }

  test("push", () => {
    let { navigator, getScreens } = render({ screen: "Foo" });
    navigator.push({ screen: "Bar" });
    expect(getScreens()).toEqual(["Foo", "Bar"]);
  });

  test("pop", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }, { screen: "Bar" }]
    ]);
    navigator.pop();
    expect(getScreens()).toEqual("Foo");
  });

  test("popTo", () => {
    let { navigator, getScreens } = render([
      [
        { screen: "Foo" },
        { screen: "Bar" },
        { screen: "Baz" },
        { screen: "Spam" }
      ]
    ]);
    navigator.popTo("Bar");
    expect(getScreens()).toEqual(["Foo", "Bar"]);
  });

  test("replace", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }, { screen: "Bar" }]
    ]);
    navigator.replace({ screen: "Baz" });
    expect(getScreens()).toEqual(["Foo", "Baz"]);
  });

  test("reset", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }, { screen: "Bar" }, { screen: "Baz" }]
    ]);
    navigator.reset({ screen: "Spam" });
    expect(getScreens()).toEqual("Spam");
  });

  test("pushReset", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }, { screen: "Bar" }, { screen: "Baz" }]
    ]);
    navigator.pushReset({ screen: "Spam" });
    expect(getScreens()).toEqual("Spam");
  });

  test("present single", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }, { screen: "Bar" }]
    ]);
    navigator.present({ screen: "Baz" });
    expect(getScreens()).toEqual(["Foo", "Bar", "Baz"]);
  });

  test("present multiple", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }, { screen: "Bar" }]
    ]);
    navigator.present([{ screen: "Baz" }, { screen: "Spam" }], {
      animated: false
    });
    expect(getScreens()).toEqual(["Foo", "Bar", "Baz", "Spam"]);
  });

  test("dismiss", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }],
      [{ screen: "Bar" }, { screen: "Baz" }, { screen: "Spam" }]
    ]);
    navigator.dismiss();
    expect(getScreens()).toEqual("Foo");
  });

  test("pop single stack", () => {
    let { navigator, getScreens } = render([
      [{ screen: "Foo" }, { screen: "Bar" }],
      [{ screen: "Spam" }]
    ]);
    navigator.pop();
    expect(getScreens()).toEqual(["Foo", "Bar"]);
  });

  describe("back button", () => {
    test("pops current screen", () => {
      let { getScreens } = render([[{ screen: "Foo" }, { screen: "Bar" }]]);
      BackHandler.mockPressBack();
      expect(getScreens()).toEqual("Foo");
    });

    test("dismiss if screen is the first in stack", () => {
      let { getScreens } = render([
        [{ screen: "Foo" }, { screen: "Bar" }],
        [{ screen: "Baz" }]
      ]);
      BackHandler.mockPressBack();
      expect(getScreens()).toEqual(["Foo", "Bar"]);
    });

    test("exits app if single screen", () => {
      render([[{ screen: "Foo" }]]);
      BackHandler.mockPressBack();
      expect(BackHandler.exitApp).toHaveBeenCalled();
    });
  });
});
