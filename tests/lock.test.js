import React from "react";
import Navigator from "../src/Navigator";
import renderer from "react-test-renderer";

jest.useFakeTimers();

describe("lock", () => {
  let testRenderer;
  let resetState;

  beforeEach(() => {
    jest.clearAllTimers();
    testRenderer = renderer.create(
      <Navigator
        resetState={_reset => (resetState = _reset)}
        screensConfig={{
          Screen: "Screen"
        }}
        initialState={[
          [{ screen: "Screen" }, { screen: "Screen" }],
          [{ screen: "Screen" }, { screen: "Screen" }]
        ]}
      />
    );
  });

  afterEach(() => {
    testRenderer.unmount();
    testRenderer = null;
  });

  function getScreens() {
    return testRenderer.root.findAllByType("Screen");
  }

  function getNavigator() {
    let screens = getScreens();
    return screens[screens.length - 1].props.navigator;
  }

  let actions = {
    push(navigator) {
      navigator.push({ screen: "Screen" });
    },
    pop(navigator) {
      navigator.pop();
    },
    popTo(navigator) {
      navigator.popTo("Screen");
    },
    present(navigator) {
      navigator.present({ screen: "Screen" });
    },
    dismiss(navigator) {
      navigator.dismiss();
    },
    replace(navigator) {
      navigator.replace({ screen: "Screen" });
    },
    reset(navigator) {
      navigator.reset({ screen: "Screen" });
    }
  };

  for (let name of Object.keys(actions).sort()) {
    test(`${name}()`, () => {
      let count;
      let action = actions[name];
      let navigator = getNavigator();

      action(navigator);
      count = getScreens().length;

      for (let action of Object.values(actions)) {
        // check all actions are ignored until action is complete
        action(navigator);
        expect(getScreens()).toHaveLength(count);
      }

      jest.runAllTimers();
      count = getScreens().length;

      // lock is free now
      getNavigator().push({ screen: "Screen" });
      jest.runAllTimers();
      expect(getScreens()).toHaveLength(count + 1);
    });
  }

  test("reset stops all locks", () => {
    getNavigator().push({ screen: "Screen" });
    expect(getScreens()).toHaveLength(5);

    resetState([[{ screen: "Screen" }]]);
    expect(getScreens()).toHaveLength(1);

    // push was ignored
    jest.runAllTimers();
    expect(getScreens()).toHaveLength(1);

    // lock is free now
    getNavigator().push({ screen: "Screen" });
    jest.runAllTimers();
    expect(getScreens()).toHaveLength(2);
  });
});
