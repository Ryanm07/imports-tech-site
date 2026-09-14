import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Path,
  Quaternion,
  Shape,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

type Point = [number, number, number];

function roundedOutline<T extends Path>(
  path: T,
  width: number,
  height: number,
  radius: number,
) {
  const x = width / 2;
  const y = height / 2;
  path.moveTo(-x + radius, -y);
  path.lineTo(x - radius, -y);
  path.quadraticCurveTo(x, -y, x, -y + radius);
  path.lineTo(x, y - radius);
  path.quadraticCurveTo(x, y, x - radius, y);
  path.lineTo(-x + radius, y);
  path.quadraticCurveTo(-x, y, -x, y - radius);
  path.lineTo(-x, -y + radius);
  path.quadraticCurveTo(-x, -y, -x + radius, -y);
  path.closePath();
  return path;
}

function roundedPlate(
  width: number,
  height: number,
  depth: number,
  radius: number,
) {
  const geometry = new ExtrudeGeometry(
    roundedOutline(new Shape(), width, height, radius),
    { depth, bevelEnabled: false, steps: 1, curveSegments: 3 },
  );
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function material(
  name: string,
  color: string,
  metalness = 0,
  roughness = 0.55,
) {
  const result = new MeshStandardMaterial({ color, metalness, roughness });
  result.name = name;
  return result;
}

/** Batch rigid details by material without adding textures or runtime loaders. */
function builder(root: Group) {
  const batches = new Map<
    string,
    { material: MeshStandardMaterial; parts: BufferGeometry[] }
  >();
  function add(
    name: string,
    finish: MeshStandardMaterial,
    geometry: BufferGeometry,
    at: Point = [0, 0, 0],
  ) {
    geometry.translate(...at);
    const batch = batches.get(name) ?? { material: finish, parts: [] };
    batches.set(name, batch);
    batch.parts.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
  }
  function box(
    name: string,
    finish: MeshStandardMaterial,
    size: Point,
    at: Point,
  ) {
    add(name, finish, new BoxGeometry(...size), at);
  }
  function tube(
    name: string,
    finish: MeshStandardMaterial,
    start: Point,
    end: Point,
    radius: number,
    topRadius = radius,
  ) {
    const a = new Vector3(...start);
    const b = new Vector3(...end);
    const direction = b.clone().sub(a);
    const geometry = new CylinderGeometry(
      topRadius,
      radius,
      direction.length(),
      10,
    );
    geometry.applyQuaternion(
      new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        direction.normalize(),
      ),
    );
    add(
      name,
      finish,
      geometry,
      a.add(b).multiplyScalar(0.5).toArray() as Point,
    );
  }
  function finish() {
    for (const [name, batch] of batches) {
      const geometry = mergeGeometries(batch.parts);
      batch.parts.forEach((part) => part.dispose());
      if (!geometry) continue;
      const mesh = new Mesh(geometry, batch.material);
      mesh.name = name;
      root.add(mesh);
    }
    return root;
  }
  return { add, box, tube, finish };
}

/** Y-up floor rig; U200 uses a 1.5× display scale above a 1.43 m stand mount. */
export function createLightweightRecordingRig() {
  const root = new Group();
  root.name = "RecordingRigEconomy";
  const build = builder(root);
  const metal = material("Stand_Graphite", "#24272a", 0.65, 0.36);
  const rubber = material("Stand_Rubber", "#121415", 0, 0.88);
  const red = material("Stand_RedCollars", "#9c2430", 0.35, 0.38);
  const housing = material("U200_Housing", "#1d2023", 0.05, 0.68);
  const controls = material("U200_Controls", "#383a3e", 0.2, 0.5);
  const diffuser = material("U200_Diffuser", "#eee9dc", 0, 0.48);
  diffuser.emissive.set("#fff0d7");
  diffuser.emissiveIntensity = 0;

  // Separate telescoping sections keep the floor stand slender at human height.
  build.tube("StandMast", metal, [0, 0.19, 0], [0, 0.9, 0], 0.016);
  build.tube("StandMast", metal, [0, 0.89, 0], [0, 1.205, 0], 0.013);
  build.tube("StandMast", metal, [0, 1.19, 0], [0, 1.426, 0], 0.0105);
  build.tube("StandCollars", red, [0, 0.88, 0], [0, 0.911, 0], 0.022);
  build.tube("StandCollars", red, [0, 1.19, 0], [0, 1.217, 0], 0.018);
  build.tube("StandHub", rubber, [0, 0.43, 0], [0, 0.477, 0], 0.033);
  build.tube("StandHub", rubber, [0, 0.195, 0], [0, 0.23, 0], 0.025);
  build.box("StandLocks", rubber, [0.036, 0.016, 0.017], [0.024, 0.895, 0]);
  build.box("StandLocks", rubber, [0.029, 0.014, 0.016], [0.02, 1.2, 0]);
  for (let leg = 0; leg < 3; leg++) {
    const angle = Math.PI / 2 + (leg * Math.PI * 2) / 3;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    build.tube(
      "StandLegs",
      metal,
      [x * 0.025, 0.451, z * 0.025],
      [x * 0.435, 0.025, z * 0.435],
      0.012,
    );
    build.tube(
      "StandBraces",
      metal,
      [x * 0.017, 0.211, z * 0.017],
      [x * 0.247, 0.22, z * 0.247],
      0.006,
    );
    const foot = new BoxGeometry(0.036, 0.026, 0.057);
    foot.rotateY(Math.PI / 2 - angle);
    build.add(`StandFoot${leg + 1}`, rubber, foot, [
      x * 0.438,
      0.013,
      z * 0.438,
    ]);
  }
  build.tube("U200Mount", controls, [0, 1.408, 0], [0, 1.43, 0], 0.025);

  const frameShape = roundedOutline(new Shape(), 0.435, 0.33, 0.0375);
  frameShape.holes.push(roundedOutline(new Path(), 0.327, 0.216, 0.0135));
  const frame = new ExtrudeGeometry(frameShape, {
    depth: 0.0465,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 3,
  });
  build.add("U200Frame", housing, frame, [0, 1.595, -0.02325]);

  // Four diffuser strips leave the dark corner joints visible.
  for (const y of [1.46, 1.73]) {
    build.add(
      "U200Diffusers",
      diffuser,
      roundedPlate(0.321, 0.038, 0.002, 0.005),
      [0, y, 0.024],
    );
  }
  for (const x of [-0.1905, 0.1905]) {
    build.add(
      "U200Diffusers",
      diffuser,
      roundedPlate(0.037, 0.19, 0.002, 0.005),
      [x, 1.595, 0.024],
    );
    build.box(
      "U200RearGrips",
      rubber,
      [0.021, 0.13, 0.004],
      [x, 1.595, -0.0245],
    );
  }
  for (const x of [-0.128, 0, 0.128]) {
    build.box(
      "U200ShoesAndClamp",
      controls,
      [0.027, 0.009, 0.025],
      [x, 1.7645, 0],
    );
    for (const side of [-1, 1])
      build.box(
        "U200ShoesAndClamp",
        controls,
        [0.005, 0.006, 0.025],
        [x + side * 0.011, 1.772, 0],
      );
  }
  // The phone remains a separate object for picking and switching quality.
  build.box(
    "U200ShoesAndClamp",
    controls,
    [0.021, 0.128, 0.011],
    [0, 1.565, -0.008],
  );
  for (const y of [1.514, 1.628])
    build.box(
      "U200ShoesAndClamp",
      controls,
      [0.047, 0.009, 0.018],
      [0, y, -0.001],
    );
  build.tube(
    "U200ShoesAndClamp",
    controls,
    [0, 1.487, -0.008],
    [0, 1.509, -0.008],
    0.009,
  );
  build.box(
    "U200RearControls",
    controls,
    [0.011, 0.018, 0.025],
    [-0.217, 1.658, -0.002],
  );
  build.box(
    "U200RearControls",
    controls,
    [0.011, 0.018, 0.025],
    [-0.217, 1.621, -0.002],
  );
  build.box(
    "U200RearControls",
    controls,
    [0.009, 0.013, 0.016],
    [-0.217, 1.586, -0.002],
  );
  return build.finish();
}

