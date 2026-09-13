import { Mesh, type Object3D } from "three";

export const NITRO_STUDIO_SCALE = 1.7;

export function createNitroLid(source: Object3D) {
  const scene = source.clone(true);
  const lid = scene.getObjectByName("LidPivot");
  if (!lid || !scene.getObjectByName("NitroBase"))
    throw new Error("Nitro 5 model is missing its base or lid hinge");
  lid.rotation.set(0, 0, 0);
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return {
    scene,
    update(open: boolean, delta: number, reducedMotion: boolean) {
      const target = open ? (-112 * Math.PI) / 180 : 0;
      const remaining = target - lid.rotation.x;
      if (reducedMotion || Math.abs(remaining) < 0.001) {
        lid.rotation.x = target;
        return false;
      }
      lid.rotation.x +=
        remaining * (1 - Math.exp(-Math.min(Math.max(delta, 0), 0.05) * 10));
      return true;
    },
  };
}
