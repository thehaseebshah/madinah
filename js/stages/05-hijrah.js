/* Station — The Night Road (Hijrah), 622 CE.  Genre: endless runner (Temple Run / Alto's Adventure).
   Feeling: trust in a guide through the dark, answered by dawn.
   You are a small light on the night road, keeping close behind the guide's lamp. The road runs
   some 2.5 km through four places: the granite wadi below Jabal Thawr, the dune sea, the coastal
   plain by the moonlit sea (Qudayd), and the black harrah that opens on the palms of Quba at dawn.
   Switch lanes round boulders, jump the dry washes, duck under low acacia limbs, take the side of
   the track the lamp takes. Then hoofbeats and dust behind: the pursuer, whose horse sinks into the
   ground (Sahih al-Bukhari 3906). Dawn breaks over the oasis and you walk among the palms.
   No person is shown: the travellers are the lamp, two camels with their loads, tracks and sounds.
   Colour script: night blue, with ember gold kept for the lamp, your light and the dawn. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- the route: a long meander from Thawr northward ---------------- */
  const Z0 = 1160, Z1 = -1560;
  const RX = z => 150 * Math.sin(z * 0.0019 + 0.4) + 55 * Math.sin(z * 0.0061 + 1.3);
  const TR = (() => {
    const xs = [RX(Z0)], zs = [Z0];
    let z = Z0, px = RX(Z0), pz = Z0, acc = 0;
    while (z > Z1) { z -= 0.05; const x = RX(z); acc += Math.hypot(x - px, z - pz); px = x; pz = z; if (acc >= 1) { xs.push(x); zs.push(z); acc -= 1; } }
    const n = xs.length, tx = new Float32Array(n), tz = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), dx = xs[b] - xs[a], dz = zs[b] - zs[a], l = Math.hypot(dx, dz); tx[i] = dx / l; tz[i] = dz / l; }
    return { xs, zs, tx, tz, len: n - 1 };
  })();
  // a point on the track at arc length s: position, tangent and right vector
  function tp(s, o) {
    o = o || {};
    const L = TR.len; let i, f, ex = 0;
    if (s < 0) { i = 0; f = 0; ex = s; } else if (s >= L) { i = L - 1; f = 1; ex = s - L; } else { i = Math.floor(s); f = s - i; }
    const tx = U.lerp(TR.tx[i], TR.tx[i + 1], f), tz = U.lerp(TR.tz[i], TR.tz[i + 1], f), l = Math.hypot(tx, tz);
    o.tx = tx / l; o.tz = tz / l; o.rx = -o.tz; o.rz = o.tx;
    o.x = U.lerp(TR.xs[i], TR.xs[i + 1], f) + o.tx * ex; o.z = U.lerp(TR.zs[i], TR.zs[i + 1], f) + o.tz * ex;
    return o;
  }
  const zAt = s => tp(s).z;
  const LANE = 2.5;
  // the stretches of the road (in metres along it)
  const P1 = 620, P2 = 1420, SINK = 1900, P3 = 2100, STOP = 2430;
  const zAB = zAt(600), zBC = zAt(1260), zCD = zAt(2040), zOa0 = zAt(2180), zOa1 = zAt(2330);
  const zSea0 = zAt(820), zSea1 = zAt(1040), zSea2 = zAt(2060), zSea3 = zAt(2240);
  function zones(z) {
    const a = U.smooth(zAB - 90, zAB + 90, z), top = U.smooth(zBC - 90, zBC + 90, z), d = 1 - U.smooth(zCD - 90, zCD + 90, z);
    return { a, b: top * (1 - a), c: (1 - top) * (1 - d), d, o: U.smooth(zOa0, zOa1, z) };
  }

  /* ---------------- obstacles along the road ---------------- */
  const COURSE = (() => {
    const O = [], r = U.seeded(622);
    const add = (type, s, x) => O.push(Object.assign({ type, s }, x || {}));
    const PAT = [[0], [-1], [1], [-1, 0], [0, 1], [-1, 1]];
    // part 1: the wadi — learn to change lanes, then to jump the dry washes
    add('rock', 75, { lanes: [0] }); add('rock', 112, { lanes: [-1] }); add('rock', 150, { lanes: [0, 1] }); add('rock', 186, { lanes: [-1, 0] });
    add('gully', 240); add('gully', 300); add('rock', 340, { lanes: [0, 1] }); add('gully', 385);
    add('rock', 425, { lanes: [-1] }); add('rock', 440, { lanes: [1] });
    for (let s = 480; s < 600; s += 30 + r() * 12) r() < 0.4 ? add('gully', s) : add('rock', s, { lanes: PAT[(r() * 6) | 0] });
    // part 2: the sands — duck under acacia limbs, follow the lamp where the track parts
    add('branch', 690); add('branch', 745); add('rock', 790, { lanes: [-1, 1] }); add('fork', 850, { good: 1 });
    add('gully', 905); add('branch', 950); add('rock', 990, { lanes: [0, 1] });
    for (let s = 1030; s < 1130; s += 28 + r() * 10) { const k = r(); k < 0.33 ? add('branch', s) : k < 0.6 ? add('gully', s) : add('rock', s, { lanes: PAT[(r() * 6) | 0] }); }
    add('fork', 1160, { good: -1 });
    for (let s = 1215; s < 1320; s += 27 + r() * 10) { const k = r(); k < 0.33 ? add('branch', s) : k < 0.6 ? add('gully', s) : add('rock', s, { lanes: PAT[(r() * 6) | 0] }); }
    add('fork', 1345, { good: 1 });
    // part 3: the pursuer — everything together, a little faster
    for (let s = 1470; s < SINK - 20; s += 24 + r() * 9) { const k = r(); k < 0.3 ? add('branch', s) : k < 0.55 ? add('gully', s) : add('rock', s, { lanes: PAT[(r() * 6) | 0] }); }
    add('fork', 1700, { good: -1 }); add('fork', 1830, { good: 1 });
    O.sort((a, b) => a.s - b.s);
    // keep forks clear of their neighbours
    return O.filter((o, i) => !(o.type !== 'fork' && O.some(f => f.type === 'fork' && f !== o && Math.abs(f.s - o.s) < 22)));
  })();
  const GULLIES = COURSE.filter(o => o.type === 'gully').map(o => { const p = tp(o.s); return { s: o.s, x: p.x, z: p.z, tx: p.tx, tz: p.tz }; });
  const FORKS = COURSE.filter(o => o.type === 'fork');

  /* ---------------- the land ---------------- */
  function H(x, z) {
    const dx = x - RX(z), d = Math.abs(dx), Z = zones(z);
    let y = 1.4;
    // long rolling swells under the road, for the glide of an Alto run
    y += (Math.sin(z * 0.043) * 0.8 + Math.sin(z * 0.017 + 2) * 1.3) * (Z.b + Z.c * 0.4);
    y += SCAPE.fbm(x * 0.03, z * 0.03, 3) * (0.7 + Z.a * 1.1 + Z.d * 0.6) + SCAPE.fbm(x * 0.21, z * 0.21, 2) * 0.07 * U.smooth(3, 8, d);
    if (Z.a > 0.001) {
      const rg = SCAPE.ridge(x * 0.0052 + 3, z * 0.0052, 5);
      y += Z.a * (U.smooth(28, 165, d) * (50 + rg * 150) + U.smooth(12, 40, d) * 3);
    }
    // Jabal Thawr and its range close the valley behind the start
    y += U.smooth(Z0 + 30, Z0 + 330, z) * (170 + SCAPE.ridge(x * 0.007, z * 0.007, 4) * 110);
    if (Z.b > 0.001) {
      const wx = x + U.noise2(x * 0.011, z * 0.011) * 26, wz = z + U.noise2(x * 0.013 + 7.3, z * 0.009 - 2.1) * 22 + wx * 0.25;
      const f = wz / 52, ph = f - Math.floor(f), prof = ph < 0.72 ? U.smooth(0, 0.72, ph) : 1 - U.smooth(0.72, 1, ph);
      const wild = U.smooth(10, 150, d);
      y += Z.b * (prof * U.lerp(1.4, 12, wild) * (0.6 + 0.5 * (U.noise2(x * 0.006 + 3, z * 0.006) * 0.5 + 0.5)) + (U.noise2(x * 0.004 - 5, z * 0.004 + 1) * 0.5 + 0.5) * U.lerp(0.8, 28, wild));
    }
    // the Hejaz escarpment, far to the east of the coastal plain
    y += (Z.c + Z.b * 0.6 + Z.d * 0.5) * U.smooth(300, 760, dx) * (60 + SCAPE.ridge(x * 0.004, z * 0.004, 5) * 170);
    if (Z.d > 0.001) y += Z.d * (1 - Z.o) * (SCAPE.fbm(x * 0.025, z * 0.025, 4) * 2.6 * U.smooth(5, 30, d) + U.smooth(160, 520, d) * 26 * SCAPE.ridge(x * 0.01, z * 0.01, 4));
    // the sea to the west of the coastal plain
    const sea = U.smooth(zSea0, zSea1, z) * (1 - U.smooth(zSea2, zSea3, z));
    if (sea > 0) y = U.lerp(y, -7, sea * U.smooth(-250, -360, dx));
    // dry washes across the road
    for (let i = 0; i < GULLIES.length; i++) {
      const g = GULLIES[i], ax = x - g.x, az = z - g.z, dd = Math.abs(ax * g.tx + az * g.tz);
      if (dd > 4) continue;
      const lat = Math.abs(-ax * g.tz + az * g.tx);
      y -= 1.35 * (1 - U.smooth(1.4, 3.8, dd)) * (1 - U.smooth(30, 80, lat));
    }
    return y;
  }
  // zone tint for the ground (a multiplier on the terrain's own colour)
  function tint(x, z, out) {
    const Z = zones(z), dx = x - RX(z), d = Math.abs(dx);
    const A = [0.86, 0.84, 0.82], B = [1.06, 0.98, 0.88], C = [1.08, 1.04, 0.98], D = [0.42, 0.4, 0.4], O = [0.95, 0.86, 0.74];
    for (let k = 0; k < 3; k++) out[k] = A[k] * Z.a + B[k] * Z.b + C[k] * Z.c + U.lerp(D[k], O[k], Z.o) * Z.d;
    // the beaten track: a little darker and smoother where the camels walk
    const tr = 1 - U.smooth(3.5, 8, d) * 1; const k2 = 1 - 0.12 * tr;
    out[0] *= k2; out[1] *= k2; out[2] *= k2;
    // wet sand toward the sea
    const sea = U.smooth(zSea0, zSea1, z) * (1 - U.smooth(zSea2, zSea3, z)) * U.smooth(-200, -300, dx);
    if (sea > 0) { out[0] *= 1 - sea * 0.35; out[1] *= 1 - sea * 0.3; out[2] *= 1 - sea * 0.22; }
    // the floor of each dry wash
    for (let i = 0; i < GULLIES.length; i++) {
      const g = GULLIES[i], ax = x - g.x, az = z - g.z, dd = Math.abs(ax * g.tx + az * g.tz); if (dd > 4) continue;
      const k3 = 1 - 0.45 * (1 - U.smooth(1.2, 3.4, dd)); out[0] *= k3; out[1] *= k3 * 0.98; out[2] *= k3 * 0.96;
    }
    return out;
  }

  /* ---------------- small helpers ---------------- */
  const PV = `attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
    void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
  const PF = `uniform sampler2D tMap; uniform vec3 uColor; varying float vA;
    void main(){ vec4 t = texture2D(tMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA); if (gl_FragColor.a < 0.004) discard; }`;
  function sprites(w, n, color, additive) {
    const geo = new T.BufferGeometry(), P = new Float32Array(n * 3), S = new Float32Array(n), A = new Float32Array(n);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aSize', new T.BufferAttribute(S, 1)); geo.setAttribute('aAlpha', new T.BufferAttribute(A, 1));
    const mat = new T.ShaderMaterial({ vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending,
      uniforms: { tMap: { value: SCAPE.tex.soft(w) }, uColor: { value: new T.Color(color) }, uScale: { value: w.env.h * 0.9 } } });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true; w.scene.add(pts);
    return { pts, P, S, A, geo, n, mat, upd() { geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true; } };
  }
  // a pool of short-lived particles: sand puffs, sparks
  function burstPool(w, n, color, additive) {
    const sp = sprites(w, n, color, additive), V = new Float32Array(n * 3), L = new Float32Array(n), L0 = new Float32Array(n), S0 = new Float32Array(n);
    let k = 0;
    return {
      sp,
      emit(x, y, z, vx, vy, vz, life, size, alpha) { const i = k++ % n; sp.P.set([x, y, z], i * 3); V.set([vx, vy, vz], i * 3); L[i] = L0[i] = life; S0[i] = size; sp.A[i] = alpha; sp.S[i] = size; },
      step(dt, drag, grav) {
        for (let i = 0; i < n; i++) {
          if (L[i] <= 0) { sp.A[i] = 0; continue; }
          L[i] -= dt; const t = 1 - L[i] / L0[i];
          V[i * 3] *= 1 - drag * dt; V[i * 3 + 1] = V[i * 3 + 1] * (1 - drag * dt) - grav * dt; V[i * 3 + 2] *= 1 - drag * dt;
          sp.P[i * 3] += V[i * 3] * dt; sp.P[i * 3 + 1] += V[i * 3 + 1] * dt; sp.P[i * 3 + 2] += V[i * 3 + 2] * dt;
          sp.S[i] = S0[i] * (0.6 + t * 1.4); sp.A[i] = Math.sin(Math.PI * Math.pow(t, 0.5)) * (sp.A[i] > 0 ? 1 : 0) * (L0[i] > 0 ? 0.6 : 0);
        }
        sp.upd();
      },
    };
  }
  // instanced scatters get a real bounding sphere, so the camera can skip the ones out of view
  function cullable(w, res, list) {
    const fix = () => res.meshes.forEach(m => {
      if (!m.isInstancedMesh || !m.count) return;
      const m4 = new T.Matrix4(), p = new T.Vector3(), c = new T.Vector3(); let n = m.count, sMax = 0;
      for (let i = 0; i < n; i++) { m.getMatrixAt(i, m4); c.add(p.setFromMatrixPosition(m4)); }
      c.divideScalar(n); let r = 0;
      for (let i = 0; i < n; i++) { m.getMatrixAt(i, m4); r = Math.max(r, p.setFromMatrixPosition(m4).distanceTo(c)); sMax = Math.max(sMax, m4.getMaxScaleOnAxis()); }
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      m.geometry = m.geometry.clone(); m.geometry.boundingSphere = new T.Sphere(c, r + (m.geometry.boundingSphere ? m.geometry.boundingSphere.radius : 2) * sMax + 2);
      m.frustumCulled = true; list.push(m);
    });
    if (res.ready) res.ready.then(fix); else fix();
  }
  function cylBetween(a, b, r0, r1, seg) {
    const d = new T.Vector3().subVectors(b, a), len = d.length();
    const g = new T.CylinderGeometry(r1, r0, len, seg || 7, 1); g.translate(0, len / 2, 0);
    g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()))); g.translate(a.x, a.y, a.z);
    return g;
  }
  function sphereAt(r, sx, sy, sz, x, y, z, seg) { const g = new T.SphereGeometry(r, seg || 14, 10); g.scale(sx, sy, sz); g.translate(x, y, z); return g; }

  /* A camel, simple and dignified: body, hump, neck, head (one mesh), saddle with its loads, and legs. Faces local -z. */
  function camelGeos() {
    const body = SCAPE.merge([
      sphereAt(1, 0.52, 0.5, 1.15, 0, 1.78, 0.05),
      sphereAt(1, 0.42, 0.5, 0.62, 0, 2.15, 0.12),
      new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0, 1.9, -0.85), new T.Vector3(0, 1.62, -1.45), new T.Vector3(0, 1.95, -1.95), new T.Vector3(0, 2.42, -2.08)]), 16, 0.17, 8),
      sphereAt(1, 0.15, 0.17, 0.34, 0, 2.48, -2.3),
      sphereAt(1, 0.1, 0.1, 0.14, 0, 2.44, -2.6),
      cylBetween(new T.Vector3(0, 1.85, 1.15), new T.Vector3(0, 1.1, 1.3), 0.06, 0.03, 5),
    ]);
    const saddle = SCAPE.merge([
      (() => { const g = new T.BoxGeometry(1.25, 0.12, 1.3); g.translate(0, 2.36, 0.1); return g; })(),
      cylBetween(new T.Vector3(-0.62, 2.0, -0.35), new T.Vector3(-0.62, 2.0, 0.6), 0.24, 0.24, 9),
      cylBetween(new T.Vector3(0.62, 2.0, -0.35), new T.Vector3(0.62, 2.0, 0.6), 0.24, 0.24, 9),
      (() => { const g = new T.BoxGeometry(1.5, 0.5, 0.08); g.translate(0, 2.05, -0.55); return g; })(),
      sphereAt(1, 0.32, 0.22, 0.3, 0, 2.55, 0.35),
    ]);
    const leg = SCAPE.merge([cylBetween(new T.Vector3(0, 0, 0), new T.Vector3(0, -0.7, 0.03), 0.15, 0.1, 7), sphereAt(1, 0.1, 0.1, 0.1, 0, -0.72, 0.03, 8), cylBetween(new T.Vector3(0, -0.72, 0.03), new T.Vector3(0, -1.48, 0), 0.085, 0.06, 6), sphereAt(1, 0.12, 0.05, 0.15, 0, -1.5, -0.02, 8)]);
    return { body, saddle, leg };
  }
  const HIPS = [[-0.24, 1.55, -0.7], [0.24, 1.55, -0.7], [-0.24, 1.55, 0.78], [0.24, 1.55, 0.78]];

  /* An acacia leaning over the road with one low limb across the lanes (duck under it). Road runs along local z. */
  function acaciaArch() {
    const V = (x, y, z) => new T.Vector3(x, y, z);
    const bark = SCAPE.merge([
      cylBetween(V(8.2, -0.3, 0), V(6.6, 2.4, 0.2), 0.26, 0.2, 8), cylBetween(V(6.6, 2.4, 0.2), V(4.2, 3.8, 0.1), 0.2, 0.14, 7),
      cylBetween(V(6.6, 2.4, 0.2), V(6.8, 4.0, -1.2), 0.14, 0.09, 6), cylBetween(V(4.2, 3.8, 0.1), V(0.5, 4.3, 0.6), 0.13, 0.07, 6),
      cylBetween(V(7.4, 1.2, 0.1), V(1.5, 1.32, 0.2), 0.13, 0.09, 7), cylBetween(V(1.5, 1.32, 0.2), V(-5.2, 1.12, -0.1), 0.09, 0.05, 6),
      cylBetween(V(-2.0, 1.25, 0.05), V(-3.6, 1.7, 0.8), 0.04, 0.025, 5),
    ]);
    const L = [];
    [[3.6, 4.5, 0.3, 4.6], [6.0, 4.3, -0.8, 2.6], [0.6, 4.7, 0.8, 2.8], [1.8, 4.9, -0.5, 2.6]].forEach(([x, y, z, r]) => {
      const a = new T.CircleGeometry(r, 14); a.rotateX(-Math.PI / 2); a.translate(x, y, z); L.push(a);
      const b = new T.CircleGeometry(r * 0.92, 14); b.rotateX(Math.PI / 2); b.translate(x, y - 0.08, z); L.push(b);
    });
    for (let i = 0; i < 5; i++) { const c = new T.PlaneGeometry(5.5, 1.0); c.rotateY(i * 0.63); c.translate(3.2, 4.55, 0); L.push(c); }
    [[-4.8, 1.2], [-2.5, 1.3]].forEach(([x, y]) => { for (let i = 0; i < 3; i++) { const c = new T.PlaneGeometry(1.1, 0.7); c.rotateY(i * 1.05); c.translate(x, y + 0.15, 0.1); L.push(c); } });
    return { bark, leaf: SCAPE.merge(L) };
  }

  ENGINE.register(WORLD.stage({
    key: 'hijrah',
    arabic: 'الهجرة',
    title: 'The Night Road',
    era: '622 CE · the year 1 of the Hijrah',
    hint: 'A / D or ← → to change lane · W, ↑ or Space to jump · S or ↓ to duck · stay close behind the lamp',
    hintTouch: 'Swipe left or right to change lane · swipe up to jump · swipe down to duck',
    sound: { reverb: 0.5 },
    story: `<p>In the year 622 the Prophet Muhammad ﷺ and his companion Abu Bakr left Makkah and hid for three nights in the Cave of Thawr. Then their hired guide, a man of Banu ad-Dil and an expert in the roads, brought the two camels, and he led them by the road along the coast (Sahih al-Bukhari 3905): some 450 to 470 kilometres to Yathrib.</p>
            <p>Quraysh offered a reward for them. Suraqah ibn Malik rode after them, and the forelegs of his horse sank into the ground (Sahih al-Bukhari 3906). The Hijrah, the migration, became the first year of the Islamic calendar.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: TR.xs[0], z: TR.zs[0], yaw: 0 }, exposure: 0.9, far: 5200, near: 0.3, fov: 64, speed: 3.2, run: 5.8,
        fog: { color: 0x101626, density: 0.0011 } });
      const S = w.scene, Q = w.quality, rnd = U.seeded(1);
      w.renderer.setClearColor(0x05070e);

      /* ---------- terrain: a coarse far field and a fine ribbon along the road ---------- */
      const far = (x, z) => H(x, z) - 2.6 * (1 - U.smooth(78, 100, Math.abs(x - RX(z))));
      const ter = SCAPE.terrain(w, { size: 3400, seg: 230, cx: 0, cz: -200, height: far, rock: [0.8, 0.93],
        colors: { low: '#9c8670', high: '#ab9476', rock: '#6e6258', dark: '#4a403c' }, tex: 'dune', rockTex: 'granite',
        photo: { ground: 'dense_sand', rock: 'rock_face_03', normal: 1 }, rep: 0.2, rockRep: 0.03 });
      { const p = ter.mesh.geometry.attributes.position, c = ter.mesh.geometry.attributes.color, t3 = [0, 0, 0];
        for (let i = 0; i < p.count; i++) { tint(p.getX(i), p.getZ(i), t3); c.setXYZ(i, c.getX(i) * t3[0], c.getY(i) * t3[1], c.getZ(i) * t3[2]); } c.needsUpdate = true; }
      this.ribbon(w, ter.mesh.material, Q);
      w.ground = (x, z) => { const d = Math.abs(x - RX(z)); return d < 88 ? H(x, z) : d > 98 ? ter.ground(x, z) : U.lerp(H(x, z), ter.ground(x, z), U.smooth(88, 98, d)); };

      /* ---------- sky, moon and light ---------- */
      this.moon = new T.DirectionalLight(0x9fb4e8, 0.3); this.moon.position.set(-40, 75, 55); S.add(this.moon);
      this.hemi = new T.HemisphereLight(0x46588c, 0x1a140e, PHOTO.enabled ? 0.1 : 0.35); S.add(this.hemi);
      w.followShadow(this.moon, 46, Q < 1 ? 1024 : 2048);
      this.dawnK = 0; this.skies = {};
      if (PHOTO.enabled) {
        const grab = () => { const m = S.children[S.children.length - 1]; return m && m.material && m.material.uniforms && m.material.uniforms.tSky ? m : null; };
        PHOTO.sky(w, 'qwantani_night_puresky', { rotation: 0.82, intensity: 0.38, haze: '#141b30', horizon: 0.55, ground: '#2a2836', bounce: 0.25 });
        this.skies.night = grab(); if (this.skies.night) this.skies.night.material.uniforms.uGain.value = 0.85;
        PHOTO.sky(w, 'qwantani_dawn_puresky', { env: false, rotation: -0.63, haze: '#c0a890', horizon: 0.45 });
        const dm = this.skies.dawn = grab();
        if (dm) {
          const m = dm.material; m.uniforms.uA = { value: 0 }; m.transparent = true; dm.renderOrder = -9;
          m.fragmentShader = m.fragmentShader.replace('varying vec3 vDir;', 'uniform float uA; varying vec3 vDir;').replace('gl_FragColor = vec4(c, 1.);', 'gl_FragColor = vec4(c, uA);');
        }
      } else {
        this.proSky = w.sky({ top: '#03050e', mid: '#0e1630', bot: '#0a0e1a', sunDir: [0.95, -0.2, -0.2], sun: '#000000', stars: 0.9, haze: 0.3 });
      }
      SCAPE.horizon(w, { cx: 0, cz: -200, haze: '#141b30', layers: [{ r: 2000, h: 90, color: '#262c40', seed: 4, fade: 0.9 }, { r: 2500, h: 130, color: '#222838', seed: 9, fade: 0.9 }, { r: 3100, h: 170, color: '#1e2434', seed: 15, fade: 0.9 }] });

      /* ---------- the sea, west of the coastal plain ---------- */
      const seaMat = new T.MeshStandardMaterial({ color: 0x0c1626, roughness: 0.12, metalness: 0.2 });
      const sea = new T.Mesh(new T.PlaneGeometry(4000, 4000), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.set(-900, -2.6, -200); S.add(sea);
      this.glitter = KIT.glow(w, 0xbcd0ff, 180, 0.0); this.glitter.material.fog = false; S.add(this.glitter);

      /* ---------- scattered life of each place ---------- */
      const ZW = (z, k) => { const Z = zones(z); return Z.a * k[0] + Z.b * k[1] + Z.c * k[2] + Z.d * (1 - Z.o) * k[3] + Z.d * Z.o * (k[4] || 0); };
      const near = (x, z, a, b) => { const d = Math.abs(x - RX(z)); return d < a ? 0 : 1 - U.smooth(a, b, d) * 0.85; };
      const road = (x, z, m) => Math.abs(x - RX(z)) < (m || 6.5);
      const AREA = [-520, Z1 + 40, 560, Z0 + 260];
      // every scatter is cut into bands along the road, so what lies far behind or far ahead is not drawn
      this.cullList = [];
      const NB = 7, bandZ = k => U.lerp(AREA[3], AREA[1], k / NB);
      const sc = o => {
        if (o.area) { const r = SCAPE.scatter(w, o); cullable(w, r, this.cullList); return r; }
        const out = { meshes: [], list: [] };
        for (let k = 0; k < NB; k++) {
          const r = SCAPE.scatter(w, Object.assign({}, o, { n: Math.max(1, Math.round(o.n / NB)), seed: o.seed * 13 + k, area: [AREA[0], bandZ(k + 1), AREA[2], bandZ(k)] }));
          cullable(w, r, this.cullList); out.list.push(...r.list); if (r.ready) r.ready.then(() => out.meshes.push(...r.meshes)); else out.meshes.push(...r.meshes);
        }
        return out;
      };
      const scPts = o => { for (let k = 0; k < NB; k++) { const z1 = bandZ(k), z0 = bandZ(k + 1), pts = o.points.filter(q => q[1] <= z1 && q[1] > z0); if (pts.length) cullable(w, SCAPE.scatter(w, Object.assign({}, o, { points: pts })), this.cullList); } };
      const nearArea = (a, b, k) => ({ density: (x, z) => near(x, z, a, b) * ZW(z, k) });
      sc(Object.assign({ kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 150, scale: [0.9, 2.6], seed: 11, collide: false, avoid: (x, z) => road(x, z, 10) }, nearArea(10, 170, [1, 0.25, 0.4, 0.5, 0])));
      sc(Object.assign({ kind: 'model', model: 'namaqualand_boulder_04', fallback: 'boulder', n: 110, scale: [0.8, 2.2], seed: 12, avoid: (x, z) => road(x, z, 9) }, nearArea(9, 150, [1, 0.2, 0.5, 0.2, 0])));
      sc(Object.assign({ kind: 'model', model: 'rock_07', fallback: 'rock', n: 160, scale: [0.6, 1.8], seed: 13, avoid: (x, z) => road(x, z, 8) }, nearArea(8, 120, [1, 0.3, 0.6, 0.6, 0.2])));
      sc(Object.assign({ kind: 'model', model: 'namaqualand_rocks_01', fallback: 'rock', fallbackScale: 0.4, n: 520, scale: [0.6, 1.6], seed: 14, avoid: (x, z) => road(x, z, 5.2) }, nearArea(5.2, 70, [1, 0.4, 0.8, 0.9, 0.4])));
      sc(Object.assign({ kind: 'model', model: 'namaqualand_stones_01', fallback: 'pebble', fallbackScale: 0.6, n: 1500, scale: [0.6, 1.5], seed: 15, castShadow: false, avoid: (x, z) => road(x, z, 4.6) }, nearArea(4.6, 34, [1, 0.5, 1, 1, 0.6])));
      sc(Object.assign({ kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 240, scale: [0.6, 1.4], seed: 16, avoid: (x, z) => road(x, z, 7) }, nearArea(7, 90, [0.4, 0.8, 1, 0.3, 0.8])));
      sc(Object.assign({ kind: 'model', model: 'wild_rooibos_bush', fallback: 'shrub', n: 160, scale: [0.6, 1.2], seed: 17, avoid: (x, z) => road(x, z, 7) }, nearArea(7, 80, [0.2, 0.4, 1, 0.6, 1])));
      sc(Object.assign({ kind: 'model', model: 'dry_branches_medium_01', fallback: 'thorn', n: 90, scale: [0.8, 1.4], seed: 19, avoid: (x, z) => road(x, z, 7) }, nearArea(7, 80, [0.8, 0.5, 1, 0.5, 0])));
      sc(Object.assign({ kind: 'model', model: 'dead_tree_trunk', fallback: 'rock', n: 26, scale: [0.8, 1.2], seed: 20, avoid: (x, z) => road(x, z, 9) }, nearArea(9, 80, [0.3, 1, 0.8, 0.2, 0])));
      sc({ kind: 'boulder', n: 420, scale: [3, 14], seed: 21, tex: 'granite', color: '#8a8078', density: (x, z) => U.smooth(60, 160, Math.abs(x - RX(z))) * ZW(z, [1, 0.2, 0.3, 0, 0]) });
      sc({ kind: 'boulder', n: 520, scale: [0.8, 4], seed: 22, tex: 'lava', color: '#77706a', avoid: (x, z) => road(x, z, 7), density: (x, z) => near(x, z, 7, 220) * ZW(z, [0, 0, 0, 1, 0.2]) });
      sc({ kind: 'rock', n: 800, scale: [0.3, 1.2], seed: 23, avoid: (x, z) => road(x, z, 5), density: (x, z) => near(x, z, 5, 160) * ZW(z, [1, 0.3, 0.6, 1, 0.4]) });
      sc({ kind: 'grass', n: 1900, scale: [0.4, 0.9], seed: 24, avoid: (x, z) => road(x, z, 4.6), density: (x, z) => near(x, z, 4.6, 60) * ZW(z, [0.4, 1, 1, 0.3, 1]) });
      sc({ kind: 'thorn', n: 300, scale: [0.7, 1.4], seed: 25, avoid: (x, z) => road(x, z, 6), density: (x, z) => near(x, z, 6, 140) * ZW(z, [0.4, 0.6, 1, 0.5, 0.5]) });
      sc({ kind: 'shrub', n: 240, scale: [0.6, 1.3], seed: 26, avoid: (x, z) => road(x, z, 6), density: (x, z) => near(x, z, 6, 160) * ZW(z, [0.3, 0.8, 1, 0.4, 0.8]) });
      sc({ kind: 'acacia', n: 170, scale: [0.9, 1.5], seed: 27, collide: false, avoid: (x, z) => road(x, z, 13), density: (x, z) => near(x, z, 13, 260) * ZW(z, [0.15, 0.5, 1, 0.3, 0.6]) });
      // the oasis of Quba: palms and the first houses, waiting at the end of the road
      const oz = zAt(2450), ox = RX(oz);
      sc({ kind: 'palm', n: 320, scale: [7, 14], seed: 28, area: [ox - 340, oz - 320, ox + 340, oz + 170], avoid: (x, z) => road(x, z, 9) || (z > zAt(2330) && Math.abs(x - RX(z)) < 60) });
      const hs = sc({ kind: 'house', n: 46, scale: [6, 10], seed: 29, area: [ox - 260, oz - 330, ox + 260, oz - 60], avoid: (x, z) => road(x, z, 22) });
      hs.meshes.forEach(m => { m.material = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.25, fallback: m.material.map, color: '#d8c8b0' }); });
      // cairns of stones marking the guide's way
      const cairns = []; for (let s = 30; s < STOP; s += 46) { const p = tp(s), side = (s / 46 | 0) % 2 ? 1 : -1; cairns.push([p.x + p.rx * 8.6 * side, p.z + p.rz * 8.6 * side, 1.25]); }
      scPts({ kind: 'model', model: 'namaqualand_rocks_01', variant: 1, fallback: 'rock', fallbackScale: 0.5, points: cairns, seed: 31 });

      /* ---------- obstacles ---------- */
      const rockPts = [], bankPts = [], forkPts = [], branchList = [];
      COURSE.forEach(o => {
        const p = tp(o.s);
        if (o.type === 'rock') o.lanes.forEach(l => { const j = (rnd() - 0.5) * 0.5; rockPts.push([p.x + p.rx * (l * LANE + j), p.z + p.rz * (l * LANE + j), 1.0 + rnd() * 0.25]); bankPts.push([p.x + p.rx * (l * LANE + 1) + p.tx * 1.2, p.z + p.rz * (l * LANE + 1) + p.tz * 1.2, 0.7]); });
        if (o.type === 'gully') for (let k = -9; k <= 9; k++) { if (rnd() < 0.35) continue; [-1, 1].forEach(sd => bankPts.push([p.x + p.rx * (k * 2.2 + rnd()) + p.tx * sd * (3.3 + rnd() * 0.6), p.z + p.rz * (k * 2.2 + rnd()) + p.tz * sd * (3.3 + rnd() * 0.6), 0.5 + rnd() * 0.5])); }
        if (o.type === 'fork') for (let k = -14; k <= 14; k += 4.5) { const q = tp(o.s + k); forkPts.push([q.x + q.rx * (rnd() - 0.5) * 0.6, q.z + q.rz * (rnd() - 0.5) * 0.6, U.lerp(1.12, 0.7, Math.abs(k) / 14)]); }
        if (o.type === 'branch') branchList.push(o);
      });
      scPts({ kind: 'model', model: 'namaqualand_boulder_05', fallback: 'boulder', fallbackScale: 0.8, points: rockPts, seed: 32, sink: 0.08 });
      scPts({ kind: 'model', model: 'namaqualand_rocks_01', variant: 2, fallback: 'rock', fallbackScale: 0.4, points: bankPts, seed: 33 });
      scPts({ kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', points: forkPts, seed: 34, sink: 0.15 });
      // the low acacia limbs
      const arch = acaciaArch();
      const barkM = PHOTO.mat(w, 'medieval_wood', { triplanar: 0.7, color: '#a08a78', fallback: KIT.bark(w) });
      const leafM = SCAPE.sway(new T.MeshStandardMaterial({ map: SCAPE.tex.leaves(w), alphaTest: 0.45, side: T.DoubleSide, roughness: 0.85, color: 0xb8c49a }), 0.012);
      const ib = new T.InstancedMesh(arch.bark, barkM, branchList.length), il = new T.InstancedMesh(arch.leaf, leafM, branchList.length);
      const m4 = new T.Matrix4(), q4 = new T.Quaternion(), v4 = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      branchList.forEach((o, i) => { const p = tp(o.s), flip = i % 2 ? Math.PI : 0; q4.setFromAxisAngle(new T.Vector3(0, 1, 0), Math.atan2(p.rx, p.rz) - Math.PI / 2 + flip); v4.set(p.x, H(p.x, p.z), p.z); m4.compose(v4, q4, one); ib.setMatrixAt(i, m4); il.setMatrixAt(i, m4); });
      [ib, il].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.userData.dynamic = true; S.add(m); });
      // the soft sand on the wrong side of each fork: small dunes of drift and thorn
      const softPts = []; FORKS.forEach(f => { for (let k = -12; k <= 12; k += 3) { const q = tp(f.s + k); softPts.push([q.x + q.rx * -f.good * (LANE + 0.6 * rnd()), q.z + q.rz * -f.good * (LANE + 0.6 * rnd()), 0.5 + rnd() * 0.3]); } });
      scPts({ kind: 'thorn', points: softPts, seed: 35, color: '#c8b8a0' });

      /* ---------- Jabal Thawr: the cave mouth high on the slope behind the start ---------- */
      const cp = tp(-150); this.cave = new T.Vector3(cp.x + 34, 0, cp.z); this.cave.y = H(this.cave.x, this.cave.z) + 1;
      PHOTO.place(w, 'namaqualand_cliff_01', { pos: [this.cave.x - 5, this.cave.y - 3, this.cave.z + 2], s: 1.2, ry: 0.4 });
      PHOTO.place(w, 'namaqualand_cliff_01', { pos: [this.cave.x + 5, this.cave.y - 3.5, this.cave.z + 3], s: 1.1, ry: 2.6 });
      const mouth = new T.Mesh(new T.SphereGeometry(1, 16, 10), new T.MeshBasicMaterial({ color: 0x020204 })); mouth.scale.set(2.2, 1.3, 1.2); mouth.position.set(this.cave.x, this.cave.y + 0.6, this.cave.z + 0.8); S.add(mouth);
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', points: [[this.cave.x - 3.4, this.cave.z - 1.5, 1.6], [this.cave.x + 3.2, this.cave.z - 1.2, 1.4], [this.cave.x + 1, this.cave.z - 3.5, 0.9]], seed: 36 });

      /* ---------- the camels, the guide's lamp, and their camp below the cave ---------- */
      const cg = camelGeos();
      const fur = PHOTO.mat(w, 'rough_linen', { color: '#5a3c24', rep: [2, 2], normal: 0.7, fallbackColor: '#5e4632' });
      const cloth = PHOTO.mat(w, 'brown_leather', { color: '#9a6a4a', rep: [1, 1] });
      this.cBody = new T.InstancedMesh(cg.body, fur, 2); this.cSad = new T.InstancedMesh(cg.saddle, cloth, 2); this.cLeg = new T.InstancedMesh(cg.leg, fur, 8);
      [this.cBody, this.cSad, this.cLeg].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.userData.dynamic = true; m.instanceMatrix.setUsage(T.DynamicDrawUsage); S.add(m); });
      this.lampGlow = KIT.glow(w, 0xffb060, 2.0, 0.9); this.lampCore = KIT.glow(w, 0xfff2cc, 0.55, 1); S.add(this.lampGlow); S.add(this.lampCore);
      this.lampL = new T.PointLight(0xffa850, 1.3, 20, 2); S.add(this.lampL);
      const kp = tp(-26); this.camp = new T.Vector3(kp.x + kp.rx * 4, 0, kp.z + kp.rz * 4); this.camp.y = H(this.camp.x, this.camp.z);
      PHOTO.place(w, 'stone_fire_pit', { pos: [this.camp.x - 2.4, undefined, this.camp.z + 1.4], s: 0.9 });
      this.fireGlow = KIT.glow(w, 0xff8a3a, 1.5, 0.6); this.fireGlow.position.set(this.camp.x - 2.4, this.camp.y + 0.4, this.camp.z + 1.4); S.add(this.fireGlow);
      SCAPE.smoke(w, { sources: [[this.camp.x - 2.4, this.camp.y + 0.6, this.camp.z + 1.4]], n: 14, height: 9, size: 1.6, opacity: 0.12, color: '#6a6a78' });
      this.camelS = [6, 2]; this.kneel = 0;

      /* ---------- the tent at Qudayd, by the coastal road ---------- */
      const tq = tp(1640), tx0 = tq.x + tq.rx * -24, tz0 = tq.z + tq.rz * -24, ty0 = H(tx0, tz0);
      const goat = PHOTO.mat(w, 'rough_linen', { color: '#3a302a', rep: [3, 2] });
      const tent = new T.Group(); tent.position.set(tx0, ty0, tz0); tent.rotation.y = Math.atan2(tq.rx, tq.rz) + Math.PI; S.add(tent);
      const roofG = new T.PlaneGeometry(7, 3.8, 6, 3); { const rp = roofG.attributes.position; for (let i = 0; i < rp.count; i++) rp.setZ(i, -Math.cos(rp.getX(i) / 3.5 * Math.PI * 1.5) * 0.12 * (rp.getX(i) % 3.5 === 0 ? 0 : 1)); }
      roofG.rotateX(-Math.PI / 2 + 0.3); const roof = new T.Mesh(roofG, goat); roof.position.set(0, 1.65, 0.1); tent.add(roof);
      for (let i = -1; i <= 1; i++) { const pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.1, 5), barkM); pole.position.set(i * 3, 1.05, 1.3); tent.add(pole); }
      tent.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.material.side = T.DoubleSide; } });
      this.tentLamp = new T.PointLight(0xffa860, 1.6, 14, 2); this.tentLamp.position.set(tx0 + tq.rx * 0.8, ty0 + 1.0, tz0 + tq.rz * 0.8); S.add(this.tentLamp);
      const tg = KIT.glow(w, 0xffb070, 2.2, 0.8); tg.position.copy(this.tentLamp.position); S.add(tg); this.tentGlow = tg;
      PHOTO.place(w, 'wicker_basket_01', { pos: [tx0 + tq.rx * 3 + tq.tx * 2, undefined, tz0 + tq.rz * 3 + tq.tz * 2], s: 1.2 });
      PHOTO.place(w, 'jug_01', { pos: [tx0 + tq.rx * 3.2 + tq.tx * 1.2, undefined, tz0 + tq.rz * 3.2 + tq.tz * 1.2], s: 1.4 });

      /* ---------- the searchers' torches on the hills of Makkah, seen in the film ---------- */
      this.torches = [];
      for (let i = 0; i < 7; i++) { const g = KIT.glow(w, 0xff9a40, 14, 0); g.material.fog = false; g.userData.ph = i * 1.7; g.userData.x = TR.xs[0] - 260 + i * 80; S.add(g); this.torches.push(g); }

      /* ---------- your light, its trail and the starlight on the road ---------- */
      this.orb = KIT.glow(w, 0xffd9a0, 1.4, 0.75); this.orbCore = new T.Mesh(new T.SphereGeometry(0.13, 16, 12), new T.MeshBasicMaterial({ color: 0xfff4dc }));
      S.add(this.orb); S.add(this.orbCore);
      this.orbL = new T.PointLight(0xffc27a, 1.1, 12, 2); S.add(this.orbL);
      this.trail = sprites(w, 46, '#ffc87a', true); this.trailI = 0;
      this.sand = burstPool(w, 120, '#a89478', false); this.sparks = burstPool(w, 80, '#ffe0a0', true);
      this.dust = sprites(w, 70, '#8a7c6c', false); this.dustOn = 0;
      // starlight motes: strings that show the safe way through each obstacle
      const M = []; const str = (s0, n, lane, hf) => { for (let i = 0; i < n; i++) M.push({ s: s0 + i * 3, lat: lane * LANE, h: hf ? hf(i / Math.max(1, n - 1)) : 1.05 }); };
      COURSE.forEach(o => {
        if (o.type === 'rock') { const free = [-1, 0, 1].filter(l => !o.lanes.includes(l)); str(o.s - 13, 6, free[(o.s | 0) % free.length]); }
        if (o.type === 'gully') str(o.s - 7, 5, [(o.s | 0) % 3 - 1][0], t => 1.05 + Math.sin(t * Math.PI) * 1.4);
        if (o.type === 'branch') str(o.s - 9, 5, ((o.s / 7) | 0) % 3 - 1, () => 0.45);
        if (o.type === 'fork') str(o.s - 12, 9, o.good);
      });
      M.sort((a, b) => a.s - b.s);
      this.motes = M; this.moteSp = sprites(w, M.length, '#ffe2a8', true);
      M.forEach((m, i) => { const p = tp(m.s); m.x = p.x + p.rx * m.lat; m.z = p.z + p.rz * m.lat; m.y = H(m.x, m.z) + m.h; this.moteSp.P.set([m.x, m.y, m.z], i * 3); this.moteSp.S[i] = 0.32; this.moteSp.A[i] = 0.8; });
      this.moteSp.upd();

      /* ---------- discoveries along the road (fly through the golden light) ---------- */
      const D = (s, lane, d) => { const p = tp(s), x = p.x + p.rx * lane * LANE, z = p.z + p.rz * lane * LANE; const it = w.discover(Object.assign({ pos: [x, H(x, z) + 1.1, z], size: 2.4, color: 0xffd36a }, d)); this.disc.push({ s, lane, it, d }); };
      this.disc = [];
      D(34, 0, { title: 'The Cave of Thawr', text: 'They stayed three nights in a cave on the mountain of Thawr, and ‘Amir ibn Fuhayrah, Abu Bakr’s freed slave, brought milch sheep to them after nightfall. (Sahih al-Bukhari 3905)', ar: 'غار ثور' });
      D(540, 1, { title: 'An Expert Guide', text: 'They had hired a man of Banu ad-Dil as an expert guide. He still followed the religion of Quraysh, yet they trusted him and gave him their two camels, to bring them to the cave after three nights. (Sahih al-Bukhari 3905)', ar: 'هَادِيًا خِرِّيتًا' });
      D(1190, -1, { title: 'The Road by the Sea', text: '‘Amir ibn Fuhayrah and the guide went with them, and the guide led them along the shore. (Sahih al-Bukhari 3905) The way from Thawr to Quba is some 450 to 470 kilometres.', ar: 'طريق الساحل' });
      D(1405, 0, { title: 'A Price on the Road', text: 'Messengers of Quraysh went among the tribes, offering for each of the two travellers a reward equal to his blood-price, to whoever killed or captured him. (Sahih al-Bukhari 3906)', ar: 'دِيَةَ كُلِّ وَاحِدٍ مِنْهُمَا' });
      D(1636, -1, { title: 'A Tent at Qudayd', text: 'Tradition tells of the tent of Umm Ma‘bad at Qudayd on this road, where a dry, thin ewe gave milk. The report is beloved in the sirah (al-Hakim, Ibn Sa‘d), though its chains are of disputed strength.', ar: 'خيمة أم معبد' });
      D(2010, 1, { title: 'The First Year', text: 'The Hijrah became the starting point of the Islamic calendar: years are counted from his arrival in Madinah (Sahih al-Bukhari 3934), a reckoning adopted in the time of ‘Umar.', ar: 'التقويم الهجري' });
      D(2300, 0, { title: 'Quba', text: 'He came down among Banu ‘Amr ibn ‘Awf at Quba, on a Monday in the month of Rabi‘ al-Awwal. (Sahih al-Bukhari 3906)', ar: 'قُبَاء' });

      /* ---------- the hand-off from the film to the run ---------- */
      this.R = { s: 0, lat: 0, lane: 0, jy: 0, vy: 0, duck: 0, v: 0, mul: 1, gap: 22, light: 0.8, hitT: 0, shake: 0, roll: 0, mi: 0, oi: 0, di: 0, soft: 0, camY: 0, phase: 0, pursuit: 0, dustD: 120, sunk: 0, end: 0 };
      const c0 = this.camPose(0, 0, 0);
      w.pos.set(c0.p.x, 0, c0.p.z); w.eye = c0.p.y - w.ground(c0.p.x, c0.p.z);
      const dl = c0.l.clone().sub(c0.p); w.yaw = Math.atan2(-dl.x, -dl.z); w.pitch = Math.asin(dl.y / dl.length());
      this.placeOrb(0, 0, 0, 0);
      this.setCamels(6, 0, 0, 0);

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 0.6, gain: 0.06 });
      this.rush = SND.noise(b, { color: 'white', type: 'highpass', freq: 3000, gain: 0.0 });
      SND.lfo(b, this.wind.filter && this.wind.filter.frequency, 0.06, 150);
      this.hum = SND.drone(b, 110, { vowel: 'u', gain: 0.0 });
      this.clk = { pad: 0, gust: 3, cricket: 1, hoof: 0, bird: 1 };

      // post: night blue, warm lamps that bloom
      this.post = w.post({ bloom: 0.85, threshold: 0.6, vignette: 0.5, grain: 0.035, sat: 0.92, contrast: 1.05, lift: [0.0, 0.008, 0.03], gain: [0.96, 0.98, 1.06], rays: { strength: 0.0, pos: [0, 0, 0] } });
      w.goal(null);
      w.tick(dt => this.world(env, dt));
    },

    /* the fine ribbon of ground along the road, sharing the terrain's material */
    ribbon(w, mat, Q) {
      const offs = []; for (let o = -12; o <= 12.001; o += 1.5) offs.push(o);
      let st = 1.5, o = 12; while (o < 100) { st *= 1.24; o = Math.min(100, o + st); offs.push(o); offs.unshift(-o); }
      const nx = offs.length, ds = Q < 1 ? 2.2 : 1.6, S0 = -240, S1 = TR.len + 40, CH = 340;
      const C = ['#9c8670', '#ab9476', '#6e6258', '#4a403c'].map(h => U.hex(h).map(v => Math.pow(v / 255, 2.2)));
      const t3 = [0, 0, 0], p = {};
      for (let c0 = S0; c0 < S1; c0 += CH) {
        const rows = []; for (let s = c0; s <= Math.min(S1, c0 + CH) + 1e-6; s += ds) rows.push(s);
        const nz = rows.length, NC = nx + 4, P = new Float32Array(NC * nz * 3), UV = new Float32Array(NC * nz * 2), idx = [];
        rows.forEach((s, j) => {
          tp(s, p);
          for (let i = 0; i < NC; i++) {
            const oi = i < 2 ? 0 : i >= nx + 2 ? nx - 1 : i - 2, off = offs[oi], x = p.x + p.rx * off, z = p.z + p.rz * off;
            const y = H(x, z) - (i === 0 || i === NC - 1 ? 4 : 0), k = j * NC + i;
            P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z; UV[k * 2] = x * 0.2; UV[k * 2 + 1] = z * 0.2;
          }
        });
        const q = (a, b2, c, d) => idx.push(a, b2, c, b2, d, c);
        for (let j = 0; j < nz - 1; j++) {
          for (let i = 2; i < nx + 1; i++) { const a = j * NC + i; q(a, a + 1, a + NC, a + NC + 1); }
          const a0 = j * NC; q(a0, a0 + 1, a0 + NC, a0 + NC + 1);
          const a1 = j * NC + nx + 2; q(a1, a1 + 1, a1 + NC, a1 + NC + 1);
        }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('uv', new T.BufferAttribute(UV, 2)); g.setIndex(idx); g.computeVertexNormals();
        const N = g.attributes.normal, n = NC * nz, col = new Float32Array(n * 3), rk = new Float32Array(n);
        for (let k = 0; k < n; k++) {
          const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2], ny = N.getY(k);
          const macro = SCAPE.fbm(x * 0.012, z * 0.012, 3) * 0.5 + 0.5;
          let rock = 1 - U.smooth(0.8, 0.93, ny); rock = U.clamp(rock + SCAPE.fbm(x * 0.05, z * 0.05, 3) * 0.35 * rock);
          let c = U.mix(C[0], C[1], U.clamp(macro * 1.3 - 0.15)); c = U.mix(c, U.mix(C[2], C[3], U.clamp(SCAPE.fbm(x * 0.03 + 9, z * 0.03, 3) + 0.4)), rock);
          tint(x, z, t3);
          col[k * 3] = c[0] * t3[0]; col[k * 3 + 1] = c[1] * t3[1]; col[k * 3 + 2] = c[2] * t3[2]; rk[k] = rock;
        }
        g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setAttribute('rockiness', new T.BufferAttribute(rk, 1)); g.computeBoundingSphere();
        const m = new T.Mesh(g, mat); m.receiveShadow = true; w.scene.add(m);
      }
    },

    /* the runner's camera: behind and above the light, looking down the road */
    camPose(s, lat, jy) {
      const a = tp(s - 6.4), b = tp(s + 10), w = this.w;
      const gy = H(a.x + a.rx * lat * 0.75, a.z + a.rz * lat * 0.75);
      const p = new T.Vector3(a.x + a.rx * lat * 0.75, Math.max(gy, H(tp(s).x, tp(s).z)) + 2.35 + jy * 0.35, a.z + a.rz * lat * 0.75);
      const lx = b.x + b.rx * lat * 0.5, lz = b.z + b.rz * lat * 0.5;
      const l = new T.Vector3(lx, H(lx, lz) + 0.9 + jy * 0.2, lz);
      return { p, l };
    },
    placeOrb(s, lat, h, duck) {
      const p = tp(s), x = p.x + p.rx * lat, z = p.z + p.rz * lat, y = H(x, z) + h;
      this.orb.position.set(x, y, z); this.orbCore.position.set(x, y, z); this.orbL.position.set(x, y + 0.35, z);
      const sq = duck ? 1 : 0;
      this.orbCore.scale.set(1 + sq * 0.5, 1 - sq * 0.45, 1 + sq * 0.5);
      return this.orb.position;
    },
    // the two camels walking (or kneeling) at s along the road, with the lamp swinging from the first saddle
    setCamels(s, lat, gait, kneel) {
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ'), v = new T.Vector3(), one = new T.Vector3(1, 1, 1), hip = new T.Vector3();
      for (let c = 0; c < 2; c++) {
        let x, z, hd, y;
        if (this.camelAt) { const A = this.camelAt[c]; x = A[0]; z = A[1]; hd = A[2]; }
        else { const p = tp(s - c * 4.6), off = lat + (c ? 0.6 : 0); x = p.x + p.rx * off; z = p.z + p.rz * off; hd = Math.atan2(-p.tx, -p.tz); }
        y = H(x, z);
        const bob = Math.abs(Math.sin(gait + c)) * 0.06 * (1 - kneel);
        e.set(-kneel * 0.08 + Math.sin(gait * 2 + c) * 0.015, hd, 0); q.setFromEuler(e); v.set(x, y - kneel * 1.12 + bob, z);
        m4.compose(v, q, one); this.cBody.setMatrixAt(c, m4); this.cSad.setMatrixAt(c, m4);
        if (c === 0) { hip.set(Math.sin(gait) * 0.04, 1.62 + Math.sin(gait * 2) * 0.04, -1.5).applyMatrix4(m4); this.lampGlow.position.copy(hip); this.lampCore.position.copy(hip); this.lampL.position.copy(hip); }
        HIPS.forEach((hp, k) => {
          const swing = Math.sin(gait + (k === 0 || k === 3 ? 0 : Math.PI) + c * 0.7) * 0.42 * (1 - kneel);
          const fold = kneel * (k < 2 ? 1.45 : -1.45);
          hip.set(hp[0], hp[1], hp[2]).applyMatrix4(m4);
          e.set(swing + fold, hd, 0); q.setFromEuler(e); m4.compose(hip, q, v.set(1, 1 - kneel * 0.3, 1));
          this.cLeg.setMatrixAt(c * 4 + k, m4);
          m4.compose(v.set(x, y - kneel * 1.12 + bob, z), q.setFromEuler(e.set(-kneel * 0.08 + Math.sin(gait * 2 + c) * 0.015, hd, 0)), one);
        });
      }
      this.cBody.instanceMatrix.needsUpdate = this.cSad.instanceMatrix.needsUpdate = this.cLeg.instanceMatrix.needsUpdate = true;
    },

    film(env, w) {
      const self = this, P = (s, lat, h, abs) => { const p = tp(s), x = p.x + p.rx * lat, z = p.z + p.rz * lat; return [x, abs ? h : H(x, z) + h, z]; };
      const C = this.cave, K = this.camp;
      const a = tp(-190), b = tp(-70);
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [48, 42],
          path: [[[a.x + 150, 330, a.z + 90], P(700, 0, 0)], [[b.x + 80, 190, b.z + 40], P(520, 0, 0)]],
          start: () => { self.camelAt = null; self.kneel = 1; } },
        { dur: 6, fade: 'dip', fov: [40, 34], line: 'The Prophet ﷺ and Abu Bakr have hidden three nights in the Cave of Thawr.', ar: 'ثلاث ليالٍ في غار ثور',
          path: [[[C.x - 6, C.y + 5, C.z - 34], [C.x, C.y + 0.8, C.z]], [[C.x - 2, C.y + 2.6, C.z - 13], [C.x, C.y + 0.8, C.z]]] },
        { dur: 7, fade: 'dip', fov: [44, 40],
          lines: [[0.4, 'After three nights, the guide brings their two camels.', 'وبعد ثلاث ليالٍ يأتي الدليل بالراحلتين'], [3.6, 'He is a man of Banu ad-Dil, an expert guide (Sahih al-Bukhari 3905).', 'رجلٌ من بني الدِّيل، هاديًا خِرِّيتًا']],
          path: [[[K.x - 9, K.y + 1.3, K.z + 7], [K.x, K.y + 1.3, K.z]], [[K.x - 8, K.y + 1.8, K.z - 2], [K.x, K.y + 1.6, K.z]], [[K.x - 5, K.y + 2.4, K.z - 8], [K.x, K.y + 1.8, K.z]]],
          start: () => { self.camelAt = [[K.x, K.z, 0.6], [K.x + 2.2, K.z + 2.6, 0.9]]; self.kneel = 1; },
          during: (w, k) => { self.kneel = 1 - U.smooth(0.5, 0.9, k); if (k > 0.5 && !self._rose) { self._rose = true; SND.swell(env.bus, { f0: 180, f1: 520, dur: 1.8, gain: 0.05 }); SND.step(env.bus, { gain: 0.08, f: 220 }); } } },
        { dur: 6, fade: 'dip', fov: [36, 32], line: 'Quraysh offer a reward, a blood-price for each of them (Sahih al-Bukhari 3906).', ar: 'وجعلت قريش في كل واحدٍ منهما ديته',
          path: [[P(70, -14, 7), [TR.xs[0], 150, TR.zs[0] + 330]], [P(55, -10, 5), [TR.xs[0] + 40, 140, TR.zs[0] + 330]]],
          start: () => { self.camelAt = null; self.torchK = 1; SND.swell(env.bus, { f0: 120, f1: 300, dur: 4, gain: 0.04 }); } },
        { dur: 7, fade: 'dip', fov: [50, 46], line: 'The guide leads them along the shore (Sahih al-Bukhari 3905).', ar: 'فأخذ بهم الدليل طريق الساحل',
          path: [[P(1050, -40, 18), P(1500, -300, 0, true)], [P(1110, -110, 70), P(1600, -380, 0, true)]],
          start: () => { self.torchK = 0; SND.glow(env.bus, 146.83, { gain: 0.05, dur: 7, vowel: 'a' }); } },
        { dur: 7, fade: 'dip', fov: [46, 64],
          lines: [[0.5, 'Some 450 to 470 kilometres lie between them and Yathrib.', 'نحو أربعمئة وخمسين إلى أربعمئة وسبعين كيلومترًا إلى يثرب'], [3.8, 'Keep close behind the guide’s lamp.', 'ابقَ قريبًا خلف مصباح الدليل']],
          path: [[P(-16, 1.4, 0.6), P(4, 0, 1.2)], [P(-10, 0.6, 1.2), P(10, 0, 1.4)]],
          start: () => { self.camelAt = null; self.kneel = 0; self.filmWalk = 0; SND.sing(env.bus, 220, { vowel: 'o', dur: 4, gain: 0.03 }); },
          during: (w, k, dt) => { self.filmWalk += dt; } },
      ];
    },
    filmOpts: {
      end(w, skipped) {
        const self = ENGINE.cur && ENGINE.cur.w === w ? ENGINE.cur : null; if (!self) return;
        self.camelAt = null; self.kneel = 0; self.torchK = 0;
        self.startRun();
      },
    },

    startRun() {
      const w = this.w, R = this.R;
      R.s = 0; R.v = 7; R.on = true;
      w.mode = (dt) => this.run(dt);
      w.onPointer = (e, p, phase) => this.pointer(e, phase);
      w.activity('The Night Road', 3, '');
      this.setPhase(0);
      if (w.ui.layer.classList.contains('touch')) this.touchButtons();
    },
    setPhase(i) {
      const R = this.R, w = this.w; R.phase = i;
      const T3 = ['Part 1 of 3 · The wadi below Thawr', 'Part 2 of 3 · Across the sands', 'Part 3 of 3 · The pursuer', 'Dawn · The palms of Quba'];
      const ST = ['Change lane round the boulders (A / D or ← →). Stay close behind the lamp.', 'Duck under low acacia limbs (S or ↓). Where the track parts, take the side the lamp takes.', 'Hoofbeats behind you. Ride steady, and do not falter.', 'The night is over. Come gently to the palms.'];
      this.phaseTitle = T3[i]; w.step(ST[i]); w.progress(Math.min(i, 3)); this.setTitle();
      if (i > 0) { SND.glow(this.w.env.bus, [0, 164.81, 130.81, 196][i], { gain: 0.06, dur: 7, vowel: 'a' }); }
    },
    setTitle() { const el = this.w.ui.layer.querySelector('.wq-title'); if (el) el.textContent = this.phaseTitle; },

    /* ---------- input ---------- */
    onKey(env, e) {
      const w = this.w; if (!w || !this.R || !this.R.on || w.filmS || e.repeat) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'a' || k === 'ArrowLeft') this.act('left');
      else if (k === 'd' || k === 'ArrowRight') this.act('right');
      else if (k === 'w' || k === 'ArrowUp' || k === ' ') this.act('jump');
      else if (k === 's' || k === 'ArrowDown') this.act('duck');
    },
    pointer(e, phase) {
      if (!this.R || !this.R.on) return false;
      if (phase === 'down') { this.sw = { x: e.clientX, y: e.clientY }; return true; }
      if (phase === 'up' && this.sw) {
        const dx = e.clientX - this.sw.x, dy = e.clientY - this.sw.y; this.sw = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) this.act(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'jump' : 'duck'));
        else { const W = this.w.env.w; this.act(e.clientX < W * 0.33 ? 'left' : e.clientX > W * 0.67 ? 'right' : 'jump'); }
      }
      return true;
    },
    touchButtons() {
      const L = this.w.ui.layer, wrap = document.createElement('div');
      wrap.className = 'hijrah-pad';
      wrap.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateX(-50%);display:flex;gap:12px;pointer-events:auto;z-index:5';
      [['left', '◀'], ['duck', '▼'], ['jump', '▲'], ['right', '▶']].forEach(([a, t]) => {
        const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'hijrah-btn'; bt.textContent = t; bt.setAttribute('aria-label', a);
        bt.style.cssText = 'width:58px;height:58px;border-radius:50%;border:1px solid rgba(242,233,214,.4);background:rgba(6,9,20,.45);color:#f6dc9a;font-size:20px;touch-action:none';
        bt.addEventListener('pointerdown', ev => { ev.stopPropagation(); ev.preventDefault(); this.act(a); });
        wrap.appendChild(bt);
      });
      L.appendChild(wrap); this.pad = wrap;
    },
    act(a) {
      const R = this.R, b = this.w.env.bus; if (!R.on || R.end) return;
      if (a === 'left' || a === 'right') {
        const nl = U.clamp(R.lane + (a === 'left' ? -1 : 1), -1, 1);
        if (nl !== R.lane) { R.lane = nl; R.roll = (a === 'left' ? 1 : -1) * 0.05; SND.swell(b, { color: 'white', type: 'bandpass', f0: 900, f1: 2400, dur: 0.35, gain: 0.03, pan: a === 'left' ? -0.6 : 0.6 }); }
      } else if (a === 'jump') {
        if (R.jy <= 0.02) { R.vy = 8.4; R.duck = 0; SND.swell(b, { f0: 300, f1: 1400, dur: 0.6, gain: 0.05 }); SND.sing(b, 392, { vowel: 'u', dur: 0.5, gain: 0.012 }); }
      } else if (a === 'duck') {
        R.duck = 0.8; if (R.jy > 0.1) R.vy = Math.min(R.vy, -9); SND.swell(b, { f0: 600, f1: 220, dur: 0.45, gain: 0.04 });
      }
    },

    /* ---------- the run ---------- */
    run(dt) {
      const w = this.w, R = this.R, env = w.env, b = env.bus;
      dt = Math.min(dt, 0.06);
      // speed by stretch of the road
      const base = R.s < P1 ? U.lerp(8.6, 10.6, R.s / P1) : R.s < P2 ? U.lerp(10.8, 12.4, (R.s - P1) / (P2 - P1)) : R.s < P3 ? 12.8 : U.lerp(10.5, 1.6, U.smooth(P3, STOP, R.s));
      R.mul = U.damp(R.mul, 1, 1.1, dt);
      const catchup = R.gap > 22.5 && R.mul > 0.9 ? 1.1 : 1;
      R.v = R.end ? U.damp(R.v, 0, 2, dt) : base * R.mul * catchup * (R.soft > 0 ? 0.62 : 1);
      const prev = R.s; R.s += R.v * dt;
      R.gap = U.clamp(R.gap + (base - R.v) * dt, 15, 46);
      R.soft = Math.max(0, R.soft - R.v * dt);
      // lateral, jump, duck
      R.lat = U.damp(R.lat, R.lane * LANE, 13, dt);
      if (R.jy > 0 || R.vy > 0) { R.vy -= 25 * dt; R.jy += R.vy * dt; if (R.jy <= 0) { R.jy = 0; R.vy = 0; this.land(); } }
      R.duck = Math.max(0, R.duck - dt);
      R.roll = U.damp(R.roll, 0, 6, dt);
      // obstacles crossed this frame
      while (R.oi < COURSE.length && COURSE[R.oi].s <= R.s) {
        const o = COURSE[R.oi++]; if (o.s < prev - 0.01) continue;
        if (o.type === 'rock' && o.lanes.some(l => Math.abs(R.lat - l * LANE) < 1.35)) this.hit('rock');
        else if (o.type === 'gully' && R.jy < 0.3) this.hit('gully');
        else if (o.type === 'branch' && R.duck <= 0) this.hit('branch');
        else if (o.type === 'fork') { if (Math.abs(R.lat) < 1.1) this.hit('rock'); else if (Math.sign(R.lat) !== o.good) { R.soft = 26; SND.swell(b, { f0: 200, f1: 500, dur: 1.2, gain: 0.05 }); } else { SND.sing(b, 523.25, { vowel: 'o', dur: 1.2, gain: 0.02 }); SND.sing(b, 659.25, { vowel: 'o', dur: 1.2, gain: 0.015, delay: 0.15 }); } }
        else if (o.type === 'gully') { SND.swell(b, { color: 'white', type: 'highpass', f0: 2000, f1: 5000, dur: 0.5, gain: 0.012 }); }
      }
      // starlight
      const M = this.motes, sp = this.moteSp;
      while (R.mi < M.length && M[R.mi].s < R.s - 2) R.mi++;
      const o3 = this.orb.position;
      for (let i = R.mi; i < M.length && M[i].s < R.s + 2; i++) {
        const m = M[i]; if (m.got) continue;
        if (Math.abs(m.lat - R.lat) < 1.2 && Math.abs(m.y - o3.y) < 1.1) {
          m.got = true; sp.A[i] = 0; R.light = Math.min(1.25, R.light + 0.025);
          const nn = [392, 440, 523.25, 587.33, 659.25, 783.99]; this.note = ((this.note || 0) + 1) % nn.length;
          SND.sing(b, nn[this.note], { vowel: 'u', dur: 0.7, gain: 0.014, attack: 0.02 });
          for (let k = 0; k < 4; k++) this.sparks.emit(m.x, m.y, m.z, (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2, 0.6, 0.35, 1);
        }
      }
      // discoveries: fly through the golden light
      while (R.di < this.disc.length && this.disc[R.di].s < R.s - 1.5) R.di++;
      this.disc.forEach(dd => {
        if (dd.it.done || Math.abs(dd.s - R.s) > 1.6 || Math.abs(dd.lane * LANE - R.lat) > 1.5) return;
        dd.it.done = true; dd.it.onUse(w, dd.it); R.light = Math.min(1.25, R.light + 0.1);
        for (let k = 0; k < 16; k++) this.sparks.emit(o3.x, o3.y, o3.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, 1.2, 0.5, 1);
      });
      // the stretches
      if (R.phase === 0 && R.s > P1) this.setPhase(1);
      if (R.phase === 1 && R.s > P2) { this.setPhase(2); R.pursuit = 1; w.say('The Pursuer', 'Suraqah ibn Malik rode out after them for the reward, and came near. (Sahih al-Bukhari 3906)', { ar: 'سُرَاقَةُ بْنُ مَالِكٍ', ms: 9000 }); }
      if (R.phase === 2 && R.s > SINK && !R.sunk) this.sink();
      if (R.phase === 2 && R.s > P3) { this.setPhase(3); w.goal(this.lampGlow.position); }
      if (R.phase === 0 && R.s > 215 && !this.taughtJump) { this.taughtJump = true; w.step('Jump the dry washes (Space, W or ↑). Change lane round the boulders.'); }
      if (R.phase === 0 && R.s > 0) { w.progress(R.s / P1 * 1); this.setTitle(); }
      else if (R.phase === 1) { w.progress(1 + (R.s - P1) / (P2 - P1)); this.setTitle(); }
      else if (R.phase === 2) { w.progress(2 + (R.s - P2) / (P3 - P2) * 0.98); this.setTitle(); }
      if (R.s >= STOP && !R.end) this.arrive();

      // place the light
      const h = R.duck > 0 ? 0.42 : 1.05;
      R.h = U.damp(R.h || 1.05, h, 18, dt);
      const op = this.placeOrb(R.s, R.lat, R.h + R.jy, R.duck > 0 ? 1 : 0);
      const stretch = U.clamp(R.vy * 0.04, -0.25, 0.3); if (R.duck <= 0) this.orbCore.scale.set(1 - stretch * 0.5, 1 + stretch, 1 - stretch * 0.5);
      w.pos.set(op.x, 0, op.z); w.y = op.y;
      // the trail of embers
      if (R.v > 0.5) { const i = this.trailI++ % this.trail.n; this.trail.P.set([op.x + (Math.random() - 0.5) * 0.1, op.y + (Math.random() - 0.5) * 0.1, op.z], i * 3); this.trail.S[i] = 0.5; this.trail.A[i] = 0.7; }
      for (let i = 0; i < this.trail.n; i++) { this.trail.A[i] *= Math.exp(-dt * 3.2); this.trail.S[i] *= Math.exp(-dt * 0.6); this.trail.P[i * 3 + 1] += dt * 0.25; }
      this.trail.upd();
      R.light = U.damp(R.light, 0.85, 0.05, dt);
      const fl = 0.92 + 0.08 * U.noise1(w.time * 7) - (R.hitT > 0 ? 0.35 * Math.abs(Math.sin(w.time * 30)) : 0);
      const dk = 1 - this.dawnK * 0.6; this.orbL.intensity = 1.1 * R.light * fl * dk; this.orb.material.opacity = 0.75 * fl * dk; this.orb.scale.setScalar(1.1 + R.light * 0.5);
      R.hitT = Math.max(0, R.hitT - dt);

      // the lamp and the camels ahead
      const sL = R.s + R.gap, f = FORKS.find(fk => sL > fk.s - 18 && sL < fk.s + 16);
      R.lampLat = U.damp(R.lampLat || 0, f ? f.good * LANE : 0, 2.2, dt);
      this.walk = (this.walk || 0) + R.v * dt * 0.62;
      if (!R.end || R.v > 0.05) this.setCamels(sL, R.lampLat, this.walk, 0);

      // camera
      const c = this.camPose(R.s, R.lat, R.jy);
      R.camY = R.camY ? U.damp(R.camY, c.p.y, 7, dt) : c.p.y;
      R.shake = U.damp(R.shake, 0, 4, dt);
      const sh = R.shake, cam = w.camera;
      cam.position.set(c.p.x + (Math.random() - 0.5) * sh, R.camY + (Math.random() - 0.5) * sh, c.p.z);
      cam.lookAt(c.l); cam.rotation.z += R.roll * 1.6 + (R.lane * LANE - R.lat) * 0.012;
      const fov = 60 + U.clamp((R.v - 8) / 5) * 9; if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = U.damp(cam.fov, fov, 3, dt); cam.updateProjectionMatrix(); }

      // the pursuer: dust and hoofbeats behind
      if (R.pursuit && !R.sunk) {
        R.dustD = Math.max(24, R.dustD - dt * (R.hitT > 0 ? 10 : 3.2));
        const ds = R.s - R.dustD; this.dustAt = ds;
        this.clk.hoof -= dt;
        if (this.clk.hoof <= 0) { this.clk.hoof = 0.44; const g = 0.2 / (1 + Math.pow(R.dustD / 45, 2)); [0, 0.11, 0.24].forEach((d0, k) => setTimeout(() => SND.knock(b, { f: 70 + k * 12, gain: g * (k === 2 ? 1.2 : 0.8), click: 700 }), d0 * 1000)); }
      }
      // sound
      const sp2 = U.clamp(R.v / 13);
      this.wind.set('gain', 0.04 + sp2 * 0.05, 0.4); this.wind.set('freq', 380 + sp2 * 500, 0.4); this.rush.set('gain', sp2 * 0.008, 0.3);
      this.hum.setGain(0.006 + R.light * 0.008, 0.6); this.hum.set(110 * (1 + R.phase * 0.125), 1);
      this.clk.pad -= dt;
      if (this.clk.pad <= 0 && R.v > 0.5) { this.clk.pad = 3.1 / Math.max(2.5, R.v); const sp3 = w.spatial(this.lampGlow.position, 20); SND.step(b, { gain: 0.05 * sp3.gain + 0.01, f: U.rnd(180, 260), pan: sp3.pan }); }
    },
    // testing aid: move the run to a point on the road without crossing what lies between
    _seek(s) {
      const R = this.R; R.s = s; R.oi = COURSE.findIndex(o => o.s > s); if (R.oi < 0) R.oi = COURSE.length;
      while (R.mi < this.motes.length && this.motes[R.mi].s < s) R.mi++;
      const ph = s < P1 ? 0 : s < P2 ? 1 : s < P3 ? 2 : 3; if (ph !== R.phase) { this.setPhase(ph); if (ph >= 2) R.pursuit = 1; }
      R.camY = 0; this.dawnK = U.smooth(P3 - 40, STOP - 60, s);
    },
    land() { const b = this.w.env.bus, o = this.orb.position; SND.step(b, { gain: 0.07, f: 500 }); for (let k = 0; k < 8; k++) this.sand.emit(o.x, o.y - 0.9, o.z, (Math.random() - 0.5) * 3, Math.random() * 1.2, (Math.random() - 0.5) * 3, 0.9, 0.9, 0.5); },
    hit(kind) {
      const R = this.R, b = this.w.env.bus, o = this.orb.position;
      R.mul = 0.45; R.hitT = 0.9; R.shake = 0.22; R.light = Math.max(0.45, R.light - 0.18); R.gap = Math.min(46, R.gap + 5);
      if (R.pursuit && !R.sunk) R.dustD = Math.max(24, R.dustD - 10);
      SND.thump(b, { gain: 0.14, f: 60, dur: 0.5 }); SND.swell(b, { f0: 300, f1: 900, dur: 0.6, gain: 0.06 });
      for (let k = 0; k < 18; k++) this.sand.emit(o.x, o.y - 0.5, o.z, (Math.random() - 0.5) * 4, Math.random() * 2.4, (Math.random() - 0.5) * 4, 1.3, 1.2, 0.7);
      if (kind === 'gully') { R.vy = 3; R.jy = 0.01; }
    },
    sink() {
      const R = this.R, w = this.w, b = w.env.bus; R.sunk = 1; this.sinkT = 0;
      const p = tp(R.s - R.dustD); this.sinkAt = new T.Vector3(p.x, H(p.x, p.z), p.z);
      SND.thump(b, { gain: 0.25, f: 45, dur: 1.4 }); SND.swell(b, { f0: 150, f1: 700, dur: 3.5, gain: 0.1 });
      setTimeout(() => SND.glow(b, 196, { gain: 0.07, dur: 9, vowel: 'a' }), 1600);
      w.say('The Sinking', 'Suraqah said: <span class="q">“The forelegs of my horse sank into the ground up to the knees,”</span> and dust rose from them into the sky like smoke. He asked them for a written promise of safety, and turned back. (Sahih al-Bukhari 3906)', { ar: 'سَاخَتْ يَدَا فَرَسِي فِي الأَرْضِ حَتَّى بَلَغَتَا الرُّكْبَتَيْنِ', ms: 13000 });
    },
    arrive() {
      const R = this.R, w = this.w, b = w.env.bus; R.end = 1;
      SND.glow(b, 146.83, { gain: 0.08, dur: 12, vowel: 'a' }); SND.glow(b, 220, { gain: 0.05, dur: 12, delay: 1.2, vowel: 'o' });
      setTimeout(() => {
        if (this.w !== w) return;
        w.finish('The road has reached Quba');
        // walk among the palms at dawn
        R.on = false; w.mode = null; w.onPointer = null; w.goal(null); if (this.pad) this.pad.remove();
        const p = tp(R.s); w.pos.set(p.x, 0, p.z); w.y = H(p.x, p.z); w.eye = 1.62; w.yaw = Math.atan2(-p.tx, -p.tz); w.pitch = 0.04;
        w.camera.fov = 64; w.camera.updateProjectionMatrix();
        w.env.hint('WASD to walk among the palms of Quba · look around');
      }, 3500);
    },

    /* ---------- the world around the run: sky, dawn, dust, lights, sound ---------- */
    world(env, dt) {
      const w = this.w, R = this.R, t = w.time, cam = w.camera, b = env.bus;
      // the dawn
      const target = R.on || R.end ? U.smooth(P3 - 40, STOP - 60, R.s) : (R.s > 100 ? 1 : 0);
      this.dawnK = U.damp(this.dawnK, target, 0.5, dt);
      const k = this.dawnK;
      if (this.skies.night) { const n = this.skies.night, d = this.skies.dawn; n.position.copy(cam.position); if (d) { d.position.copy(cam.position); d.material.uniforms.uA.value = U.smooth(0.05, 0.9, k); d.visible = !!d.material.uniforms.tSky.value.image && k > 0.01; } n.visible = !!n.material.uniforms.tSky.value.image && k < 0.99; }
      if (this.proSky) { const u = this.proSky.material.uniforms; u.uTop.value.setRGB(U.lerp(0.012, 0.32, k), U.lerp(0.02, 0.42, k), U.lerp(0.055, 0.62, k)); u.uMid.value.setRGB(U.lerp(0.055, 0.95, k), U.lerp(0.086, 0.7, k), U.lerp(0.19, 0.55, k)); u.uStars.value = 0.9 * (1 - k); }
      if (k > 0.3 && !this.envDawn && PHOTO.enabled) { this.envDawn = true; PHOTO.sky(w, 'qwantani_dawn_puresky', { background: false, sun: this.moon, intensity: 0.75, rotation: -0.63, ground: '#8a7058', bounce: 0.5 }); }
      this.moon.color.setRGB(U.lerp(0.62, 1, k), U.lerp(0.7, 0.72, k), U.lerp(0.9, 0.5, k)); this.moon.intensity = U.lerp(0.3, 1.5, U.smooth(0.3, 1, k));
      this.hemi.intensity = (PHOTO.enabled ? 0.1 : 0.35) + k * 0.15;
      w.scene.fog.color.setRGB(U.lerp(0.063, 0.62, k), U.lerp(0.086, 0.52, k), U.lerp(0.15, 0.48, k)); w.scene.fog.density = U.lerp(0.0011, 0.0013, k);
      w.renderer.toneMappingExposure = U.lerp(0.95, 0.85, k);
      if (this.post) this.post.set({ lift: [U.lerp(0, 0.02, k), U.lerp(0.008, 0.01, k), U.lerp(0.03, 0, k)], gain: [U.lerp(0.96, 1.05, k), U.lerp(0.98, 1.0, k), U.lerp(1.06, 0.92, k)], sat: U.lerp(0.92, 1.02, k), rays: k * 0.35 });
      if (this.post && this.post.rays) { this.post.rays.pos = [cam.position.x + 900, cam.position.y + 60, cam.position.z - 300]; }
      // shadows follow whatever the camera looks at
      if (w._shadow) { const L = w._shadow.light, f = w.forward ? cam.getWorldDirection(new T.Vector3()) : null; const px = Math.round((cam.position.x + f.x * 18) / 2) * 2, pz = Math.round((cam.position.z + f.z * 18) / 2) * 2; L.target.position.set(px, 0, pz); L.position.set(px + w._shadow.off.x, w._shadow.off.y, pz + w._shadow.off.z); }
      // far bands are not drawn at all
      if (this.cullList) for (const m of this.cullList) { const S0 = m.geometry.boundingSphere; m.visible = S0.center.distanceTo(cam.position) - S0.radius < 1000; }
      // the sea's glitter under the stars
      this.glitter.position.set(cam.position.x - 900, 2, cam.position.z - 200); this.glitter.material.opacity = 0.05 * (1 - k);
      // the lamp swings and flickers
      const fl = 0.85 + 0.15 * U.noise1(t * 6);
      this.lampGlow.material.opacity = 0.95 * fl * (1 - k * 0.6); this.lampL.intensity = 1.3 * fl * (1 - k * 0.7); this.lampGlow.scale.setScalar(2.0 + Math.sin(t * 3) * 0.15);
      this.fireGlow.material.opacity = 0.45 + 0.2 * U.noise1(t * 9);
      this.tentGlow.material.opacity = (0.7 + 0.2 * U.noise1(t * 5 + 3)) * (1 - k);
      // in the film
      if (w.filmS) {
        this.walk = (this.walk || 0) + dt * (this.filmWalk != null && !this.camelAt ? 2.2 : 0);
        const s0 = this.filmWalk != null ? 8 + this.filmWalk * 1.6 : 6;
        this.setCamels(s0, 0, this.walk, this.kneel);
        this.placeOrb(0, 0, 1.05 + Math.sin(t * 2) * 0.05, 0);
        this.orbL.intensity = 1.0;
      }
      this.torches.forEach((g, i) => { const x = g.userData.x + Math.sin(t * 0.15 + g.userData.ph) * 30, z = TR.zs[0] + 300 + Math.cos(t * 0.11 + g.userData.ph) * 25; g.position.set(x, H(x, z) + 3, z); g.material.opacity = (this.torchK || 0) * (0.7 + 0.3 * U.noise1(t * 8 + i)); });
      // the pursuer's dust, and its last great cloud when the horse sinks
      const D = this.dust;
      if (R.pursuit && this.dustAt != null) {
        let at = this.dustAt;
        if (R.sunk) { this.sinkT += dt; at = null; }
        for (let i = 0; i < D.n; i++) {
          const ph = (t * 0.35 + i / D.n) % 1;
          if (at != null) { const p = tp(at - ph * 6); D.P.set([p.x + Math.sin(i * 7.3) * 3 * (0.5 + ph), H(p.x, p.z) + 0.4 + ph * 5, p.z + Math.cos(i * 3.1) * 2], i * 3); D.S[i] = 4 + ph * 9; D.A[i] = 0.32 * Math.sin(Math.PI * ph); }
          else { const sp = this.sinkAt, g = U.smooth(0, 3, this.sinkT); D.P.set([sp.x + Math.sin(i * 7.3) * (2 + ph * 8 * g), sp.y + 0.5 + ph * 22 * g, sp.z + Math.cos(i * 3.1) * (2 + ph * 6 * g)], i * 3); D.S[i] = 6 + ph * 16 * g; D.A[i] = 0.42 * Math.sin(Math.PI * ph) * (1 - U.smooth(8, 18, this.sinkT)); }
        }
        D.upd();
      }
      this.sand.step(dt, 1.6, 2); this.sparks.step(dt, 2.5, -0.5);
      // motes twinkle
      if (this.motes) { const sp = this.moteSp, i0 = Math.max(0, (R.mi || 0) - 2); for (let i = i0; i < Math.min(this.motes.length, i0 + 60); i++) if (!this.motes[i].got) sp.A[i] = 0.6 + 0.25 * Math.sin(t * 4 + i); sp.geo.attributes.aAlpha.needsUpdate = true; }
      // night and dawn sounds
      this.clk.gust -= dt; if (this.clk.gust < 0) { this.clk.gust = 5 + Math.random() * 6; SND.swell(b, { f0: 260, f1: 1100, dur: 3.2, gain: 0.04 * (1 - k * 0.5), pan: U.rnd(-1, 1) }); }
      this.clk.cricket -= dt; if (this.clk.cricket < 0 && k < 0.5) { this.clk.cricket = 0.8 + Math.random() * 2.5; SND.cricket(b, { gain: 0.003 }); }
      this.clk.bird -= dt; if (this.clk.bird < 0 && k > 0.6) { this.clk.bird = 0.5 + Math.random() * 2; SND.chirp(b, { gain: 0.012 + k * 0.012 }); if (Math.random() < 0.15) SND.coo(b, { gain: 0.025 }); }
    },

    update(env, dt) { const w = this.w; if (!w) return; w.update(Math.min(dt, 0.1)); },
    onLeave() { this.pad = null; },
  }));
})();
