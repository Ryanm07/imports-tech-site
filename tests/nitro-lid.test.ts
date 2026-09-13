import assert from "node:assert/strict";
import test from "node:test";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { createNitroLid } from "../lib/nitro-lid";

function notebookFixture() {
  const source = new Group();
  const base = new Mesh(
    new BoxGeometry(0.3634, 0.02, 0.255),
    new MeshStandardMaterial(),
  );
  base.name = "NitroBase";
  base.position.y = 0.01;
  source.add(base);
  const hinge = new Group();
  hinge.name = "LidPivot";
  hinge.position.set(0, 0.022, -0.116);
  const screen = new Mesh(
    new BoxGeometry(0.345, 0.004, 0.225),
    new MeshStandardMaterial(),
  );
  screen.name = "Screen";
  screen.position.z = 0.1125;
  hinge.add(screen);
  source.add(hinge);
  return source;
}

test("opening the notebook raises its display while the base and cached source remain seated", () => {
  const source = notebookFixture();
  const control = createNitroLid(source);
  const base = control.scene.getObjectByName("NitroBase")!;
  const screen = control.scene.getObjectByName("Screen")!;
  control.scene.updateMatrixWorld(true);
  const seated = base.matrixWorld.toArray();
  for (let frame = 0; frame < 120; frame++) {
    control.update(true, 1 / 60, false);
    control.scene.updateMatrixWorld(true);
    assert.deepEqual(base.matrixWorld.toArray(), seated);
  }
  const displayCenter = screen.getWorldPosition(new Vector3());
  assert.ok(displayCenter.y > 0.12, "display rises above the keyboard");
  assert.ok(
    displayCenter.z < -0.15,
    "display tilts behind the hinge, not into the keys",
  );
  assert.equal(
    source.getObjectByName("LidPivot")!.rotation.x,
    0,
    "loader cache remains closed",
  );
  assert.equal(
    control.update(true, 1 / 60, false),
    false,
    "an open settled lid requests no frame",
  );
});

test("a click can reverse opening and reduced motion settles immediately without an idle render loop", () => {
  const control = createNitroLid(notebookFixture());
  const hinge = control.scene.getObjectByName("LidPivot")!;
  assert.equal(control.update(false, 1 / 60, false), false);
  assert.equal(control.update(true, 1 / 60, false), true);
  const opening = hinge.rotation.x;
  assert.ok(opening < 0 && opening > -1.9);
  control.update(false, 1 / 60, false);
  assert.ok(hinge.rotation.x > opening, "second click reverses toward closed");
  control.update(true, 0, true);
  assert.ok(Math.abs(hinge.rotation.x + 1.954768762) < 0.00001);
  assert.equal(control.update(false, 0, true), false);
  assert.equal(hinge.rotation.x, 0);
  assert.equal(control.update(false, 1 / 60, false), false);
});
