import {
  BoxGeometry,
  BufferGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function shell(width: number, depth: number, height: number, chamfer: number) {
  const x = width / 2,
    z = depth / 2;
  const shape = new Shape();
  shape.moveTo(-x + chamfer, -z);
  shape.lineTo(x - chamfer, -z);
  shape.lineTo(x, -z + chamfer);
  shape.lineTo(x, z - chamfer);
  shape.lineTo(x - chamfer, z);
  shape.lineTo(-x + chamfer, z);
  shape.lineTo(-x, z - chamfer);
  shape.lineTo(-x, -z + chamfer);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: height,
    steps: 1,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Meter-scale Nitro 5 silhouette with a numpad and red trim; no model or texture downloads. */
export function createLightweightNitro() {
  const scene = new Group();
  scene.name = "Nitro5Root";
  const base = new Group();
  base.name = "NitroBase";
  scene.add(base);
  const lid = new Group();
  lid.name = "LidPivot";
  lid.position.set(0, 0.022, -0.116);
  scene.add(lid);
  const graphite = new MeshStandardMaterial({
    color: "#242427",
    roughness: 0.48,
    metalness: 0.12,
  });
  const dark = new MeshStandardMaterial({ color: "#0d0e11", roughness: 0.85 });
  const red = new MeshStandardMaterial({
    color: "#a21325",
    roughness: 0.45,
    metalness: 0.15,
  });
  const keys = new MeshStandardMaterial({ color: "#191a1e", roughness: 0.66 });
  const display = new MeshStandardMaterial({
    color: "#263c45",
    emissive: "#244758",
    emissiveIntensity: 0.25,
    roughness: 0.28,
  });
  const accent = new MeshStandardMaterial({
    color: "#cb273b",
    emissive: "#801021",
    emissiveIntensity: 0.12,
    roughness: 0.5,
  });
  const batches = new Map<Group, Map<MeshStandardMaterial, BufferGeometry[]>>();
  function add(
    parent: Group,
    material: MeshStandardMaterial,
    geometry: BufferGeometry,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const bucket =
      batches.get(parent) ?? new Map<MeshStandardMaterial, BufferGeometry[]>();
    batches.set(parent, bucket);
    const parts = bucket.get(material) ?? [];
    bucket.set(material, parts);
    geometry.translate(x, y, z);
    parts.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
  }
  function box(
    parent: Group,
    material: MeshStandardMaterial,
    size: [number, number, number],
    at: [number, number, number],
  ) {
    add(parent, material, new BoxGeometry(...size), ...at);
  }
  add(base, graphite, shell(0.3634, 0.255, 0.017, 0.008), 0, 0.003);
  box(base, dark, [0.341, 0.001, 0.099], [0, 0.0203, -0.027]);
  box(base, red, [0.358, 0.013, 0.008], [0, 0.011, -0.121]);
  for (const x of [-0.15, 0.15]) {
    for (const z of [-0.103, 0.102])
      box(base, dark, [0.034, 0.003, 0.012], [x, 0.0015, z]);
    box(base, graphite, [0.035, 0.006, 0.012], [x, 0.019, -0.113]);
  }
  // Merge the small keycaps into one draw; the numpad remains visually separate.
  for (let row = 0; row < 5; row++) {
    for (let column = 0; column < 14; column++) {
      const x = -0.156 + column * 0.018;
      const z = -0.064 + row * 0.018;
      box(base, accent, [0.016, 0.0007, 0.0155], [x, 0.0209, z]);
      box(base, keys, [0.0145, 0.001, 0.014], [x, 0.0213, z]);
    }
    for (let column = 0; column < 4; column++)
      box(
        base,
        keys,
        [0.015, 0.001, 0.014],
        [0.1 + column * 0.018, 0.0213, -0.064 + row * 0.018],
      );
  }
  box(base, accent, [0.092, 0.0007, 0.012], [-0.038, 0.0209, 0.026]);
  box(base, keys, [0.09, 0.001, 0.01], [-0.038, 0.0213, 0.026]);
  box(base, red, [0.105, 0.001, 0.062], [-0.039, 0.0204, 0.079]);
  box(base, graphite, [0.102, 0.0012, 0.059], [-0.039, 0.0206, 0.079]);
  for (let vent = 0; vent < 13; vent++)
    box(
      base,
      dark,
      [0.009, 0.008, 0.001],
      [-0.158 + vent * 0.012, 0.011, -0.1255],
    );

  add(lid, graphite, shell(0.359, 0.235, 0.0048, 0.006), 0, -0.0011, 0.1175);
  box(lid, dark, [0.351, 0.0004, 0.226], [0, -0.0013, 0.119]);
  box(lid, display, [0.344, 0.0003, 0.1935], [0, -0.00165, 0.124]);
  // The AN515-54 has dark textured side panels, with red trim at the hinge.
  for (const side of [-1, 1]) {
    const stripe = new BoxGeometry(0.0013, 0.0002, 0.116);
    stripe.rotateY(side * -0.18);
    add(lid, dark, stripe, side * 0.112, 0.0038, 0.118);
  }
  box(lid, dark, [0.018, 0.0002, 0.003], [0, 0.0038, 0.12]);

  for (const [parent, materials] of batches) {
    for (const [material, parts] of materials) {
      const geometry = mergeGeometries(parts);
      parts.forEach((part) => part.dispose());
      if (!geometry) continue;
      parent.add(new Mesh(geometry, material));
    }
  }
  return scene;
}
