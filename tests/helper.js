import React, { useState } from "react";
import { View, Button, Text, TextInput } from "react-native";
import {
  fireEvent,
  render as _render,
  getQueriesForElement
} from "@testing-library/react-native";

export const makeScreen = name => ({ navigator }) => {
  const [next, setNext] = useState("");
  return (
    <View accessibilityHint={`${name} Screen`}>
      <Text>{name} Screen</Text>
      <TextInput
        placeholder="screen action"
        onChangeText={setNext}
        value={next}
      />
      <Button onPress={() => navigator.push({ screen: next })} title="push" />
      <Button
        onPress={() => navigator.replace({ screen: next })}
        title="replace"
      />
      <Button onPress={() => navigator.reset({ screen: next })} title="reset" />
      <Button onPress={() => navigator.pop()} title="pop" />
      <Button onPress={() => navigator.popTo(next)} title="popTo" />
      <Button
        onPress={() => navigator.present({ screen: next })}
        title="present"
      />
      <Button onPress={() => navigator.dismiss()} title="dismiss" />
    </View>
  );
};

export const screensConfig = {
  Initial: makeScreen("Initial"),
  Profile: makeScreen("Profile"),
  Search: makeScreen("Search"),
  About: makeScreen("About"),
  // this is only used for the lock tests
  Extra: makeScreen("Extra")
};

export function render(component) {
  const container = Object.assign(_render(component), {
    navigate(action, screen, runAllTimers = true) {
      const rendered = container.queryAllByA11yHint(/[A-Z][a-z]+ Screen/);
      if (!rendered.length) {
        throw Error("No screens were found");
      }
      const queries = getQueriesForElement(rendered[rendered.length - 1]);
      if (screen) {
        fireEvent.changeText(
          queries.getByPlaceholderText("screen action"),
          screen
        );
      }
      fireEvent.press(queries.queryByText(action));
      fireEvent.changeText(queries.getByPlaceholderText("screen action"), "");

      if (runAllTimers) {
        jest.runAllTimers();
      }
    },
    queryScreen(name) {
      return container.queryByA11yHint(`${name} Screen`);
    },
    queryAllScreens() {
      return container.queryAllByA11yHint(/[A-Z][a-z]+ Screen/);
    }
  });
  return container;
}
