/** @flow */

import * as React from "react";
import { Animated, BackHandler, StyleSheet } from "react-native";
import produce from "immer";
import { NavigatorProvider } from "./Context";
import * as animations from "./animations";
import { last, lock, uid } from "./utils";

import typeof NavigatorComponent from "./Navigator.js.flow";
import type {
  NavigatorActions as Actions,
  NavigatorState,
  NavigatorRoute as Route
} from "./Navigator.js.flow";

type Options = {|
  animated: boolean
|};

type InternalRoute = {| key: string, ...Route |};
type RouteStack = {|
  key: string,
  value: Animated.Value,
  routes: Array<InternalRoute>
|};

function makeStack(routes: Route | Array<Route>): RouteStack {
  routes = Array.isArray(routes) ? routes : [routes];
  return {
    key: "stack_" + uid(),
    routes: routes.map(makeRoute),
    value: new Animated.Value(routes.length - 1)
  };
}

function makeRoute({ screen, props }: Route) {
  return {
    key: "screen_" + uid(),
    screen,
    props
  };
}

function transition(
  value: Animated.Value,
  toValue: number,
  animated: boolean | void,
  cb?: () => any
) {
  if (animated === false) {
    value.setValue(toValue);
    cb?.();
  } else {
    Animated.spring(value, {
      friction: 26,
      tension: 200,
      useNativeDriver: true,
      toValue
    }).start(() => {
      cb?.();
    });
  }
}

type Props = React.ElementConfig<NavigatorComponent>;
type State = $Exact<{
  stacks: Array<RouteStack>,
  value: Animated.Value
}>;

class Navigator extends React.Component<Props, State> {
  _actions: Actions = {
    push: this.push.bind(this),
    pop: this.pop.bind(this),
    popTo: this.popTo.bind(this),
    replace: this.replace.bind(this),
    reset: this.reset.bind(this),
    pushReset: this.pushReset.bind(this),
    present: this.present.bind(this),
    dismiss: this.dismiss.bind(this)
  };
  _subscription: ?{ remove(): void };

  constructor(props: Props) {
    super(props);

    let stacks: NavigatorState = Array.isArray(props.initialState)
      ? props.initialState
      : [[props.initialState]];

    this.state = {
      stacks: stacks.map(makeStack),
      value: new Animated.Value(stacks.length - 1)
    };

    this._willFocus(last(last(stacks)));
  }

  _willFocus({ screen, props }: Route | InternalRoute) {
    if (this.props.onWillFocus) {
      this.props.onWillFocus({ screen, props });
    }
  }

  _pushRoute(route: InternalRoute, animated?: boolean, callback: () => void) {
    this.setState(
      produce(function({ stacks }: State): void {
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
      produce(function({ stacks }: State): void {
        last(stacks).routes.splice(-n, n - 1);
      }),
      () => {
        let { value, routes } = last(this.state.stacks);
        value.setValue(routes.length - 1);
        transition(value, routes.length - 2, animated, () => {
          this.setState(
            produce(function({ stacks }: State): void {
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
    update: (Array<InternalRoute>) => Array<InternalRoute> | void,
    callback: () => void
  ) {
    this.setState(
      produce(function({ stacks }: State): void {
        let stack = last(stacks);
        let routes = update(stack.routes);
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

  push(route: Route, options?: Options) {
    if (lock.acquire()) {
      this._willFocus(route);
      this._pushRoute(makeRoute(route), options?.animated, () => {
        lock.release();
      });
    }
  }

  pop(options?: Options) {
    const { routes } = last(this.state.stacks);
    if (routes.length === 1) {
      this.dismiss(options);
      return;
    }

    if (lock.acquire()) {
      this._willFocus(routes[routes.length - 2]);
      this._popRoutes(1, options?.animated, () => {
        lock.release();
      });
    }
  }

  popTo(screen: string, options?: Options) {
    let { routes } = last(this.state.stacks);
    let index = routes.findIndex(route => route.screen === screen);
    if (routes.length === 1 || index === -1) {
      return;
    }

    if (lock.acquire()) {
      this._willFocus(routes[index]);
      this._popRoutes(routes.length - index - 1, options?.animated, () => {
        lock.release();
      });
    }
  }

  replace(route: Route, options?: Options) {
    if (!lock.acquire()) {
      return;
    }
    this._willFocus(route);
    this._pushRoute(makeRoute(route), options?.animated, () => {
      this._setStackRoutes(
        routes => {
          routes.splice(-2, 1);
        },
        () => {
          lock.release();
        }
      );
    });
  }

  /**
   * Resets the current stack with the new route, with an animation
   * from the left
   */
  reset(route: Route, options?: Options) {
    if (!lock.acquire()) {
      return;
    }
    this._willFocus(route);
    this._setStackRoutes(
      routes => [makeRoute(route), routes[routes.length - 1]],
      () => {
        this._popRoutes(1, options?.animated, () => {
          lock.release();
        });
      }
    );
  }

  /**
   * Resets the current stack with the new screen, with an animation
   * from the right
   */
  pushReset(route: Route, options?: Options) {
    if (!lock.acquire()) {
      return;
    }
    this._willFocus(route);
    this._pushRoute(makeRoute(route), options?.animated, () => {
      this._setStackRoutes(
        routes => [last(routes)],
        () => {
          lock.release();
        }
      );
    });
  }

  present(routes: Route | Array<Route>, options?: Options) {
    if (!lock.acquire()) {
      return;
    }
    this._willFocus(Array.isArray(routes) ? last(routes) : routes);
    this.setState(
      produce(function({ stacks }: State): void {
        stacks.push(makeStack(routes));
      }),
      () => {
        let { value, stacks } = this.state;
        transition(value, stacks.length - 1, options?.animated, () => {
          lock.release();
        });
      }
    );
  }

  dismiss(options?: Options) {
    let { stacks, value } = this.state;
    if (stacks.length === 1) {
      return;
    }

    if (lock.acquire()) {
      this._willFocus(last(stacks[stacks.length - 2].routes));
      transition(value, stacks.length - 2, options?.animated, () => {
        this.setState({ stacks: stacks.slice(0, -1) }, () => {
          lock.release();
        });
      });
    }
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

    if (this.props.resetState) {
      this.props.resetState(state => {
        this.setState({ stacks: state.map(makeStack) }, () => {
          this.state.value.setValue(state.length - 1);
          lock.release();
        });
      });
    }
  }

  componentWillUnmount() {
    if (this.props.resetState) {
      this.props.resetState(null);
    }

    if (this._subscription) {
      this._subscription.remove();
    }
  }

  render() {
    let { stacks, value } = this.state;
    let { screenStyle, screensConfig } = this.props;
    return (
      <NavigatorProvider navigator={this._actions}>
        {stacks.map((stack, i) => {
          let style = animations.vertical(value, i);
          return (
            <Animated.View key={stack.key} style={[styles.base, style]}>
              {stack.routes.map((route, j) => {
                let Component = screensConfig[route.screen];
                let style = animations.horizontal(stack.value, j);
                return (
                  <Animated.View
                    key={route.key}
                    style={[styles.base, style, screenStyle]}
                  >
                    <Component navigator={this._actions} {...route.props} />
                  </Animated.View>
                );
              })}
            </Animated.View>
          );
        })}
      </NavigatorProvider>
    );
  }
}

export default Navigator;
export * from "./Context";

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
