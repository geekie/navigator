jest.mock("Animated", () =>
  Object.assign({}, require.requireActual("Animated"), {
    View: props => props.children,
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

import { BackHandler } from "react-native";
import { render, clean } from "./helper";

describe("state", () => {
  afterEach(() => {
    clean();
  });

  test("push", () => {
    let { navigator, toJSON } = render({
      initialState: { screen: "Foo" }
    });
    navigator().push({ screen: "Bar" });
    expect(toJSON()).toEqual(["Foo", "Bar"]);
  });

  test("pop", () => {
    let { navigator, toJSON } = render({
      initialState: [[{ screen: "Foo" }, { screen: "Bar" }]]
    });
    navigator().pop();
    expect(toJSON()).toEqual("Foo");
  });

  test("popTo", () => {
    let { navigator, toJSON } = render({
      initialState: [
        [
          { screen: "Foo" },
          { screen: "Bar" },
          { screen: "Baz" },
          { screen: "Spam" }
        ]
      ]
    });
    navigator().popTo("Bar");
    expect(toJSON()).toEqual(["Foo", "Bar"]);
  });

  test("replace", () => {
    let { navigator, toJSON } = render({
      initialState: [[{ screen: "Foo" }, { screen: "Bar" }]]
    });
    navigator().replace({ screen: "Baz" });
    expect(toJSON()).toEqual(["Foo", "Baz"]);
  });

  test("reset", () => {
    let { navigator, toJSON } = render({
      initialState: [[{ screen: "Foo" }, { screen: "Bar" }, { screen: "Baz" }]]
    });
    navigator().reset({ screen: "Spam" });
    expect(toJSON()).toEqual("Spam");
  });

  test("pushReset", () => {
    let { navigator, toJSON } = render({
      initialState: [[{ screen: "Foo" }, { screen: "Bar" }, { screen: "Baz" }]]
    });
    navigator().pushReset({ screen: "Spam" });
    expect(toJSON()).toEqual("Spam");
  });

  test("present single", () => {
    let { navigator, toJSON } = render({
      initialState: [[{ screen: "Foo" }, { screen: "Bar" }]]
    });
    navigator().present({ screen: "Baz" });
    expect(toJSON()).toEqual(["Foo", "Bar", "Baz"]);
  });

  test("present multiple", () => {
    let { navigator, toJSON } = render({
      initialState: [[{ screen: "Foo" }, { screen: "Bar" }]]
    });
    navigator().present([{ screen: "Baz" }, { screen: "Spam" }], {
      animated: false
    });
    expect(toJSON()).toEqual(["Foo", "Bar", "Baz", "Spam"]);
  });

  test("dismiss", () => {
    let { navigator, toJSON } = render({
      initialState: [
        [{ screen: "Foo" }],
        [{ screen: "Bar" }, { screen: "Baz" }, { screen: "Spam" }]
      ]
    });
    navigator().dismiss();
    expect(toJSON()).toEqual("Foo");
  });

  test("pop single stack", () => {
    let { navigator, toJSON } = render({
      initialState: [
        [{ screen: "Foo" }, { screen: "Bar" }],
        [{ screen: "Spam" }]
      ]
    });
    navigator().pop();
    expect(toJSON()).toEqual(["Foo", "Bar"]);
  });

  describe("back button", () => {
    test("pops current screen", () => {
      let { toJSON } = render({
        initialState: [[{ screen: "Foo" }, { screen: "Bar" }]]
      });
      BackHandler.mockPressBack();
      expect(toJSON()).toEqual("Foo");
    });

    test("dismiss if screen is the first in stack", () => {
      let { toJSON } = render({
        initialState: [
          [{ screen: "Foo" }, { screen: "Bar" }],
          [{ screen: "Baz" }]
        ]
      });
      BackHandler.mockPressBack();
      expect(toJSON()).toEqual(["Foo", "Bar"]);
    });

    test("exits app if single screen", () => {
      render({ initialState: [[{ screen: "Foo" }]] });
      BackHandler.mockPressBack();
      expect(BackHandler.exitApp).toHaveBeenCalled();
    });
  });
});
