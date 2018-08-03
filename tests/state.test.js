jest.mock("Animated", () =>
  Object.assign(require.requireActual("Animated"), {
    View: ({ children }) => children,
    spring(value, { toValue }) {
      return {
        start: fn => fn && fn()
      };
    }
  })
);

import React from "react";
import Navigator from "../src/Navigator";
import renderer from "react-test-renderer";

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
  function render(initialState) {
    let testRenderer = renderer.create(
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
});
