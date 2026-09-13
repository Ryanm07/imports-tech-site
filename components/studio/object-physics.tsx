"use client";
/* eslint-disable react-hooks/immutability -- Imperative Three.js transforms and the simulation are updated outside React rendering. */
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, PerspectiveCamera, Vector3, type Group } from "three";
import { createStudioPhysics } from "@/lib/studio-physics";
import { createStudioGestures } from "@/lib/studio-gestures";
import { ObjectTrails } from "./object-trails";
import type { StudioMode, StudioTheme } from "@/lib/studio-navigation";
import type { StudioQuality } from "@/lib/studio-quality";
import type {
  StudioObjectActions,
  StudioObjectBridge,
} from "./object-interaction-context";

type Props = {
  bridge: StudioObjectBridge;
  actionsRef: MutableRefObject<StudioObjectActions | null>;
  mode: StudioMode;
  theme: StudioTheme;
  quality: StudioQuality;
  paused: boolean;
  reducedMotion: boolean;
  onHeldChange: (id: string | null) => void;
  onInteractionReady: (ready: boolean) => void;
  onSelect: (id: string) => void;
};
type Binding = { group: Group; home: Vector3; offset: Vector3 };

export default function ObjectPhysics(props: Props) {
  const { camera, gl, invalidate } = useThree();
  const config = useRef(props);
  useEffect(() => {
    config.current = props;
  }, [props]);
  const engine = useMemo(() => createStudioPhysics({}), []);
  const bindings = useMemo(() => new Map<string, Binding>(), []);
  const scratch = useMemo(
    () => ({
      box: new Box3(),
      center: new Vector3(),
      origin: new Vector3(),
      direction: new Vector3(),
      target: new Vector3(),
    }),
    [],
  );
  const resume = useRef(true);
  const lastHeld = useRef<string | null>(null);
  const dragged = useRef(false);
  const touch = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const controls = useMemo(() => {
    function syncObjects() {
      for (const [id, binding] of bindings) {
        if (props.bridge.objects.get(id) !== binding.group) {
          binding.group.position.copy(binding.home);
          engine.unregister(id);
          bindings.delete(id);
        }
      }
      for (const [id, group] of props.bridge.objects) {
        if (bindings.has(id)) continue;
        group.updateWorldMatrix(true, true);
        scratch.box.setFromObject(group);
        if (scratch.box.isEmpty()) continue;
        scratch.box.getCenter(scratch.center);
        scratch.box.getSize(scratch.target);
        group.getWorldPosition(scratch.origin);
        if (id === "earbuds") {
          // The case is the collider; its hinged lid never changes the resting height.
          scratch.center.set(0, 0.034, 0);
          group.localToWorld(scratch.center);
          scratch.target.set(0.17, 0.068, 0.15);
        }
        bindings.set(id, {
          group,
          home: group.position.clone(),
          offset: scratch.origin.clone().sub(scratch.center),
        });
        engine.register({
          id,
          home: scratch.center.toArray(),
          radius: Math.max(0.06, scratch.target.length() * 0.5),
          halfHeight: Math.max(0.01, scratch.target.y * 0.5),
        });
      }
    }
    function report() {
      if (lastHeld.current !== engine.heldId) {
        lastHeld.current = engine.heldId;
        config.current.onHeldChange(engine.heldId);
      }
      gl.domElement.dataset.heldObject = engine.heldId ?? "";
      gl.domElement.dataset.physicsActive = String(engine.activeCount);
    }
    function placeHeld() {
      const body = engine.heldId ? engine.get(engine.heldId) : undefined;
      if (!body) return;
      camera.getWorldDirection(scratch.direction);
      const framingDistance =
        camera instanceof PerspectiveCamera
          ? (body.radius /
              (Math.tan((camera.fov * Math.PI) / 360) *
                Math.min(1, camera.aspect))) *
            1.15
          : 0;
      scratch.target
        .copy(camera.position)
        .addScaledVector(
          scratch.direction,
          Math.max(0.75 + body.radius * 1.5, framingDistance),
        );
      scratch.target.y -= 0.16;
      engine.setHeldPosition(scratch.target.toArray());
    }
    function write() {
      for (const body of engine.bodies) {
        const binding = bindings.get(body.id);
        if (!binding) continue;
        const { group, offset } = binding;
        group.visible = body.state !== "captured";
        if (body.state === "flying" || body.state === "returning") {
          scratch.target.set(...body.previousPosition);
          scratch.center.set(...body.position);
          scratch.target.lerp(scratch.center, engine.interpolationAlpha);
        } else scratch.target.set(...body.position);
        scratch.target.add(offset);
        group.parent?.worldToLocal(scratch.target);
        group.position.copy(scratch.target);
      }
      report();
    }
    function release(drop: boolean) {
      if (!engine.heldId) return;
      placeHeld();
      camera.getWorldDirection(scratch.direction);
      engine.release(
        drop ? null : scratch.direction.toArray(),
        config.current.reducedMotion ? "basic" : config.current.quality,
      );
      report();
      invalidate();
    }
    const actions: StudioObjectActions = {
      pick(id) {
        if (config.current.mode !== "walk") return false;
        syncObjects();
        if (
          !engine.pick(
            id,
            config.current.reducedMotion ? "basic" : config.current.quality,
          )
        )
          return false;
        placeHeld();
        report();
        invalidate();
        return true;
      },
      throw: () => release(false),
      drop: () => release(true),
      restore() {
        gestures.cancel();
        engine.restore();
        write();
        invalidate();
      },
      click(id, isTouch = touch.current) {
        if (
          config.current.mode !== "walk" ||
          config.current.paused ||
          dragged.current
        )
          return;
        gestures.click(id, isTouch);
      },
    };
    // The factory only stores callbacks; it never reads a ref during rendering.
    // eslint-disable-next-line react-hooks/refs
    const gestures = createStudioGestures({
      isHolding: () => Boolean(engine.heldId),
      select: (id) => config.current.onSelect(id),
      pick: actions.pick,
      throw: actions.throw,
    });
    return { actions, gestures, syncObjects, placeHeld, write };
  }, [bindings, engine, scratch, camera, gl, invalidate, props.bridge]);

  useEffect(() => {
    props.bridge.actions = controls.actions;
    props.actionsRef.current = controls.actions;
    controls.syncObjects();
    config.current.onInteractionReady(true);
    const canvas = gl.domElement;
    let startX = 0,
      startY = 0;
    const down = (event: PointerEvent) => {
      startX = event.clientX;
      startY = event.clientY;
      dragged.current = false;
      touch.current = event.pointerType === "touch";
    };
    const move = (event: PointerEvent) => {
      if (
        event.buttons &&
        Math.hypot(event.clientX - startX, event.clientY - startY) >= 6
      ) {
        dragged.current = true;
        controls.gestures.cancel();
      }
    };
    const cancel = () => {
      controls.gestures.cancel();
      resume.current = true;
      clearTimeout(timer.current);
      timer.current = undefined;
    };
    const visibility = () => {
      cancel();
      if (!document.hidden) invalidate();
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    canvas.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", visibility);
    invalidate();
    return () => {
      cancel();
      engine.restore();
      controls.write();
      props.bridge.actions = null;
      props.actionsRef.current = null;
      config.current.onInteractionReady(false);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [controls, engine, gl, invalidate, props.bridge, props.actionsRef]);

  useEffect(() => {
    controls.gestures.cancel();
    resume.current = true;
    if (props.mode !== "walk") controls.actions.drop();
    // Enforce a lower active-body budget immediately, even while a panel is open.
    engine.step(0, props.reducedMotion ? "basic" : props.quality, props.theme);
    controls.write();
    invalidate();
  }, [
    props.mode,
    props.paused,
    props.quality,
    props.reducedMotion,
    props.theme,
    controls,
    engine,
    invalidate,
  ]);

  useFrame((_, delta) => {
    controls.syncObjects();
    if (props.paused || document.hidden) {
      resume.current = true;
      return;
    }
    controls.placeHeld();
    if (resume.current) resume.current = false;
    else
      engine.step(
        delta,
        props.reducedMotion ? "basic" : props.quality,
        props.theme,
      );
    controls.write();
    // Sleeping scenes request no more frames. A single timer wakes active physics.
    if (
      engine.bodies.some(
        (body) => body.state === "flying" || body.state === "returning",
      ) &&
      timer.current === undefined
    ) {
      timer.current = setTimeout(
        () => {
          timer.current = undefined;
          invalidate();
        },
        props.quality === "basic" || props.quality === "low"
          ? 1000 / 24
          : 1000 / 60,
      );
    }
  }, -0.5);
  return props.quality === "ultra" && !props.reducedMotion ? (
    <ObjectTrails engine={engine} paused={props.paused} />
  ) : null;
}
