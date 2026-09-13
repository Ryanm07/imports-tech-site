import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Box3, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

test("Nitro export fits the desk, keeps its base planted when opened, and stays within its download budget", async () => {
  const path = new URL(
    "../public/models/acer-nitro5-an515-54.glb",
    import.meta.url,
  );
  assert.ok(existsSync(path), "the Blender notebook export must exist");
  const bytes = await readFile(path);
  assert.ok(
    bytes.byteLength < 900_000,
    "detailed notebook must remain below 900 KB",
  );
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  const scene = gltf.scene;
  const base = scene.getObjectByName("NitroBase");
  const lid = scene.getObjectByName("LidPivot");
  assert.ok(
    base && lid,
    "the physical base and hinged display must be separate",
  );
  const closed = new Box3().setFromObject(scene);
  const size = closed.getSize(new Vector3());
  assert.ok(Math.abs(size.x - 0.3634) < 0.003);
  assert.ok(Math.abs(size.z - 0.255) < 0.004);
  assert.ok(size.y < 0.029 && closed.min.y >= -0.0005);
  scene.updateMatrixWorld(true);
  const planted = base.matrixWorld.toArray();
  lid.rotation.x = (-112 * Math.PI) / 180;
  scene.updateMatrixWorld(true);
  assert.deepEqual(
    base.matrixWorld.toArray(),
    planted,
    "opening must not move the keyboard/base",
  );
  const open = new Box3().setFromObject(lid);
  assert.ok(open.max.y > 0.22, "the screen must rise above the keyboard");
  assert.ok(
    open.min.y >= 0.018,
    "the hinge must not push the screen through the desk",
  );
  let triangles = 0;
  let draws = 0;
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    triangles +=
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3;
    draws += Math.max(1, object.geometry.groups.length);
  });
  assert.ok(triangles <= 25_000, `triangle budget exceeded: ${triangles}`);
  assert.ok(draws <= 24, `draw budget exceeded: ${draws}`);
});
