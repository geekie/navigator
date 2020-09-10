import React from "react";
import { Animated, BackHandler, StyleSheet } from "react-native";
import produce from "immer";
import { NavigatorProvider } from "./Context";
import * as animations from "./animations";
import { last, uid } from "./utils";

function makeStack(routes) {
  if (!Array.isArray(routes)) {
    routes = [routes];
  }
  return {
    key: "stack_" + uid(),
    routes: routes.map(makeRoute),
    value: new Animated.Value(routes.length - 1)
  };
}

function makeRoute({ screen, props }) {
  return {
    key: "screen_" + uid(),
    screen,
    props
  };
}

function transition(value, toValue, animated, cb) {
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

class Navigator extends React.Component {
  _actions = {
    push: this.push.bind(this),
    pop: this.pop.bind(this),
    popTo: this.popTo.bind(this),
    replace: this.replace.bind(this),
    reset: this.reset.bind(this),
    pushReset: this.pushReset.bind(this),
    present: this.present.bind(this),
    dismiss: this.dismiss.bind(this),
    waitForPendingNavigations: this.waitForPendingNavigations.bind(this)
  };

  constructor(props) {
    super(props);

    let stacks = Array.isArray(props.initialState)
      ? props.initialState
      : [[props.initialState]];

    this.state = {
      stacks: stacks.map(makeStack),
      value: new Animated.Value(stacks.length - 1)
    };

    this._willFocus(last(last(stacks)));
  }

  acquireLock() {
    if (this._lockWaiter) {
      return false;
    } else {
      this._lockWaiter = {};
      this._lockWaiter.promise = new Promise(resolve => {
        this._lockWaiter.resolve = resolve;
      });

      return true;
    }
  }

  releaseLock() {
    const previousLockWaiter = this._lockWaiter;
    this._lockWaiter = null;

    if (previousLockWaiter) {
      previousLockWaiter.resolve();
    }
  }

  _willFocus({ screen, props }) {
    if (this.props.onWillFocus) {
      this.props.onWillFocus({ screen, props });
    }
  }

  _pushRoute(route, animated, callback) {
    this.setState(
      produce(function({ stacks }) {
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

  _popRoutes(n, animated, callback) {
    this.setState(
      produce(function({ stacks }) {
        last(stacks).routes.splice(-n, n - 1);
      }),
      () => {
        let { value, routes } = last(this.state.stacks);
        value.setValue(routes.length - 1);
        transition(value, routes.length - 2, animated, () => {
          this.setState(
            produce(function({ stacks }) {
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

  _setStackRoutes(update, callback) {
    this.setState(
      produce(function({ stacks }) {
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

  push(route, options) {
    if (this.acquireLock()) {
      this._willFocus(route);
      this._pushRoute(makeRoute(route), options?.animated, () => {
        this.releaseLock();
      });
    }
  }

  pop(options) {
    const { routes } = last(this.state.stacks);
    if (routes.length === 1) {
      this.dismiss(options);
      return;
    }

    if (this.acquireLock()) {
      this._willFocus(routes[routes.length - 2]);
      this._popRoutes(1, options?.animated, () => {
        this.releaseLock();
      });
    }
  }

  popTo(screen, options) {
    let { routes } = last(this.state.stacks);
    let index = routes.findIndex(route => route.screen === screen);
    if (routes.length === 1 || index === -1) {
      return;
    }

    if (this.acquireLock()) {
      this._willFocus(routes[index]);
      this._popRoutes(routes.length - index - 1, options?.animated, () => {
        this.releaseLock();
      });
    }
  }

  replace(route, options) {
    if (!this.acquireLock()) {
      return;
    }
    this._willFocus(route);
    this._pushRoute(makeRoute(route), options?.animated, () => {
      this._setStackRoutes(
        routes => {
          routes.splice(-2, 1);
        },
        () => {
          this.releaseLock();
        }
      );
    });
  }

  /**
   * Resets the current stack with the new route, with an animation
   * from the left
   */
  reset(route, options) {
    if (!this.acquireLock()) {
      return;
    }
    this._willFocus(route);
    this._setStackRoutes(
      routes => [makeRoute(route), routes[routes.length - 1]],
      () => {
        this._popRoutes(1, options?.animated, () => {
          this.releaseLock();
        });
      }
    );
  }

  /**
   * Resets the current stack with the new screen, with an animation
   * from the right
   */
  pushReset(route, options) {
    if (!this.acquireLock()) {
      return;
    }
    this._willFocus(route);
    this._pushRoute(makeRoute(route), options?.animated, () => {
      this._setStackRoutes(
        routes => [last(routes)],
        () => {
          this.releaseLock();
        }
      );
    });
  }

  present(routes, options) {
    if (!this.acquireLock()) {
      return;
    }
    this._willFocus(Array.isArray(routes) ? last(routes) : routes);
    this.setState(
      produce(function({ stacks }) {
        stacks.push(makeStack(routes));
      }),
      () => {
        let { value, stacks } = this.state;
        transition(value, stacks.length - 1, options?.animated, () => {
          this.releaseLock();
        });
      }
    );
  }

  dismiss(options) {
    let { stacks, value } = this.state;
    if (stacks.length === 1) {
      return;
    }

    if (this.acquireLock()) {
      this._willFocus(last(stacks[stacks.length - 2].routes));
      transition(value, stacks.length - 2, options?.animated, () => {
        this.setState({ stacks: stacks.slice(0, -1) }, () => {
          this.releaseLock();
        });
      });
    }
  }

  waitForPendingNavigations() {
    if (this._lockWaiter) {
      return this._lockWaiter.promise;
    } else {
      return Promise.resolve();
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
          this.releaseLock();
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
