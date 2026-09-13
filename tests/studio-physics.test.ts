import assert from "node:assert/strict";
import test from "node:test";
import { createStudioPhysics } from "../lib/studio-physics";
import type { StudioQuality } from "../lib/studio-quality";

function advance(
  world: ReturnType<typeof createStudioPhysics>,
  seconds: number,
  quality: StudioQuality = "medium",
  theme: "dark" | "light" = "dark",
) {
  for (let frame = 0; frame < seconds * 60; frame++) {
    world.step(1 / 60, quality, theme);
  }
}

test("picking follows the hand and dropping releases the same registered body", () => {
  const world = createStudioPhysics();
  const body = world.register({ id: "buds", home: [0, 1, -1], radius: 0.12 });
  assert.equal(world.pick("missing", "low"), false);
  assert.equal(world.pick("buds", "low"), true);
  world.setHeldPosition([0, 1.6, 1]);
  assert.deepEqual(body.position, [0, 1.6, 1]);
  assert.equal(body.state, "held");
  assert.equal(world.heldId, "buds");
  world.release(null, "low");
  assert.equal(world.heldId, null);
  assert.equal(body.state, "flying");
  advance(world, 4, "low");
  assert.equal(body.state, "resting");
  assert.equal(body.position[1], 0.12);
  assert.equal(world.get("buds"), body);
  const sleepingPosition = [...body.position];
  assert.equal(world.step(1 / 30, "low", "dark"), 0);
  assert.deepEqual(body.position, sleepingPosition);
});

test("a flat keyboard rests on its bottom surface instead of floating on its bounding sphere", () => {
  const world = createStudioPhysics();
  const body = world.register({
    id: "keyboard",
    home: [0, 1, 1],
    radius: 0.42,
    halfHeight: 0.04,
  });
  world.pick("keyboard", "basic");
  world.release(null, "basic");
  advance(world, 2, "basic");
  assert.ok(Math.abs(body.position[1] - 0.04) < 1e-8);
  world.pick("keyboard", "high");
  world.setHeldPosition([0, 1.5, -1.5]);
  world.release(null, "high");
  advance(world, 4, "high");
  assert.ok(Math.abs(body.position[1] - (0.8125 + 0.04)) < 1e-8);
});

test("economy throws never leave the studio even when looking over an open edge", () => {
  const world = createStudioPhysics();
  const body = world.register({ id: "buds", home: [0, 1, -1], radius: 0.12 });
  for (const direction of [
    [1, 1, 1],
    [-1, 0, -1],
    [0, -1, 1],
  ] as const) {
    world.pick("buds", "basic");
    world.setHeldPosition([3.25, 1.6, 3.2]);
    world.release(direction, "basic");
    for (let frame = 0; frame < 240; frame++) {
      world.step(1 / 60, "basic", "dark");
      assert.ok(body.position[0] >= -3.3 + body.radius);
      assert.ok(body.position[0] <= 3.3 - body.radius);
      assert.ok(body.position[2] >= -2.6 + body.radius);
      assert.ok(body.position[2] <= 3.3 - body.radius);
      assert.ok(body.position[1] >= body.radius);
    }
    assert.equal(body.state, "resting");
  }
});

test("downgrading quality restores oldest moving objects and retains the held one", () => {
  const world = createStudioPhysics();
  for (let index = 0; index < 8; index++) {
    const id = `item-${index}`;
    world.register({ id, home: [index * 0.2, 1, 0], radius: 0.08 });
    world.pick(id, "ultra");
    if (index < 7) world.release([0, 1, 1], "ultra");
  }
  assert.equal(world.activeCount, 8);
  world.step(1 / 60, "low", "dark");
  assert.equal(world.activeCount, 2);
  assert.equal(world.heldId, "item-7");
  assert.deepEqual(world.get("item-0")!.position, [0, 1, 0]);
  world.step(1 / 60, "basic", "dark");
  assert.equal(world.activeCount, 1);
  assert.equal(world.heldId, "item-7");
});

test("a paused quality change enforces economy limits without advancing the clock", () => {
  const world = createStudioPhysics();
  for (const id of ["one", "two", "three"]) {
    world.register({ id, home: [0, 1, 1], radius: 0.1 });
    world.pick(id, "ultra");
    world.setHeldPosition([5, 2, 4]);
    if (id !== "three") world.release([1, 0, 0], "ultra");
  }
  world.step(0, "basic", "dark");
  assert.equal(world.activeCount, 1);
  assert.equal(world.heldId, "three");
  assert.ok(world.get("three")!.position[0] <= 3.2);
});

