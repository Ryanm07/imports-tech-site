import assert from "node:assert/strict";
import test from "node:test";
import { createStudioGestures } from "../lib/studio-gestures";

test("double click picks without opening information; a second double click throws", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const actions: string[] = [];
  let held = false;
  const gesture = createStudioGestures({
    isHolding: () => held,
    select: (id) => actions.push(`info:${id}`),
    pick: (id) => {
      held = true;
      actions.push(`pick:${id}`);
    },
    throw: () => {
      held = false;
      actions.push("throw");
    },
  });
  gesture.click("mouse");
  t.mock.timers.tick(140);
  gesture.click("mouse");
  t.mock.timers.tick(500);
  assert.deepEqual(actions, ["pick:mouse"]);
  gesture.click(null);
  t.mock.timers.tick(100);
  gesture.click(null);
  assert.deepEqual(actions, ["pick:mouse", "throw"]);
});

test("single click resolves information and cancelling a pending gesture prevents a late dialog", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const actions: string[] = [];
  const gesture = createStudioGestures({
    isHolding: () => false,
    select: (id) => actions.push(id),
    pick: () => {},
    throw: () => {},
  });
  gesture.click("keyboard");
  assert.deepEqual(actions, []);
  t.mock.timers.tick(500);
  assert.deepEqual(actions, ["keyboard"]);
  gesture.click("earbuds");
  gesture.cancel();
  t.mock.timers.tick(500);
  assert.deepEqual(actions, ["keyboard"]);
});

test("clicks on different objects never combine into a pick and touch selects immediately", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const actions: string[] = [];
  const gesture = createStudioGestures({
    isHolding: () => false,
    select: (id) => actions.push(id),
    pick: (id) => actions.push(`pick:${id}`),
    throw: () => {},
  });
  gesture.click("mouse");
  gesture.click("keyboard");
  t.mock.timers.tick(500);
  assert.deepEqual(actions, ["keyboard"]);
  gesture.click("earbuds", true);
  assert.deepEqual(actions, ["keyboard", "earbuds"]);
});
