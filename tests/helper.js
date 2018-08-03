import React from "react";
import renderer from "react-test-renderer";
import Navigator from "../src/Navigator";

function Foo() {
  return "Foo";
}

function Bar() {
  return "Bar";
}

function Baz() {
  return "Baz";
}

function Spam() {
  return "Spam";
}

let mounted = new Set();

export function clean() {
  for (let _mounted of mounted) {
    _mounted.unmount();
  }
  mounted.clear();
}

export function render(props) {
  let testRenderer = renderer.create(
    <Navigator screensConfig={{ Foo, Bar, Baz, Spam }} {...props} />
  );
  mounted.add(testRenderer);

  function find() {
    return testRenderer.root.findAll(
      node =>
        node.type === Foo ||
        node.type === Bar ||
        node.type === Baz ||
        node.type === Spam
    );
  }

  function last(arr) {
    return arr[arr.length - 1];
  }

  return {
    navigator() {
      return last(find()).props.navigator;
    },
    toJSON() {
      return testRenderer.toJSON();
    }
  };
}
