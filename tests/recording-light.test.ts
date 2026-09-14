import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { createRecordingLight } from "../lib/recording-light";

function fixture() {
  const source = new Group();
  const diffuser = new MeshStandardMaterial({
    emissive: "#ffdda0",
    emissiveIntensity: 0,
  });
  diffuser.name = "U200_Diffuser";
  for (let i = 0; i < 4; i++)
    source.add(new Mesh(new BoxGeometry(1, 1, 1), diffuser));
  return { source, diffuser };
}

test("the actual off-state Blender export emits warm light when switched on", async () => {
  const bytes = await readFile(
    new URL("../public/models/ulanzi-u200.glb", import.meta.url),
  );
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  const control = createRecordingLight(gltf.scene);
  control.update(true, 0, true);
  let found = false;
  control.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (material.name !== "U200_Diffuser") continue;
      found = true;
      assert.ok(
        (material as MeshStandardMaterial).emissive.r > 0.5,
        "off-state export must regain its emission color",
      );
      assert.equal((material as MeshStandardMaterial).emissiveIntensity, 3);
    }
  });
  assert.ok(found);
});

test("switching the ring light isolates the cached asset and shares a single diffuser material", () => {
  const { source, diffuser } = fixture();
  const on = createRecordingLight(source);
  const off = createRecordingLight(source);
  on.update(true, 0, true);
  const first = (on.scene.children[0] as Mesh).material as MeshStandardMaterial;
  assert.ok(first.emissiveIntensity >= 2);
  assert.notEqual(first, diffuser);
  assert.equal(diffuser.emissiveIntensity, 0);
  assert.equal(
    ((off.scene.children[0] as Mesh).material as MeshStandardMaterial)
      .emissiveIntensity,
    0,
  );
  for (const child of on.scene.children)
    assert.equal((child as Mesh).material, first);
  assert.equal(
    (on.scene.children[0] as Mesh).geometry,
    (source.children[0] as Mesh).geometry,
  );
});

test("light reverses smoothly, settles without idle frames, and respects reduced motion", () => {
  const control = createRecordingLight(fixture().source);
  const material = (control.scene.children[0] as Mesh)
    .material as MeshStandardMaterial;
  assert.equal(control.update(false, 1 / 60, false), false);
  assert.equal(control.update(true, 1 / 60, false), true);
  const partial = material.emissiveIntensity;
  assert.ok(partial > 0 && partial < 3);
  control.update(false, 1 / 60, false);
  assert.ok(material.emissiveIntensity < partial);
  for (let i = 0; i < 120; i++) control.update(true, 1 / 60, false);
  assert.equal(control.update(true, 1 / 60, false), false);
  assert.equal(control.update(false, 0, true), false);
  assert.equal(material.emissiveIntensity, 0);
});

test("disposing an instance leaves the loader's geometry and materials usable", () => {
  const { source, diffuser } = fixture();
  const control = createRecordingLight(source);
  let originalDisposed = false;
  let instanceDisposals = 0;
  diffuser.addEventListener("dispose", () => {
    originalDisposed = true;
  });
  (source.children[0] as Mesh).geometry.addEventListener("dispose", () => {
    originalDisposed = true;
  });
  const material = (control.scene.children[0] as Mesh)
    .material as MeshStandardMaterial;
  material.addEventListener("dispose", () => {
    instanceDisposals++;
  });
  control.dispose();
  assert.equal(instanceDisposals, 1);
  assert.equal(originalDisposed, false);
});
