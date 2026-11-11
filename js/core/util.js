/* Shared math, noise and colour helpers. */
(function () {
  'use strict';
  const U = {};
  U.clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.inv = (a, b, v) => U.clamp((v - a) / (b - a));
  U.smooth = (a, b, v) => { const t = U.inv(a, b, v); return t * t * (3 - 2 * t); };
  U.ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  U.easeOut = t => 1 - Math.pow(1 - t, 3);
  U.rnd = (a = 1, b) => (b == null ? Math.random() * a : a + Math.random() * (b - a));
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.TAU = Math.PI * 2;
  U.damp = (cur, target, rate, dt) => U.lerp(cur, target, 1 - Math.exp(-rate * dt));

  // Seeded PRNG (mulberry32) so landscapes stay the same between visits.
  U.seeded = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Smooth 1D value noise and fractal sum.
  const P = new Float32Array(512);
  (function () { const r = U.seeded(1447); for (let i = 0; i < 512; i++) P[i] = r(); })();
  U.noise1 = function (x) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return U.lerp(P[i & 511], P[(i + 1) & 511], u) * 2 - 1;
  };
  U.fbm1 = function (x, oct = 5) {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += a * U.noise1(x * f + i * 17.3); f *= 2.03; a *= 0.5; }
    return s;
  };
  // 2D value noise
  U.noise2 = function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const h = (a, b) => P[(a + P[b & 511] * 511) & 511];
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v) * 2 - 1;
  };

  // Colours as [r,g,b] arrays.
  U.hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  U.mix = (c1, c2, t) => [U.lerp(c1[0], c2[0], t), U.lerp(c1[1], c2[1], t), U.lerp(c1[2], c2[2], t)];
  U.rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  // Sample a gradient defined as [[stop, '#hex'], ...]
  U.ramp = function (stops, t) {
    t = U.clamp(t);
    for (let i = 0; i < stops.length - 1; i++) {
      const [s0, c0] = stops[i], [s1, c1] = stops[i + 1];
      if (t <= s1) return U.mix(U.hex(c0), U.hex(c1), U.inv(s0, s1, t));
    }
    return U.hex(stops[stops.length - 1][1]);
  };

  // An eight-pointed star (khatam) path, the recurring seal of the journey.
  U.star8 = function (ctx, x, y, r, inner = 0.72, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = rot + (i * Math.PI) / 8, rr = i % 2 ? r * inner : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };

  window.U = U;
})();
