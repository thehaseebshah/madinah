/* Madinah — Uhud, the Mountain That Loves Us. The field of Uhud today, in late afternoon light.
   Genre: viewpoint / photo alignment (Viewfinder's held-up picture, Superliminal's perspective,
   Pokémon Snap's shutter). You carry four old hand-drawn sketches of this field. Raise a sketch and
   walk until its lines lie exactly on the real ridges, hill and walls; take the view, and the past
   answers as light: the mountain's ridges, the archers' hill, the martyrs' resting place, and at last
   the whole mountain, from the hill where the archers stood.
   Feeling: remembrance and love for a place. No battle is shown; no person is depicted: presence is
   only lights that gather and rise, and wordless sung voices.
   Colour script: red granite and golden afternoon; the accent is a warm gold kept for the lights. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ================= the land ================= */
  const HILL = { x: 0, z: 0, h: 11, top: 4.5, r: 26 };
  const CEM = { x0: 30, z0: -60, x1: 66, z1: -34 };
  const M_FOOT = 170;
  function plain(x, z) { return SCAPE.fbm(x * 0.012, z * 0.012, 3) * 1.4 + U.noise2(x * 0.09, z * 0.09) * 0.15; }
  function hill(x, z) {
    const d = Math.hypot(x - HILL.x, (z - HILL.z) * 1.15);
    const body = HILL.h * (1 - U.smooth(HILL.top, HILL.r, d));
    const rough = (U.noise2(x * 0.3, z * 0.3) * 0.4 + SCAPE.ridge(x * 0.12 + 7, z * 0.12, 3) * 1.2) * U.smooth(3, 9, d) * (1 - U.smooth(HILL.r - 4, HILL.r + 4, d));
    return body + rough;
  }
  function mountain(x, z) {
    const u = (-z - M_FOOT) / 280;
    if (u < -0.1) return 0;
    const along = 1 - U.smooth(700, 1300, Math.abs(x + 60));
    const rise = U.smooth(-0.05, 0.35, u) * (1 - 0.3 * U.smooth(0.9, 1.6, u));
    const r = SCAPE.ridge(x * 0.0045 + 3, z * 0.006 + 1, 5);
    const domes = 0.5 + 0.5 * U.noise2(x * 0.004 + 3.3, z * 0.006 + 1.1);
    const swell = 0.6 + 0.4 * Math.cos(U.clamp((x + 60) / 900, -1, 1) * Math.PI * 0.5);
    return 290 * rise * along * swell * (0.12 + 0.38 * domes + 0.75 * r) + SCAPE.fbm(x * 0.05, z * 0.05, 3) * 3 * rise;
  }
  // the low hills that close the horizon to the south and the far ranges
  function far(x, z) { const d = Math.hypot(x, z - 100); return SCAPE.ridge(x * 0.002, z * 0.002 + 4, 4) * 160 * U.smooth(900, 1600, d); }
  const H = (x, z) => plain(x, z) + hill(x, z) + mountain(x, z) + far(x, z);
  const walkable = (x, z) => Math.abs(x) < 260 && z < 330 && z > -M_FOOT - 30 && mountain(x, z) < 6;
  const inCem = (x, z) => x > CEM.x0 && x < CEM.x1 && z > CEM.z0 && z < CEM.z1;

  /* ---------- the four sketches: where each was drawn, and what it shows ---------- */
  const yawTo = (fx, fz, tx, tz) => Math.atan2(-(tx - fx), -(tz - fz));
  const SKETCHES = [
    { id: 'mountain', title: 'The Mountain', x: -36, z: 128, tx: -40, tz: -400, pitch: 0.13, tolP: 5, tolA: 0.12, cap: 'Drawn on the open plain, south of the hill, facing the long mountain' },
    { id: 'hill', title: 'The Archers’ Hill', x: 44, z: 52, tx: 0, tz: 0, pitch: 0.07, tolP: 2.8, tolA: 0.075, cap: 'Drawn from the east of the plain: the small hill set against the mountain' },
    { id: 'rest', title: 'The Resting Place', x: 86, z: 2, tx: 48, tz: -47, pitch: 0.05, tolP: 2.3, tolA: 0.065, cap: 'Drawn by the walled ground, with the mountain behind it' },
    { id: 'love', title: 'From the Hill', x: 0, z: 2.5, tx: -10, tz: -300, pitch: 0.17, tolP: 2.0, tolA: 0.06, cap: 'Drawn from the top of the small hill, where the archers stood' },
  ];
  SKETCHES.forEach(s => { s.yaw = yawTo(s.x, s.z, s.tx, s.tz); });
  const FOV = 60;
  const START = { x: -24, z: 176 };

  /* ================= helpers ================= */
  function warpTerrain(w, o) {
    const base = SCAPE.terrain(w, { size: 4, seg: 2, height: () => -9999, colors: o.colors, tex: o.tex, rockTex: o.rockTex, photo: o.photo, rep: o.rep, rockRep: o.rockRep });
    w.scene.remove(base.mesh); base.mesh.geometry.dispose();
    const NX = Math.round(o.nx * (w.quality < 1 ? 0.8 : 1)), NZ = Math.round(o.nz * (w.quality < 1 ? 0.8 : 1)), n = (NX + 1) * (NZ + 1);
    const P = new Float32Array(n * 3), UV = new Float32Array(n * 2), I = [], rep = o.rep || 0.18;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const k = j * (NX + 1) + i, x = o.fx(i / NX * 2 - 1), z = o.fz(j / NZ * 2 - 1);
      P[k * 3] = x; P[k * 3 + 1] = o.height(x, z); P[k * 3 + 2] = z; UV[k * 2] = x * rep; UV[k * 2 + 1] = z * rep;
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('uv', new T.BufferAttribute(UV, 2));
    geo.setIndex(n > 65535 ? new T.Uint32BufferAttribute(I, 1) : new T.Uint16BufferAttribute(I, 1));
    geo.computeVertexNormals();
    const nrm = geo.attributes.normal, C = o.colors, lin = h => U.hex(h).map(v => Math.pow(v / 255, 2.2));
    const cl = lin(C.low), chi = lin(C.high), cr = lin(C.rock), cd = lin(C.dark), rs = o.rock || [0.72, 0.9];
    const col = new Float32Array(n * 3), rk = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2], ny = nrm.getY(k);
      let rock = Math.max(1 - U.smooth(rs[0], rs[1], ny), o.rockAt ? o.rockAt(x, y, z) : 0); rock = U.clamp(rock + SCAPE.fbm(x * 0.05, z * 0.05, 3) * 0.35 * rock);
      const macro = SCAPE.fbm(x * 0.012, z * 0.012, 3) * 0.5 + 0.5;
      let c = U.mix(cl, chi, U.clamp(macro * 1.3 - 0.15));
      // banded red granite on the mountain
      const band = y * 0.06 + x * 0.004 + U.noise2(x * 0.01, z * 0.01) * 1.2, bk = 0.5 + 0.5 * Math.sin(band * 2.3);
      const rc = U.mix(U.mix(cr, cd, bk * 0.7), cd, U.clamp(SCAPE.fbm(x * 0.03 + 9, z * 0.03, 3) + 0.3));
      c = U.mix(c, rc, rock);
      col.set(c, k * 3); rk[k] = rock;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setAttribute('rockiness', new T.BufferAttribute(rk, 1));
    geo.computeBoundingSphere();
    const mesh = new T.Mesh(geo, base.mesh.material); mesh.receiveShadow = true; mesh.frustumCulled = false; w.scene.add(mesh);
    return mesh;
  }
  const GV = `attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
    void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
  const GF = `uniform sampler2D tMap; uniform vec3 uColor; varying float vA;
    void main(){ vec4 t = texture2D(tMap, gl_PointCoord); gl_FragColor = vec4(uColor * t.a * vA, 1.0); }`;
  function glowPoints(w, n, color) {
    const geo = new T.BufferGeometry(), P = new Float32Array(n * 3), Sz = new Float32Array(n), A = new Float32Array(n);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Sz, 1)); geo.setAttribute('aAlpha', new T.BufferAttribute(A, 1));
    const mat = new T.ShaderMaterial({ vertexShader: GV, fragmentShader: GF, transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { tMap: { value: KIT.glowTex(w) }, uColor: { value: new T.Color(color) }, uScale: { value: w.env.h * 0.9 } } });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true; w.scene.add(pts);
    return { pts, P, Sz, A, n, dirty() { geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true; } };
  }
  /* What a sketch shows: the far skyline and the near ground line seen from its viewpoint, plus the
     outlines of the walls and the palms; stored as view tangents so any screen shape can draw it. */
  function makeSketch(w, s, landmarks) {
    const eyeY = H(s.x, s.z) + 1.62, fwd = [-Math.sin(s.yaw), -Math.cos(s.yaw)], rgt = [Math.cos(s.yaw), -Math.sin(s.yaw)];
    const far = [], near = [], ridge = [];
    for (let i = 0; i <= 140; i++) {
      const th = (i / 140 - 0.5) * 2 * 0.95, c = Math.cos(th), sn = Math.sin(th), dx = fwd[0] * c + rgt[0] * sn, dz = fwd[1] * c + rgt[1] * sn;
      let best = -1, bestN = -1, bp = null;
      for (let d = 4; d < 3200; d *= 1.035) { const x = s.x + dx * d, z = s.z + dz * d, e = (H(x, z) - eyeY) / d; if (e > best) { best = e; bp = [x, H(x, z), z]; } if (d < 320 && e > bestN) bestN = e; }
      const ty = Math.tan(Math.atan(best) - s.pitch), tyn = Math.tan(Math.atan(bestN) - s.pitch), tx = Math.tan(th);
      far.push([tx, ty]); near.push([tx, tyn]); ridge.push(bp);
    }
    // landmarks: 3D polylines projected through the sketch's camera
    const cam = new T.PerspectiveCamera(FOV, 1, 0.1, 5000); cam.rotation.order = 'YXZ'; cam.position.set(s.x, eyeY, s.z); cam.rotation.set(s.pitch, s.yaw, 0); cam.updateMatrixWorld(true);
    const inv = cam.matrixWorldInverse, v = new T.Vector3();
    const lines = landmarks.map(pl => pl.map(p => { v.set(p[0], p[1], p[2]).applyMatrix4(inv); return v.z < -0.5 ? [v.x / -v.z, v.y / -v.z] : null; })).filter(pl => pl.every(q => q));
    const r = U.seeded(s.x * 13 + s.z * 7 + 99), jit = []; for (let i = 0; i < 4000; i++) jit.push((r() - 0.5));
    return { far, near, lines, ridge, jit };
  }

  ENGINE.register(WORLD.stage({
    key: 'uhud',
    SKETCHES,
    arabic: 'أُحُد',
    title: 'The Mountain That Loves Us',
    era: 'Jabal Uhud · the battle of 3 AH (625 CE) · the field today',
    hint: 'WASD walk · R (or right mouse) raises the sketch · walk and turn until its lines lie on the hills · click or SPACE takes the view when they turn gold',
    hintTouch: 'Left thumb walk · right thumb look · SKETCH raises the drawing · MATCH takes the view when its lines turn gold',
    sound: { reverb: 0.55 },
    story: `<p>Uhud rises from the plain north of Madinah, a long massif of red granite. In Shawwal of the year 3 AH (625 CE) a battle was fought at its foot. The Prophet ﷺ placed about fifty archers on a small hill under ‘Abdullah ibn Jubayr and told them not to leave it; the hill is called Jabal ar-Rumat today. About seventy Muslims were killed, Hamzah among them, and they were buried here.</p>
            <p class="q"><span class="ar">أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ</span>“Uhud is a mountain that loves us, and we love it.” (Sahih al-Bukhari 4422; Sahih Muslim 1393)</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: START.x, z: START.z, yaw: yawTo(START.x, START.z, -30, -300), pitch: 0.08 }, fov: FOV, exposure: 0.9, far: 4000, speed: 3.0, run: 5.6,
        fog: { color: 0xd8b48e, density: 0.00045 }, ground: H, surface: (x, z) => (hill(x, z) > 1 ? 'gravel' : inCem(x, z) ? 'gravel' : 'sand') });
      const S = w.scene;
      this.S = { phase: 'film', i: 0, raised: false, raiseK: 0, align: 0, done: [], revealT: -1, endT: 0, helpT: 0 };

      /* ---------- sky and the low western sun ---------- */
      const sun = this.sun = new T.DirectionalLight(0xffe0b8, 1.9); sun.position.set(-70, 30, 40); S.add(sun);
      w.followShadow(sun, 70, 2048);
      w.sky({ top: '#5784bd', mid: '#f0cfa4', bot: '#c89a72', sunDir: [-0.8, 0.33, 0.5], sun: '#ffd6a0', sunSize: 0.0016, clouds: 0.3, haze: 0.4 });
      S.add(new T.HemisphereLight(0xffe2c4, 0x8a5a40, PHOTO.enabled ? 0.1 : 0.6));
      PHOTO.sky(w, 'qwantani_late_afternoon_puresky', { sun, rotation: 2.58 - 0.629, intensity: 0.75, haze: '#e0bc94', horizon: 0.45, ground: '#b89070', bounce: 0.45 })
        .then(o => { if (o && o.sunDir && w._post && w._post.rays) w._post.rays.dir = o.sunDir.toArray(); });

      /* ---------- terrain: the plain, the hill, the long mountain ---------- */
      warpTerrain(w, { nx: 300, nz: 320, fx: u => 1700 * (0.1 * u + 0.9 * u * u * u), fz: v => -60 + (v < 0 ? 1500 : 1300) * (0.1 * v + 0.9 * v * v * v), height: H, rock: [0.78, 0.92],
        rockAt: (x, y, z) => U.smooth(4, 30, mountain(x, z)) * 0.9 + U.smooth(1.5, 6, hill(x, z)) * 0.7,
        colors: { low: '#d8b894', high: '#c8a47e', rock: '#9a5a44', dark: '#5e3428' }, tex: 'dune', rockTex: 'granite', photo: { ground: 'dense_sand', rock: 'rock_face', normal: 1 }, rep: 0.2, rockRep: 0.025 });
      SCAPE.horizon(w, { cz: -60, haze: '#e2c0a0', layers: [{ r: 2200, h: 160, color: '#9a7466', seed: 5 }, { r: 2900, h: 220, color: '#b08c80', seed: 9 }, { r: 3600, h: 250, color: '#c8a89a', seed: 13 }] });

      /* ---------- the martyrs' resting place: a low walled ground ---------- */
      const wallM = PHOTO.mat(w, 'plastered_stone_wall', { triplanar: 0.45, color: 0xd8c8b0, fallback: KIT.plaster(w) });
      const capM = PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.6, color: 0xb8a690, fallback: SCAPE.tex.granite(w) });
      const wallH = 1.7, gate = { z: CEM.z1, x: (CEM.x0 + CEM.x1) / 2 };
      const wseg = (x0, z0, x1, z1) => {
        const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 3);
        for (let i = 0; i < n; i++) {
          const a = i / n, b = (i + 1) / n, xa = U.lerp(x0, x1, a), za = U.lerp(z0, z1, a), xb = U.lerp(x0, x1, b), zb = U.lerp(z0, z1, b), mx = (xa + xb) / 2, mz = (za + zb) / 2;
          if (Math.abs(mz - gate.z) < 0.5 && Math.abs(mx - gate.x) < 2.2) continue;
          const len = Math.hypot(xb - xa, zb - za) + 0.05, ry = Math.atan2(xb - xa, zb - za), gy = H(mx, mz);
          const m = new T.Mesh(new T.BoxGeometry(0.5, wallH + 0.6, len), wallM); m.position.set(mx, gy + wallH / 2 - 0.25, mz); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; S.add(m);
          const c = new T.Mesh(new T.BoxGeometry(0.62, 0.12, len), capM); c.position.set(mx, gy + wallH + 0.06, mz); c.rotation.y = ry; c.castShadow = true; S.add(c);
          w.addBox(Math.min(xa, xb) - 0.3, Math.min(za, zb) - 0.3, Math.max(xa, xb) + 0.3, Math.max(za, zb) + 0.3);
        }
      };
      wseg(CEM.x0, CEM.z0, CEM.x1, CEM.z0); wseg(CEM.x1, CEM.z0, CEM.x1, CEM.z1); wseg(CEM.x1, CEM.z1, CEM.x0, CEM.z1); wseg(CEM.x0, CEM.z1, CEM.x0, CEM.z0);
      // inside: plain ground of gravel and low stones in rows, nothing more
      { const pts = [], r = U.seeded(37); for (let i = 0; i < 70; i++) { const row = i % 7, col = Math.floor(i / 7); pts.push([CEM.x0 + 4 + col * 3.1 + r() * 0.4, CEM.z0 + 4 + row * 2.7 + r() * 0.3, 2.5 + r()]); }
        SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', points: pts, fallback: 'rock', fallbackScale: 0.1, seed: 38, color: '#c8b8a8' });
        this.graves = pts; }

      /* ---------- the plain: palms toward the city, acacias, scrub, scanned rocks ---------- */
      const nearKey = (x, z, d) => SKETCHES.some(s => Math.hypot(s.x - x, s.z - z) < d) || inCem(x, z) || (x > CEM.x0 - 3 && x < CEM.x1 + 3 && z > CEM.z0 - 3 && z < CEM.z1 + 3);
      const palms = SCAPE.scatter(w, { kind: 'palm', n: 150, area: [-260, 200, 260, 330], scale: [8, 13], seed: 41, density: (x, z) => (SCAPE.fbm(x * 0.012, z * 0.012, 2) > -0.1 ? 1 : 0.1) });
      palms.meshes.length && (palms.meshes[0].material = SCAPE.triplanar(PHOTO.mat(w, 'palm_tree_bark', { color: 0xb8a894, fallback: KIT.bark(w) }), 1.6));
      this.palms = palms;
      SCAPE.scatter(w, { kind: 'palm', n: 30, area: [90, 60, 220, 180], scale: [8, 12], seed: 42 }).meshes.forEach((m, i) => { if (i === 0) m.material = palms.meshes[0] ? palms.meshes[0].material : m.material; });
      SCAPE.scatter(w, { kind: 'acacia', n: 40, area: [-240, -150, 240, 200], density: (x, z) => (mountain(x, z) < 1 && !nearKey(x, z, 12) && hill(x, z) < 0.5 ? 1 : 0), scale: [0.9, 1.5], seed: 43, collide: 0.3 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', n: 70, area: [-300, -260, 300, -150], density: (x, z) => (mountain(x, z) > 0.5 && mountain(x, z) < 40 ? 1 : 0), scale: [1.2, 3.5], seed: 44, collide: 1.0, fallback: 'boulder', fallbackScale: 1.2, color: '#c8a090' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', n: 45, area: { x: 0, z: 0, r: 34 }, density: (x, z) => (hill(x, z) > 1 && Math.hypot(x, z) > 6 && Math.abs(Math.atan2(x, z)) > 0.4 ? 1 : 0), scale: [0.8, 1.8], seed: 45, collide: 0.8, color: '#c89a88' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_05', n: 30, area: [-200, -160, 200, 160], density: (x, z) => (!nearKey(x, z, 6) ? 1 : 0), scale: [0.6, 1.5], seed: 46, color: '#c8a898' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 160, area: { x: 0, z: -20, r: 200 }, density: (x, z) => (!nearKey(x, z, 2) ? 1 : 0), scale: [2, 6], seed: 47, color: '#d0b8a8' });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', n: 110, area: { x: 0, z: 30, r: 230 }, density: (x, z) => (!nearKey(x, z, 3) && mountain(x, z) < 2 ? 1 : 0), scale: [2.5, 5.5], seed: 48 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', n: 260, area: { x: 0, z: 40, r: 200 }, density: (x, z) => (!nearKey(x, z, 2) && mountain(x, z) < 1 ? 1 : 0), scale: [2, 4], seed: 49 });
      SCAPE.scatter(w, { kind: 'grass', n: 1300, area: { x: 0, z: 60, r: 260 }, density: (x, z) => (mountain(x, z) < 1 && !nearKey(x, z, 2) ? (SCAPE.fbm(x * 0.02, z * 0.02, 2) > -0.05 ? 0.9 : 0.25) : 0), scale: [0.4, 0.9], seed: 50, color: '#e0d0a8' });
      SCAPE.scatter(w, { kind: 'thorn', n: 160, area: { x: 0, z: 0, r: 260 }, density: (x, z) => (!nearKey(x, z, 4) && mountain(x, z) < 3 ? 1 : 0), scale: [0.6, 1.3], seed: 51, color: '#d0b8a0' });
      SCAPE.scatter(w, { kind: 'pebble', n: 1400, area: { x: 0, z: 0, r: 150 }, scale: [0.05, 0.2], seed: 52, color: '#c8a898' });
      SCAPE.scatter(w, { kind: 'rock', n: 200, area: [-500, -420, 500, -150], density: (x, z) => (mountain(x, z) > 2 ? 1 : 0), scale: [1, 4], seed: 53, color: '#b88070' });
      SCAPE.scatter(w, { kind: 'boulder', n: 150, area: [-600, -500, 600, -160], density: (x, z) => (mountain(x, z) > 5 ? 1 : 0), scale: [3, 9], seed: 54, color: '#b07868' });
      // a flat stone where each sketch was drawn: a seat on the ground, nothing more
      SCAPE.scatter(w, { kind: 'model', model: 'sand_rocks_small_01', points: SKETCHES.map(s => [s.x + Math.sin(s.yaw) * 1.2, s.z + Math.cos(s.yaw) * 1.2, 0.45]), seed: 55, color: '#d8c0a8', fallback: 'rock', fallbackScale: 0.6 });

      /* ---------- life ---------- */
      SCAPE.birds(w, { n: 12, x: -40, z: -120, y: 70, r: 90, color: 0x2a2018, size: 0.6 });
      SCAPE.birds(w, { n: 6, x: 60, z: 160, y: 30, r: 40, color: 0x3a2a20, size: 0.4, speed: 0.2, seed: 9 });
      SCAPE.motes(w, { n: 80, area: [-60, 0.5, -40, 60, 8, 180], color: '#ffe8c0', size: 0.12, opacity: 0.5, additive: true, seed: 6 });

      /* ---------- the sketches, and the lights the past answers with ---------- */
      const lm = [];
      // the walls of the resting place (top edge) and a few palms at the south edge
      lm.push([[CEM.x0, H(CEM.x0, CEM.z1) + wallH, CEM.z1], [gate.x - 2.2, H(gate.x - 2.2, CEM.z1) + wallH, CEM.z1]], [[gate.x + 2.2, H(gate.x + 2.2, CEM.z1) + wallH, CEM.z1], [CEM.x1, H(CEM.x1, CEM.z1) + wallH, CEM.z1], [CEM.x1, H(CEM.x1, CEM.z0) + wallH, CEM.z0], [CEM.x0, H(CEM.x0, CEM.z0) + wallH, CEM.z0], [CEM.x0, H(CEM.x0, CEM.z1) + wallH, CEM.z1]]);
      [[CEM.x0, CEM.z1], [CEM.x1, CEM.z1], [CEM.x1, CEM.z0], [CEM.x0, CEM.z0]].forEach(([x, z]) => lm.push([[x, H(x, z), z], [x, H(x, z) + wallH, z]]));
      SKETCHES.forEach(s => { s.data = makeSketch(w, s, lm); });
      this.ridgeGlow = glowPoints(w, 141 * 2, 0xffc878);
      this.archers = glowPoints(w, 50, 0xffd890);
      this.rise = glowPoints(w, 70, 0xfff0d0);
      this.archerPos = []; { const r = U.seeded(50); for (let i = 0; i < 50; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 5.5; const x = HILL.x + Math.cos(a) * d, z = HILL.z + Math.sin(a) * d * 0.85; this.archerPos.push([x, H(x, z) + 1.3, z]); } }
      this.lights = { ridge: 0, archers: 0, rise: 0, riseT: 0, love: 0 };

      this.baked = w.bake();
      w.post({ bloom: 0.5, threshold: 0.78, rays: { strength: 0.32, dir: [-0.8, 0.33, 0.5] }, vignette: 0.38, grain: 0.03, sat: 1.04, contrast: 1.05, lift: [0.02, 0.012, 0.0], gain: [1.04, 1.0, 0.94] });

      /* ---------- the sketch overlay, the album, the buttons ---------- */
      const ov = document.createElement('canvas'); ov.className = 'uhud-sketch';
      ov.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .25s';
      w.ui.layer.insertBefore(ov, w.ui.layer.firstChild); this.ov = ov; this.octx = ov.getContext('2d');
      const album = document.createElement('div'); album.className = 'uhud-album';
      album.style.cssText = 'position:absolute;left:calc(var(--gut, 16px) + 8px);top:calc(env(safe-area-inset-top, 0px) + 64px);display:flex;gap:8px;pointer-events:none;opacity:0;transition:opacity .6s';
      this.cards = SKETCHES.map((s, i) => { const c = document.createElement('canvas'); c.width = 192; c.height = 120; c.style.cssText = 'width:96px;height:60px;border-radius:3px;box-shadow:0 2px 10px rgba(0,0,0,.45);transition:transform .5s, opacity .5s, box-shadow .5s;opacity:.55'; album.appendChild(c); this.drawCard(c, s, false); return c; });
      w.ui.layer.appendChild(album); this.album = album;
      const meter = document.createElement('div'); meter.className = 'uhud-meter';
      meter.style.cssText = 'position:absolute;left:50%;top:calc(50% + 46px);transform:translateX(-50%);width:160px;height:4px;border-radius:2px;background:rgba(40,24,10,.35);pointer-events:none;opacity:0;transition:opacity .25s';
      meter.innerHTML = '<i style="display:block;height:100%;width:0;border-radius:2px;background:linear-gradient(90deg,#8a5a2a,#ffd68a)"></i>'; w.ui.layer.appendChild(meter); this.meter = meter;
      const mkBtn = (label, bottom, right, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'uhud-btn'; b.textContent = label;
        b.style.cssText = `position:absolute;right:calc(var(--gut-r, 16px) + ${right}px);bottom:calc(env(safe-area-inset-bottom, 0px) + ${bottom}px);width:84px;height:54px;border-radius:27px;border:1px solid rgba(242,233,214,.5);background:rgba(30,18,8,.5);color:#f6ecd8;font:600 .6rem var(--f-display, serif);letter-spacing:.16em;pointer-events:auto;touch-action:none;display:none`;
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); fn(); }); w.ui.layer.appendChild(b); return b; };
      this.btns = [mkBtn('SKETCH', 150, 92, () => this.toggleRaise(env)), mkBtn('MATCH', 216, 92, () => this.capture(env))];
      this.touch = matchMedia('(pointer: coarse)').matches;
      this.flash = document.createElement('div'); this.flash.style.cssText = 'position:absolute;inset:0;background:#fff8ec;opacity:0;pointer-events:none;transition:opacity .5s'; w.ui.layer.appendChild(this.flash);
      this.noMenu = e => { if (this.w) e.preventDefault(); }; document.addEventListener('contextmenu', this.noMenu);
      w.onPointer = (e, p, phase) => {
        if (phase !== 'down' || this.S.phase !== 'play') return false;
        if (e.button === 2) { this.toggleRaise(env); return true; }
        if (e.button === 0 && this.S.raised && w.locked) { this.capture(env); return true; }
        return false;
      };

      /* ---------- discoveries ---------- */
      const dp = (x, z, y) => [x, H(x, z) + (y || 1.3), z];
      w.discover({ pos: dp(2, 9), title: 'Jabal ar-Rumat', ar: 'جَبَلُ الرُّمَاة',
        text: 'Before the battle the Prophet ﷺ placed about fifty archers on this small hill under ‘Abdullah ibn Jubayr. The sirah calls the hill ‘Aynayn; today it is called Jabal ar-Rumat, the Archers’ Hill. (Sahih al-Bukhari 3039)' });
      w.discover({ pos: dp(-8, -16), title: 'Do Not Leave Your Place', label: 'Read the words', ar: 'لَا تَبْرَحُوا مَكَانَكُمْ',
        text: 'He told them: <span class="q">“Even if you see birds snatching us, do not leave this place of yours until I send for you.”</span> (Sahih al-Bukhari 3039)' });
      w.discover({ pos: dp(gate.x, CEM.z1 + 3), title: 'Hamzah', ar: 'حَمْزَةُ بْنُ عَبْدِ الْمُطَّلِب', label: 'Stand at the gate',
        text: 'Among those killed at Uhud was Hamzah, the Prophet’s uncle. About seventy Muslims were killed in the battle, in Shawwal of the year 3 AH. (Sahih al-Bukhari 4072, 3039)' });
      w.discover({ pos: dp(CEM.x0 - 6, CEM.z0 + 6), title: 'Buried Where They Fell', label: 'Look at the wall',
        text: 'The Prophet ﷺ had the martyrs of Uhud buried in their blood, unwashed, often two men in one grave, and did not pray the funeral prayer over them then. (Sahih al-Bukhari 1343, from Jabir)' });
      w.discover({ pos: dp(-70, -150), title: 'Tabah', label: 'Look up at the mountain',
        text: 'Returning from Tabuk, as Madinah came into view, he said: <span class="q">“This is Tabah,”</span> and when he saw Uhud: <span class="q">“This is a mountain that loves us and we love it.”</span> (Sahih al-Bukhari 4422)' });
      w.discover({ pos: dp(-40, 205), title: 'North of the City', label: 'Look back south',
        text: 'Behind you, past the palms, lies Madinah. Uhud stands about five kilometres north of the Prophet’s Mosque, a massif of red granite some seven kilometres long.' });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 0.5, gain: 0.04 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.07, 0.02);
      this.tone = SND.drone(b, 196, { vowel: 'o', gain: 0 });
      this.clocks = { bird: 3, dove: 6 };
    },

    /* ================= the entrance film ================= */
    film(env, w) {
      const hy = H(0, 0), self = this;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [54, 48],
          path: [[[-60, 70, 420], [-30, 60, -300]], [[-40, 60, 260], [-30, 70, -300]], [[-20, 46, 150], [-30, 80, -300]]],
          start: () => SND.glow(env.bus, 196, { gain: 0.035, dur: 8 }) },
        { dur: 8, fade: 'dip', ease: 'linear', line: 'North of Madinah rises Uhud, a long mountain of red granite.', ar: 'وإلى شمال المدينة يقوم أُحُد، جبلٌ طويلٌ من الصخر الأحمر.', lineAt: 0.8, fov: [40, 40],
          path: [[[-420, 40, -60], [-300, 60, -320]], [[-60, 34, -80], [40, 60, -330]], [[260, 40, -60], [360, 60, -320]]] },
        { dur: 7, fade: 'dip', ease: 'glide', lines: [[0.5, 'In Shawwal of 3 AH a battle was fought at its foot.', 'وفي شوّال سنة ثلاثٍ للهجرة دارت عند سفحه معركة.'], [3.8, 'About fifty archers were placed on this small hill.', 'ووُضع على هذا التلّ الصغير نحوُ خمسين من الرماة.']],
          path: [[[40, hy + 14, 40], [0, hy, 0]], [[34, hy + 8, -20], [0, hy + 1, 0]], [[-10, hy + 10, -40], [0, hy + 1, 0]]] },
        { dur: 7, fade: 'dip', ease: 'inout', line: 'About seventy were killed, and buried here.', ar: 'وقُتل نحوُ سبعين، ودُفنوا هنا.', lineAt: 0.8, fov: [42, 36],
          path: [[[CEM.x1 + 18, H(CEM.x1, CEM.z1) + 6, CEM.z1 + 22], [48, H(48, -47) + 1, -47]], [[CEM.x1 + 6, H(CEM.x1, CEM.z1) + 4, CEM.z1 + 10], [44, H(44, -47) + 1, -50]]],
          start: () => SND.sing(env.bus, 146.83, { vowel: 'm', dur: 6, gain: 0.03, voices: 3, attack: 1.5 }) },
        { dur: 7, fade: 'dip', ease: 'glide', line: 'Today the field is quiet. Old drawings of it remain.', ar: 'والميدان اليوم ساكن، وبقيت له رسومٌ قديمة.', lineAt: 1,
          path: [[[START.x - 4, H(START.x, START.z) + 5, START.z + 14], [-30, 40, -300]], [[START.x - 1, H(START.x, START.z) + 2.2, START.z + 4], [-30, 50, -300]]],
          start: () => { self.cardPeek = 1; } },
      ];
    },
    filmOpts: { end(w) { const st = ENGINE.byId('uhud'); if (!st || !st.S) return; st.S.phase = 'play'; st.album.style.opacity = 1; if (st.touch) st.btns.forEach(b => { b.style.display = 'block'; }); st.setSketch(ENGINE.env, 0); } },

    /* ================= the game ================= */
    setSketch(env, i) {
      const w = this.w, S = this.S, s = SKETCHES[i]; S.i = i; S.helpT = 0;
      const parts = ['Part 1 of 4', 'Part 2 of 4', 'Part 3 of 4', 'Part 4 of 4'];
      w.activity(`${parts[i]} · ${s.title}`, 4, `${s.cap}. Press R to raise it, then walk and turn until its lines lie on the land`);
      w.progress(i);
      this.cards.forEach((c, k) => { c.style.opacity = k === i ? 1 : S.done.includes(k) ? 0.9 : 0.45; c.style.transform = k === i ? 'translateY(4px) scale(1.12)' : ''; });
      w.goal(null);
    },
    toggleRaise(env) {
      const S = this.S; if (S.phase !== 'play') return;
      S.raised = !S.raised;
      SND.swell(env.bus, { f0: 1200, f1: 3000, dur: 0.35, gain: 0.035, type: 'highpass' });
    },
    capture(env) {
      const w = this.w, S = this.S; if (S.phase !== 'play') return;
      if (!S.raised) { this.toggleRaise(env); return; }
      // the shutter answers every time; the past answers only when the lines lie true
      this.flash.style.transition = 'none'; this.flash.style.opacity = S.align > 0.62 ? 0.85 : 0.25; void this.flash.offsetWidth; this.flash.style.transition = 'opacity .9s'; this.flash.style.opacity = 0;
      SND.knock(env.bus, { f: 900, gain: 0.05, click: 5200 }); SND.knock(env.bus, { f: 600, gain: 0.03, click: 3000 });
      if (S.align > 0.62) this.reveal(env);
      else { SND.sing(env.bus, 174.61, { vowel: 'm', dur: 0.6, gain: 0.02, attack: 0.03 }); w.step(S.align > 0.35 ? 'Close. The lines still slide off the ridges: a few steps, a small turn' : 'The drawing does not match this view yet. Look for where the hill and the ridges sit as they do on the page'); }
    },
    reveal(env) {
      const w = this.w, S = this.S, i = S.i, b = env.bus;
      S.done.push(i); S.raised = false; S.revealT = 0; S.phase = 'reveal';
      this.drawCard(this.cards[i], SKETCHES[i], true); this.cards[i].style.boxShadow = '0 0 18px rgba(255,200,120,.75)';
      SND.glow(b, [196, 220, 246.94, 293.66][i], { gain: 0.045, dur: 7 });
      SND.bell(b, [587.33, 659.25, 739.99, 783.99][i], { gain: 0.03 });
      w.progress(i + 1);
      const say = [
        ['Uhud', 'The mountain answers along its ridges. Uhud rises north of Madinah, a massif of red granite some seven kilometres long.', ''],
        ['About Fifty Archers', 'Here stood about fifty archers under ‘Abdullah ibn Jubayr, told not to leave their place <span class="q">“even if you see birds snatching us.”</span> (Sahih al-Bukhari 3039)', 'لَا تَبْرَحُوا'],
        ['The Martyrs of Uhud', 'About seventy Muslims were killed at Uhud, among them Hamzah, the Prophet’s uncle, and they were buried here. (Sahih al-Bukhari 3039, 4072, 1343)', ''],
        ['A Mountain That Loves Us', '<span class="q">“Uhud is a mountain that loves us, and we love it.”</span> (Sahih al-Bukhari 4422, 2889; Sahih Muslim 1393)', 'أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ'],
      ][i];
      setTimeout(() => this.w && this.w.say(say[0], say[1], { ar: say[2], ms: 12000 }), 1600);
    },
    drawCard(c, s, done) {
      const g = c.getContext('2d'), W = c.width, Hh = c.height;
      g.fillStyle = done ? '#f3dfb0' : '#e9dcc0'; g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,90,50,${Math.random() * 0.06})`; g.fillRect(Math.random() * W, Math.random() * Hh, 2, 2); }
      const k = 1 / Math.tan(FOV * Math.PI / 360), A = W / Hh;
      const px = tx => (tx * k / A * 0.5 + 0.5) * W, py = ty => (0.5 - ty * k * 0.5) * Hh;
      g.strokeStyle = done ? '#8a4a10' : '#5a3a1e'; g.lineWidth = 1.4; g.lineJoin = 'round';
      [s.data.far, s.data.near].forEach(line => { g.beginPath(); line.forEach(([tx, ty], i) => { i ? g.lineTo(px(tx), py(ty)) : g.moveTo(px(tx), py(ty)); }); g.stroke(); });
      s.data.lines.forEach(pl => { g.beginPath(); pl.forEach(([tx, ty], i) => { i ? g.lineTo(px(tx), py(ty)) : g.moveTo(px(tx), py(ty)); }); g.stroke(); });
      g.strokeStyle = 'rgba(90,58,30,0.5)'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, Hh - 2);
    },
    // the drawing held up before the eyes: ink lines drawn as the sketcher saw them
    drawOverlay(k) {
      const ov = this.ov, g = this.octx, W = this.w.env.w, Hh = this.w.env.h, S = this.S, s = SKETCHES[S.i];
      if (ov.width !== W || ov.height !== Hh) { ov.width = W; ov.height = Hh; }
      g.clearRect(0, 0, W, Hh);
      if (k < 0.01) return;
      const f = 1 / Math.tan(FOV * Math.PI / 360), A = W / Hh;
      const px = tx => (tx * f / A * 0.5 + 0.5) * W, py = ty => (0.5 - ty * f * 0.5) * Hh;
      // paper at the edges, as if the page is held up
      const gr = g.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.35, W / 2, Hh / 2, Math.max(W, Hh) * 0.72);
      gr.addColorStop(0, 'rgba(240,226,196,0)'); gr.addColorStop(1, `rgba(236,220,186,${0.55 * k})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
      const a = S.align, ink = `rgba(${U.lerp(70, 255, a) | 0},${U.lerp(44, 200, a) | 0},${U.lerp(20, 110, a) | 0},${(0.55 + 0.4 * a) * k})`;
      const J = s.data.jit, t = performance.now() * 0.001;
      const stroke = (line, w0, j0, amp) => { g.beginPath(); line.forEach(([tx, ty], i) => { const x = px(tx) + J[(i + j0) % J.length] * amp, y = py(ty) + J[(i * 3 + j0 + 7) % J.length] * amp; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.lineWidth = w0; g.stroke(); };
      g.strokeStyle = ink; g.lineJoin = 'round'; g.lineCap = 'round';
      stroke(s.data.far, 2.4, 0, 2.2); stroke(s.data.far, 1, 50, 4);
      stroke(s.data.near, 1.8, 100, 2);
      s.data.lines.forEach((pl, n) => stroke(pl, 1.8, 200 + n * 9, 1.5));
      // hatching under the ridge, like the drawer's shading
      g.lineWidth = 1; g.strokeStyle = `rgba(90,60,30,${0.18 * k * (1 - a * 0.5)})`;
      s.data.far.forEach(([tx, ty], i) => { if (i % 3) return; const x = px(tx), y = py(ty); g.beginPath(); g.moveTo(x, y + 3); g.lineTo(x - 6, y + 16 + J[i] * 8); g.stroke(); });
      void t;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      const S = this.S, b = env.bus, px = w.pos.x, pz = w.pos.z;
      w.speed = S.raised ? 1.4 : 3.0; w.run = S.raised ? 1.8 : 5.6;
      w.update(dt);
      if (!walkable(w.pos.x, w.pos.z)) { if (walkable(px, w.pos.z)) w.pos.x = px; else if (walkable(w.pos.x, pz)) w.pos.z = pz; else { w.pos.x = px; w.pos.z = pz; } }
      const t = w.time;

      /* ---------- alignment ---------- */
      const s = SKETCHES[S.i];
      if (S.phase === 'play') {
        const dPos = Math.hypot(w.pos.x - s.x, w.pos.z - s.z) / s.tolP;
        let dy = w.yaw - s.yaw; dy = Math.abs(Math.atan2(Math.sin(dy), Math.cos(dy))) / s.tolA;
        const dp = Math.abs(w.pitch - s.pitch) / (s.tolA * 1.6);
        const raw = U.clamp(1 - Math.max(dPos, dy, dp) * 0.55);
        S.align = U.damp(S.align, S.raised ? raw : 0, 6, dt);
        S.helpT += dt;
        if (S.helpT > 75 && !w._goal) w.goal([s.x, H(s.x, s.z) + 1.4, s.z]);
        if (w._goal && Math.hypot(w.pos.x - s.x, w.pos.z - s.z) < 6) w.goal(null);
      }
      S.raiseK = U.damp(S.raiseK, S.raised && S.phase === 'play' ? 1 : 0, 10, dt);
      this.ov.style.opacity = 1; this.drawOverlay(S.raiseK);
      this.meter.style.opacity = S.raiseK > 0.5 ? 1 : 0; this.meter.firstChild.style.width = `${(S.align * 100).toFixed(0)}%`;
      // a sung tone that settles onto a fifth as the lines come true
      this.tone.setGain(S.raiseK * 0.035, 0.2);
      this.tone.set(196 * (1 + (1 - S.align) * 0.07 * Math.sin(t * 2.6)) * (S.align > 0.62 ? 1.4983 : 1), 0.15);

      /* ---------- the lights of each sketch ---------- */
      const Lg = this.lights;
      if (S.done.includes(0)) Lg.ridge = Math.min(1, Lg.ridge + dt * 0.25);
      if (S.done.includes(1)) Lg.archers = Math.min(1, Lg.archers + dt * 0.3);
      if (S.done.includes(2)) { Lg.rise = Math.min(1, Lg.rise + dt * 0.3); Lg.riseT += dt; }
      if (S.done.includes(3)) Lg.love = Math.min(1, Lg.love + dt * 0.12);
      { const g = this.ridgeGlow, R0 = SKETCHES[0].data.ridge, R3 = SKETCHES[3].data.ridge;
        for (let i = 0; i < 141; i++) {
          const p0 = R0[i], wave0 = U.clamp(Lg.ridge * 1.6 - i / 141 * 0.6);
          g.P.set([p0[0], p0[1] + 4, p0[2]], i * 3); g.Sz[i] = 26 * wave0; g.A[i] = wave0 * (0.35 + 0.15 * Math.sin(t * 1.3 + i * 0.4)) * (1 - Lg.love * 0.5);
          const p3 = R3[i], wave3 = U.clamp(Lg.love * 2 - Math.abs(i / 140 - 0.5) * 1.4);
          g.P.set([p3[0], p3[1] + 6, p3[2]], (141 + i) * 3); g.Sz[141 + i] = 60 * wave3; g.A[141 + i] = wave3 * (0.5 + 0.2 * Math.sin(t * 0.9 + i * 0.3));
        }
        g.dirty(); }
      { const g = this.archers; this.archerPos.forEach((p, i) => { const k = U.clamp(Lg.archers * 3 - i / 50 * 2); g.P.set(p, i * 3); g.Sz[i] = 1.4 * k; g.A[i] = k * (0.8 + 0.2 * Math.sin(t * 2 + i)); }); g.dirty(); }
      { const g = this.rise; this.graves.forEach(([x, z], i) => { if (i >= 70) return; const st = i * 0.18, tt = Math.max(0, Lg.riseT - st), y = H(x, z) + 0.6 + tt * 0.55 * (0.7 + (i % 5) * 0.1); const k = U.clamp(tt * 0.8) * (1 - U.smooth(30, 60, tt)); g.P.set([x + Math.sin(tt * 0.3 + i) * 0.6, y, z + Math.cos(tt * 0.25 + i) * 0.6], i * 3); g.Sz[i] = 1.2 + tt * 0.02; g.A[i] = k * 0.85; }); g.dirty(); }

      /* ---------- after a reveal: let it land, then the next sketch ---------- */
      if (S.phase === 'reveal') {
        S.revealT += dt; const at = x => S.revealT - dt < x && S.revealT >= x;
        if (S.i === 0 && at(1)) { for (let k = 0; k < 6; k++) SND.sing(b, [196, 246.94, 293.66, 392, 293.66, 246.94][k], { vowel: 'o', dur: 2.4, gain: 0.022 * (1 - k * 0.12), delay: k * 0.55, pan: -0.7 + k * 0.28, attack: 0.3 }); }
        if (S.i === 1 && at(1)) SND.sing(b, 146.83, { vowel: 'm', dur: 6, gain: 0.03, voices: 4, attack: 2 });
        if (S.i === 2 && at(1)) { SND.sing(b, 130.81, { vowel: 'u', dur: 9, gain: 0.03, voices: 4, attack: 3 }); SND.sing(b, 196, { vowel: 'o', dur: 8, gain: 0.02, voices: 3, attack: 3, delay: 2 }); }
        if (S.i === 3) {
          // the echo rolls along the ridges, voice after voice
          if (at(1)) [293.66, 392, 440, 587.33].forEach((f, k) => { SND.sing(b, f, { vowel: 'a', dur: 3, gain: 0.03, delay: k * 0.9, pan: -0.6 + k * 0.4, attack: 0.4 }); SND.sing(b, f, { vowel: 'o', dur: 3, gain: 0.014, delay: k * 0.9 + 1.4, pan: 0.6 - k * 0.4, attack: 0.6 }); });
          if (at(6)) SND.glow(b, 146.83, { gain: 0.05, dur: 12 });
          if (at(9)) { w.finish('Uhud loves us, and we love it'); this.btns.forEach(q => { q.style.display = 'none'; }); }
          if (at(24)) w.say('Remembrance', 'The field is quiet now. The hill, the walled ground and the long red mountain remain, and those who visit greet the martyrs of Uhud.', { ms: 10000 });
          return;
        }
        if (S.revealT > 9) { S.phase = 'play'; this.setSketch(env, S.i + 1); }
      }

      /* ---------- sound ---------- */
      this.clocks.bird -= dt; if (this.clocks.bird < 0) { this.clocks.bird = 3 + Math.random() * 6; SND.chirp(b, { gain: 0.012 }); }
      this.clocks.dove -= dt; if (this.clocks.dove < 0) { this.clocks.dove = 9 + Math.random() * 10; if (w.pos.z > 120) SND.coo(b, { gain: 0.02 }); }
      this.wind.set('freq', w.y > 6 ? 600 : 420, 1);
    },
    onKey(env, e) {
      if (!this.w || !this.S || this.w.cine) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'r' && !e.repeat) this.toggleRaise(env);
      if (k === ' ' && !e.repeat && this.S.raised) this.capture(env);
    },
    onLeave() { if (this.noMenu) document.removeEventListener('contextmenu', this.noMenu); },
  }));
})();
