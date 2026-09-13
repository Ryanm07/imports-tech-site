import assert from "node:assert/strict";
import test from "node:test";
import { Box3, Mesh } from "three";
import { createBudsLid } from "../lib/buds-lid";
import * as lightweight from "../lib/buds-lightweight";

test("the lightweight Buds keeps the case and both earbuds within a small geometry budget", () => {
  assert.equal(typeof lightweight.createLightweightBuds, "function");
  const scene = lightweight.createLightweightBuds();
  let triangles = 0;
  let meshes = 0;
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    meshes += 1;
    triangles +=
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      assert.equal(
        "transmission" in material,
        false,
        "economy materials do not need a transmission render pass",
      );
    }
  });
  assert.ok(triangles < 2000, `${triangles} triangles should stay below 2000`);
  assert.ok(meshes <= 12, `${meshes} meshes should stay below the draw budget`);
  assert.ok(scene.getObjectByName("Earbud_L"));
  assert.ok(scene.getObjectByName("Earbud_R"));
  const bounds = new Box3().setFromObject(scene);
  assert.ok(
    bounds.max.x - bounds.min.x < 0.07,
    "the lightweight case matches the detailed model scale",
  );
  assert.ok(bounds.max.y - bounds.min.y < 0.04);
});

test("opening the lightweight lid never lifts the earbuds and closing becomes idle", () => {
  assert.equal(typeof lightweight.createLightweightBuds, "function");
  const control = createBudsLid(lightweight.createLightweightBuds());
  const lid = control.scene.getObjectByName("LidPivot")!;
  const buds = ["Earbud_L", "Earbud_R"].map(
    (name) => control.scene.getObjectByName(name)!,
  );
  control.scene.updateMatrixWorld(true);
  const seated = buds.map((bud) => bud.matrixWorld.toArray());
  for (let frame = 0; frame < 180; frame++) control.update(true, 1 / 60, false);
  control.scene.updateMatrixWorld(true);
  assert.ok(lid.rotation.x < -1.8, "the hinge opens fully");
  buds.forEach((bud, index) =>
    assert.deepEqual(bud.matrixWorld.toArray(), seated[index]),
  );
  control.update(false, 0, true);
  assert.equal(lid.rotation.x, 0);
  assert.equal(control.update(false, 1 / 60, false), false);
});
