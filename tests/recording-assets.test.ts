import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Box3, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

async function loadAsset(name: string, budget: number) {
  const path = new URL(`../public/models/${name}.glb`, import.meta.url);
  assert.ok(existsSync(path), `the ${name} Blender export must exist`);
  const bytes = await readFile(path);
  assert.ok(bytes.byteLength < budget, `${name} exceeds its download budget`);
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  const json = JSON.parse(
    bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)),
  );
  assert.equal(json.scenes.length, 1, "only the active export scene may ship");
  assert.equal(json.cameras?.length ?? 0, 0);
  assert.equal(
    json.images?.length ?? 0,
    0,
    "these assets need no image downloads",
  );
  assert.equal(json.extensions?.KHR_lights_punctual?.lights?.length ?? 0, 0);
  assert.ok(json.buffers.every((buffer: { uri?: string }) => !buffer.uri));
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  let triangles = 0;
  let draws = 0;
  gltf.scene.traverse((object) => {
    assert.ok(!/^(Presentation|Softbox|ground)/i.test(object.name));
    if (!(object instanceof Mesh)) return;
    triangles +=
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3;
    draws += Math.max(1, object.geometry.groups.length);
  });
  return {
    ...gltf,
    triangles,
    draws,
    bounds: new Box3().setFromObject(gltf.scene, true),
  };
}

test("floor stand puts equipment at standing height with its three feet on the ground", async () => {
  const asset = await loadAsset("recording-floor-stand", 350_000);
  const stand = asset.scene.getObjectByName("RecordingFloorStand_Export");
  assert.ok(
    stand,
    "the floor stand must export independently from the ring and phone",
  );
  assert.equal(stand.userData.mount_height_m, 1.43);
  assert.ok(
    Math.abs(asset.bounds.min.y) < 0.001,
    "the stand must touch the floor",
  );
  assert.ok(asset.bounds.max.y >= 1.43 && asset.bounds.max.y <= 1.46);
  const size = asset.bounds.getSize(new Vector3());
  assert.ok(
    size.x >= 0.7 && size.x <= 0.92,
    "footprint must support the tall column",
  );
  assert.ok(size.z >= 0.6 && size.z <= 0.92);
  assert.ok(
    asset.triangles < 10_000,
    `stand triangle budget exceeded: ${asset.triangles}`,
  );
  assert.ok(asset.draws <= 10, `stand draw budget exceeded: ${asset.draws}`);
  assert.ok(!asset.scene.getObjectByName("UlanziU200_Export"));
  assert.ok(!asset.scene.getObjectByName("GalaxyS25Ultra_Export"));
});

test("ring and phone retain native dimensions for independent optimized placement", async () => {
  const ring = await loadAsset("ulanzi-u200", 550_000);
  const phone = await loadAsset("galaxy-s25-ultra", 250_000);
  assert.ok(ring.scene.getObjectByName("UlanziU200_Export"));
  assert.ok(phone.scene.getObjectByName("GalaxyS25Ultra_Export"));
  const ringSize = ring.bounds.getSize(new Vector3());
  assert.ok(Math.abs(ringSize.x - 0.295) < 0.003);
  assert.ok(Math.abs(ringSize.y - 0.227) < 0.003);
  assert.ok(Math.abs(ring.bounds.min.y) < 0.001);
  const phoneSize = phone.bounds.getSize(new Vector3());
  assert.ok(Math.abs(phoneSize.x - 0.0776) < 0.001);
  assert.ok(Math.abs(phoneSize.y - 0.1628) < 0.001);
  assert.ok(phoneSize.z > 0.008 && phoneSize.z < 0.012);
  assert.ok(ring.triangles < 12_000 && ring.draws <= 12);
  assert.ok(phone.triangles < 9_000 && phone.draws <= 22);
});
