type Point = [number, number, number];
type Theme = "light" | "dark";

export type CosmicFragment = {
  origin: Point;
  position: Point;
  velocity: Point;
  rotation: Point;
  angularVelocity: Point;
  spin: Point;
  size: Point;
  material: number;
  delay: number;
  captured: boolean;
};

export type CosmicDebrisSimulation = {
  bodies: CosmicFragment[];
  hole: Point;
  captureRadius: number;
  darkTime: number;
  theme: Theme | null;
};

const SPEED_LIMIT = 2.8;
const MAX_FRAME_DELTA = 0.08;
const MAX_SUBSTEP = 1 / 120;

export function createCosmicDebris(
  hole: readonly [number, number, number],
  radius: number,
): CosmicDebrisSimulation {
  let seed = 4919;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const bodies = Array.from({ length: 72 }, (_, index): CosmicFragment => {
    // Trim outside the back wall: trajectories never pass through the equipment.
    const row = Math.floor(index / 24);
    const column = index % 24;
    const origin: Point = [
      -3.4 + (column / 23) * 6.8,
      row === 0 ? 3.145 : row === 1 ? 3.055 : -0.09,
      row === 0 ? -2.805 : row === 1 ? -2.84 : -2.835,
    ];
    return {
      origin,
      position: [...origin],
      velocity: [0, 0, 0],
      rotation: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      spin: [random() - 0.5, random() - 0.5, random() - 0.5],
      size: [
        0.18 + random() * 0.075,
        row === 0 ? 0.07 : row === 1 ? 0.095 : 0.18,
        row === 0 ? 0.13 : row === 1 ? 0.045 : 0.085,
      ],
      material: row === 0 ? 1 : column % 5 === 0 ? 2 : 0,
      delay: 0.65 + random() * 17.5,
      captured: false,
    };
  });
  return {
    bodies,
    hole: [...hole],
    captureRadius: radius * 0.83,
    darkTime: 0,
    theme: null,
  };
}

export function resetCosmicDebris(simulation: CosmicDebrisSimulation) {
  simulation.darkTime = 0;
  simulation.theme = null;
  for (const body of simulation.bodies) {
    for (let axis = 0; axis < 3; axis++) {
      body.position[axis] = body.origin[axis];
      body.velocity[axis] = 0;
      body.rotation[axis] = 0;
      body.angularVelocity[axis] = 0;
    }
    body.captured = false;
  }
}

/** Mutates existing vectors; bounded semi-implicit integration allocates nothing. */
export function advanceCosmicDebris(
  simulation: CosmicDebrisSimulation,
  theme: Theme,
  delta: number,
) {
  if (!Number.isFinite(delta) || delta <= 0) return;
  if (simulation.theme !== theme) {
    simulation.darkTime = 0;
    simulation.theme = theme;
  }
  const elapsed = Math.min(delta, MAX_FRAME_DELTA);
  const steps = Math.ceil(elapsed / MAX_SUBSTEP);
  const dt = elapsed / steps;
  const { hole, bodies, captureRadius } = simulation;

  for (let step = 0; step < steps; step++) {
    if (theme === "dark") simulation.darkTime += dt;
    for (const body of bodies) {
      const { position, velocity, rotation, angularVelocity } = body;
      if (theme === "dark") {
        if (body.captured || simulation.darkTime < body.delay) continue;
        const dx = hole[0] - position[0];
        const dy = hole[1] - position[1];
        const dz = hole[2] - position[2];
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const distance = Math.sqrt(distanceSquared);
        const gravity = 18 / (distanceSquared + 1.8);
        // A small tangential force bends the path around the incoming axis.
        const planar = Math.max(Math.hypot(dx, dy), 0.4);
        const swirl = 0.42 / (1 + distance * 0.35);
        velocity[0] += ((dx / distance) * gravity - (dy / planar) * swirl) * dt;
        velocity[1] += ((dy / distance) * gravity + (dx / planar) * swirl) * dt;
        velocity[2] += (dz / distance) * gravity * dt;
        const speed = Math.hypot(...velocity);
        for (let axis = 0; axis < 3; axis++) {
          const targetSpin = body.spin[axis] * (0.3 + speed * 0.6);
          angularVelocity[axis] +=
            (targetSpin - angularVelocity[axis]) * dt * 2;
        }
      } else {
        body.captured = false;
        // Near-critical damping brings the original fragments back into place.
        for (let axis = 0; axis < 3; axis++) {
          velocity[axis] +=
            ((body.origin[axis] - position[axis]) * 1.6 -
              velocity[axis] * 2.65) *
            dt;
          angularVelocity[axis] +=
            (-rotation[axis] * 6 - angularVelocity[axis] * 5.5) * dt;
        }
      }

      const speed = Math.hypot(...velocity);
      const speedScale = speed > SPEED_LIMIT ? SPEED_LIMIT / speed : 1;
      for (let axis = 0; axis < 3; axis++) {
        velocity[axis] *= speedScale;
        position[axis] += velocity[axis] * dt;
        rotation[axis] += angularVelocity[axis] * dt;
        if (rotation[axis] > Math.PI) rotation[axis] -= Math.PI * 2;
        else if (rotation[axis] < -Math.PI) rotation[axis] += Math.PI * 2;
      }

      if (theme === "dark") {
        if (
          Math.hypot(
            hole[0] - position[0],
            hole[1] - position[1],
            hole[2] - position[2],
          ) <= captureRadius
        ) {
          body.captured = true;
          velocity[0] = velocity[1] = velocity[2] = 0;
          angularVelocity[0] = angularVelocity[1] = angularVelocity[2] = 0;
        }
      } else if (
        Math.hypot(
          body.origin[0] - position[0],
          body.origin[1] - position[1],
          body.origin[2] - position[2],
        ) < 0.002 &&
        speed < 0.006 &&
        Math.hypot(...rotation) < 0.005 &&
        Math.hypot(...angularVelocity) < 0.01
      ) {
        for (let axis = 0; axis < 3; axis++) {
          position[axis] = body.origin[axis];
          velocity[axis] = 0;
          rotation[axis] = 0;
          angularVelocity[axis] = 0;
        }
      }
    }
  }
}
