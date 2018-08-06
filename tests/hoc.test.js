jest.mock("Animated", () =>
  Object.assign(require.requireActual("Animated"), {
    View: props => props.children
  })
);

import React from "react";
import renderer from "react-test-renderer";
import Navigator, { withNavigator } from "../src/Navigator";

function Foo() {
  return <FooChild />;
}

let FooChild = withNavigator(
  class FooChild extends React.Component {
    componentDidMount() {
      this.props.navigator.push({ screen: "Bar" });
    }

    render() {
      return "Foo";
    }
  }
);

let screensConfig = {
  Foo,
  FooChild,
  Bar: function() {
    return "Bar";
  }
};

describe("withNavigator HOC", () => {
  test("throws when outside of navigator hierarchy", () => {
    expect(() => renderer.create(<Foo />)).toThrowErrorMatchingSnapshot();
  });

  test("injects the navigator prop", () => {
    let tree = renderer.create(
      <Navigator
        screensConfig={screensConfig}
        initialState={{ screen: "Foo" }}
      />
    );

    expect(tree.toJSON()).toEqual(["Foo", "Bar"]);

    tree.unmount();
  });
});