test("economy clamps a surviving flight immediately while the quality panel is paused", () => {
  const world = createStudioPhysics();
  const body = world.register({ id: "buds", home: [0, 1, 0], radius: 0.1 });
  world.pick("buds", "ultra");
  world.setHeldPosition([5, 2, 4]);
  world.release([1, 0, 0], "ultra");
  assert.equal(world.step(0, "basic", "dark"), 0);
  assert.ok(body.position[0] <= 3.2 && body.position[2] <= 3.2);
  assert.deepEqual(body.previousPosition, body.position);
  const pausedPosition = [...body.position];
  assert.equal(world.step(0, "basic", "dark"), 0);
  assert.deepEqual(body.position, pausedPosition);
});

test("economy recovers captured equipment and clamps a returning object before resuming", () => {
  for (const theme of ["dark", "light"] as const) {
    const world = createStudioPhysics({ holePosition: [0, 3, 10] });
    const body = world.register({ id: "buds", home: [0, 1, 0], radius: 0.1 });
    world.pick("buds", "ultra");
    world.setHeldPosition([0, 3, 9.5]);
    world.release(null, "ultra");
    world.step(1 / 60, "ultra", "dark");
    assert.equal(body.state, "captured");
    if (theme === "light") world.step(0, "ultra", "light");
    world.step(0, "basic", theme);
    assert.notEqual(body.state, "captured");
    assert.ok(body.position[2] <= 3.2);
  }
});

test("economy contains equipment resting near an open edge without moving original decorations", () => {
  const world = createStudioPhysics();
  const body = world.register({ id: "buds", home: [0, 1, 0], radius: 0.1 });
  const decoration = world.register({
    id: "wall",
    home: [-3.3, 1.5, -1],
    radius: 0.2,
  });
  world.pick("buds", "low");
  world.setHeldPosition([3.45, 1, 0]);
  world.release(null, "low");
  advance(world, 4, "low");
  assert.equal(body.state, "resting");
  assert.ok(body.position[0] > 3.2);
  world.step(0, "basic", "dark");
  assert.ok(body.position[0] <= 3.2);
  assert.deepEqual(decoration.position, [-3.3, 1.5, -1]);
});

test("returning to economy starts its arc from the current flight instead of an old throw", () => {
  const world = createStudioPhysics();
  const body = world.register({ id: "buds", home: [0, 1, 0], radius: 0.1 });
  world.pick("buds", "basic");
  world.release([1, 0, 0], "basic");
  advance(world, 0.2, "basic");
  advance(world, 0.2, "high");
  const before = [...body.position];
  assert.equal(body.state, "flying");
  world.step(0, "basic", "dark");
  assert.deepEqual(body.position, before);
  world.step(1 / 20, "basic", "dark");
  assert.ok(
    body.position[0] >= before[0],
    "the new arc cannot jump behind the current flight",
  );
  assert.ok(
    Math.hypot(...body.position.map((value, axis) => value - before[axis])) <
      0.4,
  );
});

test("a white theme wakes captured objects even when the scene has no animation timer", () => {
  const world = createStudioPhysics({ holePosition: [0, 3, 10] });
  const body = world.register({ id: "one", home: [0, 1, 0], radius: 0.1 });
  world.pick("one", "low");
  world.setHeldPosition([0, 3, 9.5]);
  world.release(null, "low");
  world.step(1 / 30, "low", "dark");
  assert.equal(body.state, "captured");
  const position = [...body.position];
  world.step(0, "low", "light");
  assert.equal(body.state, "returning");
  assert.deepEqual(body.position, position);
});

test("a long resumed frame cannot cause an unbounded physics catch-up", () => {
  const setup = () => {
    const world = createStudioPhysics();
    world.register({ id: "item", home: [0, 1, 0], radius: 0.1 });
    world.pick("item", "ultra");
    world.release([0, 0.2, 1], "ultra");
    return world;
  };
  const resumed = setup();
  const regular = setup();
  const position = [...resumed.get("item")!.position];
  for (const delta of [0, -1, NaN, Infinity]) {
    assert.equal(resumed.step(delta, "ultra", "dark"), 0);
    assert.deepEqual(resumed.get("item")!.position, position);
  }
  assert.ok(resumed.step(120, "ultra", "dark") <= 6);
  regular.step(0.1, "ultra", "dark");
  assert.deepEqual(
    resumed.get("item")!.position,
    regular.get("item")!.position,
  );
  assert.ok(resumed.interpolationAlpha >= 0 && resumed.interpolationAlpha <= 1);
  assert.ok(Math.hypot(...resumed.get("item")!.velocity) <= 14.00001);
});

test("black hole captures a nearby thrown item and white returns it to its home", () => {
  const world = createStudioPhysics({ holePosition: [0, 3.4, 10] });
  const body = world.register({ id: "item", home: [0, 1, -1], radius: 0.1 });
  world.pick("item", "high");
  world.setHeldPosition([0, 3.4, 8.5]);
  world.release([0, 0, 1], "high");
  advance(world, 1, "high", "dark");
  assert.equal(body.state, "captured");
  assert.equal(world.activeCount, 0);
  const captured = [...body.position];
  advance(world, 1, "high", "dark");
  assert.deepEqual(body.position, captured);
  world.step(1 / 60, "high", "light");
  assert.equal(body.state, "returning");
  assert.ok(Math.hypot(...body.velocity) <= 14.00001);
  advance(world, 8, "high", "light");
  assert.equal(body.state, "resting");
  assert.deepEqual(body.position, [0, 1, -1]);
});

