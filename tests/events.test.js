import { render, clean } from "./helper";

jest.useFakeTimers();

describe("onWillFocus", () => {
  let onWillFocus = jest.fn();
  let onDidFocus = jest.fn();
  let count = 1;
  let navigator;

  let fooScreen = { screen: "Foo", props: { foo: "foo" } };
  let barScreen = { screen: "Bar", props: { bar: "bar" } };
  let bazScreen = { screen: "Baz", props: { baz: "baz" } };
  let spamScreen = { screen: "Spam", props: { spam: "spam" } };

  afterEach(() => {
    jest.runAllTimers();
  });

  afterAll(() => {
    clean();
  });

  test("is called on mount", () => {
    ({ navigator } = render({
      initialState: fooScreen,
      onWillFocus,
      onDidFocus
    }));
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...fooScreen,
        navigationType: "initial"
      })
    );
  });

  // state = [["Foo"]]

  test("push", () => {
    navigator().push(barScreen);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...barScreen,
        route: expect.objectContaining(barScreen),
        navigationType: "push",
        previousRoute: expect.objectContaining(fooScreen)
      })
    );
  });

  // state = [["Foo", "Bar"]]

  test("pop", () => {
    navigator().pop();
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...fooScreen,
        route: expect.objectContaining(fooScreen),
        navigationType: "pop",
        previousRoute: expect.objectContaining(barScreen)
      })
    );
  });

  // state = [["Foo"]]

  test("present", () => {
    navigator().present(barScreen);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...barScreen,
        route: expect.objectContaining(barScreen),
        navigationType: "present",
        previousRoute: expect.objectContaining(fooScreen)
      })
    );
  });

  // state = [["Foo"], ["Bar"]]

  test("dismiss", () => {
    navigator().pop();
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...fooScreen,
        route: expect.objectContaining(fooScreen),
        navigationType: "dismiss",
        previousRoute: expect.objectContaining(barScreen)
      })
    );
  });

  // state = [["Foo"]]

  test("replace", () => {
    navigator().replace(spamScreen);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...spamScreen,
        route: expect.objectContaining(spamScreen),
        navigationType: "replace",
        previousRoute: expect.objectContaining(fooScreen)
      })
    );
  });

  // state = [["Spam"]]

  test("present multiple", () => {
    navigator().present([fooScreen, barScreen, bazScreen]);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...bazScreen,
        route: expect.objectContaining(bazScreen),
        navigationType: "present",
        previousRoute: expect.objectContaining(spamScreen)
      })
    );
  });

  // state = [["Spam"], ["Foo", "Bar", "Baz"]]

  test("popTo", () => {
    navigator().popTo("Foo");
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...fooScreen,
        route: expect.objectContaining(fooScreen),
        navigationType: "pop",
        previousRoute: expect.objectContaining(bazScreen)
      })
    );
  });

  // state = [["Spam"], ["Foo"]]

  test("pop that calls dismiss", () => {
    navigator().pop();
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...spamScreen,
        route: expect.objectContaining(spamScreen),
        navigationType: "dismiss",
        previousRoute: expect.objectContaining(fooScreen)
      })
    );
  });
});
