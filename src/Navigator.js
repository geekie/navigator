/** @flow */

"use strict";

import * as React from "react";
import { Animated, BackHandler, StyleSheet } from "react-native";
import update from "immer";
import { animations, transition } from "./util";

export type NavigatorActions = {|
  push(route: Route, options?: NavigatorActionOptions): void,
  pop(options?: NavigatorActionOptions): void,
  popTo(screen: string, options?: NavigatorActionOptions): void,
  replace(route: Route, options?: NavigatorActionOptions): void,
  reset(route: Route, options?: NavigatorActionOptions): void,
  pushReset(route: Route, options?: NavigatorActionOptions): void,
  present(route: Route, options?: NavigatorActionOptions): void,
  dismiss(options?: NavigatorActionOptions): void
|};

type NavigatorActionOptions = {|
  animated: boolean
|};

type NavigatorScreensConfig = {
  [string]: React.ComponentType<*>
};

export type NavigatorState = Array<Array<Route>>;

type Route = {| screen: string, props?: Object |};
type InternalRoute = {| key: string, ...Route |};
type RouteStack = {|
  key: string,
  value: Animated.Value,
  routes: Array<InternalRoute>
|};

let lock = false;

function wrap<F: Function>(fn: F): F {
  // $FlowFixMe
  return function() {
    if (!lock) {
      fn.apply(null, arguments);
    }
  };
}

function last<T>(arr: Array<T>): T {
  return arr[arr.length - 1];
}

let uid = 0;
function makeStack(routes: Route | Array<Route>): RouteStack {
  routes = Array.isArray(routes) ? routes : [routes];
  return {
    key: "stack_" + uid++,
    routes: routes.map(makeRoute),
    value: new Animated.Value(routes.length - 1)
  };
}
function makeRoute(route: Route) {
  return { ...route, key: "screen_" + uid++ };
}

type Props = {|
  initialState: Route | NavigatorState,
  screensConfig: NavigatorScreensConfig,
  resetState?: ((state: NavigatorState) => void) => mixed,
  onWillFocus?: (route: Route) => mixed
|};
type State = {|
  stacks: Array<RouteStack>
|};

export default class Navigator extends React.Component<Props, State> {
  _actions: NavigatorActions = {
    push: wrap(this.push.bind(this)),
    pop: wrap(this.pop.bind(this)),
    popTo: wrap(this.popTo.bind(this)),
    replace: wrap(this.replace.bind(this)),
    reset: wrap(this.reset.bind(this)),
    pushReset: wrap(this.pushReset.bind(this)),
    present: wrap(this.present.bind(this)),
    dismiss: wrap(this.dismiss.bind(this))
  };
  _subscription: ?{ remove(): void };
  _yValue: Animated.Value;

  constructor(props: Props) {
    super(props);

    let stacks: NavigatorState = Array.isArray(props.initialState)
      ? props.initialState
      : [[props.initialState]];

    this.state = {
      stacks: stacks.map(makeStack)
    };
    this._yValue = new Animated.Value(stacks.length - 1);

    this._willFocus(last(last(stacks)));
  }

  _willFocus(route: Route | InternalRoute) {
    let { screen, props } = route;
    let { onWillFocus } = this.props;
    onWillFocus?.({ screen, props });
  }

  _pushRoute(route: InternalRoute, animated?: boolean, callback: () => void) {
    this.setState(
      update(function({ stacks }: State): void {
        last(stacks).routes.push(route);
      }),
      () => {
        let { value, routes } = last(this.state.stacks);
        transition(value, routes.length - 1, animated, () => {
          callback();
        });
      }
    );
  }

  _popRoutes(n: number, animated?: boolean, callback: () => void) {
    this.setState(
      update(function({ stacks }: State): void {
        last(stacks).routes.splice(-n, n - 1);
      }),
      () => {
        let { value, routes } = last(this.state.stacks);
        value.setValue(routes.length - 1);
        transition(value, routes.length - 2, animated, () => {
          this.setState(
            update(function({ stacks }: State): void {
              last(stacks).routes.pop();
            }),
            () => {
              callback();
            }
          );
        });
      }
    );
  }

