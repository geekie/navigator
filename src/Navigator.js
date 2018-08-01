/** @flow */

"use strict";

import * as React from "react";
import { Animated, BackHandler, StyleSheet } from "react-native";
import { animations, key, transition } from "./util";

type StackActions = {|
  present(route: Route, options?: NavigatorActionOptions): void,
  dismiss(options?: NavigatorActionOptions): void
|};
export type NavigatorActions = {|
  ...StackActions,
  push(route: Route, options?: NavigatorActionOptions): void,
  pushReset(route: Route, options?: NavigatorActionOptions): void,
  pop(options?: NavigatorActionOptions): void,
  popTo(screen: string, options?: NavigatorActionOptions): void,
  replace(route: Route, options?: NavigatorActionOptions): void,
  reset(route: Route, options?: NavigatorActionOptions): void
|};

type NavigatorActionOptions = {|
  animated: boolean
|};

type NavigatorScreensConfig = {
  [string]: React.ComponentType<*>
};

type Route = {| screen: string, props: Object |};
type RouteStack = {| routes: Array<Route> |};

let lock = false;

function wrap<F: Function>(fn: F): F {
  // $FlowFixMe
  return function() {
    if (!lock) {
      fn.apply(null, arguments);
    }
  };
}

type NavigatorProps = {|
  initial: Route | Array<Array<Route>>,
  screensConfig: NavigatorScreensConfig
|};

export default class Navigator extends React.Component<
  NavigatorProps,
  {|
    stacks: Array<RouteStack>,
    value: Animated.Value
  |}
> {
  _actions: StackActions = {
    present: wrap(this.present.bind(this)),
    dismiss: wrap(this.dismiss.bind(this))
  };
  _rendered: WeakMap<RouteStack, React.Element<any>> = new WeakMap();
  _unsubscribe: () => void;

  constructor(props: NavigatorProps) {
    super(props);

    let stacks: Array<Array<Route>> = Array.isArray(props.initial)
      ? props.initial
      : [[props.initial]];

    this.state = {
      stacks: stacks.map(routes => ({ routes })),
      value: new Animated.Value(stacks.length - 1)
    };
  }

  present(routes: Route | Array<Route>, options?: NavigatorActionOptions) {
    if (!Array.isArray(routes)) {
      routes = [routes];
    }
    let { stacks, value } = this.state;
    lock = true;
    (stacks = stacks.slice()).push({ routes });
    this.setState({ stacks }, () => {
      transition(value, stacks.length - 1, options?.animated, () => {
        lock = false;
      });
    });
  }

  dismiss(options?: NavigatorActionOptions) {
    let { stacks, value } = this.state;
    if (stacks.length === 1) {
      return;
    }
    lock = true;
    transition(value, stacks.length - 2, options?.animated, () => {
      this.setState({ stacks: stacks.slice(0, -1) }, () => {
        lock = false;
      });
    });
  }

  componentDidMount() {
    this._unsubscribe = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (this.state.stacks.length > 1) {
          this.dismiss();
          return true;
        }
      }
    );
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  render() {
    let { stacks, value } = this.state;
    return stacks.map((stack, i) => {
      let rendered = this._rendered.get(stack);
      if (!rendered || i === stacks.length - 1) {
        let style = animations.vertical(value, i);
        rendered = (
          <Animated.View key={key(stack)} style={[styles.base, style]}>
            <StackNavigator
              initial={stack.routes}
              screensConfig={this.props.screensConfig}
              actions={this._actions}
            />
          </Animated.View>
        );
        this._rendered.set(stack, rendered);
      }
      return rendered;
    });
  }
}

type StackNavigatorProps = {|
  actions: StackActions,
  initial: Array<Route>,
  screensConfig: NavigatorScreensConfig
|};

class StackNavigator extends React.Component<
  StackNavigatorProps,
  {|
    routes: Array<Route>,
    value: Animated.Value
  |}
> {
  _actions: NavigatorActions = {
    ...this.props.actions,
    push: wrap(this.push.bind(this)),
    pushReset: wrap(this.pushReset.bind(this)),
    pop: wrap(this.pop.bind(this)),
    popTo: wrap(this.popTo.bind(this)),
    replace: wrap(this.replace.bind(this)),
    reset: wrap(this.reset.bind(this))
  };
  _rendered: WeakMap<Route, React.Element<any>> = new WeakMap();
  _unsubscribe: () => void;

  constructor(props: StackNavigatorProps) {
    super(props);

    this.state = {
      routes: props.initial,
      value: new Animated.Value(props.initial.length - 1)
    };
  }

  _pushRoute(route: Route, animated?: boolean, callback: () => void) {
    let routes = this.state.routes.slice();
    routes.push(route);
    this.setState({ routes }, () => {
      transition(this.state.value, routes.length - 1, animated, () => {
        callback();
      });
    });
  }

  _popRoute(animated?: boolean, callback: () => void) {
    let { routes, value } = this.state;
    routes = routes.slice(0, -1);
    transition(value, routes.length - 1, animated, () => {
      this.setState({ routes }, () => {
        callback();
      });
    });
  }

  _setRoutes(routes: Array<Route>, callback: () => void) {
    this.setState({ routes }, () => {
      this.state.value.setValue(routes.length - 1);
      callback();
    });
  }

  push(route: Route, options?: NavigatorActionOptions) {
    lock = true;
    this._pushRoute(route, options?.animated, () => {
      lock = false;
    });
  }

  pushReset(route: Route, options?: NavigatorActionOptions) {
    lock = true;
    this._pushRoute(route, options?.animated, () => {
      this._setRoutes([route], () => {
        lock = false;
      });
    });
  }

  pop(options?: NavigatorActionOptions) {
    let { routes } = this.state;
    if (routes.length === 1) {
      this.props.actions.dismiss();
      return;
    }
    lock = true;
    this._popRoute(options?.animated, () => {
      lock = false;
    });
  }

  popTo(screen: string, options?: NavigatorActionOptions) {
    let { routes } = this.state;
    let index = routes.findIndex(route => route.screen === screen);
    if (routes.length === 1 || index === -1) {
      return;
    }
    let curr = routes[routes.length - 1];
    (routes = routes.slice(0, index + 1)).push(curr);
    lock = true;
    this._setRoutes(routes, () => {
      this._popRoute(options?.animated, () => {
        lock = false;
      });
    });
  }

  replace(route: Route, options?: NavigatorActionOptions) {
    let { routes } = this.state;
    (routes = routes.slice(0, -1)).push(route);
    lock = true;
    this._pushRoute(route, options?.animated, () => {
      this._setRoutes(routes, () => {
        lock = false;
      });
    });
  }

  reset(route: Route, options?: NavigatorActionOptions) {
    let { routes } = this.state;
    lock = true;
    this._setRoutes([route, routes[routes.length - 1]], () => {
      this._popRoute(options?.animated, () => {
        lock = false;
      });
    });
  }

  componentDidMount() {
    this._unsubscribe = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (this.state.routes.length > 1) {
          this.pop();
          return true;
        }
      }
    );
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  render() {
    let { routes, value } = this.state;
    return routes.map((route, i) => {
      let rendered = this._rendered.get(route);
      if (!rendered || i === routes.length - 1) {
        let Component = this.props.screensConfig[route.screen];
        let style = animations.horizontal(value, i);
        rendered = (
          <Animated.View key={key(route)} style={[styles.base, style]}>
            <Component {...route.props} navigator={this._actions} />
          </Animated.View>
        );
        this._rendered.set(route, rendered);
      }
      return rendered;
    });
  }
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  }
});
