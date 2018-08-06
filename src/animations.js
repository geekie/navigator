/** @flow */

import { Animated, Dimensions } from "react-native";

const SCREEN_WIDTH: number = Dimensions.get("window").width;
const SCREEN_HEIGHT: number = Dimensions.get("window").height;

export function horizontal(position: Animated.Value, index: number) {
  const opacity = position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [1, 1, 0.3]
  });

  const scale = position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [1, 1, 0.95]
  });

  const translateX = position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [SCREEN_WIDTH, 0, -SCREEN_WIDTH * 0.3]
  });

  return {
    opacity,
    transform: [{ translateX }, { scale }]
  };
}

export function vertical(position: Animated.Value, index: number) {
  const opacity = position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [1, 1, 0.3]
  });

  const scale = position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [1, 1, 0.95]
  });

  const translateY = position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [SCREEN_HEIGHT, 0, 0]
  });

  return {
    opacity,
    transform: [{ translateY }, { scale }]
  };
}
