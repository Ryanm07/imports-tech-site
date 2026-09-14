import assert from "node:assert/strict";
import test from "node:test";
import { Box3, Light, Mesh, MeshStandardMaterial, Vector3 } from "three";
import {
  createLightweightRecordingRig,
  createLightweightS25,
  disposeRecordingGeometry,
} from "../lib/recording-lightweight";

function inspectBudget(root: ReturnType<typeof createLightweightRecordingRig>) {
  let triangles = 0;
  let draws = 0;
  root.traverse((object) => {
    assert.ok(
      !(object instanceof Light),
      "fallback adds no dynamic light pass",
    );
    if (!(object instanceof Mesh)) return;
    draws++;
    triangles +=
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      assert.ok(material instanceof MeshStandardMaterial);
      assert.equal(material.map, null, "no fallback texture downloads");
      assert.equal(material.normalMap, null);
      assert.equal(material.emissiveMap, null);
    }
  });
  return { triangles, draws };
}

test("the economy recording stand puts the light at standing height and all three feet on the floor", () => {
  const rig = createLightweightRecordingRig();
  const bounds = new Box3().setFromObject(rig);
  assert.ok(bounds.min.y >= -0.0001 && bounds.min.y < 0.002);
  assert.ok(bounds.max.y > 1.75 && bounds.max.y < 1.8);
  const size = bounds.getSize(new Vector3());
  assert.ok(
    size.x > 0.65 && size.x < 1.0,
    "legs provide a floor-stand footprint",
  );
  assert.ok(size.z > 0.6 && size.z < 1.0);
  const feet = rig.children.filter((child) =>
    child.name.startsWith("StandFoot"),
  );
  assert.equal(feet.length, 3);
  for (const foot of feet) {
    const box = new Box3().setFromObject(foot);
    assert.ok(box.min.y >= -0.0001 && box.min.y < 0.002);
  }
  const frame = rig.getObjectByName("U200Frame");
  assert.ok(frame);
  const frameBox = new Box3().setFromObject(frame);
  assert.ok(Math.abs(frameBox.min.y - 1.43) < 0.001);
  assert.ok(Math.abs(frameBox.max.y - 1.76) < 0.001);
  assert.ok(Math.abs(frameBox.getSize(new Vector3()).x - 0.435) < 0.001);
});

test("the economy ring has a separately controllable, initially unlit front diffuser", () => {
  const rig = createLightweightRecordingRig();
  let diffuser: Mesh | undefined;
  rig.traverse((object) => {
    if (
      object instanceof Mesh &&
      object.material instanceof MeshStandardMaterial &&
      object.material.name === "U200_Diffuser"
    )
      diffuser = object;
  });
  assert.ok(diffuser, "light controller can find the exact diffuser material");
  const material = diffuser.material as MeshStandardMaterial;
  assert.equal(material.emissiveIntensity, 0);
  assert.ok(material.emissive.r > 0.5);
  assert.ok(material.emissive.r >= material.emissive.b, "warm white light");
  assert.ok(
    new Box3().setFromObject(diffuser).min.z > 0,
    "light faces the subject",
  );
  const { triangles, draws } = inspectBudget(rig);
  assert.ok(
    triangles < 4500,
    `${triangles} triangles exceed the economy budget`,
  );
  assert.ok(draws <= 18, `${draws} draws exceed the economy budget`);
});

test("the economy S25 retains physical proportions and puts the rear cameras opposite its screen", () => {
  const phone = createLightweightS25();
  const bounds = new Box3().setFromObject(phone);
  const size = bounds.getSize(new Vector3());
  assert.ok(Math.abs(size.x - 0.0776) < 0.001);
  assert.ok(Math.abs(size.y - 0.1628) < 0.001);
  assert.ok(size.z >= 0.0082 && size.z < 0.012);
  assert.ok(Math.abs(bounds.getCenter(new Vector3()).y) < 0.0001);
  const screen = phone.getObjectByName("S25Screen");
  const lenses = phone.getObjectByName("S25RearLenses");
  assert.ok(screen && lenses);
  assert.ok(new Box3().setFromObject(screen).max.z < 0);
  assert.ok(new Box3().setFromObject(lenses).min.z > 0);
  const { triangles, draws } = inspectBudget(phone);
  assert.ok(
    triangles < 1500,
    `${triangles} triangles exceed the economy budget`,
  );
  assert.ok(draws <= 12, `${draws} draws exceed the economy budget`);
});

test("unmounting a recording fallback releases each generated resource exactly once", () => {
  const rig = createLightweightRecordingRig();
  const disposed = new Map<object, number>();
  rig.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    for (const resource of [
      object.geometry,
      ...(Array.isArray(object.material) ? object.material : [object.material]),
    ]) {
      if (disposed.has(resource)) continue;
      disposed.set(resource, 0);
      resource.addEventListener("dispose", () => {
        disposed.set(resource, (disposed.get(resource) ?? 0) + 1);
      });
    }
  });
  disposeRecordingGeometry(rig);
  assert.ok(disposed.size > 0);
  for (const count of disposed.values()) assert.equal(count, 1);
});
