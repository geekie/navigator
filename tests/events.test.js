import { render, clean } from "./helper";

jest.useFakeTimers();

describe("onWillFocus", () => {
  let onWillFocus = jest.fn();
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
      onWillFocus
    }));
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(fooScreen);
  });

  // state = [["Foo"]]

  test("push", () => {
    navigator().push(barScreen);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(barScreen);
  });

  // state = [["Foo", "Bar"]]

  test("pop", () => {
    navigator().pop();
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(fooScreen);
  });

  // state = [["Foo"]]

  test("present", () => {
    navigator().present(barScreen);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(barScreen);
  });

  // state = [["Foo"], ["Bar"]]

  test("dismiss", () => {
    navigator().pop();
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(fooScreen);
  });

  // state = [["Foo"]]

  test("replace", () => {
    navigator().replace(spamScreen);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(spamScreen);
  });

  // state = [["Spam"]]

  test("present multiple", () => {
    navigator().present([fooScreen, barScreen, bazScreen]);
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(bazScreen);
  });

  // state = [["Spam"], ["Foo", "Bar", "Baz"]]

  test("popTo", () => {
    navigator().popTo("Foo");
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(fooScreen);
  });

  // state = [["Spam"], ["Foo"]]

  test("pop that calls dismiss", () => {
    navigator().pop();
    expect(onWillFocus).toHaveBeenCalledTimes(count++);
    expect(onWillFocus).toHaveBeenLastCalledWith(spamScreen);
  });
});
