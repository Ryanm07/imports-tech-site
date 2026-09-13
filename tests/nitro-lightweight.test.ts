import assert from "node:assert/strict";
import test from "node:test";
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { createLightweightNitro } from "../lib/nitro-lightweight";
import { createNitroLid } from "../lib/nitro-lid";

test("the economy notebook fits its detailed replacement and stays inside the geometry and material budget", () => {
  const source = createLightweightNitro();
  const box = new Box3().setFromObject(source);
  const size = box.getSize(new Vector3());
  assert.ok(
    size.x > 0.36 && size.x < 0.365,
    "the replacement maintains the notebook width",
  );
  assert.ok(size.z > 0.25 && size.z < 0.26);
  assert.ok(
    box.min.y >= -0.0001 && box.min.y < 0.001,
    "feet rest on the tabletop",
  );
  assert.ok(size.y < 0.027, "closed notebook stays thin");
  let triangles = 0;
  let meshes = 0;
  source.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    meshes++;
    triangles +=
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      assert.ok(material instanceof MeshStandardMaterial);
      assert.equal(
        material.map,
        null,
        "the economy model needs no texture downloads",
      );
      assert.equal("transmission" in material, false);
    }
  });
  assert.ok(
    triangles < 2600,
    `${triangles} triangles exceed the lightweight budget`,
  );
  assert.ok(meshes <= 14, `${meshes} draws exceed the lightweight budget`);
  const control = createNitroLid(source);
  control.update(true, 0, true);
  const opened = new Box3().setFromObject(control.scene);
  assert.ok(
    opened.max.y > 0.22,
    "the economy model has a full-size hinged screen",
  );
  assert.ok(
    opened.min.y >= -0.0001,
    "opening the lid never moves the base below the desk",
  );
});
