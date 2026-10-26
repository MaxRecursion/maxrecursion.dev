import {
  advectionShader,
  baseVertex,
  clearShader,
  curlShader,
  displayShader,
  divergenceShader,
  gradientSubtractShader,
  pressureShader,
  splatShader,
  vorticityShader,
} from "./shaders";

type RGB = [number, number, number];

type Target = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelX: number;
  texelY: number;
};

type DoubleTarget = {
  read: Target;
  write: Target;
  swap: () => void;
};

type Program = {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
};

export type FluidOptions = {
  simResolution: number;
  dyeResolution: number;
  pressureIterations: number;
  curl: number;
  velocityDissipation: number;
  densityDissipation: number;
  pressure: number;
  splatRadius: number;
  splatForce: number;
};

const defaults: FluidOptions = {
  simResolution: 128,
  dyeResolution: 1024,
  pressureIterations: 20,
  curl: 28,
  velocityDissipation: 0.25,
  densityDissipation: 1.2,
  pressure: 0.8,
  splatRadius: 0.22,
  splatForce: 6000,
};

// Dye colours, normalised to a max channel of 1: antique gold, champagne, sage,
// burnished bronze and ivory, matching the site's gilt-and-ink palette.
const PALETTE: RGB[] = [
  [1, 0.79, 0.4],
  [1, 0.9, 0.7],
  [0.62, 0.8, 0.66],
  [1, 0.62, 0.36],
  [1, 0.96, 0.88],
];

export class FluidSimulation {
  private gl: WebGL2RenderingContext;
  private opts: FluidOptions;
  private programs: Record<string, Program> = {};
  private velocity!: DoubleTarget;
  private dye!: DoubleTarget;
  private pressure!: DoubleTarget;
  private divergence!: Target;
  private curlTarget!: Target;
  private raf = 0;
  private running = false;
  private lastTime = 0;
  private intensity = 1;
  private slowFrames = 0;
  private degraded = false;
  private hueIndex = 0;

  /** Returns null when WebGL2 or float render targets are unavailable. */
  static create(canvas: HTMLCanvasElement, options: Partial<FluidOptions> = {}) {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
    try {
      return new FluidSimulation(canvas, gl, { ...defaults, ...options });
    } catch {
      return null;
    }
  }

  private constructor(
    private canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    opts: FluidOptions,
  ) {
    this.gl = gl;
    this.opts = opts;

    const vertex = this.compile(gl.VERTEX_SHADER, baseVertex);
    const sources = {
      clear: clearShader,
      splat: splatShader,
      advection: advectionShader,
      divergence: divergenceShader,
      curl: curlShader,
      vorticity: vorticityShader,
      pressure: pressureShader,
      gradient: gradientSubtractShader,
      display: displayShader,
    };
    for (const [name, src] of Object.entries(sources)) {
      this.programs[name] = this.link(vertex, this.compile(gl.FRAGMENT_SHADER, src));
    }

    // Full-screen quad shared by every pass.
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    this.resizeCanvas();
    this.initTargets();
  }

