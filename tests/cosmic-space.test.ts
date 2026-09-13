import assert from "node:assert/strict";
import test from "node:test";
import { PerspectiveCamera, Vector3 } from "three";
import { HOLE_POSITION } from "../lib/cosmic-space";

test("the cosmic landmark is behind the entrance view and visible looking out of the open studio", () => {
  const camera = new PerspectiveCamera(43, 16 / 9, 0.1, 60);
  camera.position.set(6.3, 4.2, 7.6);
  camera.lookAt(0, 1, -0.12);
  camera.updateMatrixWorld();
  const hole = new Vector3(...HOLE_POSITION);
  assert.ok(
    hole.clone().applyMatrix4(camera.matrixWorldInverse).z > 0,
    "landmark should be behind the initial camera",
  );
  camera.position.set(1.82, 1.62, 2.3);
  camera.lookAt(0, 2.7, 10);
  camera.updateMatrixWorld();
  const projected = hole.clone().project(camera);
  assert.ok(
    Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z < 1,
  );
  camera.rotation.set(-0.14, 0.28 + Math.PI, 0, "YXZ");
  camera.updateMatrixWorld();
  assert.ok(
    hole.clone().project(camera).y < 0.65,
    "turning around should reveal the core without needing to look up",
  );
});
