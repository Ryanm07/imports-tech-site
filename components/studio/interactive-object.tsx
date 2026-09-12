"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  createPortal,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { Box3, Sphere, type Group } from "three";

export const StudioInteractionContext = createContext({
  enabled: true,
  reducedMotion: false,
});

// Decorative geometry must never capture the pointer or enlarge the click target.
const noRaycast = () => {};

function HoverHalo({
  target,
  reducedMotion,
}: {
  target: RefObject<Group | null>;
  reducedMotion: boolean;
}) {
  const { scene, camera, invalidate } = useThree();
  const ring = useRef<Group>(null);
  const arc = useRef<Group>(null);
  const box = useRef(new Box3());
  const sphere = useRef(new Sphere());
  useFrame((_, delta) => {
    if (!ring.current || !target.current) return;
    box.current.setFromObject(target.current).getBoundingSphere(sphere.current);
    ring.current.position.copy(sphere.current.center);
    ring.current.quaternion.copy(camera.quaternion);
    const radius = Math.max(0.07, sphere.current.radius * 1.12);
    ring.current.scale.setScalar(radius);
    if (!reducedMotion && arc.current) {
      arc.current.rotation.z -= Math.min(delta, 0.05) * 1.8;
      invalidate();
    }
  });
  return createPortal(
    <group ref={ring} name="studio-hover-halo">
      <mesh raycast={noRaycast} renderOrder={10}>
        <ringGeometry args={[0.975, 1, 96]} />
        <meshBasicMaterial
          color="#edc47b"
          transparent
          opacity={0.6}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={arc}>
        <mesh raycast={noRaycast} renderOrder={11}>
          <ringGeometry args={[0.958, 1.018, 40, 1, 0, Math.PI * 0.65]} />
          <meshBasicMaterial
            color="#ffe9ad"
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh raycast={noRaycast} position={[0.988, 0, 0]} renderOrder={12}>
          <circleGeometry args={[0.045, 16]} />
          <meshBasicMaterial
            color="#fff4d5"
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>,
    scene,
  );
}

export function InteractiveObject({
  id,
  at,
  rotation,
  onSelect,
  children,
}: {
  id: string;
  at: [number, number, number];
  rotation?: [number, number, number];
  onSelect: (id: string) => void;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const { enabled, reducedMotion } = useContext(StudioInteractionContext);
  const { gl, invalidate } = useThree();
  const active = hovered && enabled;

  useEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    canvas.setAttribute("data-item-hover", "true");
    const clear = () => setHovered(false);
    canvas.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    invalidate();
    return () => {
      canvas.removeAttribute("data-item-hover");
      canvas.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
      invalidate();
    };
  }, [active, gl, invalidate]);

  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!enabled || event.delta >= 6) return;
    setHovered(false);
    onSelect(id);
  }

  return (
    <>
      <group
        ref={group}
        name={`studio-object-${id}`}
        position={at}
        rotation={rotation}
        onClick={select}
        onPointerOver={(event) => {
          if (!enabled || event.pointerType === "touch" || event.buttons)
            return;
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {children}
      </group>
      {active && <HoverHalo target={group} reducedMotion={reducedMotion} />}
    </>
  );
}
