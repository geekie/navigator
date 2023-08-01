/** @flow */

import React from "react";
import {
  Switch as RNSwitch,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Navigator, { withNavigator } from "@geekie/navigator";
import type { NavigatorActions, NavigatorState } from "@geekie/navigator";

let COLOR = 0;
const colors = ["#fff", "#00f", "#0f0", "#f00", "#ff0", "#f0f", "#0ff"];

const { Provider, Consumer } = React.createContext({});

function Button(props) {
  return (
    <TouchableOpacity
      style={[styles.button, styles.bordered]}
      onPress={props.onPress}
    >
      <Text>{props.label}</Text>
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

function ActionButtons(props: {
  navigator: NavigatorActions,
  stacks: number,
  screens: number
}) {
  return (
    <Consumer>
      {({ animated }) => (
        <View style={styles.buttons}>
          <Button
            label="push()"
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
            label="pop()"
            onPress={() => props.navigator.pop({ animated })}
          />
          <Button
            label="present()"
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
            label="dismiss()"
            onPress={() => props.navigator.dismiss({ animated })}
          />
          <Button
            label="dismissAll()"
            onPress={() => props.navigator.dismissAll({ animated })}
          />
          <Button
            label="replace()"
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
            label="reset()"
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
      )}
    </Consumer>
  );
}

const ActionButtonsWithNavigator = withNavigator(ActionButtons);

function Component(props: {
  navigator: NavigatorActions,
  color: number,
  screens: number,
  stacks: number
}) {
  return (
    <Consumer>
      {ctx => (
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
              value={ctx.animated}
              onValueChange={ctx.setAnimated}
            />
            <Switch
              label="Use HOC"
              value={ctx.useHOC}
              onValueChange={ctx.setUseHOC}
            />
          </View>
          <Button
            label="Reset everything"
            onPress={() =>
              ctx.resetState([
                [
                  {
                    screen: "Component",
                    props: {
                      stacks: 999,
                      screens: 999,
                      color: 123
                    }
                  }
                ]
              ])
            }
          />
          {ctx.useHOC ? (
            <ActionButtonsWithNavigator
              stacks={props.stacks}
              screens={props.screens}
            />
          ) : (
            <ActionButtons
              navigator={props.navigator}
              stacks={props.stacks}
              screens={props.screens}
            />
          )}
        </View>
      )}
    </Consumer>
  );
}

export default class App extends React.Component<
  empty,
  {|
    animated: boolean,
    useHOC: boolean,
    setAnimated(boolean): void,
    setUseHOC(boolean): void,
    resetState(NavigatorState): mixed
  |}
> {
  _reset = null;
  state = {
    animated: true,
    useHOC: false,
    setAnimated: (animated: boolean) => this.setState({ animated }),
    setUseHOC: (useHOC: boolean) => this.setState({ useHOC }),
    resetState: (state: NavigatorState) => this._reset && this._reset(state)
  };

  render() {
    return (
      <Provider value={this.state}>
        <View style={{ backgroundColor: "#000", flex: 1 }}>
          <Navigator
            screensConfig={{ Component }}
            initialState={[
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
            onWillFocus={route => {
              console.log(route, "will focus");
            }}
            resetState={reset => (this._reset = reset)}
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
