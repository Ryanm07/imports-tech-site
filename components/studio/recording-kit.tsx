"use client";

import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Mesh, type BufferGeometry, type Material } from "three";
import {
  createLightweightRecordingRig,
  createLightweightS25,
} from "@/lib/recording-lightweight";
import type { StudioQuality } from "@/lib/studio-quality";
import { InteractiveObject } from "./interactive-object";
import {
  RecordingRigScene,
  RecordingPhoneScene,
  type RecordingLightProps,
} from "./recording-scene";

const DetailedRig = lazy(() =>
  import("./recording-detailed-model").then((module) => ({
    default: module.DetailedRecordingRig,
  })),
);
const DetailedPhone = lazy(() =>
  import("./recording-detailed-model").then((module) => ({
    default: module.DetailedRecordingPhone,
  })),
);

function useLightweightSource(create: typeof createLightweightS25) {
  const [source] = useState(create);
  useEffect(
    () => () => {
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      source.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
    [source],
  );
  return source;
}

function LightweightRig(props: RecordingLightProps) {
  const source = useLightweightSource(createLightweightRecordingRig);
  return <RecordingRigScene source={source} {...props} />;
}

function LightweightPhone() {
  const source = useLightweightSource(createLightweightS25);
  return <RecordingPhoneScene source={source} />;
}

class RecordingLoadBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RecordingKit({
  onSelect,
  quality,
  ...light
}: RecordingLightProps & {
  quality: StudioQuality;
  onSelect: (id: string) => void;
}) {
  const detailed = quality === "high" || quality === "ultra";
  const rigFallback = <LightweightRig {...light} />;
  const phoneFallback = <LightweightPhone />;
  return (
    <>
      <InteractiveObject
        id="recording-rig"
        at={[2.15, 0.015, -1.4]}
        rotation={[0, -0.45, 0]}
        onSelect={onSelect}
      >
        {detailed ? (
          <RecordingLoadBoundary fallback={rigFallback}>
            <Suspense fallback={rigFallback}>
              <DetailedRig {...light} />
            </Suspense>
          </RecordingLoadBoundary>
        ) : (
          rigFallback
        )}
      </InteractiveObject>
      <InteractiveObject
        id="phone"
        at={[2.15, 1.61, -1.4]}
        rotation={[0, -0.45, 0]}
        onSelect={onSelect}
      >
        {detailed ? (
          <RecordingLoadBoundary fallback={phoneFallback}>
            <Suspense fallback={phoneFallback}>
              <DetailedPhone />
            </Suspense>
          </RecordingLoadBoundary>
        ) : (
          phoneFallback
        )}
      </InteractiveObject>
    </>
  );
}
