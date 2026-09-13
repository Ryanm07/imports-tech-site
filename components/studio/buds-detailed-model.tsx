"use client";

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { BudsScene, type BudsAnimationProps } from "./buds-scene";

export default function DetailedBudsModel(props: BudsAnimationProps) {
  const gltf = useLoader(GLTFLoader, "/models/galaxy-buds4-pro-black.glb");
  return <BudsScene source={gltf.scene} {...props} />;
}
