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
import { createLightweightNitro } from "@/lib/nitro-lightweight";
import type { StudioQuality } from "@/lib/studio-quality";
import { NitroScene, type NitroAnimationProps } from "./nitro-scene";

const DetailedNitroModel = lazy(() => import("./nitro-detailed-model"));

function LightweightNitroModel(props: NitroAnimationProps) {
  const [source] = useState(createLightweightNitro);
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
  return <NitroScene source={source} shadows={false} {...props} />;
}

class NitroLoadBoundary extends Component<
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

export function NitroModel({
  open,
  reducedMotion,
  quality,
}: NitroAnimationProps & { quality: StudioQuality }) {
  const fallback = (
    <LightweightNitroModel open={open} reducedMotion={reducedMotion} />
  );
  if (quality !== "high" && quality !== "ultra") return fallback;
  return (
    <NitroLoadBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <DetailedNitroModel open={open} reducedMotion={reducedMotion} />
      </Suspense>
    </NitroLoadBoundary>
  );
}