/** Meter-scale portrait S25 Ultra. The screen faces -Z, rear cameras +Z. */
export function createLightweightS25() {
  const root = new Group();
  root.name = "S25UltraEconomy";
  const build = builder(root);
  const titanium = material("S25_Titanium", "#949ca8", 0.78, 0.34);
  const silverblue = material("S25_Silverblue", "#8d9aaa", 0.25, 0.48);
  const black = material("S25_Black", "#14171b", 0.1, 0.46);
  const display = material("S25_Display", "#151e26", 0.15, 0.22);
  const glass = material("S25_LensGlass", "#152e40", 0.6, 0.18);
  const flash = material("S25_Flash", "#eee8cb", 0, 0.4);
  build.add("S25Body", titanium, roundedPlate(0.0776, 0.1628, 0.0082, 0.007));
  build.add(
    "S25Back",
    silverblue,
    roundedPlate(0.0754, 0.1606, 0.0002, 0.0063),
    [0, 0, 0.00415],
  );
  build.add(
    "S25ScreenBezel",
    black,
    roundedPlate(0.0755, 0.1607, 0.00015, 0.0063),
    [0, 0, -0.00417],
  );
  build.add(
    "S25Screen",
    display,
    roundedPlate(0.0728, 0.158, 0.0001, 0.0055),
    [0, 0, -0.0043],
  );
  function disk(
    name: string,
    finish: MeshStandardMaterial,
    radius: number,
    depth: number,
    at: Point,
  ) {
    const geometry = new CylinderGeometry(radius, radius, depth, 16);
    geometry.rotateX(Math.PI / 2);
    build.add(name, finish, geometry, at);
  }
  for (const y of [0.058, 0.035, 0.012]) {
    disk("S25CameraRings", black, 0.00725, 0.002, [-0.023, y, 0.0051]);
    disk("S25RearLenses", glass, 0.00555, 0.00035, [-0.023, y, 0.00625]);
  }
  disk("S25CameraRings", black, 0.005, 0.0016, [-0.004, 0.025, 0.005]);
  disk("S25RearLenses", glass, 0.0037, 0.00035, [-0.004, 0.025, 0.006]);
  disk("S25CameraRings", black, 0.0029, 0.0005, [-0.004, 0.057, 0.0045]);
  disk("S25Flash", flash, 0.0026, 0.0004, [-0.004, 0.043, 0.0045]);
  disk("S25ScreenBezel", black, 0.00135, 0.0001, [0, 0.072, -0.00442]);
  build.box("S25Ports", black, [0.009, 0.0005, 0.0027], [0, -0.08125, 0]);
  build.box("S25Ports", black, [0.012, 0.0005, 0.0008], [-0.018, -0.08125, 0]);
  build.box(
    "S25SideButtons",
    titanium,
    [0.0005, 0.02, 0.0021],
    [0.03865, 0.036, 0],
  );
  build.box(
    "S25SideButtons",
    titanium,
    [0.0005, 0.009, 0.0021],
    [0.03865, 0.014, 0],
  );
  return build.finish();
}

/** The caller owns the generated resources; repeated shared parts are disposed once. */
export function disposeRecordingGeometry(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const finish of Array.isArray(object.material)
      ? object.material
      : [object.material])
      materials.add(finish);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((finish) => finish.dispose());
}
