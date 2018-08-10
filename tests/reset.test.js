jest.mock("Animated", () =>
  Object.assign(require.requireActual("Animated"), {
    View: props => props.children
  })
);

import { render, clean } from "./helper";

describe("reset", () => {
  afterEach(() => {
    clean();
  });

  test("works", () => {
    let reset;
    let { toJSON } = render({
      initialState: [
        [{ screen: "Foo" }, { screen: "Bar" }],
        [{ screen: "Baz" }]
      ],
      resetState: _reset => (reset = _reset)
    });
    expect(toJSON()).toEqual(["Foo", "Bar", "Baz"]);

    reset([[{ screen: "Spam" }]]);
    expect(toJSON()).toEqual("Spam");
  });
});
