import type { StudioTheme } from "./studio-navigation";
import type { StudioQuality } from "./studio-quality";
import { HOLE_POSITION, HOLE_RADIUS } from "./cosmic-space";

export type PhysicsVec3 = [number, number, number];
export type StudioBodyState =
  | "resting"
  | "held"
  | "flying"
  | "captured"
  | "returning";
export type StudioBody = {
  id: string;
  home: PhysicsVec3;
  radius: number;
  halfHeight: number;
  position: PhysicsVec3;
  previousPosition: PhysicsVec3;
  velocity: PhysicsVec3;
  state: StudioBodyState;
  age: number;
  activation: number;
  arcStart: PhysicsVec3;
  arcEnd: PhysicsVec3;
  arcDuration: number;
};
export type StudioPhysicsOptions = {
  holePosition?: readonly [number, number, number];
  desk?: {
    min: readonly [number, number, number];
    max: readonly [number, number, number];
  };
};

export const STUDIO_BODY_LIMITS: Record<StudioQuality, number> = {
  basic: 1,
  low: 2,
  medium: 4,
  high: 6,
  ultra: 8,
};

const BOUNDS = { minX: -3.3, maxX: 3.3, minZ: -2.6, maxZ: 3.3 };
const MAX_SPEED = 14;
const GRAVITY = 5.5;
const copy = (target: PhysicsVec3, source: readonly number[]) => {
  target[0] = source[0];
  target[1] = source[1];
  target[2] = source[2];
};
const isMoving = (body: StudioBody) =>
  body.state === "held" ||
  body.state === "flying" ||
  body.state === "returning";
const finiteVector = (value: readonly number[]) =>
  value.length === 3 && value.every(Number.isFinite);

/** Small, fixed-budget proxies. The detailed visual meshes never become colliders. */
export class StudioPhysics {
  readonly bodies: StudioBody[] = [];
  private readonly lookup = new Map<string, StudioBody>();
  private readonly hole: readonly [number, number, number];
  private readonly desk: NonNullable<StudioPhysicsOptions["desk"]>;
  private accumulator = 0;
  private sequence = 0;
  private quality: StudioQuality = "medium";
  heldId: string | null = null;
  interpolationAlpha = 0;

  constructor(options: StudioPhysicsOptions = {}) {
    this.hole = options.holePosition ?? HOLE_POSITION;
    this.desk = options.desk ?? {
      min: [-1.525, 0.7175, -2.075],
      max: [1.525, 0.8125, -0.925],
    };
  }

  get activeCount() {
    let count = 0;
    for (const body of this.bodies) if (isMoving(body)) count++;
    return count;
  }

  get(id: string) {
    return this.lookup.get(id);
  }

  register({
    id,
    home,
    radius,
    halfHeight = radius,
  }: {
    id: string;
    home: readonly [number, number, number];
    radius: number;
    halfHeight?: number;
  }) {
    const existing = this.lookup.get(id);
    if (existing) return existing;
    if (
      !finiteVector(home) ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      !Number.isFinite(halfHeight) ||
      halfHeight <= 0
    ) {
      throw new RangeError(
        "An object needs a finite home position and positive radius.",
      );
    }
    const body: StudioBody = {
      id,
      home: [...home],
      radius: Math.min(radius, 0.75),
      halfHeight: Math.min(halfHeight, radius),
      position: [...home],
      previousPosition: [...home],
      velocity: [0, 0, 0],
      state: "resting",
      age: 0,
      activation: 0,
      arcStart: [...home],
      arcEnd: [...home],
      arcDuration: 0,
    };
    this.bodies.push(body);
    this.lookup.set(id, body);
    return body;
  }

  unregister(id: string) {
    const body = this.lookup.get(id);
    if (!body) return;
    if (this.heldId === id) this.heldId = null;
    this.bodies.splice(this.bodies.indexOf(body), 1);
    this.lookup.delete(id);
  }

  pick(id: string, quality: StudioQuality): boolean {
    const body = this.lookup.get(id);
    if (!body || body.state === "captured") return false;
    if (this.heldId && this.heldId !== id) this.release(null, quality);
    this.quality = quality;
    this.heldId = id;
    body.state = "held";
    body.activation = ++this.sequence;
    body.age = 0;
    body.arcDuration = 0;
    body.velocity.fill(0);
    copy(body.previousPosition, body.position);
    this.enforceLimit(quality);
    return true;
  }

  setHeldPosition(position: readonly [number, number, number]) {
    if (!this.heldId || !finiteVector(position)) return;
    const body = this.lookup.get(this.heldId)!;
    copy(body.position, position);
    if (this.quality === "basic") this.clampToRoom(body);
    copy(body.previousPosition, body.position);
  }