  setIntensity(value: number) {
    this.intensity = value;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  get isRunning() {
    return this.running;
  }

  // The context is deliberately not lost here: a remount on the same canvas (React's dev double
  // effect, hot reload) gets that context back from getContext, and a lost one never draws again.
  // WebKit paints such a canvas solid white. The context is freed with the canvas element.
  destroy() {
    this.stop();
  }

  /** Splat at (x, y) in 0-1 canvas space, moving by (dx, dy) in the same units. */
  splat(x: number, y: number, dx: number, dy: number, color: RGB = this.nextColor()) {
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    const p = this.programs.splat;
    gl.useProgram(p.program);
    gl.uniform1i(p.uniforms.uTarget, this.bind(0, this.velocity.read));
    gl.uniform1f(p.uniforms.aspectRatio, aspect);
    gl.uniform2f(p.uniforms.point, x, y);
    gl.uniform3f(p.uniforms.color, dx * this.opts.splatForce, dy * this.opts.splatForce, 0);
    gl.uniform1f(p.uniforms.radius, this.radius(aspect));
    this.blit(this.velocity.write);
    this.velocity.swap();

    gl.uniform1i(p.uniforms.uTarget, this.bind(0, this.dye.read));
    gl.uniform3f(p.uniforms.color, color[0], color[1], color[2]);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  randomSplats(count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.002 + Math.random() * 0.004;
      this.splat(
        0.15 + Math.random() * 0.7,
        0.15 + Math.random() * 0.7,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.nextColor(1.6),
      );
    }
  }

  nextColor(boost = 1): RGB {
    this.hueIndex = (this.hueIndex + 1) % PALETTE.length;
    const [r, g, b] = PALETTE[this.hueIndex];
    const k = 0.15 * boost * (0.9 + Math.random() * 0.2);
    return [r * k, g * k, b * k];
  }

  private radius(aspect: number) {
    const r = this.opts.splatRadius / 100;
    return aspect > 1 ? r * aspect : r;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const elapsed = now - this.lastTime;
    this.lastTime = now;
    const dt = Math.min(elapsed / 1000, 1 / 60);

    this.watchPerformance(elapsed);
    if (this.resizeCanvas()) this.initTargets();
    this.step(dt);
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  // If frames stay slow, drop to a cheaper configuration once.
  private watchPerformance(elapsed: number) {
    if (this.degraded) return;
    this.slowFrames = elapsed > 24 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 90) {
      this.degraded = true;
      this.opts.dyeResolution = Math.min(this.opts.dyeResolution, 512);
      this.opts.simResolution = 96;
      this.opts.pressureIterations = 12;
      this.initTargets();
    }
  }

  private step(dt: number) {
    const gl = this.gl;
    const { programs: P, velocity, dye, pressure, divergence, curlTarget } = this;
    gl.disable(gl.BLEND);

    gl.useProgram(P.curl.program);
    gl.uniform2f(P.curl.uniforms.texelSize, velocity.read.texelX, velocity.read.texelY);
    gl.uniform1i(P.curl.uniforms.uVelocity, this.bind(0, velocity.read));
    this.blit(curlTarget);

    gl.useProgram(P.vorticity.program);
    gl.uniform2f(P.vorticity.uniforms.texelSize, velocity.read.texelX, velocity.read.texelY);
    gl.uniform1i(P.vorticity.uniforms.uVelocity, this.bind(0, velocity.read));
    gl.uniform1i(P.vorticity.uniforms.uCurl, this.bind(1, curlTarget));
    gl.uniform1f(P.vorticity.uniforms.curl, this.opts.curl);
    gl.uniform1f(P.vorticity.uniforms.dt, dt);
    this.blit(velocity.write);
    velocity.swap();

    gl.useProgram(P.divergence.program);
    gl.uniform2f(P.divergence.uniforms.texelSize, velocity.read.texelX, velocity.read.texelY);
    gl.uniform1i(P.divergence.uniforms.uVelocity, this.bind(0, velocity.read));
    this.blit(divergence);

    gl.useProgram(P.clear.program);
    gl.uniform1i(P.clear.uniforms.uTexture, this.bind(0, pressure.read));
    gl.uniform1f(P.clear.uniforms.value, this.opts.pressure);
    this.blit(pressure.write);
    pressure.swap();

    gl.useProgram(P.pressure.program);
    gl.uniform2f(P.pressure.uniforms.texelSize, velocity.read.texelX, velocity.read.texelY);
    gl.uniform1i(P.pressure.uniforms.uDivergence, this.bind(0, divergence));
    for (let i = 0; i < this.opts.pressureIterations; i++) {
      gl.uniform1i(P.pressure.uniforms.uPressure, this.bind(1, pressure.read));
      this.blit(pressure.write);
      pressure.swap();
    }

    gl.useProgram(P.gradient.program);
    gl.uniform2f(P.gradient.uniforms.texelSize, velocity.read.texelX, velocity.read.texelY);
    gl.uniform1i(P.gradient.uniforms.uPressure, this.bind(0, pressure.read));
    gl.uniform1i(P.gradient.uniforms.uVelocity, this.bind(1, velocity.read));
    this.blit(velocity.write);
    velocity.swap();

    gl.useProgram(P.advection.program);
    gl.uniform2f(P.advection.uniforms.velocityTexelSize, velocity.read.texelX, velocity.read.texelY);
    gl.uniform1i(P.advection.uniforms.uVelocity, this.bind(0, velocity.read));
    gl.uniform1i(P.advection.uniforms.uSource, this.bind(0, velocity.read));
    gl.uniform1f(P.advection.uniforms.dt, dt);
    gl.uniform1f(P.advection.uniforms.dissipation, this.opts.velocityDissipation);
    this.blit(velocity.write);
    velocity.swap();

    gl.uniform1i(P.advection.uniforms.uVelocity, this.bind(0, velocity.read));
    gl.uniform1i(P.advection.uniforms.uSource, this.bind(1, dye.read));
    gl.uniform1f(P.advection.uniforms.dissipation, this.opts.densityDissipation);
    this.blit(dye.write);
    dye.swap();
  }

  private render() {
    const gl = this.gl;
    const p = this.programs.display;
    gl.useProgram(p.program);
    gl.uniform2f(p.uniforms.dyeTexelSize, this.dye.read.texelX, this.dye.read.texelY);
    gl.uniform1i(p.uniforms.uTexture, this.bind(0, this.dye.read));
    gl.uniform1f(p.uniforms.intensity, this.intensity);
    this.blit(null, true);
  }

  private blit(target: Target | null, clear = false) {
    const gl = this.gl;
    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    if (clear) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  private bind(unit: number, target: Target) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    return unit;
  }

  /** Matches the drawing buffer to the element size. Returns true if it changed. */
  private resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width === w && this.canvas.height === h) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    return true;
  }

  private resolution(base: number) {
    const w = this.gl.drawingBufferWidth;
    const h = this.gl.drawingBufferHeight;
    const aspect = w > h ? w / h : h / w;
    const min = Math.round(base);
    const max = Math.round(base * aspect);
    return w > h ? { width: max, height: min } : { width: min, height: max };
  }

  private initTargets() {
    const gl = this.gl;
    const sim = this.resolution(this.opts.simResolution);
    const dyeRes = this.resolution(this.opts.dyeResolution);

    this.dye = this.double(dyeRes.width, dyeRes.height, gl.RGBA16F, gl.RGBA);
    this.velocity = this.double(sim.width, sim.height, gl.RG16F, gl.RG);
    this.divergence = this.target(sim.width, sim.height, gl.R16F, gl.RED, gl.NEAREST);
    this.curlTarget = this.target(sim.width, sim.height, gl.R16F, gl.RED, gl.NEAREST);
    this.pressure = this.double(sim.width, sim.height, gl.R16F, gl.RED, gl.NEAREST);
  }

  private target(w: number, h: number, internal: number, format: number, filter: number = this.gl.LINEAR): Target {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);

    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Float render target not supported");
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, width: w, height: h, texelX: 1 / w, texelY: 1 / h };
  }

  private double(w: number, h: number, internal: number, format: number, filter?: number): DoubleTarget {
    const pair = {
      read: this.target(w, h, internal, format, filter),
      write: this.target(w, h, internal, format, filter),
      swap() {
        const t = pair.read;
        pair.read = pair.write;
        pair.write = t;
      },
    };
    return pair;
  }

  private compile(type: number, source: string) {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
    }
    return shader;
  }

  private link(vertex: WebGLShader, fragment: WebGLShader): Program {
    const gl = this.gl;
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed");
    }
    const uniforms: Record<string, WebGLUniformLocation> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(program, i)!.name;
      uniforms[name] = gl.getUniformLocation(program, name)!;
    }
    return { program, uniforms };
  }
}
