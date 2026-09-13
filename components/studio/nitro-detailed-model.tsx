"use client";

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { NitroScene, type NitroAnimationProps } from "./nitro-scene";

export default function DetailedNitroModel(props: NitroAnimationProps) {
  const gltf = useLoader(GLTFLoader, "/models/acer-nitro5-an515-54.glb");
  return <NitroScene source={gltf.scene} {...props} />;
}