  release(
    direction: readonly [number, number, number] | null,
    quality: StudioQuality,
  ) {
    const body = this.heldId ? this.lookup.get(this.heldId) : undefined;
    if (!body) return false;
    this.heldId = null;
    this.quality = quality;
    body.state = "flying";
    body.age = 0;
    body.arcDuration = 0;
    const magnitude =
      direction && finiteVector(direction) ? Math.hypot(...direction) : 0;
    for (let axis = 0; axis < 3; axis++) {
      body.velocity[axis] =
        magnitude && direction ? (direction[axis] / magnitude) * 9.5 : 0;
    }
    if (magnitude) body.velocity[1] += 1.2;
    if (quality === "basic") this.beginArc(body, magnitude ? 0.75 : 0.45);
    this.enforceLimit(quality);
    return true;
  }

  restore(id?: string) {
    if (id !== undefined) {
      const body = this.lookup.get(id);
      if (body) this.resetBody(body);
    } else {
      for (const body of this.bodies) this.resetBody(body);
      this.accumulator = 0;
      this.interpolationAlpha = 0;
    }
  }

  private resetBody(body: StudioBody) {
    if (this.heldId === body.id) this.heldId = null;
    copy(body.position, body.home);
    copy(body.previousPosition, body.home);
    body.velocity.fill(0);
    body.state = "resting";
    body.age = 0;
    body.arcDuration = 0;
  }

  private enforceLimit(quality: StudioQuality) {
    let count = this.activeCount;
    while (count > STUDIO_BODY_LIMITS[quality]) {
      let oldest: StudioBody | undefined;
      for (const body of this.bodies) {
        if (
          isMoving(body) &&
          body.state !== "held" &&
          (!oldest || body.activation < oldest.activation)
        )
          oldest = body;
      }
      if (!oldest) break;
      this.resetBody(oldest);
      count--;
    }
  }

  private clampToRoom(body: StudioBody) {
    const p = body.position;
    p[0] = Math.max(
      BOUNDS.minX + body.radius,
      Math.min(BOUNDS.maxX - body.radius, p[0]),
    );
    p[2] = Math.max(
      BOUNDS.minZ + body.radius,
      Math.min(BOUNDS.maxZ - body.radius, p[2]),
    );
    p[1] = Math.max(body.halfHeight, p[1]);
  }

  private beginArc(body: StudioBody, duration: number) {
    this.clampToRoom(body);
    copy(body.arcStart, body.position);
    copy(body.arcEnd, body.position);
    const horizontal = Math.hypot(body.velocity[0], body.velocity[2]);
    if (horizontal > 0) {
      body.arcEnd[0] += (body.velocity[0] / horizontal) * 1.7;
      body.arcEnd[2] += (body.velocity[2] / horizontal) * 1.7;
    }
    body.arcEnd[0] = Math.max(
      BOUNDS.minX + body.radius,
      Math.min(BOUNDS.maxX - body.radius, body.arcEnd[0]),
    );
    body.arcEnd[2] = Math.max(
      BOUNDS.minZ + body.radius,
      Math.min(BOUNDS.maxZ - body.radius, body.arcEnd[2]),
    );
    const overDesk =
      body.arcEnd[0] >= this.desk.min[0] &&
      body.arcEnd[0] <= this.desk.max[0] &&
      body.arcEnd[2] >= this.desk.min[2] &&
      body.arcEnd[2] <= this.desk.max[2];
    body.arcEnd[1] = (overDesk ? this.desk.max[1] : 0) + body.halfHeight;
    body.arcDuration = duration;
    body.age = 0;
  }

