/** @flow */

import * as React from "React";
import hoistNonReactStatics from "hoist-non-react-statics";
import type { NavigatorActions } from "./Navigator.js.flow";

const {
  Provider,
  Consumer
}: React.Context<NavigatorActions | void> = React.createContext();

export function withNavigator<Props: {}>(
  Component: React.ComponentType<Props>
): React.ComponentType<$Diff<Props, { navigator: NavigatorActions | void }>> {
  class WithNavigator extends React.Component<Props> {
    static displayName = `WithNavigator(${Component.displayName ||
      Component.name})`;

    render() {
      return (
        <Consumer>
          {navigator => {
            if (__DEV__ && !navigator) {
              console.warn(
                "`withNavigation` can only be used when rendered by the `Navigator`. " +
                  "Unable to access the `navigator` prop."
              );
            }
            return <Component navigator={navigator} {...this.props} />;
          }}
        </Consumer>
      );
    }
  }
  return hoistNonReactStatics(WithNavigator, Component);
}

export class NavigatorProvider extends React.Component<{
  navigator: NavigatorActions,
  children: React.Node
}> {
  render() {
    return (
      <Provider value={this.props.navigator}>{this.props.children}</Provider>
    );
  }
}
