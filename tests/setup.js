let warn = console.warn;

let messagesRegex = /^Animated: `useNativeDriver` is not supported because the native animated module is missing\.|^Calling \.setNativeProps\(\) in the test renderer environment is not supported/;

console.warn = function(message) {
  if (messagesRegex.test(message)) {
    return;
  }
  warn(message);
};
