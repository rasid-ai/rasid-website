/**
 * QuadRenderer — a minimal WebGL2 fullscreen-quad shader runner.
 *
 * Every flat "satellite imagery" panel on the site (data plate, GoPilot map,
 * model showcase, the three use cases) is one fragment shader over one quad.
 * Wrapping that in a scene graph would be pure overhead, so this is bare GL:
 * no dependencies, no per-frame allocation, ~1 draw call.
 *
 * Behaviour that matters for a production page:
 *  • renders on demand — `request()` schedules exactly one frame
 *  • pauses entirely when off-screen (owner supplies visibility)
 *  • DPR clamped, and resolution scaled down on low-end devices
 *  • releases the GL context on dispose so we never exhaust the browser's
 *    context budget as the reader scrolls through five imagery sections
 */

export type UniformValue = number | [number, number] | [number, number, number] | [number, number, number, number];

interface Options {
  fragment: string;
  /** Uniforms updated per frame, resolved at draw time. */
  uniforms: () => Record<string, UniformValue>;
  /** Max device pixel ratio. Defaults to 2 (1.5 on low-power). */
  maxDpr?: number;
  /** Called after each draw — used to drive continuous animation. */
  onFrame?: (t: number) => void;
  /** Continuous render loop instead of on-demand. */
  animate?: boolean;
}

const VERT = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  // Oversized triangle covering the viewport — no attribute buffers needed.
  vec2 p = vec2((gl_VertexID == 2) ? 3.0 : -1.0, (gl_VertexID == 1) ? 3.0 : -1.0);
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

export class QuadRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private locations = new Map<string, WebGLUniformLocation | null>();
  private raf = 0;
  private disposed = false;
  private visible = true;
  private readonly canvas: HTMLCanvasElement;
  private readonly opts: Options;
  private start = 0;
  private lastW = 0;
  private lastH = 0;
  private scale = 1;

  constructor(canvas: HTMLCanvasElement, opts: Options) {
    this.canvas = canvas;
    this.opts = opts;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false, // the shader anti-aliases via fwidth; MSAA would be wasted
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
    });
    if (!gl) return;
    this.gl = gl;

    const program = compile(gl, VERT, opts.fragment);
    if (!program) {
      this.gl = null;
      return;
    }
    this.program = program;
    gl.useProgram(program);
    this.start = performance.now();
    if (opts.animate) this.loop();
    else this.request();
  }

  /** True when a GL2 context and program were successfully created. */
  get ok(): boolean {
    return this.gl !== null && this.program !== null;
  }

  setVisible(v: boolean): void {
    if (this.visible === v) return;
    this.visible = v;
    if (v) {
      if (this.opts.animate) this.loop();
      else this.request();
    } else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  /** Lower internal resolution (0.5–1). Used to keep weak GPUs fluid. */
  setScale(s: number): void {
    this.scale = Math.max(0.4, Math.min(1, s));
    this.lastW = 0; // force resize
    this.request();
  }

  /** Schedule exactly one frame. */
  request(): void {
    if (this.disposed || !this.visible || this.raf || this.opts.animate) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
    });
  }

  private loop = (): void => {
    if (this.disposed || !this.visible) return;
    this.raf = requestAnimationFrame(this.loop);
    this.draw();
  };

  private resize(): void {
    const gl = this.gl!;
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.maxDpr ?? 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr * this.scale));
    const h = Math.max(1, Math.round(rect.height * dpr * this.scale));
    if (w === this.lastW && h === this.lastH) return;
    this.lastW = w;
    this.lastH = h;
    this.canvas.width = w;
    this.canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  private draw(): void {
    const gl = this.gl;
    const program = this.program;
    if (!gl || !program || this.disposed) return;

    this.resize();
    gl.useProgram(program);

    const t = (performance.now() - this.start) / 1000;
    const uniforms = this.opts.uniforms();
    uniforms.uResolution = [this.lastW, this.lastH];
    uniforms.uTime = t;

    for (const key in uniforms) {
      let loc = this.locations.get(key);
      if (loc === undefined) {
        loc = gl.getUniformLocation(program, key);
        this.locations.set(key, loc);
      }
      if (!loc) continue;
      const v = uniforms[key]!;
      if (typeof v === 'number') gl.uniform1f(loc, v);
      else if (v.length === 2) gl.uniform2f(loc, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2]);
      else gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.opts.onFrame?.(t);
  }

  dispose(): void {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    const gl = this.gl;
    if (gl) {
      if (this.program) gl.deleteProgram(this.program);
      /* Explicitly drop the context. Both halves of this matter, and getting
         either wrong breaks the page in a way nothing else catches:

         Not releasing it → Chrome caps simultaneous WebGL contexts (~16) and
         silently evicts the OLDEST live one when a new panel asks for one.
         Since a context is only collected when the canvas is GC'd — which is
         not prompt — scrolling through the six imagery acts exhausts the pool
         and kills the earliest panels. Scrolling back up then shows the CSS
         substrate where the GoPilot map should be, logging only a warning.

         Releasing it → getContext('webgl2') hands back the *same* object for
         the life of a canvas element, so this canvas is now permanently dead:
         any renderer remounted on it fails every compile with an empty info
         log (React StrictMode double-invokes effects, so that path is the norm
         in development, and re-entering a section hits it in production).
         restoreContext() is not a reliable undo — it is async and driver
         dependent. So the canvas is marked instead, and ImageryPanel keys a
         fresh <canvas> element rather than reusing a poisoned one. */
      this.canvas.dataset.glDead = '1';
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    this.gl = null;
    this.program = null;
    this.locations.clear();
  }
}

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram | null {
  const v = shader(gl, gl.VERTEX_SHADER, vs);
  const f = shader(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[QuadRenderer] link failed:', gl.getProgramInfoLog(p));
    }
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function shader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== 'production') {
      const log = gl.getShaderInfoLog(s) ?? '';
      /* A lost context fails every compile with an *empty* log, which reads like
         a mystery shader bug. It isn't: it means the panel was disposed (we call
         loseContext there, since browsers cap simultaneous contexts) while a
         compile was still in flight. Name it so it isn't chased as a GLSL typo. */
      if (gl.isContextLost()) {
        console.warn('[QuadRenderer] compile skipped — context lost (panel disposed mid-compile)');
        return null;
      }
      const line = /:(\d+):/.exec(log)?.[1];
      console.error('[QuadRenderer] compile failed:', log);
      if (line) {
        const lines = src.split('\n');
        const n = parseInt(line, 10);
        console.error(lines.slice(Math.max(0, n - 4), n + 3).join('\n'));
      }
    }
    gl.deleteShader(s);
    return null;
  }
  return s;
}
