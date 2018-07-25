/** @flow */

import React from "react";
import { Switch, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Navigator from "@geekie/navigator";
import type { NavigatorActions } from "@geekie/navigator";

let COLOR = 0;
const colors = ["#fff", "#00f", "#0f0", "#f00", "#ff0", "#f0f", "#0ff"];

type OptionsConfig = {|
  animated: boolean,
  setAnimated(boolean): void
|};

// prettier-ignore
const Options = React.createContext/*::<OptionsConfig>*/({
  animated: true,
  setAnimated() {}
});

function Component(props: {
  navigator: NavigatorActions,
  color: number,
  screens: number,
  stacks: number
}) {
  return (
    <Options.Consumer>
      {({ setAnimated, ...options }) => (
        <View
          style={[
            styles.container,
            { backgroundColor: colors[props.color % 7] }
          ]}
        >
          <View
            style={[styles.bordered, { alignItems: "center", padding: 10 }]}
          >
            <Text>Stacks: {props.stacks}</Text>
            <Text>Screens: {props.screens}</Text>
            <View style={styles.switch}>
              <Text>Animated?</Text>
              <Switch
                value={options.animated}
                onValueChange={setAnimated}
                style={{ transform: [{ scaleX: 0.65 }, { scaleY: 0.65 }] }}
              />
            </View>
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.bordered]}
              onPress={() =>
                props.navigator.push(
                  {
                    screen: "Component",
                    props: {
                      stacks: props.stacks,
                      screens: props.screens + 1,
                      color: COLOR++
                    }
                  },
                  options
                )
              }
            >
              <Text>push()</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.bordered]}
              onPress={() => props.navigator.pop(options)}
            >
              <Text>pop()</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.bordered]}
              onPress={() =>
                props.navigator.present(
                  {
                    screen: "Component",
                    props: {
                      stacks: props.stacks + 1,
                      screens: 1,
                      color: COLOR++
                    }
                  },
                  options
                )
              }
            >
              <Text>present()</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.bordered]}
              onPress={() => props.navigator.dismiss(options)}
            >
              <Text>dismiss()</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.bordered]}
              onPress={() =>
                props.navigator.replace(
                  {
                    screen: "Component",
                    props: {
                      stacks: props.stacks,
                      screens: props.screens,
                      color: COLOR++
                    }
                  },
                  options
                )
              }
            >
              <Text>replace()</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.bordered]}
              onPress={() =>
                props.navigator.reset(
                  {
                    screen: "Component",
                    props: {
                      stacks: props.stacks,
                      screens: 1,
                      color: COLOR++
                    }
                  },
                  options
                )
              }
            >
              <Text>reset()</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Options.Consumer>
  );
}

export default class App extends React.Component<empty, OptionsConfig> {
  state = {
    animated: true,
    setAnimated: (animated: boolean) => this.setState({ animated })
  };

  render() {
    return (
      <Options.Provider value={this.state}>
        <View style={{ backgroundColor: "#000", flex: 1 }}>
          <Navigator
            screensConfig={{ Component }}
            initial={[
              [
                {
                  screen: "Component",
                  props: {
                    stacks: 1,
                    screens: 1,
                    color: COLOR++
                  }
                }
              ]
            ]}
          />
        </View>
      </Options.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-evenly"
  },
  buttons: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    alignContent: "space-between",
    justifyContent: "space-evenly",
    flexWrap: "wrap"
  },
  switch: {
    flexDirection: "row",
    alignItems: "center"
  },
  bordered: {
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1
  },
  button: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    marginVertical: 10,
    width: 100
  }
});
