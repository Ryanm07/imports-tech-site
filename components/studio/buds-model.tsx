"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createBudsLid } from "@/lib/buds-lid";

export function BudsModel({
  open,
  reducedMotion,
}: {
  open: boolean;
  reducedMotion: boolean;
}) {
  const gltf = useLoader(GLTFLoader, "/models/galaxy-buds4-pro-black.glb");
  const control = useMemo(() => createBudsLid(gltf.scene), [gltf.scene]);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [open, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    if (control.update(open, delta, reducedMotion)) invalidate();
  });
  return <primitive object={control.scene} scale={2.8} dispose={null} />;
}
