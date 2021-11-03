import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";

const NavigatorContext = React.createContext();

export function withNavigator(Component) {
  class WithNavigator extends React.Component {
    static displayName = `WithNavigator(${Component.displayName ||
      Component.name})`;

    static contextType = NavigatorContext;

    render() {
      if (__DEV__ && !this.context) {
        console.warn(
          "`withNavigation` can only be used when rendered by the `Navigator`. " +
            "Unable to find the `navigator` object."
        );
      }
      return <Component navigator={this.context} {...this.props} />;
    }
  }
  return hoistNonReactStatics(WithNavigator, Component);
}

export function useNavigator() {
  const navigator = React.useContext(NavigatorContext);
  if (__DEV__ && !navigator) {
    console.warn(
      "`useNavigator` can only be used when rendered by the `Navigator`. " +
        "Unable to find the `navigator` object."
    );
  }
  return navigator;
}

export class NavigatorProvider extends React.Component {
  render() {
    return (
      <NavigatorContext.Provider value={this.props.navigator}>
        {this.props.children}
      </NavigatorContext.Provider>
    );
  }
}
