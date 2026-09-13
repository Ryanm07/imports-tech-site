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
import { createLightweightBuds } from "@/lib/buds-lightweight";
import type { StudioQuality } from "@/lib/studio-quality";
import { BudsScene, type BudsAnimationProps } from "./buds-scene";

const DetailedBudsModel = lazy(() => import("./buds-detailed-model"));

function LightweightBudsModel(props: BudsAnimationProps) {
  const [source] = useState(createLightweightBuds);
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
  return <BudsScene source={source} shadows={false} {...props} />;
}

class BudsLoadBoundary extends Component<
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

export function BudsModel({
  open,
  reducedMotion,
  quality,
}: {
  open: boolean;
  reducedMotion: boolean;
  quality: StudioQuality;
}) {
  const fallback = (
    <LightweightBudsModel open={open} reducedMotion={reducedMotion} />
  );
  if (quality !== "high" && quality !== "ultra") return fallback;
  return (
    <BudsLoadBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <DetailedBudsModel open={open} reducedMotion={reducedMotion} />
      </Suspense>
    </BudsLoadBoundary>
  );
}
