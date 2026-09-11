import assert from "node:assert/strict";
import test from "node:test";
import { stepRoadSpring } from "../lib/journey-road";

test("estrada volta ao repouso depois que o cursor sai", () => {
  let spring = { offset: 48, velocity: 300 };
  for (let frame = 0; frame < 300; frame++)
    spring = stepRoadSpring(spring, 0, 1 / 60);
  assert(Math.abs(spring.offset) < 0.01);
  assert(Math.abs(spring.velocity) < 0.01);
});

test("gestos rápidos e retorno de uma aba não lançam a estrada para fora do percurso", () => {
  let spring = { offset: 0, velocity: 0 };
  for (let frame = 0; frame < 300; frame++) {
    spring = stepRoadSpring(spring, 1e9, frame === 100 ? 30 : 1 / 60);
    assert(Math.abs(spring.offset) <= 64);
    assert(Number.isFinite(spring.velocity));
  }
  assert.deepEqual(
    stepRoadSpring({ offset: NaN, velocity: Infinity }, NaN, NaN),
    { offset: 0, velocity: 0 },
  );
});
