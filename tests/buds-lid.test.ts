import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createBudsLid } from "../lib/buds-lid";

test("opening and closing the actual Buds model moves only the lid, never the earbuds", async () => {
  const bytes = await readFile(
    new URL("../public/models/galaxy-buds4-pro-black.glb", import.meta.url),
  );
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  const control = createBudsLid(gltf.scene);
  const lid = control.scene.getObjectByName("LidPivot")!;
  const buds = ["Earbud_L", "Earbud_R"].map(
    (name) => control.scene.getObjectByName(name)!,
  );
  control.scene.updateMatrixWorld(true);
  const seated = buds.map((bud) => bud.matrixWorld.toArray());
  assert.ok(Math.abs(lid.rotation.x) < 0.0001);
  for (let frame = 0; frame < 180; frame++) {
    control.update(true, 1 / 60, false);
    control.scene.updateMatrixWorld(true);
    buds.forEach((bud, index) =>
      assert.deepEqual(bud.matrixWorld.toArray(), seated[index]),
    );
  }
  assert.ok(Math.abs(lid.rotation.x + (105 * Math.PI) / 180) < 0.001);
  assert.ok(
    Math.abs(gltf.scene.getObjectByName("LidPivot")!.rotation.x) < 0.0001,
    "cached model remains untouched",
  );
  control.update(false, 1 / 60, false);
  assert.ok(lid.rotation.x > (-105 * Math.PI) / 180);
  control.update(true, 1 / 60, false);
  control.update(false, 1 / 60, true);
  assert.equal(lid.rotation.x, 0, "reduced motion closes immediately");
  assert.equal(
    control.update(false, 1 / 60, false),
    false,
    "settled model stops requesting frames",
  );
});
