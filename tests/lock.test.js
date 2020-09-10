jest.mock("Animated", () =>
  Object.assign({}, require.requireActual("Animated"), {
    View: props => props.children
  })
);

import { render, clean } from "./helper";

jest.useFakeTimers();

function ensureArray(obj) {
  return Array.isArray(obj) ? obj : [obj];
}

describe("locks during transition", () => {
  afterEach(() => {
    clean();
  });

  let ACTIONS = [
    nav => nav.push({ screen: "Spam" }),
    nav => nav.pop(),
    nav => nav.popTo("Foo"),
    nav => nav.present({ screen: "Spam" }),
    nav => nav.dismiss(),
    nav => nav.replace({ screen: "Spam" }),
    nav => nav.reset({ screen: "Spam" }),
    nav => nav.pushReset({ screen: "Spam" })
  ];

  function assertLock(runAction, initialState) {
    let { navigator, toJSON } = render({ initialState });

    runAction(navigator());
    let state = toJSON();

    let nav = navigator();
    // check actions are ignored during transition
    for (let action of ACTIONS) {
      action(nav);
      expect(toJSON()).toEqual(state);
    }

    jest.runAllTimers();

    // check lock is free after transition
    (state = ensureArray(toJSON())).push("Spam");
    navigator().push({ screen: "Spam" });
    jest.runAllTimers();
    expect(toJSON()).toEqual(state);
  }

  test("push", () => {
    assertLock(
      function(navigator) {
        navigator.push({ screen: "Bar" });
      },
      { screen: "Foo" }
    );
  });

  test("pop", () => {
    assertLock(
      function(navigator) {
        navigator.pop();
      },
      [[{ screen: "Foo" }, { screen: "Bar" }]]
    );
  });

  test("popTo", () => {
    assertLock(
      function(navigator) {
        navigator.popTo("Foo");
      },
      [[{ screen: "Foo" }, { screen: "Bar" }, { screen: "Baz" }]]
    );
  });

  test("present", () => {
    assertLock(
      function(navigator) {
        navigator.present({ screen: "Bar" });
      },
      { screen: "Foo" }
    );
  });

  test("dismiss", () => {
    assertLock(
      function(navigator) {
        navigator.dismiss();
      },
      [[{ screen: "Foo" }], [{ screen: "Bar" }]]
    );
  });

  test("replace", () => {
    assertLock(
      function(navigator) {
        navigator.replace({ screen: "Baz" });
      },
      [[{ screen: "Foo" }, { screen: "Bar" }]]
    );
  });

  test("reset", () => {
    assertLock(
      function(navigator) {
        navigator.reset({ screen: "Baz" });
      },
      [[{ screen: "Foo" }, { screen: "Bar" }]]
    );
  });

  test("pushReset", () => {
    assertLock(
      function(navigator) {
        navigator.pushReset({ screen: "Baz" });
      },
      [[{ screen: "Foo" }, { screen: "Bar" }]]
    );
  });
});

describe("allows waiting on lock via waitForPendingNavigations", () => {
  afterEach(() => {
    clean();
  });

  test("present + replace", () => {
    let { navigator, toJSON } = render({ initialState: [[{ screen: "Foo" }]] });

    const nav = navigator();
    nav.present({ screen: "Bar" });
    nav
      .waitForPendingNavigations()
      .then(() => nav.replace({ screen: "Spam" }, { animated: false }));

    jest.runAllTimers();

    expect(toJSON()).toEqual(["Foo", "Spam"]);
  });
});
