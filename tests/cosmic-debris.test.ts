import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceCosmicDebris,
  createCosmicDebris,
  resetCosmicDebris,
} from "../lib/cosmic-debris";

const hole = [-2, 3.4, -9] as const;
const radius = 1.05;
const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test("debris layouts are deterministic and start assembled outside the studio", () => {
  const simulation = createCosmicDebris(hole, radius);
  assert.deepEqual(simulation, createCosmicDebris(hole, radius));
  assert.equal(simulation.bodies.length, 72);
  for (const body of simulation.bodies) {
    assert.deepEqual(body.position, body.origin);
    assert.deepEqual(body.rotation, [0, 0, 0]);
    assert.ok(body.origin[2] < -2.79);
    assert.ok(body.size.every((dimension) => dimension > 0));
  }
});

test("gravity launches pieces in stages and attracts them without crossing the room", () => {
  const simulation = createCosmicDebris(hole, radius);
  for (let frame = 0; frame < 180; frame++) {
    advanceCosmicDebris(simulation, "dark", 1 / 60);
  }
  const displaced = simulation.bodies.filter(
    (body) => distance(body.origin, body.position) > 0.1,
  );
  assert.ok(
    displaced.length > 0 && displaced.length < simulation.bodies.length,
  );
  for (const body of displaced) {
    assert.ok(distance(body.position, hole) < distance(body.origin, hole));
  }
  for (let frame = 0; frame < 3600; frame++) {
    advanceCosmicDebris(simulation, "dark", 1 / 60);
    for (const body of simulation.bodies) {
      assert.ok(body.position[2] < -2.79);
      assert.ok(Math.hypot(...body.velocity) <= 2.800001);
      assert.ok(body.position.every(Number.isFinite));
    }
  }
  assert.ok(simulation.bodies.every((body) => body.captured));
});

test("theme reversal retains positions and returns every captured piece to its exact origin", () => {
  const simulation = createCosmicDebris(hole, radius);
  for (let frame = 0; frame < 2400; frame++) {
    advanceCosmicDebris(simulation, "dark", 1 / 45);
  }
  const capturedPositions = simulation.bodies.map((body) => [...body.position]);
  advanceCosmicDebris(simulation, "light", 0);
  assert.deepEqual(
    simulation.bodies.map((body) => body.position),
    capturedPositions,
  );
  advanceCosmicDebris(simulation, "light", 1 / 45);
  simulation.bodies.forEach((body, index) => {
    assert.ok(distance(body.position, capturedPositions[index]) < 0.063);
  });
  for (let frame = 0; frame < 1500; frame++) {
    advanceCosmicDebris(simulation, "light", 1 / 45);
  }
  for (const body of simulation.bodies) {
    assert.deepEqual(body.position, body.origin);
    assert.deepEqual(body.velocity, [0, 0, 0]);
    assert.deepEqual(body.rotation, [0, 0, 0]);
    assert.equal(body.captured, false);
  }
});

test("a reversal mid-flight preserves velocity and cannot teleport a fragment", () => {
  const simulation = createCosmicDebris(hole, radius);
  for (let frame = 0; frame < 360; frame++) {
    advanceCosmicDebris(simulation, "dark", 1 / 60);
  }
  const before = simulation.bodies.map((body) => ({
    position: [...body.position],
    velocity: [...body.velocity],
  }));
  advanceCosmicDebris(simulation, "light", 0);
  simulation.bodies.forEach((body, index) => {
    assert.deepEqual(body.position, before[index].position);
    assert.deepEqual(body.velocity, before[index].velocity);
  });
  advanceCosmicDebris(simulation, "light", 1 / 60);
  simulation.bodies.forEach((body, index) => {
    assert.ok(distance(body.position, before[index].position) <= 2.8 / 60);
  });
});

test("invalid frame deltas do nothing and a long suspended frame is capped", () => {
  const simulation = createCosmicDebris(hole, radius);
  const initial = structuredClone(simulation);
  for (const delta of [0, -1, NaN, Infinity]) {
    advanceCosmicDebris(simulation, "dark", delta);
  }
  assert.deepEqual(simulation, initial);
  const regular = createCosmicDebris(hole, radius);
  advanceCosmicDebris(simulation, "dark", 120);
  advanceCosmicDebris(regular, "dark", 0.08);
  assert.deepEqual(simulation, regular);
});

test("reduced motion can reassemble the same bodies without allocating a new simulation", () => {
  const simulation = createCosmicDebris(hole, radius);
  const bodies = simulation.bodies;
  for (let frame = 0; frame < 360; frame++) {
    advanceCosmicDebris(simulation, "dark", 1 / 60);
  }
  resetCosmicDebris(simulation);
  assert.equal(simulation.bodies, bodies);
  for (const body of bodies) {
    assert.deepEqual(body.position, body.origin);
    assert.deepEqual(body.velocity, [0, 0, 0]);
    assert.deepEqual(body.rotation, [0, 0, 0]);
    assert.equal(body.captured, false);
  }
  assert.equal(simulation.darkTime, 0);
});
