import renderer from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { TimelineScheduler } from "../components/templates";
import { demoSchedulerData } from "../data/demo";

describe("TimelineScheduler component", () => {
  it("TimelineScheduler component renders correctly", () => {
    const component = renderer.create(
      <TimelineScheduler config={demoSchedulerData} />
    );

    const tree = component.toJSON();

    expect(tree).toMatchSnapshot();
  });

  it(" prop working", () => {
    const component = renderer.create(
      <TimelineScheduler config={demoSchedulerData} />
    );

    const tree = component.toJSON();

    expect(tree).toMatchSnapshot();
  });
});