  _setStackRoutes(
    modify: (Array<InternalRoute>) => Array<InternalRoute> | void,
    callback: () => void
  ) {
    this.setState(
      update(function({ stacks }: State): void {
        let stack = last(stacks);
        let routes = modify(stack.routes);
        if (routes) {
          stack.routes = routes;
        }
      }),
      () => {
        let { value, routes } = last(this.state.stacks);
        value.setValue(routes.length - 1);
        callback();
      }
    );
  }

  push(route: Route, options?: NavigatorActionOptions) {
    lock = true;
    this._willFocus(route);
    this._pushRoute(makeRoute(route), options?.animated, () => {
      lock = false;
    });
  }

  pop(options?: NavigatorActionOptions) {
    const { routes } = last(this.state.stacks);
    if (routes.length === 1) {
      this.dismiss(options);
      return;
    }

    this._willFocus(routes[routes.length - 2]);
    lock = true;
    this._popRoutes(1, options?.animated, () => {
      lock = false;
    });
  }

  popTo(screen: string, options?: NavigatorActionOptions) {
    let { routes } = last(this.state.stacks);
    let index = routes.findIndex(route => route.screen === screen);
    if (routes.length === 1 || index === -1) {
      return;
    }

    lock = true;
    this._willFocus(routes[index]);
    this._popRoutes(routes.length - index - 1, options?.animated, () => {
      lock = false;
    });
  }

  replace(route: Route, options?: NavigatorActionOptions) {
    lock = true;
    this._willFocus(route);
    let _route = makeRoute(route);
    this._pushRoute(_route, options?.animated, () => {
      this._setStackRoutes(
        routes => {
          routes.splice(-2, 1);
        },
        () => {
          lock = false;
        }
      );
    });
  }

  /**
   * Resets the current stack with the new route, with an animation
   * from the left
   */
  reset(route: Route, options?: NavigatorActionOptions) {
    lock = true;
    this._setStackRoutes(
      routes => [makeRoute(route), routes[routes.length - 1]],
      () => {
        this._popRoutes(1, options?.animated, () => {
          lock = false;
        });
      }
    );
  }

  /**
   * Resets the current stack with the new screen, with an animation
   * from the right
   */
  pushReset(route: Route, options?: NavigatorActionOptions) {
    lock = true;
    let _route = makeRoute(route);
    this._pushRoute(_route, options?.animated, () => {
      this._setStackRoutes(
        () => [_route],
        () => {
          lock = false;
        }
      );
    });
  }

  present(routes: Route | Array<Route>, options?: NavigatorActionOptions) {
    lock = true;
    this._willFocus(Array.isArray(routes) ? last(routes) : routes);
    this.setState(
      update(function({ stacks }: State): void {
        stacks.push(makeStack(routes));
      }),
      () => {
        transition(
          this._yValue,
          this.state.stacks.length - 1,
          options?.animated,
          () => {
            lock = false;
          }
        );
      }
    );
  }

  dismiss(options?: NavigatorActionOptions) {
    let { stacks } = this.state;
    if (stacks.length === 1) {
      return;
    }
    lock = true;
    this._willFocus(last(stacks[stacks.length - 2].routes));
    transition(this._yValue, stacks.length - 2, options?.animated, () => {
      this.setState({ stacks: stacks.slice(0, -1) }, () => {
        lock = false;
      });
    });
  }

  componentDidMount() {
    this._subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        let { stacks } = this.state;
        if (stacks.length > 1 || last(stacks).routes.length > 1) {
          this.pop();
          return true;
        }
      }
    );
    // $FlowFixMe
    this.props.resetState?.(state => {
      this.setState({ stacks: state.map(makeStack) }, () => {
        this._yValue.setValue(state.length - 1);
        lock = false;
      });
    });
  }

  componentWillUnmount() {
    // $FlowFixMe
    this._subscription?.remove();
  }

  render() {
    let { stacks } = this.state;
    return stacks.map((stack, i) => {
      let style = animations.vertical(this._yValue, i);
      return (
        <Animated.View key={stack.key} style={[styles.base, style]}>
          {stack.routes.map((route, j) => {
            let Component = this.props.screensConfig[route.screen];
            let style = animations.horizontal(stack.value, j);
            return (
              <Animated.View key={route.key} style={[styles.base, style]}>
                <Component navigator={this._actions} {...route.props} />
              </Animated.View>
            );
          })}
        </Animated.View>
      );
    });
  }
}
//
//

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
