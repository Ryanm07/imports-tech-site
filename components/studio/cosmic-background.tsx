"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector2, type ShaderMaterial } from "three";
import {
  QUALITY_SETTINGS,
  assessFrameWindow,
  lowerStudioQuality,
  type StudioQuality,
} from "@/lib/studio-quality";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.99999, 1.0);
}`;

// One background pass: no textures, ray marching, bloom buffers or particle objects.
const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform vec2 uSize;
uniform float uTime;
uniform float uLight;
uniform float uLayers;
uniform float uWalk;
uniform vec2 uLook;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
}
float stars(vec2 p, float scale, float seed) {
  vec2 grid=p*scale, cell=floor(grid);
  float rnd=hash(cell+seed);
  vec2 offset=vec2(hash(cell+seed+2.0),hash(cell+seed+9.0));
  float d=length(fract(grid)-offset);
  float point=1.0-smoothstep(0.006,0.044,d);
  return point*step(0.87,rnd)*(0.45+0.55*rnd);
}
void main() {
  float aspect=uSize.x/uSize.y;
  vec2 uv=vUv;
  vec2 p=vec2(uv.x*aspect,uv.y);
  float mobile=1.0-step(0.85,aspect);
  vec2 center=vec2(0.80*aspect,mix(0.83,0.665,mobile));
  center+=uLook*0.025;
  vec2 q=p-center;
  float tilt=-0.14;
  q=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*q;
  float radius=mix(0.092,0.049,mobile)*(1.0+0.08*uWalk);
  float r=length(q)/radius;
  float angle=atan(q.y,q.x);
  float direction=mix(1.0,-1.0,uLight);
  float time=uTime*direction;

  vec3 night=vec3(0.015,0.026,0.063);
  vec3 day=vec3(0.84,0.89,0.93);
  vec3 col=mix(night,day,uLight);
  float clouds=noise(p*3.3+vec2(0.0,uTime*0.002));
  if(uLayers>1.5) clouds=clouds*0.7+noise(p*7.0+1.0)*0.3;
  float veil=pow(max(0.0,clouds-0.22),2.0);
  col+=mix(vec3(0.055,0.075,0.14),vec3(0.055,0.035,0.005),uLight)*veil;
  float s=stars(p,36.0,1.0);
  if(uLayers>1.5) s+=stars(p,68.0,13.0)*0.5;
  if(uLayers>2.5) s+=stars(p,112.0,41.0)*0.3;
  col+=mix(vec3(0.65,0.75,0.96),vec3(0.17,0.14,0.08),uLight)*s;

  // Golden plasma: radial phase travels inward in dark mode, outward in light mode.
  float spiral=pow(0.5+0.5*sin(angle*6.0+r*3.1+time*0.50),12.0);
  float stream=spiral*exp(-r*0.65)*smoothstep(0.9,1.3,r);
  float diskR=length(vec2(q.x,q.y*4.6))/radius;
  float diskAngle=atan(q.y*4.6,q.x);
  float band=exp(-pow((diskR-2.0)*1.05,2.0));
  float streak=0.48+0.52*pow(0.5+0.5*sin(diskR*34.0+diskAngle*3.0+time*1.3),3.0);
  float disk=band*streak;
  float photon=exp(-abs(r-1.02)*52.0);
  float glow=exp(-abs(r-1.05)*3.2)*0.25;
  vec3 gold=vec3(1.0,0.56,0.15);
  vec3 hot=vec3(1.0,0.9,0.64);
  col+=gold*(stream*0.45+disk*0.95+glow)*(1.0-uLight*0.86)+hot*photon*0.95*(1.0-uLight*0.6);
  col-=vec3(0.06,0.21,0.40)*(disk*0.75+stream*0.35)*uLight;
  float core=1.0-smoothstep(0.95,1.005,r);
  vec3 coreColor=mix(vec3(0.002,0.003,0.008),vec3(1.0,0.995,0.92),uLight);
  col=mix(col,coreColor,core);
  // Near edge of the accretion disk crosses the lower rim of the core.
  float nearDisk=disk*(1.0-smoothstep(-0.015,0.02,q.y))*(1.0-smoothstep(0.10,0.22,abs(q.y)/radius));
  col+=hot*nearDisk*0.55;
  col+=hot*uLight*exp(-r*1.3)*0.12;
  float vignette=(1.0-smoothstep(0.15,0.9,length(uv-0.5)));
  col*=mix(0.76+0.24*vignette,1.0,uLight);
  gl_FragColor=vec4(col,1.0);
}`;

