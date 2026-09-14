"use client";

import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { Group } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  RecordingRigScene,
  RecordingPhoneScene,
  type RecordingLightProps,
} from "./recording-scene";

export function DetailedRecordingRig(props: RecordingLightProps) {
  const [stand, ring] = useLoader(GLTFLoader, [
    "/models/recording-floor-stand.glb",
    "/models/ulanzi-u200.glb",
  ]);
  const source = useMemo(() => {
    const rig = new Group();
    rig.add(stand.scene.clone(true));
    const head = ring.scene.clone(true);
    head.scale.setScalar(1.5);
    head.position.y = 1.43;
    rig.add(head);
    return rig;
  }, [stand, ring]);
  return <RecordingRigScene source={source} shadows {...props} />;
}

export function DetailedRecordingPhone() {
  const { scene } = useLoader(GLTFLoader, "/models/galaxy-s25-ultra.glb");
  return <RecordingPhoneScene source={scene} shadows />;
}
