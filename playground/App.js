/** @flow */

import React from "react";
import {
  Switch as RNSwitch,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Navigator from "@geekie/navigator";
import type { NavigatorActions } from "@geekie/navigator";

let COLOR = 0;
const colors = ["#fff", "#00f", "#0f0", "#f00", "#ff0", "#f0f", "#0ff"];

const { Provider, Consumer } = React.createContext({});

function Button(props) {
  return (
    <TouchableOpacity
      style={[styles.button, styles.bordered]}
      onPress={props.onPress}
    >
      <Text>{props.text}</Text>
    </TouchableOpacity>
  );
}

function Switch({ label, ...props }) {
  return (
    <View style={styles.switchContainer}>
      <Text>{label}:</Text>
      <RNSwitch style={styles.switch} {...props} />
    </View>
  );
}

function Component(props: {
  navigator: NavigatorActions,
  color: number,
  screens: number,
  stacks: number
}) {
  return (
    <Consumer>
      {({ setAnimated, animated }) => (
        <View
          style={[
            styles.container,
            { backgroundColor: colors[props.color % 7] }
          ]}
        >
          <View style={[styles.bordered, styles.info]}>
            <Text>Stacks: {props.stacks}</Text>
            <Text>Screens: {props.screens}</Text>
            <Switch
              label="Animated"
              value={animated}
              onValueChange={setAnimated}
            />
          </View>
          <View style={styles.buttons}>
            <Button
              text="push()"
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
                  { animated }
                )
              }
            />
            <Button
              text="pop()"
              onPress={() => props.navigator.pop({ animated })}
            />
            <Button
              text="present()"
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
                  { animated }
                )
              }
            />
            <Button
              text="dismiss()"
              onPress={() => props.navigator.dismiss({ animated })}
            />
            <Button
              text="replace()"
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
                  { animated }
                )
              }
            />
            <Button
              text="reset()"
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
                  { animated }
                )
              }
            />
          </View>
        </View>
      )}
    </Consumer>
  );
}

export default class App extends React.Component<
  empty,
  {| animated: boolean, setAnimated(boolean): void |}
> {
  state = {
    animated: true,
    setAnimated: (animated: boolean) => this.setState({ animated })
  };

  render() {
    return (
      <Provider value={this.state}>
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
      </Provider>
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
  info: {
    alignItems: "center",
    padding: 10
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  switch: {
    transform: [{ scaleX: 0.65 }, { scaleY: 0.65 }]
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
