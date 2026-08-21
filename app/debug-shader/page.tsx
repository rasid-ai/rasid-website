'use client';
import { useEffect, useRef, useState } from 'react';

/** Temporary: renders the earth fragment shader's components in isolation. */
const CASES: Record<string, string> = {
  landmask: 'col = vec3(L.r);',
  inland: 'col = vec3(L.g);',
  coast: 'col = vec3(L.b);',
  biome: 'col = biome(uv, L, lat, S);',
  ocean: 'col = ocean(uv, L, S);',
  clouds: `
    float tt = 0.0;
    vec2 cp = vec2(uv.x * 8.0 + tt, uv.y * 4.0);
    float bandc = 0.55 + 0.45 * cos(lat * DEG * 6.0);
    float cl = warpFbm(cp * 1.6, 5, S + 43u);
    cl = smoothstep(0.52, 0.80, cl * (0.55 + 0.75 * bandc));
    col = vec3(cl);`,
  fbm: 'col = vec3(fbm(uv * vec2(220.0,110.0) * 0.09, 4, S + 11u));',
  ridged: 'col = vec3(ridged(uv * vec2(220.0,110.0) * 0.55, 4, S + 29u));',
  composite_noclouds: `
    float landm = smoothstep(0.42,0.58,L.r);
    vec3 planet = mix(ocean(uv,L,S), biome(uv,L,lat,S), landm);
    float diff = 1.0;
    col = planet * (0.06 + 1.28 * diff);
    col = col / (col + 0.80) * 1.72;
    col = pow(max(col, 0.0), vec3(0.90));`,
  composite_clouds: `
    float landm = smoothstep(0.42,0.58,L.r);
    vec3 planet = mix(ocean(uv,L,S), biome(uv,L,lat,S), landm);
    float diff = 1.0;
    col = planet * (0.06 + 1.28 * diff);
    vec2 cp = vec2(uv.x * 3.4, uv.y * 5.2);
    float aLat = abs(lat);
    float itcz = exp(-pow(aLat / 9.0, 2.0));
    float storm = exp(-pow((aLat - 54.0) / 15.0, 2.0));
    float dryb = exp(-pow((aLat - 26.0) / 12.0, 2.0));
    float bandc = 0.34 + 0.62 * max(itcz, storm) - 0.26 * dryb;
    float cl = warpFbm(cp * 1.15, 5, S + 43u);
    cl = smoothstep(0.55, 0.74, cl * (0.30 + 0.95 * bandc));
    col = mix(col, vec3(0.88,0.92,0.95) * (0.10 + 1.05 * diff), cl * 0.62);
    col = col / (col + 0.80) * 1.72;
    col = pow(max(col, 0.0), vec3(0.90));`,
  planet: 'col = mix(ocean(uv,L,S), biome(uv,L,lat,S), smoothstep(0.42,0.58,L.r));',
};