export function CosmicBackground({
  theme,
  mode,
  quality,
  reducedMotion,
  paused,
  onDegrade,
}: {
  theme: "light" | "dark";
  mode: "overview" | "walk";
  quality: StudioQuality;
  reducedMotion: boolean;
  paused: boolean;
  onDegrade: (quality: StudioQuality) => void;
}) {
  const { size, invalidate, camera, gl } = useThree();
  const settings = QUALITY_SETTINGS[quality];
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uSize: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uLight: { value: 0 },
      uLayers: { value: 1 },
      uWalk: { value: 0 },
      uLook: { value: new Vector2() },
    }),
    [],
  );
  const lastFrame = useRef(0);
  const intervals = useRef<number[]>([]);
  const stalledFrames = useRef(0);
  const active = useRef(false);
  const motion = !reducedMotion && !paused && settings.fps > 0;
  useEffect(() => {
    invalidate();
  }, [size, settings.stars, invalidate]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearTimeout(timer);
      active.current = false;
      gl.domElement.setAttribute("data-cosmic-running", "false");
      lastFrame.current = 0;
      intervals.current = [];
      stalledFrames.current = 0;
    };
    const wake = () => {
      stop();
      if (!motion || document.hidden) return;
      active.current = true;
      gl.domElement.setAttribute("data-cosmic-running", "true");
      const tick = () => {
        invalidate();
        timer = setTimeout(tick, 1000 / settings.fps);
      };
      tick();
    };
    wake();
    document.addEventListener("visibilitychange", wake);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [motion, settings.fps, invalidate, gl]);

  useEffect(() => {
    invalidate();
  }, [theme, mode, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    if (document.hidden) return;
    const shader = material.current;
    const live = shader?.uniforms;
    const k = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 5);
    const light = theme === "light" ? 1 : 0;
    const walk = mode === "walk" ? 1 : 0;
    if (live) {
      live.uSize.value.set(size.width, size.height);
      live.uLayers.value = settings.stars;
      live.uLight.value += (light - live.uLight.value) * k;
      live.uWalk.value += (walk - live.uWalk.value) * k;
      live.uLook.value.set(camera.quaternion.y, camera.quaternion.x);
      if (
        Math.abs(light - live.uLight.value) > 0.002 ||
        Math.abs(walk - live.uWalk.value) > 0.002
      )
        invalidate();
      if (active.current) live.uTime.value += Math.min(delta, 0.08);
    }
    if (paused || quality === "basic") {
      lastFrame.current = 0;
      intervals.current = [];
      stalledFrames.current = 0;
      return;
    }
    const now = performance.now();
    const gap = now - lastFrame.current;
    // Continuously requested frames may be too slow to fill a normal window.
    // Isolated stalls and idle demand-rendering gaps don't count.
    stalledFrames.current =
      active.current && lastFrame.current > 0 && gap > 250
        ? stalledFrames.current + 1
        : 0;
    if (stalledFrames.current >= 8) {
      stalledFrames.current = 0;
      onDegrade(lowerStudioQuality(quality));
    }
    if (gap > 250) intervals.current = [];
    else if (lastFrame.current) intervals.current.push(gap);
    lastFrame.current = now;
    if (intervals.current.length >= 72) {
      gl.domElement.setAttribute(
        "data-render-fps",
        (
          1000 /
          (intervals.current.reduce((sum, value) => sum + value, 0) /
            intervals.current.length)
        ).toFixed(1),
      );
      gl.domElement.setAttribute(
        "data-render-calls",
        String(gl.info.render.calls),
      );
      const next = assessFrameWindow(
        quality,
        intervals.current,
        active.current ? settings.fps : 30,
      );
      intervals.current = [];
      if (next !== quality) onDegrade(next);
    }
  });
  if (quality === "basic") return null;
  return (
    <mesh frustumCulled={false} renderOrder={-1000} raycast={() => {}}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
