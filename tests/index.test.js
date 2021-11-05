import React from "react";
import { BackHandler } from "react-native";
import { screensConfig, render } from "./helper";
import Navigator from "../src/Navigator";

jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

jest.mock("react-native/Libraries/Utilities/BackHandler", () =>
  jest.requireActual("react-native/Libraries/Utilities/__mocks__/BackHandler")
);

jest.useFakeTimers();

global.requestAnimationFrame = cb => {
  setTimeout(cb, 16);
};

describe("basic navigations", () => {
  test("push, replace, pop and reset", () => {
    const { navigate, queryScreen } = render(
      <Navigator
        screensConfig={screensConfig}
        initialState={{ screen: "Initial" }}
      />
    );

    expect(queryScreen("Initial")).not.toBeNull();
    expect(queryScreen("Profile")).toBeNull();

    // `push`
    navigate("push", "Profile");
    expect(queryScreen("Profile")).not.toBeNull();

    // `replace`
    navigate("replace", "Search");
    expect(queryScreen("Profile")).toBeNull();
    expect(queryScreen("Search")).not.toBeNull();

    // `pop`
    navigate("pop");
    expect(queryScreen("Search")).toBeNull();

    // `push` and `reset`
    expect(queryScreen("Initial")).not.toBeNull();
    expect(queryScreen("Profile")).toBeNull();
    navigate("push", "Profile");
    navigate("push", "Search");
    navigate("reset", "About");
    expect(queryScreen("Initial")).toBeNull();
    expect(queryScreen("Profile")).toBeNull();
    expect(queryScreen("Search")).toBeNull();
    expect(queryScreen("About")).not.toBeNull();

    // popTo
    navigate("push", "Profile");
    navigate("push", "Search");
    navigate("popTo", "About");
    expect(queryScreen("Profile")).toBeNull();
    expect(queryScreen("Search")).toBeNull();
    expect(queryScreen("About")).not.toBeNull();
  });

  test("present and dismiss", () => {
    const { navigate, queryScreen } = render(
      <Navigator
        screensConfig={screensConfig}
        initialState={[[{ screen: "Initial" }, { screen: "Profile" }]]}
      />
    );

    expect(queryScreen("Initial")).not.toBeNull();
    expect(queryScreen("Profile")).not.toBeNull();
    expect(queryScreen("Search")).toBeNull();
    expect(queryScreen("About")).toBeNull();

    // present
    navigate("present", "Search");
    expect(queryScreen("Initial")).not.toBeNull();
    expect(queryScreen("Profile")).not.toBeNull();
    expect(queryScreen("Search")).not.toBeNull();
    expect(queryScreen("About")).toBeNull();

    // dismiss
    navigate("push", "About");
    expect(queryScreen("Initial")).not.toBeNull();
    expect(queryScreen("Profile")).not.toBeNull();
    expect(queryScreen("Search")).not.toBeNull();
    expect(queryScreen("About")).not.toBeNull();

    navigate("dismiss");
    expect(queryScreen("Initial")).not.toBeNull();
    expect(queryScreen("Profile")).not.toBeNull();
    expect(queryScreen("Search")).toBeNull();
    expect(queryScreen("About")).toBeNull();
  });

  test("dismiss does nothing if there's a single stack", () => {
    const { navigate, queryAllScreens } = render(
      <Navigator
        screensConfig={screensConfig}
        initialState={[[{ screen: "Initial" }, { screen: "Profile" }]]}
      />
    );

    const state = queryAllScreens();

    navigate("dismiss");

    expect(queryAllScreens()).toEqual(state);
  });

  describe("back button", () => {
    test("pops current screen", () => {
      const { queryScreen } = render(
        <Navigator
          screensConfig={screensConfig}
          initialState={[[{ screen: "Initial" }, { screen: "Profile" }]]}
        />
      );
      expect(queryScreen("Initial")).not.toBeNull();
      expect(queryScreen("Profile")).not.toBeNull();
      BackHandler.mockPressBack();
      jest.runAllTimers();
      expect(queryScreen("Initial")).not.toBeNull();
      expect(queryScreen("Profile")).toBeNull();
    });

    test("dismiss if screen is the first in stack", () => {
      const { queryScreen } = render(
        <Navigator
          screensConfig={screensConfig}
          initialState={[
            [{ screen: "Initial" }, { screen: "Profile" }],
            [{ screen: "About" }]
          ]}
        />
      );
      expect(queryScreen("Initial")).not.toBeNull();
      expect(queryScreen("Profile")).not.toBeNull();
      expect(queryScreen("About")).not.toBeNull();
      BackHandler.mockPressBack();
      jest.runAllTimers();
      expect(queryScreen("Initial")).not.toBeNull();
      expect(queryScreen("Profile")).not.toBeNull();
      expect(queryScreen("About")).toBeNull();
    });

    test("exits app if single screen", () => {
      render(
        <Navigator
          screensConfig={screensConfig}
          initialState={{ screen: "Initial" }}
        />
      );
      BackHandler.mockPressBack();
      expect(BackHandler.exitApp).toHaveBeenCalled();
    });
  });
});

