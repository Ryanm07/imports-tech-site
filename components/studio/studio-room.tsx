"use client";

import { BudsModel } from "./buds-model";
import { InteractiveObject } from "./interactive-object";
import type { StudioQuality } from "@/lib/studio-quality";

type Vector3 = [number, number, number];
type Theme = "dark" | "light";

type BoxProps = {
  at: Vector3;
  size: Vector3;
  color: string;
  rotation?: Vector3;
  emissive?: string;
  intensity?: number;
  metalness?: number;
  roughness?: number;
};

function Box({
  at,
  size,
  color,
  rotation,
  emissive,
  intensity = 0,
  metalness = 0,
  roughness = 0.72,
}: BoxProps) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={intensity}
      />
    </mesh>
  );
}

function Cylinder({
  at,
  radius,
  height,
  color,
  rotation,
  topRadius = radius,
}: {
  at: Vector3;
  radius: number;
  height: number;
  color: string;
  rotation?: Vector3;
  topRadius?: number;
}) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[topRadius, radius, height, 12]} />
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
  );
}

function Plant({ at, scale = 1 }: { at: Vector3; scale?: number }) {
  return (
    <group position={at} scale={scale}>
      <Cylinder
        at={[0, 0.18, 0]}
        radius={0.22}
        topRadius={0.27}
        height={0.36}
        color="#b7ad95"
      />
      <Cylinder
        at={[0, 0.365, 0]}
        radius={0.235}
        height={0.015}
        color="#3c3428"
      />
      <Cylinder
        at={[0, 0.68, 0]}
        radius={0.019}
        height={0.63}
        color="#667556"
      />
      {[0, 1, 2, 3, 4, 5].map((leaf) => {
        const angle = (leaf / 6) * Math.PI * 2;
        const offset = leaf % 2 === 0 ? 0.21 : 0.17;

        return (
          <mesh
            key={leaf}
            position={[
              Math.sin(angle) * offset,
              0.78 + (leaf % 3) * 0.15,
              Math.cos(angle) * offset,
            ]}
            rotation={[Math.cos(angle) * 0.6, angle, -Math.sin(angle) * 0.6]}
            scale={[0.13, 0.37, 0.06]}
            castShadow
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
              color={leaf % 2 === 0 ? "#6f8862" : "#435e45"}
              roughness={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Chair({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <InteractiveObject
      id="chair"
      at={[0, 0, 0.5]}
      rotation={[0, -0.22, 0]}
      onSelect={onSelect}
    >
      <Cylinder
        at={[0, 0.28, 0]}
        radius={0.045}
        height={0.43}
        color="#6b7474"
      />
      <Box at={[0, 0.51, 0]} size={[0.64, 0.13, 0.6]} color="#343c3e" />
      <Box
        at={[0, 0.91, 0.25]}
        size={[0.61, 0.7, 0.07]}
        color="#252e31"
        rotation={[-0.1, 0, 0]}
      />
      <Box
        at={[0, 0.96, 0.201]}
        size={[0.48, 0.43, 0.014]}
        color="#475455"
        rotation={[-0.1, 0, 0]}
      />
      <Box
        at={[0, 1.36, 0.3]}
        size={[0.35, 0.18, 0.1]}
        color="#3b4547"
        rotation={[-0.15, 0, 0]}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            at={[side * 0.36, 0.64, 0]}
            size={[0.045, 0.28, 0.045]}
            color="#647170"
          />
          <Box
            at={[side * 0.36, 0.8, -0.025]}
            size={[0.1, 0.06, 0.29]}
            color="#333d3e"
          />
        </group>
      ))}
      {[0, 1, 2, 3, 4].map((leg) => (
        <Box
          key={leg}
          at={[
            Math.sin((leg * Math.PI * 2) / 5) * 0.18,
            0.085,
            Math.cos((leg * Math.PI * 2) / 5) * 0.18,
          ]}
          size={[0.055, 0.065, 0.43]}
          rotation={[0, (leg * Math.PI * 2) / 5, 0]}
          color="#535f60"
          metalness={0.45}
        />
      ))}
    </InteractiveObject>
  );
}

function RecordingKit({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <>
      <InteractiveObject
        id="recording-rig"
        at={[2.15, 0, -1.4]}
        rotation={[0, -0.45, 0]}
        onSelect={onSelect}
      >
        <Cylinder
          at={[0, 0.79, 0]}
          radius={0.022}
          height={1.45}
          color="#565d5d"
        />
        {[0, 1, 2].map((leg) => (
          <group key={leg} rotation={[0, (leg * Math.PI * 2) / 3, 0]}>
            <Cylinder
              at={[0, 0.28, 0.2]}
              radius={0.018}
              height={0.64}
              rotation={[0.73, 0, 0]}
              color="#424a4b"
            />
          </group>
        ))}
        <mesh position={[0, 1.49, 0]} castShadow>
          <torusGeometry args={[0.3, 0.026, 8, 32]} />
          <meshStandardMaterial
            color="#efe9d8"
            emissive="#e7dcc0"
            emissiveIntensity={0.55}
            roughness={0.6}
          />
        </mesh>
      </InteractiveObject>
      <InteractiveObject
        id="phone"
        at={[2.15, 1.5, -1.4]}
        rotation={[0, -0.45, 0]}
        onSelect={onSelect}
      >
        <Box
          at={[0, 0, 0]}
          size={[0.135, 0.27, 0.026]}
          color="#343638"
          metalness={0.4}
        />
        <Box
          at={[0, 0, 0.016]}
          size={[0.118, 0.248, 0.003]}
          color="#819390"
          metalness={0.3}
          roughness={0.24}
        />
      </InteractiveObject>
    </>
  );
}

function Bookcase({
  theme,
  onSelect,
}: {
  theme: Theme;
  onSelect: (id: string) => void;
}) {
  const colors = [
    "#ae735e",
    "#d4bd8c",
    "#6b8680",
    "#94988f",
    "#bc9b60",
    "#7e8788",
    "#987964",
  ];

  return (
    <group position={[-2.6, 0, -1.48]}>
      <Box
        at={[0, 1.06, -0.2]}
        size={[1.02, 2.1, 0.035]}
        color={theme === "dark" ? "#50554d" : "#b8beb0"}
      />
      {[-0.51, 0.51].map((x) => (
        <Box
          key={x}
          at={[x, 1.06, 0]}
          size={[0.055, 2.1, 0.46]}
          color="#927455"
        />
      ))}
      {[0.14, 0.74, 1.38, 2.1].map((y) => (
        <Box
          key={y}
          at={[0, y, 0]}
          size={[1.05, 0.055, 0.49]}
          color="#b19067"
        />
      ))}
      <InteractiveObject id="story" at={[0, 1.55, 0.12]} onSelect={onSelect}>
        {colors.map((color, index) => (
          <Box
            key={color}
            at={[-0.35 + index * 0.115, 0.04 + (index % 3) * 0.025, 0]}
            size={[0.085, 0.32 + (index % 3) * 0.05, 0.24]}
            color={color}
            rotation={[0, 0, index === 6 ? -0.16 : 0]}
          />
        ))}
      </InteractiveObject>
      <Box at={[-0.13, 0.84, 0]} size={[0.56, 0.12, 0.3]} color="#c0bb9b" />
      <Box
        at={[-0.1, 0.93, 0]}
        size={[0.51, 0.06, 0.28]}
        color="#667c78"
        rotation={[0, 0.1, 0]}
      />
      <Cylinder
        at={[0.23, 0.33, 0.02]}
        radius={0.11}
        height={0.3}
        color="#b1aa92"
      />
    </group>
  );
}

function Milestone({
  id,
  at,
  color,
  onSelect,
}: {
  id: string;
  at: Vector3;
  color: string;
  onSelect: (id: string) => void;
}) {
  return (
    <InteractiveObject id={id} at={at} onSelect={onSelect}>
      <Box at={[0, 0, 0]} size={[0.56, 0.66, 0.065]} color="#333b39" />
      <Box at={[0, 0, 0.039]} size={[0.49, 0.59, 0.012]} color="#d4cfbb" />
      <Box
        at={[0, 0.035, 0.05]}
        size={[0.19, 0.19, 0.025]}
        color={color}
        rotation={[0, 0, Math.PI / 4]}
        metalness={0.5}
        roughness={0.3}
      />
      <Box at={[0, -0.19, 0.05]} size={[0.22, 0.017, 0.006]} color="#817966" />
    </InteractiveObject>
  );
}

/**
 * A lightweight spatial foundation. The simple equipment volumes deliberately
 * share selection IDs and positions with future, independently loaded models.
 */
export function StudioRoom({
  theme,
  onSelect,
  earbudsOpen,
  reducedMotion,
  quality,
}: {
  theme: Theme;
  onSelect: (id: string) => void;
  earbudsOpen: boolean;
  reducedMotion: boolean;
  quality: StudioQuality;
}) {
  const light = theme === "light";
  const wall = light ? "#c6ccc3" : "#57635b";
  const wood = light ? "#b9976c" : "#aa865c";
  const metal = light ? "#48524f" : "#434c48";

  return (
    <group name="imports-tech-studio">
      {/* The open front and right side keep the initial diorama readable. */}
      <Box
        at={[0, -0.15, 0.3]}
        size={[7, 0.3, 6.2]}
        color={light ? "#a9ada0" : "#566057"}
      />
      <Box
        at={[0, 0.005, 0.3]}
        size={[6.95, 0.018, 6.15]}
        color={light ? "#c3c4b5" : "#7c8475"}
        roughness={0.96}
      />
      <Box at={[0, 1.55, -2.73]} size={[7, 3.1, 0.12]} color={wall} />
      <Box
        at={[-3.43, 1.55, 0.3]}
        size={[0.12, 3.1, 6.2]}
        color={light ? "#d4d8cf" : "#66716a"}
      />
      <Box at={[0, 0.07, -2.63]} size={[6.8, 0.14, 0.045]} color={metal} />
      <Box at={[-3.34, 0.07, 0.3]} size={[0.045, 0.14, 6.1]} color={metal} />
      <Box at={[0, 1.66, -2.641]} size={[3.78, 2.85, 0.045]} color="#4e4b3f" />
      {Array.from({ length: 18 }, (_, index) => (
        <Box
          key={index}
          at={[-1.79 + index * 0.21, 1.66, -2.59]}
          size={[0.095, 2.85, 0.085]}
          color={index % 3 === 0 ? "#967551" : wood}
        />
      ))}
      <Box
        at={[0, 0.023, 0.6]}
        size={[3.35, 0.022, 2.72]}
        color={light ? "#989b89" : "#646e60"}
        roughness={1}
      />

      <group name="desk" position={[0, 0, -1.5]}>
        <Box
          at={[0, 0.76, 0]}
          size={[3.05, 0.085, 1.15]}
          color={wood}
          roughness={0.58}
        />
        <Box
          at={[0, 0.806, 0]}
          size={[3.04, 0.013, 1.14]}
          color={light ? "#c3a47e" : "#b09471"}
          roughness={0.61}
        />
        {[-1.32, 1.32].map((x) => (
          <group key={x}>
            <Box
              at={[x, 0.385, 0.35]}
              size={[0.07, 0.72, 0.07]}
              color={metal}
              metalness={0.4}
            />
            <Box
              at={[x, 0.385, -0.35]}
              size={[0.07, 0.72, 0.07]}
              color={metal}
              metalness={0.4}
            />
            <Box
              at={[x, 0.045, 0]}
              size={[0.1, 0.07, 0.92]}
              color={metal}
              metalness={0.4}
            />
          </group>
        ))}
        <Box at={[0, 0.65, -0.43]} size={[2.67, 0.07, 0.055]} color={metal} />
        <Box
          at={[-0.65, 0.701, -0.53]}
          size={[1.2, 0.016, 0.015]}
          color="#87c3b2"
          emissive="#75bca9"
          intensity={light ? 0.4 : 2}
        />
        <Box
          at={[0.65, 0.701, -0.53]}
          size={[1.2, 0.016, 0.015]}
          color="#d79e82"
          emissive="#d0886b"
          intensity={light ? 0.3 : 1.4}
        />
      </group>

      <InteractiveObject id="monitor" at={[0, 1.24, -1.85]} onSelect={onSelect}>
        <Box
          at={[0, 0.08, 0]}
          size={[1.19, 0.65, 0.055]}
          color="#303938"
          roughness={0.4}
        />
        <Box
          at={[0, 0.08, 0.032]}
          size={[1.12, 0.57, 0.005]}
          color="#354d49"
          emissive="#3e615a"
          intensity={light ? 0.25 : 0.75}
          roughness={0.32}
        />
        <Box
          at={[0, -0.26, -0.006]}
          size={[0.065, 0.28, 0.07]}
          color={metal}
          metalness={0.45}
        />
        <Box
          at={[0, -0.402, 0.026]}
          size={[0.4, 0.025, 0.21]}
          color={metal}
          metalness={0.45}
        />
        <Box
          at={[-0.3, 0.17, 0.039]}
          size={[0.31, 0.028, 0.002]}
          color="#e5c96e"
          emissive="#c6a94a"
          intensity={0.35}
        />
        <Box
          at={[-0.23, 0.085, 0.039]}
          size={[0.45, 0.011, 0.002]}
          color="#8caaa1"
        />
        <Box
          at={[-0.29, 0.041, 0.039]}
          size={[0.33, 0.011, 0.002]}
          color="#718d84"
        />
        <Box
          at={[0.25, 0.073, 0.041]}
          size={[0.25, 0.22, 0.006]}
          color="#607c6d"
        />
        <Box at={[0, 0.428, 0.025]} size={[0.7, 0.028, 0.05]} color="#363d3b" />
        <Box
          at={[0, 0.411, 0.034]}
          size={[0.64, 0.008, 0.034]}
          color="#e7debd"
          emissive="#f1dca6"
          intensity={light ? 0.3 : 1}
        />
      </InteractiveObject>

      <InteractiveObject
        id="keyboard"
        at={[-0.3, 0.83, -1.08]}
        onSelect={onSelect}
      >
        <Box
          at={[0, 0.015, 0]}
          size={[0.77, 0.047, 0.275]}
          color="#c5c5b7"
          roughness={0.5}
        />
        {[-0.083, -0.026, 0.031, 0.088].map((z, index) => (
          <Box
            key={z}
            at={[-0.024, 0.046, z]}
            size={[index === 3 ? 0.48 : 0.63, 0.017, 0.043]}
            color={index === 0 ? "#737e72" : "#dedbc9"}
          />
        ))}
        <Box
          at={[-0.336, 0.047, -0.084]}
          size={[0.047, 0.019, 0.045]}
          color="#c69e4f"
        />
      </InteractiveObject>

      <InteractiveObject
        id="mouse"
        at={[0.38, 0.83, -1.08]}
        rotation={[0, -0.12, 0]}
        onSelect={onSelect}
      >
        <mesh position={[0, 0.037, 0]} scale={[0.072, 0.046, 0.116]} castShadow>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#d6d9cd" roughness={0.54} />
        </mesh>
        <Box
          at={[0, 0.077, -0.04]}
          size={[0.013, 0.014, 0.033]}
          color="#708e84"
        />
      </InteractiveObject>

      <InteractiveObject
        id="laptop"
        at={[1.05, 0.83, -1.45]}
        rotation={[0, -0.2, 0]}
        onSelect={onSelect}
      >
        <Box
          at={[0, 0.013, 0]}
          size={[0.62, 0.035, 0.43]}
          color="#343638"
          metalness={0.4}
        />
        <Box at={[0, 0.034, -0.06]} size={[0.5, 0.008, 0.14]} color="#9a504e" />
        <Box
          at={[0, 0.034, 0.105]}
          size={[0.16, 0.006, 0.085]}
          color="#515557"
        />
        <group position={[0, 0.22, -0.234]} rotation={[-0.18, 0, 0]}>
          <Box at={[0, 0, 0]} size={[0.62, 0.39, 0.026]} color="#783e3d" />
          <Box
            at={[0, 0.007, 0.017]}
            size={[0.573, 0.342, 0.004]}
            color="#423f47"
            emissive="#695355"
            intensity={light ? 0.2 : 0.5}
            roughness={0.3}
          />
        </group>
      </InteractiveObject>

      <InteractiveObject
        id="earbuds"
        at={[-1, 0.813, -1.22]}
        rotation={[0, 0.22, 0]}
        onSelect={onSelect}
      >
        <BudsModel
          open={earbudsOpen}
          reducedMotion={reducedMotion}
          quality={quality}
        />
      </InteractiveObject>

      <InteractiveObject
        id="headset"
        at={[1.25, 1.03, -1.82]}
        onSelect={onSelect}
      >
        <Cylinder
          at={[0, -0.1, 0]}
          radius={0.012}
          height={0.3}
          color="#55635f"
        />
        <Box at={[0, -0.195, 0]} size={[0.18, 0.018, 0.14]} color="#46514e" />
        <mesh position={[0, 0.095, 0]} castShadow>
          <torusGeometry args={[0.11, 0.016, 6, 18, Math.PI]} />
          <meshStandardMaterial color="#66736e" roughness={0.5} />
        </mesh>
        {[-1, 1].map((side) => (
          <Box
            key={side}
            at={[side * 0.108, 0.03, 0]}
            size={[0.057, 0.114, 0.081]}
            color="#363d3c"
          />
        ))}
      </InteractiveObject>

      <Chair onSelect={onSelect} />
      <RecordingKit onSelect={onSelect} />
      <Bookcase theme={theme} onSelect={onSelect} />
      <Plant at={[2.75, 0, -2.16]} scale={1.16} />
      <Plant at={[-1.3, 0.815, -1.9]} scale={0.44} />
      <Milestone
        id="milestone-1000"
        at={[-0.65, 2.22, -2.49]}
        color="#a5b1a7"
        onSelect={onSelect}
      />
      <Milestone
        id="milestone-5000"
        at={[0.1, 2.22, -2.49]}
        color="#c9a254"
        onSelect={onSelect}
      />
    </group>
  );
}
