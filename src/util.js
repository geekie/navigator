/** @flow */

import { Animated, Dimensions } from "react-native";

const SCREEN_WIDTH: number = Dimensions.get("window").width;
const SCREEN_HEIGHT: number = Dimensions.get("window").height;

export function transition(
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

function _opacity(position, index) {
  return position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [1, 1, 0.3]
  });
}

function _scale(position, index) {
  return position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [1, 1, 0.95]
  });
}

function _translateX(position, index) {
  return position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [SCREEN_WIDTH, 0, -SCREEN_WIDTH * 0.3]
  });
}

function _translateY(position, index) {
  return position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [SCREEN_HEIGHT, 0, 0]
  });
}

export const animations = {
  horizontal(position: Animated.Value, index: number) {
    return {
      opacity: _opacity(position, index),
      transform: [
        { translateX: _translateX(position, index) },
        { scale: _scale(position, index) }
      ]
    };
  },

  vertical(position: Animated.Value, index: number) {
    return {
      opacity: _opacity(position, index),
      transform: [
        { translateY: _translateY(position, index) },
        { scale: _scale(position, index) }
      ]
    };
  }
};