describe("locks during transition", () => {
  test.each(["push", "pop", "present", "dismiss", "replace"])("%s", action => {
    const { navigate, queryAllScreens, queryScreen } = render(
      <Navigator
        screensConfig={screensConfig}
        initialState={[[{ screen: "Initial" }], [{ screen: "Search" }]]}
      />
    );

    // runNavigation(navigate);
    navigate(
      action,
      ["pop", "dismiss"].includes(action) ? undefined : "Profile",
      /* runAllTimers */ false
    );

    let state = queryAllScreens();

    // check actions are ignored during transition
    navigate("push", "About", /* runAllTimers */ false);
    expect(queryAllScreens()).toEqual(state);

    navigate("pop", undefined, /* runAllTimers */ false);
    expect(queryAllScreens()).toEqual(state);

    navigate("popTo", "Initial", /* runAllTimers */ false);
    expect(queryAllScreens()).toEqual(state);

    navigate("present", "About", /* runAllTimers */ false);
    expect(queryAllScreens()).toEqual(state);

    navigate("dismiss", undefined, /* runAllTimers */ false);
    expect(queryAllScreens()).toEqual(state);

    navigate("replace", "About", /* runAllTimers */ false);
    expect(queryAllScreens()).toEqual(state);

    navigate("reset", "About", /* runAllTimers */ false);
    expect(queryAllScreens()).toEqual(state);

    jest.runAllTimers();

    state = queryAllScreens();

    // check lock is free after transition
    navigate("push", "Extra");
    expect(queryAllScreens()).toEqual([...state, queryScreen("Extra")]);
  });
});

// TODO: finish write this test or rethink this API
describe.skip("can wait on lock with waitForPendingNavigations", () => {
  test("present + replace", () => {
    const { navigate } = render(
      <Navigator
        screensConfig={screensConfig}
        initialState={{ screen: "Initial" }}
      />
    );

    navigate("present", "Search", /* runAllTimers */ false);
  });
});

describe("events", () => {
  describe("onWillFocus", () => {
    test("is called after first render", () => {
      const onWillFocus = jest.fn();
      render(
        <Navigator
          screensConfig={screensConfig}
          initialState={[[{ screen: "Initial" }], [{ screen: "Search" }]]}
          onWillFocus={onWillFocus}
        />
      );

      expect(onWillFocus).toHaveBeenCalledTimes(1);
      expect(onWillFocus).toHaveBeenLastCalledWith({ screen: "Search" });
    });

    test.each(["push", "present", "replace"])("is called after %s", action => {
      const onWillFocus = jest.fn();
      const { navigate } = render(
        <Navigator
          screensConfig={screensConfig}
          initialState={[[{ screen: "Initial" }], [{ screen: "Search" }]]}
          onWillFocus={onWillFocus}
        />
      );

      navigate(action, "Profile");

      expect(onWillFocus).toHaveBeenCalledTimes(2);
      expect(onWillFocus).toHaveBeenLastCalledWith(
        expect.objectContaining({ screen: "Profile" })
      );
    });

    test("is called after pop", () => {
      const onWillFocus = jest.fn();
      const { navigate } = render(
        <Navigator
          screensConfig={screensConfig}
          initialState={[[{ screen: "Initial" }, { screen: "Search" }]]}
          onWillFocus={onWillFocus}
        />
      );

      navigate("pop");

      expect(onWillFocus).toHaveBeenCalledTimes(2);
      expect(onWillFocus).toHaveBeenLastCalledWith(
        expect.objectContaining({ screen: "Initial" })
      );
    });

    test("is called after dismiss", () => {
      const onWillFocus = jest.fn();
      const { navigate } = render(
        <Navigator
          screensConfig={screensConfig}
          initialState={[[{ screen: "Initial" }], [{ screen: "Search" }]]}
          onWillFocus={onWillFocus}
        />
      );

      navigate("dismiss");

      expect(onWillFocus).toHaveBeenCalledTimes(2);
      expect(onWillFocus).toHaveBeenLastCalledWith(
        expect.objectContaining({ screen: "Initial" })
      );
    });
  });
});