  step(delta: number, quality: StudioQuality, theme: StudioTheme): number {
    if (!Number.isFinite(delta) || delta < 0) return 0;
    this.quality = quality;
    this.enforceLimit(quality);
    for (const body of this.bodies) {
      if (body.state === "captured" && theme === "light") {
        body.state = "returning";
        body.age = 0;
        body.activation = ++this.sequence;
      }
      if (quality !== "basic") {
        // An economy trajectory is valid only while that mode remains active.
        // Returning to it must start from the current physical position.
        body.arcDuration = 0;
        continue;
      }
      if (body.state === "captured") this.resetBody(body);
      const displacedResting =
        body.state === "resting" &&
        body.position.some((value, axis) => value !== body.home[axis]);
      if (body.state === "held" || displacedResting) {
        this.clampToRoom(body);
        copy(body.previousPosition, body.position);
      }
      if (
        (body.state === "flying" || body.state === "returning") &&
        !body.arcDuration
      ) {
        // Apply containment even for a paused quality change (delta = 0).
        this.beginArc(body, 0.75);
        copy(body.previousPosition, body.position);
      }
    }
    this.enforceLimit(quality);
    if (delta === 0) return 0;
    if (
      !this.bodies.some(
        (body) => body.state === "flying" || body.state === "returning",
      )
    ) {
      this.accumulator = 0;
      this.interpolationAlpha = 0;
      return 0;
    }
    const fixed =
      quality === "basic"
        ? 1 / 20
        : quality === "high" || quality === "ultra"
          ? 1 / 60
          : 1 / 30;
    this.accumulator = Math.min(this.accumulator + Math.min(delta, 0.1), 0.1);
    let steps = 0;
    while (this.accumulator + 1e-9 >= fixed && steps < 6) {
      for (const body of this.bodies) {
        if (body.state !== "flying" && body.state !== "returning") continue;
        copy(body.previousPosition, body.position);
        if (quality === "basic") {
          if (!body.arcDuration) this.beginArc(body, 0.75);
          body.age += fixed;
          const progress = Math.min(1, body.age / body.arcDuration);
          for (let axis = 0; axis < 3; axis++) {
            body.position[axis] =
              body.arcStart[axis] +
              (body.arcEnd[axis] - body.arcStart[axis]) * progress;
          }
          body.position[1] += 0.9 * 4 * progress * (1 - progress);
          this.clampToRoom(body);
          if (progress === 1) this.sleep(body);
        } else {
          body.age += fixed;
          this.advanceBody(body, fixed, theme);
        }
      }
      if (quality === "high" || quality === "ultra") this.resolvePairs();
      this.accumulator = Math.max(0, this.accumulator - fixed);
      steps++;
    }
    this.interpolationAlpha = Math.min(1, this.accumulator / fixed);
    return steps;
  }

  private sleep(body: StudioBody) {
    body.state = "resting";
    body.velocity.fill(0);
    copy(body.previousPosition, body.position);
  }

  private advanceBody(body: StudioBody, delta: number, theme: StudioTheme) {
    const p = body.position;
    const v = body.velocity;
    if (body.state === "returning") {
      const dx = body.home[0] - p[0],
        dy = body.home[1] - p[1],
        dz = body.home[2] - p[2];
      const distance = Math.hypot(dx, dy, dz);
      if (distance < 0.035 || body.age > 8) {
        this.resetBody(body);
        return;
      }
      const speed = Math.min(10, distance * 3);
      v[0] = (dx / distance) * speed;
      v[1] = (dy / distance) * speed;
      v[2] = (dz / distance) * speed;
    } else {
      v[1] -= GRAVITY * delta;
      const dx = this.hole[0] - p[0],
        dy = this.hole[1] - p[1],
        dz = this.hole[2] - p[2];
      const distance = Math.hypot(dx, dy, dz);
      // The field starts beyond the open edges; equipment resting inside stays put.
      if ((p[2] > BOUNDS.maxZ || p[0] > BOUNDS.maxX) && distance < 11) {
        if (theme === "dark" && distance < HOLE_RADIUS + body.radius) {
          body.state = "captured";
          body.velocity.fill(0);
          copy(body.previousPosition, p);
          return;
        }
        const force = Math.min(18, 22 / (1 + distance * distance * 0.03));
        const direction = theme === "dark" ? 1 : -1;
        if (distance > 0.001) {
          v[0] += (dx / distance) * force * direction * delta;
          v[1] += ((dy / distance) * force * direction + GRAVITY * 0.9) * delta;
          v[2] += (dz / distance) * force * direction * delta;
        }
      }
    }
    const speed = Math.hypot(...v);
    if (speed > MAX_SPEED)
      for (let axis = 0; axis < 3; axis++) v[axis] *= MAX_SPEED / speed;
    for (let axis = 0; axis < 3; axis++) p[axis] += v[axis] * delta;
    if (body.state === "returning") return;
    this.resolveRoom(body, delta);
    if (body.age > 14 || p[1] < -8 || Math.hypot(...p) > 28)
      this.resetBody(body);
  }

