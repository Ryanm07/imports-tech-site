import assert from "node:assert/strict";
import test from "node:test";
import {
  assessFrameWindow,
  lowerStudioQuality,
  selectStudioQuality,
} from "../lib/studio-quality";

test("initial quality stays conservative unless both hardware signals support high quality", () => {
  assert.equal(selectStudioQuality({}), "medium");
  assert.equal(selectStudioQuality({ cores: 16 }), "medium");
  assert.equal(selectStudioQuality({ memoryGB: 16 }), "medium");
  assert.equal(selectStudioQuality({ cores: 8, memoryGB: 8 }), "high");
  assert.equal(selectStudioQuality({ cores: 6, memoryGB: 8 }), "medium");
  assert.equal(selectStudioQuality({ cores: 16, memoryGB: 6 }), "medium");
});

test("the weakest valid hardware signal limits quality", () => {
  assert.equal(selectStudioQuality({ cores: 4, memoryGB: 16 }), "low");
  assert.equal(selectStudioQuality({ cores: 16, memoryGB: 4 }), "low");
  assert.equal(selectStudioQuality({ cores: 2, memoryGB: 16 }), "basic");
  assert.equal(selectStudioQuality({ cores: 16, memoryGB: 2 }), "basic");
  assert.equal(selectStudioQuality({ memoryGB: 0.5 }), "basic");
});

test("unavailable or invalid hardware data does not masquerade as constrained hardware", () => {
  for (const invalid of [0, -1, NaN, Infinity]) {
    assert.equal(
      selectStudioQuality({ cores: invalid, memoryGB: 16 }),
      "medium",
    );
    assert.equal(
      selectStudioQuality({ cores: 16, memoryGB: invalid }),
      "medium",
    );
  }
  assert.equal(selectStudioQuality({ cores: 1.5, memoryGB: 16 }), "medium");
});

test("data saving and slow connections cap even powerful devices without raising low tiers", () => {
  const powerful = { cores: 16, memoryGB: 16 };
  assert.equal(selectStudioQuality({ ...powerful, saveData: true }), "basic");
  for (const effectiveType of ["slow-2g", "2g"]) {
    assert.equal(selectStudioQuality({ ...powerful, effectiveType }), "basic");
  }
  assert.equal(
    selectStudioQuality({ ...powerful, effectiveType: "3g" }),
    "low",
  );
  assert.equal(
    selectStudioQuality({ ...powerful, effectiveType: "4g" }),
    "high",
  );
  assert.equal(
    selectStudioQuality({ ...powerful, effectiveType: "unknown" }),
    "high",
  );
  assert.equal(selectStudioQuality({ cores: 2, effectiveType: "3g" }), "basic");
});

test("quality reduction takes exactly one step and stops at the basic fallback", () => {
  assert.equal(lowerStudioQuality("high"), "medium");
  assert.equal(lowerStudioQuality("medium"), "low");
  assert.equal(lowerStudioQuality("low"), "basic");
  assert.equal(lowerStudioQuality("basic"), "basic");
});

test("healthy animation and isolated frame spikes keep the current quality", () => {
  assert.equal(assessFrameWindow("high", Array(48).fill(34), 30), "high");
  assert.equal(
    assessFrameWindow("high", [...Array(47).fill(34), 200], 30),
    "high",
  );
  assert.equal(assessFrameWindow("low", Array(48).fill(16), 30), "low");
});

test("sustained slow rendering reduces quality by only one level", () => {
  assert.equal(assessFrameWindow("high", Array(48).fill(55), 30), "medium");
  assert.equal(assessFrameWindow("medium", Array(48).fill(70), 24), "low");
  assert.equal(assessFrameWindow("low", Array(48).fill(100), 30), "basic");
  assert.equal(assessFrameWindow("basic", Array(48).fill(100), 30), "basic");
});

test("repeated long frames trigger reduction even with a healthy median", () => {
  assert.equal(
    assessFrameWindow(
      "high",
      [...Array(42).fill(34), ...Array(6).fill(80)],
      30,
    ),
    "medium",
  );
});

test("short windows, invalid intervals, and idle gaps cannot cause a false downgrade", () => {
  const shortWindow = Array(47).fill(80);
  assert.equal(assessFrameWindow("high", shortWindow, 30), "high");
  assert.equal(
    assessFrameWindow(
      "high",
      [...shortWindow, 0, -1, NaN, Infinity, 251, 1000],
      30,
    ),
    "high",
  );
  assert.equal(
    assessFrameWindow(
      "high",
      [...Array(48).fill(34), ...Array(100).fill(1000)],
      30,
    ),
    "high",
  );
  assert.equal(assessFrameWindow("high", Array(48).fill(250), 30), "medium");
});

test("inactive or invalid frame targets preserve quality", () => {
  for (const targetFps of [0, -1, NaN, Infinity]) {
    assert.equal(
      assessFrameWindow("low", Array(48).fill(100), targetFps),
      "low",
    );
  }
});

test("frame assessment does not reorder the caller's samples", () => {
  const frames = [...Array(24).fill(40), ...Array(24).fill(34)];
  const original = [...frames];
  assessFrameWindow("high", frames, 30);
  assert.deepEqual(frames, original);
});
