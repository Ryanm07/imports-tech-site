import { Box3, Mesh, type Object3D } from "three";

export function createBudsLid(source: Object3D) {
  const scene = source.clone(true);
  const lid = scene.getObjectByName("LidPivot");
  if (!lid) throw new Error("Buds model is missing its lid hinge");
  lid.rotation.set(0, 0, 0);
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  // Rest the closed case on the tabletop; exported geometry uses meters.
  scene.position.y -= new Box3().setFromObject(scene).min.y;
  return {
    scene,
    update(open: boolean, delta: number, reducedMotion: boolean) {
      const target = open ? (-105 * Math.PI) / 180 : 0;
      const remaining = target - lid.rotation.x;
      if (reducedMotion || Math.abs(remaining) < 0.001) {
        lid.rotation.x = target;
        return false;
      }
      lid.rotation.x += remaining * (1 - Math.exp(-Math.min(delta, 0.05) * 9));
      return true;
    },
  };
}
