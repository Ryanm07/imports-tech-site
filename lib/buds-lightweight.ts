import {
  BoxGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
} from "three";

function roundedCase(width: number, depth: number, height: number) {
  const x = -width / 2;
  const z = -depth / 2;
  const radius = 0.007;
  const outline = new Shape();
  outline.moveTo(x + radius, z);
  outline.lineTo(x + width - radius, z);
  outline.quadraticCurveTo(x + width, z, x + width, z + radius);
  outline.lineTo(x + width, z + depth - radius);
  outline.quadraticCurveTo(x + width, z + depth, x + width - radius, z + depth);
  outline.lineTo(x + radius, z + depth);
  outline.quadraticCurveTo(x, z + depth, x, z + depth - radius);
  outline.lineTo(x, z + radius);
  outline.quadraticCurveTo(x, z, x + radius, z);
  const geometry = new ExtrudeGeometry(outline, {
    depth: height,
    steps: 1,
    curveSegments: 3,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.0008,
    bevelThickness: 0.0008,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Meter-scale stand-in: no downloads, textures, transmission, or decoder. */
export function createLightweightBuds() {
  const scene = new Group();
  scene.name = "Buds lightweight";
  const graphite = new MeshStandardMaterial({
    color: "#242a2c",
    roughness: 0.48,
    metalness: 0.12,
  });
  const insert = new MeshStandardMaterial({
    color: "#101718",
    roughness: 0.82,
  });
  const silver = new MeshStandardMaterial({
    color: "#8d979b",
    roughness: 0.32,
    metalness: 0.58,
  });
  const lidMaterial = new MeshStandardMaterial({
    color: "#4e5d5e",
    roughness: 0.3,
    metalness: 0.2,
  });
  const unitBox = new BoxGeometry(1, 1, 1);
  const earbudGeometry = new SphereGeometry(1, 10, 6);
  const body = new Mesh(roundedCase(0.057, 0.051, 0.015), graphite);
  body.name = "Case | lower enclosure";
  scene.add(body);

  const tray = new Mesh(roundedCase(0.051, 0.045, 0.001), insert);
  tray.position.y = 0.015;
  scene.add(tray);

  for (const side of [-1, 1]) {
    const earbud = new Group();
    earbud.name = side === -1 ? "Earbud_L" : "Earbud_R";
    earbud.position.set(side * 0.012, 0.0175, -0.006);
    const speaker = new Mesh(earbudGeometry, graphite);
    speaker.scale.set(0.007, 0.004, 0.0065);
    earbud.add(speaker);
    const stem = new Mesh(unitBox, silver);
    stem.scale.set(0.004, 0.0035, 0.017);
    stem.position.set(0, 0, 0.01);
    earbud.add(stem);
    scene.add(earbud);
  }

  const hinge = new Group();
  hinge.name = "LidPivot";
  hinge.position.set(0, 0.0165, -0.023);
  const lid = new Mesh(roundedCase(0.057, 0.051, 0.007), lidMaterial);
  lid.position.z = 0.023;
  hinge.add(lid);
  scene.add(hinge);

  const led = new Mesh(
    unitBox,
    new MeshStandardMaterial({
      color: "#a5ceac",
      emissive: "#80bc94",
      emissiveIntensity: 0.5,
      roughness: 0.6,
    }),
  );
  led.scale.set(0.0022, 0.001, 0.0005);
  led.position.set(0, 0.0063, 0.026);
  scene.add(led);
  return scene;
}
