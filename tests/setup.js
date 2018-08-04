/* eslint-disable no-console */

let warn = console.warn;

console.warn = function(message) {
  if (
    message.startsWith(
      "Animated: `useNativeDriver` is not supported because the native animated module is missing."
    )
  ) {
    return;
  }
  warn(message);
};