  private resolveRoom(body: StudioBody, delta: number) {
    const p = body.position,
      prev = body.previousPosition,
      v = body.velocity,
      r = body.radius,
      height = body.halfHeight;
    const onFloor = p[0] >= -3.5 && p[0] <= 3.5 && p[2] >= -2.8 && p[2] <= 3.4;
    let supported = false;
    if (onFloor && p[1] < height && prev[1] >= height - 0.02) {
      p[1] = height;
      v[1] = Math.abs(v[1]) < 0.65 ? 0 : Math.abs(v[1]) * 0.22;
      supported = true;
    }
    if (p[1] < 3.1 + r && p[1] > -r) {
      if (
        p[0] >= -3.5 &&
        p[0] <= 3.5 &&
        prev[2] >= -2.67 + r &&
        p[2] < -2.67 + r
      ) {
        p[2] = -2.67 + r;
        v[2] = Math.abs(v[2]) * 0.3;
      }
      if (
        p[2] >= -2.8 &&
        p[2] <= 3.4 &&
        prev[0] >= -3.37 + r &&
        p[0] < -3.37 + r
      ) {
        p[0] = -3.37 + r;
        v[0] = Math.abs(v[0]) * 0.3;
      }
    }
    // Swept plane tests catch fast throws through the thin tabletop without CCD on every item.
    for (let axis = 0; axis < 3; axis++) {
      const a = (axis + 1) % 3,
        b = (axis + 2) % 3;
      if (
        p[a] < this.desk.min[a] - r ||
        p[a] > this.desk.max[a] + r ||
        p[b] < this.desk.min[b] - r ||
        p[b] > this.desk.max[b] + r
      )
        continue;
      const top = this.desk.max[axis] + (axis === 1 ? height : r);
      const bottom = this.desk.min[axis] - (axis === 1 ? height : r);
      if (prev[axis] >= top - 1e-6 && p[axis] < top) {
        p[axis] = top;
        v[axis] = Math.abs(v[axis]) < 0.65 ? 0 : Math.abs(v[axis]) * 0.22;
        if (axis === 1) supported = true;
      } else if (prev[axis] <= bottom + 1e-6 && p[axis] > bottom) {
        p[axis] = bottom;
        v[axis] = -Math.abs(v[axis]) * 0.22;
      }
    }
    if (supported) {
      const friction = Math.exp(-8 * delta);
      v[0] *= friction;
      v[2] *= friction;
      if (Math.hypot(...v) < 0.08) this.sleep(body);
    }
  }

  private resolvePairs() {
    for (let first = 0; first < this.bodies.length; first++) {
      const a = this.bodies[first];
      if (a.state !== "flying") continue;
      for (let second = first + 1; second < this.bodies.length; second++) {
        const b = this.bodies[second];
        if (b.state !== "flying") continue;
        const separation = a.radius + b.radius;
        let dx = b.position[0] - a.position[0],
          dy = b.position[1] - a.position[1],
          dz = b.position[2] - a.position[2];
        let distance = Math.hypot(dx, dy, dz);
        if (distance >= separation) {
          // Only fast pairs need a swept sphere test; there are at most 28 pairs.
          const px = b.previousPosition[0] - a.previousPosition[0],
            py = b.previousPosition[1] - a.previousPosition[1],
            pz = b.previousPosition[2] - a.previousPosition[2];
          const sx = dx - px,
            sy = dy - py,
            sz = dz - pz;
          const speedSquared = sx * sx + sy * sy + sz * sz;
          if (speedSquared < separation * separation) continue;
          const projected = 2 * (px * sx + py * sy + pz * sz);
          const offset = px * px + py * py + pz * pz - separation * separation;
          const discriminant =
            projected * projected - 4 * speedSquared * offset;
          if (offset <= 0 || discriminant < 0) continue;
          const hit =
            (-projected - Math.sqrt(discriminant)) / (2 * speedSquared);
          if (hit < 0 || hit > 1) continue;
          for (let axis = 0; axis < 3; axis++) {
            a.position[axis] =
              a.previousPosition[axis] +
              (a.position[axis] - a.previousPosition[axis]) * hit;
            b.position[axis] =
              b.previousPosition[axis] +
              (b.position[axis] - b.previousPosition[axis]) * hit;
          }
          dx = b.position[0] - a.position[0];
          dy = b.position[1] - a.position[1];
          dz = b.position[2] - a.position[2];
          distance = Math.hypot(dx, dy, dz);
        }
        const nx = distance > 1e-6 ? dx / distance : 1;
        const ny = distance > 1e-6 ? dy / distance : 0;
        const nz = distance > 1e-6 ? dz / distance : 0;
        const overlap = (separation - distance) * 0.5;
        a.position[0] -= nx * overlap;
        b.position[0] += nx * overlap;
        a.position[1] -= ny * overlap;
        b.position[1] += ny * overlap;
        a.position[2] -= nz * overlap;
        b.position[2] += nz * overlap;
        const relative =
          (b.velocity[0] - a.velocity[0]) * nx +
          (b.velocity[1] - a.velocity[1]) * ny +
          (b.velocity[2] - a.velocity[2]) * nz;
        if (relative < 0) {
          const impulse = -relative * 0.65;
          a.velocity[0] -= nx * impulse;
          b.velocity[0] += nx * impulse;
          a.velocity[1] -= ny * impulse;
          b.velocity[1] += ny * impulse;
          a.velocity[2] -= nz * impulse;
          b.velocity[2] += nz * impulse;
        }
      }
    }
  }
}

export const createStudioPhysics = (options?: StudioPhysicsOptions) =>
  new StudioPhysics(options);