test("white hole repels a nearby object while dark hole draws it closer", () => {
  const setup = () => {
    const world = createStudioPhysics({ holePosition: [0, 3.4, 10] });
    world.register({ id: "item", home: [0, 1, 0], radius: 0.1 });
    world.pick("item", "medium");
    world.setHeldPosition([0, 3.4, 7.5]);
    world.release(null, "medium");
    return world;
  };
  const dark = setup();
  const light = setup();
  advance(dark, 0.25, "medium", "dark");
  advance(light, 0.25, "medium", "light");
  assert.ok(dark.get("item")!.position[2] > 7.5);
  assert.ok(light.get("item")!.position[2] < 7.5);
});

test("a throw aimed from the front entrance reaches the relocated black hole", () => {
  const world = createStudioPhysics({ holePosition: [4, 3.4, 12] });
  const body = world.register({ id: "item", home: [0, 1, -1], radius: 0.1 });
  world.pick("item", "high");
  world.setHeldPosition([1.82, 1.62, 2.3]);
  world.release([4 - 1.82, 3.4 - 1.62, 12 - 2.3], "high");
  advance(world, 6, "high", "dark");
  assert.equal(body.state, "captured");
});

test("high quality resolves contact between two moving object proxies", () => {
  const world = createStudioPhysics();
  const left = world.register({ id: "left", home: [-0.3, 2, 1], radius: 0.2 });
  const right = world.register({ id: "right", home: [0.3, 2, 1], radius: 0.2 });
  world.pick("left", "high");
  world.release([1, 0, 0], "high");
  world.pick("right", "high");
  world.release([-1, 0, 0], "high");
  for (let frame = 0; frame < 8; frame++) {
    world.step(1 / 60, "high", "dark");
    assert.ok(right.position[0] > left.position[0]);
    assert.ok(right.position[0] - left.position[0] >= 0.3999);
  }
});

test("higher qualities allow an open-edge throw and recover objects lost in space", () => {
  const world = createStudioPhysics();
  const body = world.register({ id: "item", home: [0, 1, 0], radius: 0.1 });
  world.pick("item", "low");
  world.setHeldPosition([3, 1.4, 2]);
  world.release([1, 0, 0], "low");
  advance(world, 0.5, "low");
  assert.ok(body.position[0] > 3.3);
  advance(world, 14, "low");
  assert.equal(body.state, "resting");
  assert.deepEqual(body.position, [0, 1, 0]);
});

test("fast small objects do not pass through each other between physics steps", () => {
  const world = createStudioPhysics();
  const left = world.register({
    id: "left",
    home: [-0.08, 2, 1],
    radius: 0.03,
  });
  const right = world.register({
    id: "right",
    home: [0.08, 2, 1],
    radius: 0.03,
  });
  world.pick("left", "high");
  world.release([1, 0, 0], "high");
  world.pick("right", "high");
  world.release([-1, 0, 0], "high");
  world.step(1 / 60, "high", "dark");
  assert.ok(left.position[0] < right.position[0]);
  assert.ok(left.velocity[0] < 0 && right.velocity[0] > 0);
});

test("simple swept supports catch a fast downward throw on the desk", () => {
  const world = createStudioPhysics();
  const body = world.register({
    id: "item",
    home: [0, 1.5, -1.5],
    radius: 0.1,
  });
  world.pick("item", "medium");
  world.release([0, -1, 0], "medium");
  for (let frame = 0; frame < 180; frame++) {
    world.step(1 / 60, "medium", "dark");
    assert.ok(body.position[1] >= 0.8125 + body.radius - 0.00001);
  }
  assert.equal(body.state, "resting");
});

test("repeated restore reuses registered bodies and unregister clears a held item", () => {
  const world = createStudioPhysics();
  const body = world.register({ id: "buds", home: [0.5, 1, -1], radius: 0.12 });
  const bodies = world.bodies;
  const position = body.position;
  for (let cycle = 0; cycle < 30; cycle++) {
    world.pick("buds", "high");
    world.setHeldPosition([0, 1.5, 2]);
    world.release([0, 0.2, 1], "high");
    advance(world, 0.2, "high");
    world.restore();
    assert.equal(world.bodies, bodies);
    assert.equal(body.position, position);
    assert.deepEqual(body.position, [0.5, 1, -1]);
    assert.equal(world.activeCount, 0);
    assert.equal(world.heldId, null);
  }
  world.pick("buds", "high");
  world.unregister("buds");
  assert.equal(world.heldId, null);
  assert.equal(world.activeCount, 0);
  assert.equal(world.bodies.length, 0);
});
