import assert from "node:assert/strict";
import test from "node:test";
import {
  assessFrameWindow,
  canTryStudioUltra,
  qualifiesForStudioUltra,
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
  assert.equal(lowerStudioQuality("ultra"), "high");
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
  assert.equal(assessFrameWindow("ultra", Array(48).fill(36), 45), "high");
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

const ultraCandidate = {
  cores: 16,
  memoryGB: 8,
  finePointer: true,
  saveData: false,
  effectiveType: "4g",
  downlinkMbps: 8,
};

test("ultra trials require strong desktop hardware and a fast reported connection", () => {
  assert.equal(canTryStudioUltra(ultraCandidate), true);
  for (const constrained of [
    { cores: 15 },
    { memoryGB: 4 },
    { finePointer: false },
    { saveData: true },
    { effectiveType: "3g" },
    { downlinkMbps: 7.9 },
  ]) {
    assert.equal(
      canTryStudioUltra({ ...ultraCandidate, ...constrained }),
      false,
    );
  }
  assert.equal(selectStudioQuality(ultraCandidate), "high");
});

test("missing capability evidence cannot authorize an ultra trial", () => {
  assert.equal(canTryStudioUltra({}), false);
  for (const missing of [
    { cores: undefined },
    { memoryGB: undefined },
    { finePointer: undefined },
    { effectiveType: undefined },
    { downlinkMbps: undefined },
  ]) {
    assert.equal(canTryStudioUltra({ ...ultraCandidate, ...missing }), false);
  }
});

test("invalid numeric capabilities cannot authorize an ultra trial", () => {
  for (const invalid of [0, -1, NaN, Infinity]) {
    for (const field of ["cores", "memoryGB", "downlinkMbps"]) {
      assert.equal(
        canTryStudioUltra({ ...ultraCandidate, [field]: invalid }),
        false,
      );
    }
  }
  assert.equal(canTryStudioUltra({ ...ultraCandidate, cores: 16.5 }), false);
});

test("a full window of smooth 60 fps rendering qualifies for ultra", () => {
  assert.equal(qualifiesForStudioUltra(Array(90).fill(16.7)), true);
  const boundaryFrames = [...Array(10).fill(23), ...Array(80).fill(18.5)];
  const original = [...boundaryFrames];
  assert.equal(qualifiesForStudioUltra(boundaryFrames), true);
  assert.deepEqual(boundaryFrames, original);
  assert.equal(qualifiesForStudioUltra(Array(89).fill(16.7)), false);
  assert.equal(qualifiesForStudioUltra(Array(90).fill(18.6)), false);
  assert.equal(
    qualifiesForStudioUltra([...Array(80).fill(16.7), ...Array(10).fill(24)]),
    false,
  );
});

test("ultra promotion rejects stalls and invalid frames instead of filtering them away", () => {
  for (const unhealthy of [0, -1, NaN, Infinity, 100.1, 251, 1000]) {
    assert.equal(
      qualifiesForStudioUltra([...Array(90).fill(16.7), unhealthy]),
      false,
    );
  }
});

test("the regular performance monitor never promotes healthy tiers", () => {
  assert.equal(assessFrameWindow("high", Array(90).fill(16.7), 30), "high");
  assert.equal(assessFrameWindow("ultra", Array(90).fill(22.3), 45), "ultra");
});
