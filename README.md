# `@geekie/navigator`

[![npm](https://badgen.net/npm/v/@geekie/navigator)](https://npmjs.org/@geekie/navigator)
[![License](https://badgen.net/badge/license/MIT/blue)](LICENSE)
[![Travis](https://badgen.net/travis/geekie/navigator)](https://travis-ci.com/geekie/navigator)
[![Codecov](https://badgen.net/codecov/c/github/geekie/navigator)](https://codecov.io/gh/geekie/navigator)
[![Prettier](https://badgen.net/badge/code%20style/prettier/ff69b4)](https://github.com/prettier/prettier)

A minimal navigator library for React Native.

## About

We developed this navigator library at Geekie when developing our first React Native app and getting upset by the transitions of the (now deprecated) Navigator library that shipped with React Native. After evaluating some of the options, we decided that none had the APIs and transitions that would suit our needs.

### Features

- Screen transitions at 60 fps (uses the `Animated` API with the native driver option)
- Built-in support for Android's back button

### What's missing

- No headers (we use a custom header in the app, so we didn't need it)
- Different transitions based on platform (animations are built-in and can't be changed)
- Tab based navigation

## Install

This is a pure-JS library so there's no need to link/

```sh
yarn add @geekie/navigator
```

## Usage

The navigation with this library is built on the concept of "stacks", which are a stack of screens of the app. You can present a new stack and push screens onto it when dismissing it, the navigation state returns to the last screen pushed to the previous stack. Below there's an image as an example:

![Stacks chart](https://user-images.githubusercontent.com/1574588/43719589-7a22ba5c-9964-11e8-98b4-067ed320a203.png)

The blue arrows are pushing new screens to a stack, the green arrow is presenting a new stack with a screen on it, and the red arrow is dismissing a whole stack and coming to back to the state right before presenting the new stack.

With that clear we can check what the API looks like.

### `Navigator`

The library has a single default export which is the `Navigator` component that manages the current rendered screen. It accepts the following props:

- `screensConfig`: **(required)** an object like `{ "ScreenName": ScreenComponent }`. The key will be used to reference the screen in the navigator commands, and the navigator will use the component defined when rendering the screen.
- `initialState`: **(required)** the initial state of the navigator: an array of arrays of routes. A route is defined as an object with the keys: `screen` (the name defined in `screensConfig`) and `props` (optional), an object that will be passed to the rendered component.
- `resetState`: a function that will be called when the navigator is rendered, with another function that can reset the whole state programatically. See an example below.
- `onWillFocus`: a function that will be called right before a screen is focused.

The example below shows how you use those props and an example of how to implement deep linking using the `resetState` function.

```js
import Navigator from "@geekie/navigator";

import Home from "./screens/Home";
import Login from "./screens/Login";
import Profile from "./screens/Profile";
import About from "./screens/About";
import { getCurrentUser } from "./user";

const screensConfig = {
  Home: Home,
  Login: Login,
  Profile: Profile,
  About: About
};

class App extends React.Component {
  componentDidMount() {
    // Deep linking support
    Linking.addEventListener("url", event => {
      if (event.url.endsWith("/about")) {
        this.resetState([
          [{ screen: "Home" }],
          [{ screen: "Profile", props: { user: getCurrentUser() }, {screen: "About"} }]
        ]);
      }
    });
  }

  render() {
    return (
      <Navigator
        screensConfig={screensConfig}
        initialState={{ screen: "Home" }}
        onWillFocus={route => {
          console.log("Navigator will now focus the screen:", route);
        }}
        resetState={resetState => {
          this.resetState = resetState;
        }}
      />
    );
  }
}
```

The components rendered will receive a `navigator` prop that contains the commands to navigate through screens.

### `withNavigator(Component)`

`withNavigator` is a higher order component that injects the `navigator` prop to the wrapped `Component`. This is useful if you need it in a deeply nested component or you can't pass the prop from the screen component.

### `navigator.present(route)` or `navigator.present(routes)`

Presents a new stack: if the argument is an array, will use that as the stack; if not an array, it will be equivalent as calling `navigator.present([route])`.

The screen will be slide from the bottom.

### `navigator.dismiss()`

Removes the whole current stack and renders the last route of the previous stack.

The screen will slide to the bottom.

### `navigator.push(route)`

Pushes a new route (`{screen: "ScreenName", props: { }}`) to the current stack.

The screen will slide from the right.

### `navigator.pop()`

Returns to the previous route of the current stack. If there's a single route in the stack, the stack is dismissed (i.e. the same as calling `navigator.dismiss()`).

The screen will slide to the right.

### `navigator.replace(route)`

Replaces the current route but animates as `push()`. This is useful if you want to navigate to a new screen, but doesn't want the next screen to navigate "back" to it.

Example: `Home` -> push -> `Screen A` -> replace -> `Screen B` -> pop -> `Home`

### `navigator.reset(route)`

Resets the current stack to `[route]`.

The animation is the same as `pop()`.

### `navigator.pushReset(route)`

The same as `navigator.reset()` but the animation will be the same as `push()`.

## Credits

The animations were based on the (now deprecated) [React Native's Navigator](https://github.com/facebookarchive/react-native-custom-components/blob/master/src/NavigatorSceneConfigs.js).
