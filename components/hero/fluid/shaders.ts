// GLSL ES 3.00 shaders for a grid-based Stable Fluids solver.
// Approach after Jos Stam's "Stable Fluids" and Pavel Dobryakov's WebGL-Fluid-Simulation.

const header = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;
`;

export const baseVertex = /* glsl */ `#version 300 es
precision highp float;
in vec2 aPosition;
uniform vec2 texelSize;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const varyings = `
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
`;

export const clearShader = `${header}${varyings}
uniform sampler2D uTexture;
uniform float value;
void main() {
  fragColor = value * texture(uTexture, vUv);
}
`;

export const splatShader = `${header}${varyings}
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}
`;

export const advectionShader = `${header}${varyings}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 velocityTexelSize;
uniform float dt;
uniform float dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * velocityTexelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}
`;

export const divergenceShader = `${header}${varyings}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  // Reflect velocity at the walls.
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}
`;

export const curlShader = `${header}${varyings}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`;

export const vorticityShader = `${header}${varyings}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy + force * dt;
  fragColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
}
`;

export const pressureShader = `${header}${varyings}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}
`;

export const gradientSubtractShader = `${header}${varyings}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}
`;

// Draws the dye with light bump shading. Output is premultiplied alpha so the
// page background shows through wherever there is no dye.
export const displayShader = `${header}${varyings}
uniform sampler2D uTexture;
uniform vec2 dyeTexelSize;
uniform float intensity;
void main() {
  vec3 c = texture(uTexture, vUv).rgb;
  vec3 lc = texture(uTexture, vUv - vec2(dyeTexelSize.x, 0.0)).rgb;
  vec3 rc = texture(uTexture, vUv + vec2(dyeTexelSize.x, 0.0)).rgb;
  vec3 tc = texture(uTexture, vUv + vec2(0.0, dyeTexelSize.y)).rgb;
  vec3 bc = texture(uTexture, vUv - vec2(0.0, dyeTexelSize.y)).rgb;
  float dx = length(rc) - length(lc);
  float dy = length(tc) - length(bc);
  vec3 n = normalize(vec3(dx, dy, length(dyeTexelSize)));
  float diffuse = clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.7, 0.7, 1.0);
  c = clamp(c * diffuse * intensity, 0.0, 1.0);
  float a = max(c.r, max(c.g, c.b));
  fragColor = vec4(c, a);
}
`;
