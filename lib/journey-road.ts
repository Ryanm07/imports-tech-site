export type RoadSpring = { offset: number; velocity: number };

export function stepRoadSpring(
  spring: RoadSpring,
  force: number,
  seconds: number,
): RoadSpring {
  const dt = Math.min(
    Math.max(Number.isFinite(seconds) ? seconds : 0, 0),
    1 / 30,
  );
  const safeForce = Number.isFinite(force)
    ? Math.max(-1800, Math.min(1800, force))
    : 0;
  const offset = Number.isFinite(spring.offset) ? spring.offset : 0;
  const velocity =
    (Number.isFinite(spring.velocity) ? spring.velocity : 0) +
    (safeForce - offset * 115) * dt;
  const nextVelocity = velocity * Math.exp(-8 * dt);
  return {
    offset: Math.max(-64, Math.min(64, offset + nextVelocity * dt)),
    velocity: nextVelocity,
  };
}
