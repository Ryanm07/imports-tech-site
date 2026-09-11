import assert from "node:assert/strict";
import test from "node:test";
import {
  initialStudioState,
  studioReducer,
  walkStep,
  canStandAt,
  readStudioTheme,
} from "../lib/studio-navigation";

test("walking turns lights on and returning restores the presentation lighting", () => {
  const walking = studioReducer(initialStudioState, {
    type: "mode",
    mode: "walk",
  });
  assert.equal(walking.mode, "walk");
  assert.equal(walking.theme, "light");
  const inspecting = studioReducer(walking, { type: "select", id: "keyboard" });
  assert.equal(inspecting.selectedItem, "keyboard");
  const closed = studioReducer(inspecting, { type: "escape" });
  assert.equal(closed.selectedItem, null);
  assert.equal(closed.mode, "walk");
  const returned = studioReducer(closed, { type: "escape" });
  assert.equal(returned.mode, "overview");
  assert.equal(returned.theme, "dark");
});

test("a light presentation survives a walk with a manual lighting change", () => {
  let state = studioReducer(initialStudioState, {
    type: "theme",
    theme: "light",
  });
  state = studioReducer(state, { type: "mode", mode: "walk" });
  state = studioReducer(state, { type: "theme", theme: "dark" });
  state = studioReducer(state, { type: "mode", mode: "overview" });
  assert.equal(state.theme, "light");
});

test("walking cannot leave the room or enter furniture footprints", () => {
  assert.equal(canStandAt({ x: 3.4, z: 0 }), false);
  assert.equal(canStandAt({ x: 0, z: -1.5 }), false);
  assert.equal(canStandAt({ x: -2.6, z: -1.6 }), false);
  assert.equal(canStandAt({ x: 0, z: 2.5 }), true);
  let position = { x: 2.8, z: 2.5 };
  for (let i = 0; i < 100; i++) position = walkStep(position, 1, 0, 0.1);
  assert.ok(position.x <= 3.18, `wall crossed at ${position.x}`);
});

test("diagonal walking has the same speed as straight walking", () => {
  const straight = walkStep({ x: 0, z: 2.5 }, 1, 0, 0.05);
  const diagonal = walkStep({ x: 0, z: 2.5 }, 1, -1, 0.05);
  assert.ok(
    Math.abs(Math.hypot(diagonal.x, diagonal.z - 2.5) - straight.x) < 0.00001,
  );
  assert.ok(straight.x > 0);
});

test("a resumed frame cannot tunnel through the desk", () => {
  const position = walkStep({ x: 1, z: -0.55 }, 0, -1, 30);
  assert.ok(position.z > -0.72);
  assert.equal(canStandAt(position), true);
});

test("invalid movement and stored preferences cannot poison the camera or theme", () => {
  assert.deepEqual(walkStep({ x: 1, z: 2 }, Number.NaN, 0, 0.05), {
    x: 1,
    z: 2,
  });
  assert.deepEqual(walkStep({ x: 1, z: 2 }, 1, 0, -1), { x: 1, z: 2 });
  assert.equal(readStudioTheme("light"), "light");
  assert.equal(readStudioTheme("surprise"), "dark");
  assert.equal(readStudioTheme(null), "dark");
});
