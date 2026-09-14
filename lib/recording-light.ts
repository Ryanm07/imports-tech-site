import { Mesh, MeshStandardMaterial, type Object3D } from "three";

/** Only the diffuser is mutable. Geometry and other materials stay in the GLTF cache. */
export function createRecordingLight(source: Object3D) {
  const scene = source.clone(true);
  const materials = new Map<MeshStandardMaterial, MeshStandardMaterial>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const cloneDiffuser = (material: MeshStandardMaterial) => {
      if (material.name !== "U200_Diffuser") return material;
      let cloned = materials.get(material);
      if (!cloned) {
        cloned = material.clone();
        // glTF omits the emissive color when Blender exports the lamp switched off.
        cloned.emissive.set("#fff0d4");
        cloned.emissiveIntensity = 0;
        materials.set(material, cloned);
      }
      return cloned;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(cloneDiffuser)
      : cloneDiffuser(object.material);
  });
  let intensity = 0;
  return {
    scene,
    update(on: boolean, delta: number, reducedMotion: boolean) {
      const target = on ? 3 : 0;
      const settled = reducedMotion || Math.abs(target - intensity) < 0.002;
      intensity = settled
        ? target
        : intensity +
          (target - intensity) *
            (1 - Math.exp(-Math.min(Math.max(delta, 0), 0.05) * 14));
      materials.forEach((material) => {
        material.emissiveIntensity = intensity;
      });
      return !settled;
    },
    dispose() {
      materials.forEach((material) => material.dispose());
    },
  };
}