export default function ShaderProbe() {
  const [log, setLog] = useState('working…');
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const lines: string[] = [];
      const { getLandTexture } = await import('@/lib/geo/landTexture');
      const { SURFACE_GLSL } = await import('@/lib/webgl/glsl/surface');
      const land = await getLandTexture(1024);

      for (const [name, body] of Object.entries(CASES)) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        canvas.style.cssText = 'width:512px;display:block;margin:4px 0;border:1px solid #333';
        const gl = canvas.getContext('webgl2');
        if (!gl) { lines.push(`${name}: NO GL2`); continue; }

        const frag = `#version 300 es
precision highp float;
uniform sampler2D uLand;
uniform float uTime;
out vec4 fragColor;
${SURFACE_GLSL}
#define DEG 0.01745329252
vec3 biome(vec2 uv, vec3 L, float lat, uint s){
  float inland = L.g;
  vec2 p = uv * vec2(220.0, 110.0);
  float absLat = abs(lat);
  float desertBelt = exp(-pow((absLat - 24.0) / 11.0, 2.0));
  float arid = clamp(desertBelt * 1.15 * (0.45 + 0.75 * inland) + fbm(p * 0.09, 4, s + 11u) * 0.55 - 0.30, 0.0, 1.0);
  float cold = smoothstep(52.0, 74.0, absLat);
  float ice  = smoothstep(70.0, 82.0, absLat);
  vec3 forest=vec3(0.055,0.098,0.055), savanna=vec3(0.243,0.220,0.131), desert=vec3(0.408,0.337,0.224);
  vec3 steppe=vec3(0.243,0.235,0.155), boreal=vec3(0.062,0.086,0.070), tundra=vec3(0.200,0.196,0.180), snow=vec3(0.760,0.790,0.810);
  vec3 c = mix(forest, savanna, smoothstep(0.20,0.55,arid));
  c = mix(c, desert, smoothstep(0.52,0.86,arid));
  c = mix(c, steppe, smoothstep(0.36,0.60,arid) * (1.0-desertBelt) * 0.6);
  c = mix(c, boreal, cold*0.85);
  c = mix(c, tundra, smoothstep(0.62,0.80, absLat/90.0*1.4)*0.7);
  c = mix(c, snow, ice);
  c *= 0.80 + 0.42 * fbm(p*0.35, 4, s+23u);
  float relief = ridged(p*0.55, 4, s+29u);
  c = mix(c, vec3(0.30,0.29,0.27), smoothstep(0.55,0.85,relief)*inland*0.55);
  c = mix(c, snow*0.9, smoothstep(0.72,0.94,relief)*smoothstep(0.25,0.6,absLat/90.0));
  return c;
}
vec3 ocean(vec2 uv, vec3 L, uint s){
  float shelf = smoothstep(0.0,0.45,L.g) + L.b*0.5;
  vec3 c = mix(vec3(0.008,0.030,0.062), vec3(0.020,0.098,0.128), clamp(shelf*1.25,0.0,1.0));
  c *= 0.92 + 0.14 * fbm(uv*vec2(180.0,90.0)*0.22, 3, s+31u);
  return c;
}
in vec2 vUv;
void main(){
  uint S = uint(uSeedF);
  vec2 uv = vUv;
  float lat = 90.0 - uv.y * 180.0;
  vec3 L = texture(uLand, uv).rgb;
  vec3 col = vec3(0.0);
  ${body}
  fragColor = vec4(col, 1.0);
}`;
        const vert = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p = vec2((gl_VertexID == 2) ? 3.0 : -1.0, (gl_VertexID == 1) ? 3.0 : -1.0);
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;
        const mk = (type: number, src: string) => {
          const sh = gl.createShader(type)!;
          gl.shaderSource(sh, src); gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            lines.push(`${name}: COMPILE FAIL\n${gl.getShaderInfoLog(sh)}`);
            return null;
          }
          return sh;
        };
        const vs = mk(gl.VERTEX_SHADER, vert), fs = mk(gl.FRAGMENT_SHADER, frag);
        if (!vs || !fs) continue;
        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { lines.push(`${name}: LINK FAIL ${gl.getProgramInfoLog(prog)}`); continue; }
        gl.useProgram(prog);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, land.canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(prog, 'uLand'), 0);
        for (const [u, v] of [['uSeedF',1337],['uSunAz',2.44],['uSunEl',0.62],['uDetail',1],['uSharpen',1],['uTime',0]] as [string,number][]) {
          const loc = gl.getUniformLocation(prog, u);
          if (loc) gl.uniform1f(loc, v);
        }
        gl.viewport(0,0,512,256);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        const px = new Uint8Array(512*256*4);
        gl.readPixels(0,0,512,256,gl.RGBA,gl.UNSIGNED_BYTE,px);
        let sum=0,max=0,min=255;
        for (let i=0;i<px.length;i+=4){ const v=(px[i]!+px[i+1]!+px[i+2]!)/3; sum+=v; if(v>max)max=v; if(v<min)min=v; }
        lines.push(`${name}: mean ${(sum/(px.length/4)).toFixed(1)} min ${min} max ${max}`);

        const label = document.createElement('div');
        label.textContent = name; label.style.cssText='color:#0f0;font:11px monospace;margin-top:8px';
        host.current?.appendChild(label);
        host.current?.appendChild(canvas);
      }
      setLog(lines.join('\n'));
    })();
  }, []);

  return (
    <div style={{ background:'#000', padding:12 }}>
      <pre id="probe" style={{ color:'#0f0', font:'12px monospace' }}>{log}</pre>
      <div ref={host} />
    </div>
  );
}
