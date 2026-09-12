export const cosmicVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.99999, 1.0);
}`;

// Analytic sphere and disk intersections keep every tier in the same 3D space.
// Ultra adds turbulence and an artistic lens approximation, without ray marching.
export const cosmicFragmentShader = `
precision highp float;
varying vec2 vUv;
uniform mat4 uCameraWorld;
uniform mat4 uProjectionInverse;
uniform vec3 uHole;
uniform float uRadius;
uniform float uTime;
uniform float uLight;
uniform float uLayers;
uniform float uUltra;

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
  return (1.0-smoothstep(0.006,0.044,d))*step(0.87,rnd)*(0.45+0.55*rnd);
}
void main() {
  vec4 view=uProjectionInverse*vec4(vUv*2.0-1.0,1.0,1.0);
  vec3 ray=normalize(mat3(uCameraWorld)*(view.xyz/view.w));
  vec3 origin=uCameraWorld[3].xyz;
  vec3 toHole=uHole-origin;
  float along=dot(toHole,ray);
  vec3 closest=ray*along-toHole;
  float r=length(closest)/uRadius;
  float inFront=step(0.0,along);
  float time=uTime;
  vec3 skyRay=ray;
  if(uUltra>0.5 && along>0.0) {
    // A local distortion around the horizon; not a general-relativity solver.
    float bend=0.12*exp(-abs(r-1.3)*1.8);
    skyRay=normalize(ray+normalize(toHole)*bend);
  }
  vec2 sky=vec2(atan(skyRay.z,skyRay.x),asin(clamp(skyRay.y,-1.0,1.0)))*0.6;
  vec3 night=vec3(0.012,0.022,0.049);
  vec3 day=vec3(0.84,0.89,0.93);
  vec3 col=mix(night,day,uLight);
  float clouds=noise(sky*3.3);
  if(uLayers>1.5) clouds=clouds*0.7+noise(sky*7.0+1.0)*0.3;
  float veil=pow(max(0.0,clouds-0.22),2.0);
  col+=mix(vec3(0.05,0.06,0.13),vec3(0.055,0.035,0.005),uLight)*veil;
  float s=stars(sky,36.0,1.0);
  if(uLayers>1.5) s+=stars(sky,68.0,13.0)*0.5;
  if(uLayers>2.5) s+=stars(sky,112.0,41.0)*0.3;
  if(uLayers>3.5) s+=stars(sky,175.0,71.0)*0.24;
  col+=mix(vec3(0.65,0.75,0.96),vec3(0.17,0.14,0.08),uLight)*s;

  vec3 normal=normalize(vec3(0.08,1.0,0.24));
  vec3 axisX=normalize(cross(normal,vec3(0.0,0.0,1.0)));
  vec3 axisY=cross(normal,axisX);
  float angle=atan(dot(closest,axisY),dot(closest,axisX));
  vec3 gold=vec3(1.0,0.54,0.12);
  vec3 hot=vec3(1.0,0.90,0.64);
  float stream=pow(0.5+0.5*sin(angle*5.0+r*3.1+time*0.55),10.0);
  stream*=exp(-r*0.65)*smoothstep(0.95,1.4,r)*inFront;
  float photon=exp(-abs(r-1.015)*55.0)*inFront;
  float glow=exp(-abs(r-1.08)*3.2)*0.22*inFront;
  col+=gold*(stream*0.48+glow)*(1.0-uLight*0.8);
  col+=hot*photon*(1.0-uLight*0.55);

  float sphereNear=-1.0;
  if(along>0.0 && r<1.0) {
    sphereNear=along-uRadius*sqrt(max(0.0,1.0-r*r));
    vec3 core=mix(vec3(0.001,0.002,0.005),vec3(1.0,0.995,0.93),uLight);
    col=mix(col,core,1.0-smoothstep(0.982,1.0,r));
  }
  float denom=dot(ray,normal);
  if(abs(denom)>0.0001) {
    float diskT=dot(toHole,normal)/denom;
    if(diskT>0.0 && (sphereNear<0.0 || diskT<sphereNear)) {
      vec3 hit=origin+ray*diskT-uHole;
      vec2 disk=vec2(dot(hit,axisX),dot(hit,axisY))/uRadius;
      float dr=length(disk);
      float da=atan(disk.y,disk.x);
      float band=smoothstep(1.08,1.4,dr)*(1.0-smoothstep(3.1,5.6,dr));
      float lanes=0.42+0.58*pow(0.5+0.5*sin(dr*34.0+da*3.0+time*1.4),3.0);
      float turbulence=1.0;
      if(uUltra>0.5) {
        float orbit=da+time*0.24/pow(max(dr,1.0),1.5);
        vec2 flow=vec2(orbit*7.0,dr*9.0+time*0.18);
        float n=noise(flow);
        float n2=noise(flow*2.8+vec2(n*2.0,0.0));
        float n3=noise(flow*7.0);
        turbulence=n*0.52+n2*0.32+n3*0.16;
        float filaments=pow(0.5+0.5*sin(dr*70.0+n*10.0+orbit*4.0),3.0);
        lanes=(0.27+turbulence*0.85+filaments*0.22);
      }
      float beaming=mix(0.6,1.4,0.5+0.5*sin(da+0.7));
      float intensity=band*lanes*exp(-max(0.0,dr-1.5)*0.43)*beaming;
      vec3 plasma=mix(gold,hot,pow(max(0.0,1.0-(dr-1.1)/4.0),3.0));
      col+=plasma*intensity*(1.0-uLight*0.76);
      col-=vec3(0.035,0.16,0.34)*intensity*uLight;
    }
  }
  if(uUltra>0.5 && along>0.0) {
    float lens=exp(-abs(r-1.18)*25.0)*0.22;
    col+=hot*lens*(1.0-uLight*0.6);
    col+=gold*pow(0.5+0.5*sin(angle*2.0+r*22.0-time*0.2),4.0)*exp(-abs(r-1.4)*5.0)*0.13;
  }
  col+=hot*uLight*exp(-r*1.3)*0.1*inFront;
  float vignette=1.0-smoothstep(0.15,0.9,length(vUv-0.5));
  col*=mix(0.78+0.22*vignette,1.0,uLight);
  gl_FragColor=vec4(col,1.0);
}`;
