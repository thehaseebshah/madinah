/* Makkah — The Pledge at al-'Aqabah, 622 CE.
   Genre: follower commands (Pikmin's whistle and squad, Lemmings' guided line). You are a small
   guiding light, seen from above and behind. Whistle the waiting lanterns of Yathrib's people into a
   following line, tell them to wait, shade them, and lead them through the sleeping camps of Mina
   and up the ravine of al-'Aqabah to the meeting place by the rock.
   Feeling: trust kept in secret; resolve gathering in the dark.
   Colour script: deep starlit blue; lantern gold for the people of Yathrib; the camp fires a lower
   red-orange. No person is depicted: people are only lantern light, tents, fires and murmurs. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const GOLD = 0xffd690, FIREC = 0xff6a28;

  /* ================= the land: the valley of Mina, the ravine, the meeting bowl ================= */
  const VCX = z => 5 * Math.sin(z * 0.015);
  const VHALF = z => 44 + 7 * Math.sin(z * 0.03 + 1);
  const RAV = z => -12 + 6 * Math.sin(z * 0.045 + 0.8);
  const RHALF = z => 5 + 1.6 * Math.sin(z * 0.11) + 3 * U.smooth(-66, -56, z);
  const MEET = { x: -16, z: -168 };
  const POCKETS = [[-84, 1], [-101, -1], [-118, 1], [-134, -1]].map(([z, s]) => ({ x: RAV(z) + s * (RHALF(z) + 3.2), z }));
  function outside(x, z) {
    let d = Math.max(Math.abs(x - VCX(z)) - VHALF(z), -58 - z, z - 172);
    if (z < -48 && z > -158) d = Math.min(d, Math.abs(x - RAV(z)) - RHALF(z));
    d = Math.min(d, Math.hypot(x - MEET.x, (z - MEET.z) * 1.1) - 13);
    for (const p of POCKETS) d = Math.min(d, Math.hypot(x - p.x, z - p.z) - 3.4);
    return d;
  }
  const floorY = z => (z < -50 ? (-50 - z) * 0.07 : 0);
  function H(x, z) {
    const d = outside(x, z);
    let y = floorY(z) + SCAPE.fbm(x * 0.04, z * 0.04, 3) * 0.6 + U.noise2(x * 0.5, z * 0.5) * 0.05;
    if (d > 0) {
      const inRav = z < -50;
      let wy = (inRav ? 26 : 34) * U.smooth(0, inRav ? 9 : 20, d) + d * 0.35;
      wy += SCAPE.ridge(x * 0.02, z * 0.02, 4) * 40 * U.smooth(8, 60, d);
      wy += SCAPE.ridge(x * 0.07 + 5, z * 0.07, 3) * 6 * U.smooth(1, 10, d);
      wy += SCAPE.fbm(x * 0.2, z * 0.2, 2) * 1.6 * U.smooth(0, 4, d);
      y += wy;
    }
    return y;
  }
  const walkable = (x, z) => outside(x, z) < -0.6;

  /* ---------- the people waiting, the camps, the checkpoints ---------- */
  const GROUPS = [
    [[-24, 136], [-28, 141], [-21, 145], [-29, 131]],
    [[33, 44], [37, 50], [30, 55], [39, 40]],
    POCKETS.map(p => [p.x, p.z]),
  ];
  const GOALS = [{ x: -26, z: 94, r: 7, label: 'the cairn below the west slope' }, { x: RAV(-58) + 1, z: -54, r: 8, label: 'the mouth of the ravine' }, { x: MEET.x, z: MEET.z, r: 8, label: 'the meeting place by the rock' }];
  const CAMPS = [[-6, 128], [18, 118], [-20, 108], [6, 98], [26, 92], [-12, 80], [10, 70], [-28, 60], [22, 66], [0, 52], [-18, 38], [12, 30], [-2, 18], [26, 14], [-26, 10], [8, 2], [-12, -10], [20, -14], [-30, -22], [4, -28], [-20, -40], [24, -38]].map(([x, z], i) => ({ x, z, i, base: 6.2 + (i % 3) * 0.9, alert: 0, stir: 0, flare: 0, next: 4 + (i * 2.7) % 9 }));
  const START = { x: -22, z: 156 };

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
      const x = P[k * 3], z = P[k * 3 + 2], ny = nrm.getY(k);
      let rock = 1 - U.smooth(rs[0], rs[1], ny); rock = U.clamp(rock + SCAPE.fbm(x * 0.05, z * 0.05, 3) * 0.35 * rock);
      const macro = SCAPE.fbm(x * 0.012, z * 0.012, 3) * 0.5 + 0.5;
      let c = U.mix(cl, chi, U.clamp(macro * 1.3 - 0.15));
      c = U.mix(c, U.mix(cr, cd, U.clamp(SCAPE.fbm(x * 0.03 + 9, z * 0.03, 3) + 0.4)), rock);
      col.set(c, k * 3); rk[k] = rock;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setAttribute('rockiness', new T.BufferAttribute(rk, 1));
    geo.computeBoundingSphere();
    const mesh = new T.Mesh(geo, base.mesh.material); mesh.receiveShadow = true; mesh.frustumCulled = false; w.scene.add(mesh);
    return mesh;
  }
  // soft glowing points with their own size, alpha and colour
  const GV = `attribute float aSize; attribute float aAlpha; attribute vec3 aColor; varying float vA; varying vec3 vC; uniform float uScale;
    void main(){ vA = aAlpha; vC = aColor; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
  const GF = `uniform sampler2D tMap; varying float vA; varying vec3 vC;
    void main(){ vec4 t = texture2D(tMap, gl_PointCoord); gl_FragColor = vec4(vC * t.a * vA, 1.0); }`;
  function glowPoints(w, n) {
    const geo = new T.BufferGeometry();
    const P = new Float32Array(n * 3), Sz = new Float32Array(n), A = new Float32Array(n), C = new Float32Array(n * 3);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Sz, 1)); geo.setAttribute('aAlpha', new T.BufferAttribute(A, 1)); geo.setAttribute('aColor', new T.BufferAttribute(C, 3));
    const mat = new T.ShaderMaterial({ vertexShader: GV, fragmentShader: GF, transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { tMap: { value: KIT.glowTex(w) }, uScale: { value: w.env.h * 0.9 } } });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true; w.scene.add(pts);
    return { pts, P, Sz, A, C, geo, n, dirty() { geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = geo.attributes.aColor.needsUpdate = true; } };
  }
  function tent(w, M, o) {
    const g = new T.Group(), L = o.L || 4.6, Wd = o.W || 3.4, hf = o.hf || 1.9, hb = o.hb || 1.25;
    const roof = new T.PlaneGeometry(L, Wd, 8, 5); roof.rotateX(-Math.PI / 2);
    const rp = roof.attributes.position;
    for (let i = 0; i < rp.count; i++) { const x = rp.getX(i), z = rp.getZ(i), v = (z + Wd / 2) / Wd, u = x / L; rp.setY(i, U.lerp(hb, hf, v) - Math.abs(Math.sin(u * Math.PI * 2)) * 0.22 - Math.sin(v * Math.PI) * 0.08); }
    roof.computeVertexNormals();
    const add = (geo, mat) => { const m = new T.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    add(roof, o.mat || M.tent);
    const back = new T.PlaneGeometry(L, hb, 6, 2); back.translate(0, hb / 2, -Wd / 2 - 0.05);
    { const bp = back.attributes.position; for (let i = 0; i < bp.count; i++) bp.setZ(i, bp.getZ(i) - (1 - bp.getY(i) / hb) * 0.35); back.computeVertexNormals(); }
    add(back, o.mat || M.tent);
    for (const px of [-L / 2, 0, L / 2]) { const p1 = new T.CylinderGeometry(0.045, 0.055, hf + 0.15, 6); p1.translate(px, (hf + 0.15) / 2, Wd / 2); add(p1, M.pole); }
    g.position.set(o.x, H(o.x, o.z) - 0.04, o.z); g.rotation.y = o.ry || 0; w.scene.add(g); g.updateMatrixWorld(true);
    return g;
  }
  // a camel at rest, kneeling, simple and still: body, hump, folded legs, a long neck and head
  function camel(w, mat, x, z, ry, s) {
    const g = new T.Group(), add = (geo, px, py, pz, rx, rz) => { const m = new T.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.set(rx || 0, 0, rz || 0); m.castShadow = true; g.add(m); };
    const body = new T.SphereGeometry(0.55, 14, 10); body.scale(1.0, 0.62, 1.6); add(body, 0, 0.55, 0);
    const hump = new T.SphereGeometry(0.36, 12, 8); hump.scale(1, 0.85, 1.25); add(hump, 0, 0.93, -0.05);
    [[-0.38, 0.5], [0.38, 0.5], [-0.38, -0.55], [0.38, -0.55]].forEach(([lx, lz]) => { const l = new T.CylinderGeometry(0.1, 0.12, 0.7, 7); l.rotateX(Math.PI / 2); add(l, lx, 0.14, lz); });
    const neck = new T.CylinderGeometry(0.11, 0.17, 0.95, 8); add(neck, 0, 0.92, 0.95, -0.75);
    const head = new T.SphereGeometry(0.15, 10, 8); head.scale(0.85, 0.8, 1.6); add(head, 0, 1.32, 1.27, 0.15);
    g.position.set(x, H(x, z) - 0.02, z); g.rotation.y = ry; g.scale.setScalar(s || 1); w.scene.add(g);
    return g;
  }

  ENGINE.register(WORLD.stage({
    key: 'aqabah',
    arabic: 'بَيْعَةُ الْعَقَبَة',
    title: 'The Pledge at al-‘Aqabah',
    era: 'Mina, in the pilgrimage season · 622 CE · a meeting by night',
    hint: 'WASD move your light · mouse turns the view · hold SPACE to whistle lanterns into your line · Q tells them to wait · C shades every light · keep out of the camp firelight',
    hintTouch: 'Left thumb move · right thumb turn · hold WHISTLE to gather · WAIT and SHADE buttons · keep out of the firelight',
    sound: { reverb: 0.6 },
    story: `<p>In the pilgrimage season, pilgrims from Yathrib camped at Mina with the rest. A year earlier twelve of them had pledged themselves to the Prophet ﷺ at al-‘Aqabah, and Mus‘ab ibn ‘Umayr had gone back with them to teach the Qur’an. Now, after a third of the night, men and women of Yathrib slipped out of their camps and met him in the ravine of al-‘Aqabah, and pledged to protect him as they protected their own women and children.</p>
            <p class="q">The sirah counts seventy-three men and two women. (Ibn Ishaq; Musnad Ahmad 15798)</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: START.x, z: START.z + 12, yaw: 0, pitch: -0.62 }, eye: 7.5, exposure: 0.85, far: 2400,
        fog: { color: 0x0c1222, density: 0.0028 }, ground: H, surface: () => 'gravel' });
      const S = w.scene;
      this.S = { phase: 'film', part: 0, shade: false, whistle: 0, whistling: false, done: 0, endT: 0, stirMsg: 0 };
      this.L = new T.Vector3(START.x, H(START.x, START.z) + 1.1, START.z);   // the guiding light
      this.trail = [];

      /* ---------- sky ---------- */
      const moonDir = new T.Vector3(0.4, 0.35, 0.85).normalize();
      w.sky({ top: '#03050d', mid: '#111a32', bot: '#070a12', sunDir: moonDir.toArray(), sun: '#405080', sunSize: 0.0002, stars: 1.6, haze: 0.25 });
      const moon = this.moon = new T.DirectionalLight(0x9fb2e6, 0.32); moon.position.copy(moonDir).multiplyScalar(100); S.add(moon);
      w.followShadow(moon, 60, 2048);
      S.add(new T.HemisphereLight(0x4a5a88, 0x1a1410, PHOTO.enabled ? 0.1 : 0.4));
      PHOTO.sky(w, 'qwantani_night_puresky', { intensity: 0.28, gain: 0.34, tint: '#a8b8e8', haze: '#121a30', horizon: 0.5, ground: '#2a2622', bounce: 0.2 });

      /* ---------- terrain ---------- */
      warpTerrain(w, { nx: 280, nz: 340, fx: u => 600 * (0.12 * u + 0.88 * u * u * u), fz: v => -10 + 560 * (0.35 * v + 0.65 * v * v * v), height: H, rock: [0.8, 0.93],
        colors: { low: '#a29684', high: '#968a76', rock: '#857870', dark: '#4e443c' }, tex: 'gravel', rockTex: 'granite', photo: { ground: 'gravelly_sand', rock: 'rock_face_03', normal: 1 }, rep: 0.2, rockRep: 0.04 });
      SCAPE.horizon(w, { cz: -10, haze: '#141c30', layers: [{ r: 700, h: 120, color: '#22252f', seed: 4 }, { r: 1000, h: 150, color: '#2e3242', seed: 8 }, { r: 1500, h: 170, color: '#3e445c', seed: 12 }] });

      /* ---------- materials ---------- */
      const M = {
        tent: PHOTO.mat(w, 'rough_linen', { rep: [3, 2], color: 0x5a4434, side: T.DoubleSide, fallback: SCAPE.tex.mud(w) }),
        tent2: PHOTO.mat(w, 'rough_linen', { rep: [3, 2], color: 0x7a6248, side: T.DoubleSide, fallback: SCAPE.tex.mud(w) }),
        hide: PHOTO.mat(w, 'brown_leather', { rep: [2, 2], color: 0x9a7a60, side: T.DoubleSide, fallback: KIT.wood(w, [1, 1], '#5a3a24') }),
        pole: PHOTO.mat(w, 'medieval_wood', { rep: [1, 2], color: 0x7a6656, fallback: KIT.wood(w) }),
        camel: new T.MeshStandardMaterial({ color: 0x5e4630, roughness: 1, envMapIntensity: 0.4 }),
      };

      /* ---------- the camps of Mina: tents, a fire, camels at rest ---------- */
      const rr = U.seeded(622);
      CAMPS.forEach((c, i) => {
        const n = 2 + (i % 3);
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2 + rr() * 0.6, d = 4.2 + rr() * 1.6, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
          if (!walkable(x, z)) continue;
          tent(w, M, { x, z, ry: Math.atan2(c.x - x, c.z - z), L: 3.4 + rr() * 1.4, W: 2.8 + rr() * 0.6, hf: 1.7 + rr() * 0.4, hb: 1.05, mat: [M.tent, M.tent2, M.hide][(i + k) % 3] });
          w.addCircle(x, z, 1.7);
        }
        if (i % 2 === 0) { const a = rr() * 6.28, x = c.x + Math.cos(a) * 8.5, z = c.z + Math.sin(a) * 8.5; if (walkable(x, z)) { camel(w, M.camel, x, z, rr() * 6.28, 1); w.addCircle(x, z, 1.1); } }
        c.y = H(c.x, c.z);
      });
      // fire pits (scanned) at each camp
      SCAPE.scatter(w, { kind: 'model', model: 'stone_fire_pit', points: CAMPS.map(c => [c.x, c.z, 1.0]), fallback: 'rock', fallbackScale: 0.6, sink: 0.02, seed: 3 });
      SCAPE.smoke(w, { sources: CAMPS.filter((_, i) => i % 2 === 0).map(c => [c.x, c.y + 0.6, c.z]), n: 10, height: 10, size: 2.6, opacity: 0.09, color: '#8a8478', wind: [0.25, -0.3] });
      this.fires = glowPoints(w, CAMPS.length * 2);
      // the pool each fire throws on the ground: one instanced disc
      { const disc = new T.CircleGeometry(1, 32); disc.rotateX(-Math.PI / 2);
        const dm = new T.MeshBasicMaterial({ map: KIT.glowTex(w), color: 0xffffff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.42 });
        this.pools = new T.InstancedMesh(disc, dm, CAMPS.length); this.pools.userData.dynamic = true; this.pools.frustumCulled = false; this.pools.renderOrder = 2; S.add(this.pools);
        this.pools.setColorAt(0, new T.Color(1, 1, 1)); }
      this.fireLights = [0, 1, 2].map(() => { const L = new T.PointLight(0xff7a34, 0, 16, 1.6); S.add(L); return L; });

      /* ---------- rocks, scrub and the ravine's stones (scanned near, procedural far) ---------- */
      const nearAny = (x, z, r) => CAMPS.some(c => Math.hypot(c.x - x, c.z - z) < r + 7) || GROUPS.some(g => g.some(([gx, gz]) => Math.hypot(gx - x, gz - z) < r + 1.5));
      const cover = [];
      [[-31, 138], [-19, 140], [-26, 126], [36, 46], [29, 49], [41, 54], [-30, 92], [-21, 97]].forEach(([x, z], i) => cover.push([x, z, 1.1 + (i % 3) * 0.35]));
      for (let z = -60; z > -162; z -= 4 + rr() * 4) for (const s of [-1, 1]) { const x = RAV(z) + s * (RHALF(z) - 0.4 - rr() * 1.2); if (!nearAny(x, z, 0.8) && rr() < 0.6) cover.push([x, z, 0.7 + rr() * 0.8]); }
      cover.forEach(([x, z, s]) => w.addCircle(x, z, 1.05 * s));
      this.cover = cover;
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', points: cover, fallback: 'boulder', fallbackScale: 1.2, sink: 0.12, seed: 11, color: '#b4aca6' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', n: 70, area: { x: 0, z: 0, r: 230 }, density: (x, z) => (outside(x, z) > -6 && outside(x, z) < 6 && !nearAny(x, z, 2) ? 1 : 0), scale: [1.2, 2.6], seed: 12, collide: 0.95, color: '#b4aca6' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_05', n: 60, area: { x: 0, z: 0, r: 230 }, density: (x, z) => (walkable(x, z) && !nearAny(x, z, 3) ? 1 : 0), scale: [0.7, 1.6], seed: 13, color: '#b0a8a2' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 220, area: { x: 0, z: -10, r: 230 }, density: (x, z) => (outside(x, z) < 3 ? 1 : 0), scale: [2, 6], seed: 14, color: '#a8a4a0' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 260, area: { x: -10, z: -60, r: 160 }, density: (x, z) => (outside(x, z) < 1 ? 1 : 0), scale: [2, 5], seed: 15, color: '#a09c98' });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', n: 120, area: { x: 0, z: 0, r: 230 }, density: (x, z) => (outside(x, z) < 5 && !nearAny(x, z, 0) ? 1 : 0), scale: [2.5, 5], seed: 16 });
      SCAPE.scatter(w, { kind: 'thorn', n: 160, area: { x: 0, z: 0, r: 240 }, density: (x, z) => (outside(x, z) < 8 && !nearAny(x, z, 0) ? 1 : 0), scale: [0.6, 1.3], seed: 17, color: '#b8a898' });
      SCAPE.scatter(w, { kind: 'grass', n: 900, area: { x: 0, z: 0, r: 240 }, density: (x, z) => (walkable(x, z) && !nearAny(x, z, 0) ? (SCAPE.fbm(x * 0.03, z * 0.03, 2) > 0 ? 0.8 : 0.25) : 0), scale: [0.35, 0.8], seed: 18, color: '#b8ae98' });
      SCAPE.scatter(w, { kind: 'pebble', n: 1300, area: { x: 0, z: -10, r: 240 }, density: (x, z) => (outside(x, z) < 1 ? 1 : 0), scale: [0.05, 0.2], seed: 19 });
      SCAPE.scatter(w, { kind: 'rock', n: 280, area: { x: 0, z: 0, r: 300 }, density: (x, z) => (outside(x, z) > 1 ? 1 : 0), scale: [0.5, 2.2], seed: 20, color: '#a09088' });
      SCAPE.scatter(w, { kind: 'boulder', n: 200, area: { x: 0, z: 0, r: 330 }, density: (x, z) => (outside(x, z) > 6 ? 1 : 0), scale: [2, 6], seed: 21, color: '#9a8a80' });
      SCAPE.scatter(w, { kind: 'acacia', n: 16, area: { x: 0, z: 60, r: 120 }, density: (x, z) => (walkable(x, z) && outside(x, z) > -10 && !nearAny(x, z, 2) ? 1 : 0), scale: [0.9, 1.3], seed: 22, collide: 0.3 });
      // the rock of the meeting place, and a cairn at the first gathering point
      PHOTO.place(w, 'namaqualand_cliff_01', { pos: [MEET.x - 3, undefined, MEET.z - 8], s: 1.4, ry: 0.3 }); w.addCircle(MEET.x - 3, MEET.z - 8, 4.5);
      PHOTO.place(w, 'namaqualand_boulder_04', { pos: [MEET.x + 7, undefined, MEET.z - 4], s: 2.2, ry: 1.2 }); w.addCircle(MEET.x + 7, MEET.z - 4, 2.4);
      { const cairn = [], st = PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.7, color: 0xa09080, fallback: SCAPE.tex.granite(w) }), g = GOALS[0];
        for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.DodecahedronGeometry(0.45 - i * 0.03, 0), st); const a = i * 2.4; m.position.set(g.x + Math.cos(a) * (i < 5 ? 0.5 : 0.2), H(g.x, g.z) + 0.3 + i * 0.22, g.z + Math.sin(a) * (i < 5 ? 0.5 : 0.2)); m.rotation.set(i, i * 2, 0); m.castShadow = true; S.add(m); cairn.push(m); } }

      /* ---------- the lanterns: the guide's and the waiting people's ---------- */
      const lantM = new T.MeshStandardMaterial({ color: 0xb08850, metalness: 0.7, roughness: 0.35 });
      const NL = 12 + 63;
      this.lan = []; let gi = 0;
      GROUPS.forEach((g, part) => g.forEach(([x, z]) => { this.lan.push({ id: gi++, part, home: new T.Vector3(x, H(x, z) + 1.0, z), p: new T.Vector3(x, H(x, z) + 1.0, z), v: new T.Vector3(), state: 'idle', k: 0, glow: 0, flash: 0, seen: 0, ph: Math.random() * 6 }); }));
      // the others who come by other ways, at the end
      for (let i = 0; i < 63; i++) {
        const a = rr() * Math.PI * 2, path = rr();
        const from = path < 0.5 ? [RAV(-62) + (rr() - 0.5) * 6, -62 + rr() * 30] : [MEET.x + Math.cos(a) * 40, MEET.z + Math.sin(a) * 25];
        this.lan.push({ id: gi++, part: 3, home: new T.Vector3(from[0], H(from[0], from[1]) + 1, from[1]), p: new T.Vector3(from[0], -50, from[1]), v: new T.Vector3(), state: 'hidden', k: 0, glow: 0, flash: 0, ph: rr() * 6, delay: 2 + i * 0.22 + rr() * 2 });
      }
      this.lanGlow = glowPoints(w, NL + 1);
      // a small brass lamp with a glass chimney: one instanced mesh for all of them
      { const base = new T.CylinderGeometry(0.07, 0.09, 0.06, 10); base.translate(0, -0.2, 0);
        const glass = new T.CylinderGeometry(0.055, 0.065, 0.18, 10, 1, true); glass.translate(0, -0.08, 0);
        const cap = new T.ConeGeometry(0.075, 0.08, 10); cap.translate(0, 0.05, 0);
        const ring = new T.TorusGeometry(0.04, 0.008, 5, 12); ring.translate(0, 0.12, 0);
        const im = new T.InstancedMesh(SCAPE.merge([base, glass, cap, ring]), lantM, NL + 1); im.userData.dynamic = true; im.frustumCulled = false; S.add(im); this.lanInst = [im]; }
      this.leadLight = new T.PointLight(0xffc874, 1.2, 9, 1.6); S.add(this.leadLight);
      this.meetLight = new T.PointLight(0xffc874, 0, 40, 1.4); this.meetLight.position.set(MEET.x, H(MEET.x, MEET.z) + 4, MEET.z); S.add(this.meetLight);
      // the whistle ring and the goal ring
      this.ring = new T.Mesh(new T.RingGeometry(0.9, 1, 64), new T.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
      this.ring.rotation.x = -Math.PI / 2; this.ring.userData.dynamic = true; S.add(this.ring);
      this.goalRing = new T.Mesh(new T.RingGeometry(0.94, 1, 64), new T.MeshBasicMaterial({ color: 0xffd690, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
      this.goalRing.rotation.x = -Math.PI / 2; this.goalRing.userData.dynamic = true; S.add(this.goalRing);

      /* ---------- life ---------- */
      SCAPE.motes(w, { n: 60, area: [-50, 0.3, -170, 50, 6, 160], color: '#ffcf88', size: 0.12, opacity: 0.5, additive: true, blink: true, seed: 3 });

      this.baked = w.bake();
      w.post({ bloom: 0.95, threshold: 0.5, vignette: 0.5, grain: 0.045, sat: 0.85, contrast: 1.08, lift: [0.0, 0.008, 0.026], gain: [0.94, 0.98, 1.1] });

      /* ---------- HUD and touch buttons ---------- */
      const mkBtn = (label, bottom, right, down, up) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'aqabah-btn'; b.textContent = label;
        b.style.cssText = `position:absolute;right:calc(var(--gut-r, 16px) + ${right}px);bottom:calc(env(safe-area-inset-bottom, 0px) + ${bottom}px);width:84px;height:54px;border-radius:27px;border:1px solid rgba(242,233,214,.4);background:rgba(6,9,20,.55);color:#f2e9d6;font:600 .6rem var(--f-display, serif);letter-spacing:.16em;pointer-events:auto;touch-action:none;display:none`;
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); down(); }); if (up) { const u = e => { e.stopPropagation(); up(); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u); }
        w.ui.layer.appendChild(b); return b; };
      this.btns = [mkBtn('WHISTLE', 150, 14, () => { this.touchWhistle = true; }, () => { this.touchWhistle = false; }), mkBtn('WAIT', 216, 14, () => this.waitAll(env)), mkBtn('SHADE', 216, 104, () => this.toggleShade(env))];
      this.touch = matchMedia('(pointer: coarse)').matches;
      const cnt = document.createElement('div'); cnt.className = 'aqabah-count';
      cnt.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom, 0px) + 104px);transform:translateX(-50%);font:600 .7rem var(--f-display, serif);letter-spacing:.24em;text-transform:uppercase;color:#f2e9d6;text-shadow:0 1px 6px #000;pointer-events:none;opacity:0;transition:opacity .6s;white-space:nowrap';
      w.ui.layer.appendChild(cnt); this.cnt = cnt;

      /* ---------- discoveries (found by bringing your light close and pressing E) ---------- */
      const dp = (x, z) => [x, H(x, z) + 1.3, z];
      this.disc = [
        w.discover({ pos: dp(GOALS[0].x - 4, GOALS[0].z - 3), title: 'The First Pledge', ar: 'بَيْعَةُ الْعَقَبَةِ الْأُولَى',
          text: 'A year before, twelve men of Yathrib pledged at al-‘Aqabah not to associate anything with God, not to steal, commit adultery or kill their children, not to slander, and not to disobey him in what is right. (Ibn Ishaq and Musnad Ahmad 22754, from ‘Ubadah ibn as-Samit; cf. Sahih al-Bukhari 18)' }),
        w.discover({ pos: dp(-38, 70), title: 'Mus‘ab ibn ‘Umayr',
          text: 'After the first pledge Mus‘ab ibn ‘Umayr went to Yathrib to teach the Qur’an. Al-Bara’ said: the first to come to us were Mus‘ab ibn ‘Umayr and Ibn Umm Maktum, and they taught the people the Qur’an. (Sahih al-Bukhari 3925; Ibn Ishaq)' }),
        w.discover({ pos: dp(40, 0), title: 'The Days of Tashriq',
          text: 'Ka‘b ibn Malik tells that they came to Mina with the pilgrims of their people and arranged to meet the Prophet ﷺ at al-‘Aqabah in the middle of the days of Tashriq. (Musnad Ahmad 15798; Ibn Ishaq)' }),
        w.discover({ pos: dp(RAV(-92) + 1, -92), title: 'Two Women', ar: 'نُسَيْبَةُ وَأَسْمَاء',
          text: 'Two women came to the second pledge: Nusaybah bint Ka‘b and Asma’ bint ‘Amr. (Musnad Ahmad 15798; Ibn Ishaq)' }),
        w.discover({ pos: dp(RAV(-140) + 1, -140), title: 'The Leaders of the Night', label: 'Look closer',
          text: '‘Ubadah ibn as-Samit, who took part in the battle of Badr, was one of the leaders (naqibs) chosen on the night of al-‘Aqabah. (Sahih al-Bukhari 18)' }),
        w.discover({ pos: dp(MEET.x + 11, MEET.z + 3), title: 'Masjid al-Bay‘ah',
          text: 'Today a small mosque, Masjid al-Bay‘ah, marks the place of the pledge near the Jamrat al-‘Aqabah in Mina. Its inscriptions record its building by the Abbasid caliph Abu Ja‘far al-Mansur in 144 AH (761–762 CE). (Saudipedia; mosque inscriptions)' }),
      ];
      this.disc.forEach(it => { it.r = 3.5; });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 280, q: 0.5, gain: 0.035 });
      this.fireNoise = SND.noise(b, { color: 'white', type: 'bandpass', freq: 1800, q: 0.7, gain: 0 });
      this.clocks = { cricket: 1, murmur: 3, camel: 9, step: 0 };

      /* ---------- the camera: Pikmin's, high and behind ---------- */
      this.camD = 13; this.placeCam(true);
      w.mode = (dt, ww) => self.drive(env, dt);
    },

    placeCam(snap) {
      const w = this.w, L = this.L;
      w.pitch = U.clamp(w.pitch, -1.15, -0.32);
      const p = -w.pitch, D = this.camD;
      const cx = L.x + Math.sin(w.yaw) * Math.cos(p) * D, cz = L.z + Math.cos(w.yaw) * Math.cos(p) * D;
      let cy = L.y + Math.sin(p) * D;
      cy = Math.max(cy, H(cx, cz) + 1.6);
      w.pos.x = cx; w.pos.z = cz; w.eye = cy - H(cx, cz);
      w.camera.position.set(cx, cy, cz);
      w.camera.lookAt(L.x, L.y + 0.4, L.z);
      w.y = H(cx, cz);
    },

    /* ================= the entrance film ================= */
    film(env, w) {
      const m = MEET, my = H(m.x, m.z), self = this;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [52, 46],
          path: [[[60, 120, 260], [0, 0, 60]], [[40, 80, 190], [-6, 0, 20]], [[20, 60, 130], [-10, 4, -40]]],
          start: () => SND.glow(env.bus, 146.83, { gain: 0.035, dur: 8 }) },
        { dur: 7, fade: 'dip', ease: 'linear', line: 'Mina, in the days of the pilgrimage, 622.', ar: 'منى، في أيام الحج، سنة ٦٢٢.', lineAt: 0.8,
          path: [[[24, 3, 120], [10, 1.2, 100]], [[14, 2.4, 82], [-4, 1.2, 62]]],
          start: () => { SND.sing(env.bus, 110, { vowel: 'm', dur: 5, gain: 0.025, voices: 3, attack: 1 }); } },
        { dur: 8, fade: 'dip', ease: 'glide', lines: [[0.6, 'Men and women of Yathrib had arranged to meet him', 'وكان رجالٌ ونساءٌ من يثرب قد واعدوه'], [3.8, 'in the ravine of al-‘Aqabah, by night.', 'في شِعب العقبة، ليلًا.']],
          path: [[[m.x + 40, my + 45, m.z + 70], [m.x, my, m.z]], [[m.x + 18, my + 18, m.z + 30], [m.x, my + 1, m.z]], [[m.x + 6, my + 4, m.z + 12], [m.x - 2, my + 1.5, m.z - 4]]],
          start: () => { self.meetPreview = 1; }, during: () => { self.meetPreview = 1; } },
        { dur: 7, fade: 'dip', ease: 'inout', line: 'After a third of the night, they slipped out of their camps.', ar: 'وبعد ثلث الليل تسلّلوا من رحالهم.', lineAt: 0.8, fov: [40, 36],
          path: [[[-17, 2.2, 124], [-25, 1.2, 138]], [[-19, 1.6, 129], [-26, 1.0, 140]]],
          start: () => { self.meetPreview = 0; SND.bell(env.bus, 523.25, { gain: 0.02 }); } },
        { dur: 6, fade: 'cut', ease: 'glide',
          path: [[[START.x - 6, H(START.x, START.z) + 4, START.z - 10], [START.x, H(START.x, START.z) + 1, START.z]], [[START.x - 2, H(START.x, START.z) + 9, START.z + 14], [START.x, H(START.x, START.z) + 1, START.z]]],
          start: () => SND.swell(env.bus, { f0: 300, f1: 900, dur: 2, gain: 0.03 }) },
      ];
    },
    filmOpts: { end(w) { const st = ENGINE.byId('aqabah'); if (!st || !st.S) return; st.meetPreview = 0; st.S.phase = 'play'; st.setPart(ENGINE.env, 0); st.cnt.style.opacity = 1; if (st.touch) st.btns.forEach(b => { b.style.display = 'block'; }); } },

    /* ================= the game ================= */
    setPart(env, n) {
      const w = this.w; this.S.part = n;
      const titles = ['Part 1 of 3 · The first four', 'Part 2 of 3 · Through the camps', 'Part 3 of 3 · The ravine'];
      const steps = ['Four lanterns wait among the rocks to the west. Hold SPACE to whistle them into your line, then lead them to the cairn',
        'Four more wait beyond the camps, to the east. Keep your line out of the firelight: Q to make them wait, C to shade every light',
        'Up the ravine. One lantern waits in each side pocket. Bring all twelve to the meeting place by the rock'];
      w.activity(titles[n], 12, steps[n]); w.progress(this.S.done);
      w.goal([GOALS[n].x, H(GOALS[n].x, GOALS[n].z) + 2, GOALS[n].z]);
    },
    toggleShade(env) { const S = this.S; if (S.phase !== 'play') return; S.shade = !S.shade; SND.swell(env.bus, { f0: S.shade ? 900 : 400, f1: S.shade ? 300 : 1200, dur: 0.5, gain: 0.04 }); },
    waitAll(env) {
      const S = this.S; if (S.phase !== 'play') return;
      let n = 0; for (const l of this.lan) if (l.state === 'follow') { l.state = 'wait'; l.flash = 0.6; n++; }
      if (n) { SND.sing(env.bus, 196, { vowel: 'm', dur: 0.7, gain: 0.03, attack: 0.04 }); this.w.step('They wait where they are. Whistle when you want them again'); }
    },
    scatter(env, camp) {
      // the camp stirs: the lanterns caught in its light slip away to where they waited
      let n = 0;
      for (const l of this.lan) if ((l.state === 'follow' || l.state === 'wait') && Math.hypot(l.p.x - camp.x, l.p.z - camp.z) < camp.r + 4) { l.state = 'home'; n++; }
      camp.stir = 1; camp.alert = 0;
      const sp = this.w.spatial(new T.Vector3(camp.x, 0, camp.z), 12);
      SND.sing(env.bus, U.rnd(100, 120), { vowel: 'a', dur: 0.9, gain: 0.04 * sp.gain + 0.005, pan: sp.pan, attack: 0.05, glide: 1.1 });
      SND.sing(env.bus, U.rnd(130, 150), { vowel: 'o', dur: 0.7, gain: 0.03 * sp.gain + 0.004, pan: sp.pan, delay: 0.5, attack: 0.05 });
      SND.swell(env.bus, { f0: 300, f1: 1400, dur: 1, gain: 0.05 });
      if (n) this.w.step(`The camp stirred, and ${n === 1 ? 'one lantern' : n + ' lanterns'} slipped back into the dark to wait. Whistle them again, out of the firelight`);
    },

    drive(env, dt) {
      const w = this.w, S = this.S, L = this.L, b = env.bus, t = w.time;
      const play = S.phase === 'play';
      /* ---------- moving the guiding light ---------- */
      let mx = 0, mz = 0;
      if (play) {
        const k = w.keys;
        if (k.has('w') || k.has('ArrowUp')) mz += 1; if (k.has('s') || k.has('ArrowDown')) mz -= 1;
        if (k.has('a')) mx -= 1; if (k.has('d')) mx += 1;
        if (k.has('ArrowLeft')) w.yaw += dt * 1.8; if (k.has('ArrowRight')) w.yaw -= dt * 1.8;
        if (w.joy) { mx += w.joy.dx; mz -= w.joy.dy; }
      }
      const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
      const fx = -Math.sin(w.yaw), fz = -Math.cos(w.yaw), rx = -fz, rz = fx;
      const spd = S.shade ? 1.9 : (w.keys.has('Shift') ? 4.6 : 3.4);
      const vx = (fx * mz + rx * mx) * spd, vz = (fz * mz + rz * mx) * spd;
      this.vel = this.vel || new T.Vector3(); this.vel.x = U.damp(this.vel.x, vx, 8, dt); this.vel.z = U.damp(this.vel.z, vz, 8, dt);
      let nx = L.x + this.vel.x * dt, nz = L.z + this.vel.z * dt;
      for (const [cx, cz, cr] of w.circles) { const dx = nx - cx, dz = nz - cz, d = Math.hypot(dx, dz), m = cr + 0.35; if (d < m && d > 1e-4) { nx = cx + dx / d * m; nz = cz + dz / d * m; } }
      if (!walkable(nx, nz)) { if (walkable(L.x, nz)) nx = L.x; else if (walkable(nx, L.z)) nz = L.z; else { nx = L.x; nz = L.z; } }
      const moved = Math.hypot(nx - L.x, nz - L.z);
      L.x = nx; L.z = nz; L.y = U.damp(L.y, H(nx, nz) + 1.1 + Math.sin(t * 2.2) * 0.06, 10, dt);
      // the trail the line follows
      const tr = this.trail;
      if (!tr.length || Math.hypot(tr[0].x - L.x, tr[0].z - L.z) > 0.35) { tr.unshift({ x: L.x, z: L.z }); if (tr.length > 200) tr.pop(); }
      // soft steps of the guide on the grit
      this.clocks.step -= moved; if (this.clocks.step < 0) { this.clocks.step = 0.9; SND.step(b, { gain: S.shade ? 0.03 : 0.05, f: U.rnd(700, 1100) }); }
      if (!w.filmS) this.placeCam();

      /* ---------- the whistle ---------- */
      const whistle = play && (w.keys.has(' ') || this.touchWhistle);
      if (whistle) {
        if (!S.whistling) { S.whistling = true; SND.sing(b, 392, { vowel: 'u', dur: 0.9, gain: 0.035, glide: 0.8, attack: 0.05 }); }
        S.whistle = Math.min(7.5, S.whistle + dt * 12);
        for (const l of this.lan) if ((l.state === 'idle' || l.state === 'wait') && Math.hypot(l.p.x - L.x, l.p.z - L.z) < S.whistle) {
          const was = l.state; l.state = 'follow'; l.flash = 1;
          if (was === 'idle') { SND.bell(b, [523.25, 587.33, 659.25, 783.99][l.id % 4], { gain: 0.025, glass: true }); }
        }
      } else { if (S.whistling) S.whistling = false; S.whistle = Math.max(0, S.whistle - dt * 20); }
      this.ring.position.set(L.x, H(L.x, L.z) + 0.12, L.z); this.ring.scale.setScalar(Math.max(0.01, S.whistle)); this.ring.material.opacity = S.whistle > 0.1 ? 0.55 * (whistle ? 1 : S.whistle / 7.5) : 0;

      /* ---------- the camps: fires breathe and flare; light that falls on a lantern stirs them ---------- */
      const fp = this.fires, m4 = new T.Matrix4(), col = new T.Color();
      const lights = [{ p: L, shaded: S.shade, lead: true }].concat(this.lan.filter(l => l.state === 'follow' || l.state === 'wait').map(l => ({ p: l.p, shaded: S.shade && l.state === 'follow', l })));
      CAMPS.forEach((c, i) => {
        c.next -= dt; if (c.next < 0) { c.flare = 1; c.next = 9 + (i * 3.1) % 7; const sp = w.spatial(new T.Vector3(c.x, 0, c.z), 14); if (sp.gain > 0.05) { SND.knock(b, { f: 200, gain: 0.03 * sp.gain, click: 1400, pan: sp.pan }); SND.swell(b, { f0: 800, f1: 2400, dur: 1.2, gain: 0.03 * sp.gain, pan: sp.pan }); } }
        c.flare = Math.max(0, c.flare - dt / 3.5); c.stir = Math.max(0, c.stir - dt / 4);
        c.r = c.base * (1 + 0.55 * Math.sin(Math.min(1, c.flare * 1.6) * Math.PI / 2) * (c.flare > 0 ? 1 : 0) + c.stir * 0.5) * (0.97 + 0.03 * Math.sin(t * 9 + i));
        let heat = 0;
        if (play) for (const q of lights) { const d = Math.hypot(q.p.x - c.x, q.p.z - c.z); if (d < c.r) heat += (q.shaded ? 0.22 : 1) * (1.25 - d / c.r) * (q.lead ? 0.35 : 1); }
        if (heat > 0) c.alert = Math.min(1, c.alert + heat * dt * 0.45); else c.alert = Math.max(0, c.alert - dt * 0.3);
        if (c.alert >= 1 && play) this.scatter(env, c);
        const fl = 0.85 + 0.15 * Math.sin(t * 11 + i * 3) * Math.sin(t * 5.3 + i);
        fp.P.set([c.x, c.y + 0.55, c.z], i * 6); fp.Sz[i * 2] = (1.6 + c.flare * 1.4 + c.stir) * fl; fp.A[i * 2] = 0.95; fp.C.set([1, 0.45, 0.16], i * 6);
        fp.P.set([c.x, c.y + 0.9, c.z], i * 6 + 3); fp.Sz[i * 2 + 1] = (5 + c.flare * 4 + c.alert * 3) * fl; fp.A[i * 2 + 1] = 0.35 + c.alert * 0.3; fp.C.set([1, 0.38, 0.12], i * 6 + 3);
        m4.makeScale(c.r, 1, c.r); m4.setPosition(c.x, c.y + 0.08, c.z); this.pools.setMatrixAt(i, m4);
        col.setRGB(0.55 + c.alert * 0.45, 0.22 + c.alert * 0.06, 0.06).multiplyScalar(fl); this.pools.setColorAt(i, col);
      });
      fp.dirty(); this.pools.instanceMatrix.needsUpdate = true; if (this.pools.instanceColor) this.pools.instanceColor.needsUpdate = true;
      { const near = CAMPS.slice().sort((a, c) => Math.hypot(a.x - L.x, a.z - L.z) - Math.hypot(c.x - L.x, c.z - L.z));
        this.fireLights.forEach((Lt, i) => { const c = near[i]; Lt.position.set(c.x, c.y + 1.0, c.z); Lt.intensity = (1.6 + c.flare * 1.6 + c.stir) * (0.85 + 0.15 * Math.sin(t * 10 + i)); Lt.distance = c.r * 2.4; });
        const sp = w.spatial(new T.Vector3(near[0].x, 0, near[0].z), 8); this.fireNoise.set('gain', 0.04 * sp.gain, 0.2); }

      /* ---------- the lanterns ---------- */
      const g = this.lanGlow; let follow = 0, waiting = 0;
      let slot = 0;
      for (const l of this.lan) {
        if (l.state === 'follow') {
          // walk the guide's trail: each lantern a little further back along it
          const back = 1.4 + slot * 0.95; slot++;
          let acc = Math.hypot(tr[0].x - L.x, tr[0].z - L.z), tx = tr[tr.length - 1].x, tz = tr[tr.length - 1].z;
          for (let i = 1; i < tr.length; i++) { const d = Math.hypot(tr[i].x - tr[i - 1].x, tr[i].z - tr[i - 1].z); if (acc + d >= back) { const k = (back - acc) / d; tx = U.lerp(tr[i - 1].x, tr[i].x, k); tz = U.lerp(tr[i - 1].z, tr[i].z, k); break; } acc += d; }
          if (tr.length < 2) { tx = L.x; tz = L.z; }
          const dx = tx - l.p.x, dz = tz - l.p.z, d = Math.hypot(dx, dz), sp = Math.min(d * 3, S.shade ? 2.6 : 5.2);
          if (d > 0.05) { l.p.x += dx / d * sp * dt; l.p.z += dz / d * sp * dt; }
          follow++;
        } else if (l.state === 'home') {
          const dx = l.home.x - l.p.x, dz = l.home.z - l.p.z, d = Math.hypot(dx, dz);
          if (d < 0.3) l.state = 'idle'; else { const sp = Math.min(d * 2, 4); l.p.x += dx / d * sp * dt; l.p.z += dz / d * sp * dt; }
        } else if (l.state === 'wait') waiting++;
        else if (l.state === 'gather' || l.state === 'come') {
          // at the meeting place: a slot in the circle
          if (l.state === 'come') { l.delay -= dt; if (l.delay > 0) continue; if (l.p.y < -40) { l.p.set(l.home.x, l.home.y, l.home.z); l.flash = 1; } }
          const dx = l.slot.x - l.p.x, dz = l.slot.z - l.p.z, d = Math.hypot(dx, dz);
          if (d > 0.05) { const sp = Math.min(d * 1.5, 4.5); l.p.x += dx / d * sp * dt; l.p.z += dz / d * sp * dt; }
        }
        if (l.state === 'hidden') continue;
        // keep them apart a little
        l.p.y = U.damp(l.p.y < -40 ? l.home.y : l.p.y, H(l.p.x, l.p.z) + 1.0 + Math.sin(t * 2 + l.ph) * 0.05, 6, dt);
        l.flash = Math.max(0, l.flash - dt * 1.5);
      }
      // separation between followers
      const fol = this.lan.filter(l => l.state === 'follow' || l.state === 'wait');
      for (let i = 0; i < fol.length; i++) for (let j = i + 1; j < fol.length; j++) { const a = fol[i].p, c = fol[j].p, dx = c.x - a.x, dz = c.z - a.z, d = Math.hypot(dx, dz); if (d < 0.75 && d > 1e-4) { const push = (0.75 - d) * 0.5; a.x -= dx / d * push; a.z -= dz / d * push; c.x += dx / d * push; c.z += dz / d * push; } }
      // draw: glows and lantern bodies
      const lead = this.lan.length;
      const writeGlow = (i, p, size, alpha, warm) => { g.P.set([p.x, p.y + 0.12, p.z], i * 3); g.Sz[i] = size; g.A[i] = alpha * 0.75; g.C.set(warm ? [1, 0.72, 0.38] : [1, 0.86, 0.6], i * 3); };
      this.lan.forEach((l, i) => {
        if (l.state === 'hidden' || (l.state === 'come' && l.delay > 0)) { g.A[i] = 0; g.Sz[i] = 0; return; }
        const shaded = S.shade && (l.state === 'follow');
        const base = l.state === 'idle' ? 0.55 + 0.25 * Math.pow(Math.max(0, Math.sin(t * 1.4 + l.ph)), 6) : l.state === 'home' ? 0.35 : 1;
        writeGlow(i, l.p, (shaded ? 0.6 : 1.3 + l.flash * 1.8) * (l.state === 'wait' ? 0.8 : 1), (shaded ? 0.35 : base) * (S.phase === 'end' ? 1.2 : 1), true);
      });
      writeGlow(lead, L, S.shade ? 0.9 : 1.8, S.shade ? 0.5 : 0.95, false);
      g.dirty();
      if (this.lanInst.length) {
        const q = new T.Quaternion(), s = new T.Vector3(1.3, 1.3, 1.3), pv = new T.Vector3();
        this.lanInst.forEach(im => {
          this.lan.forEach((l, i) => { const vis = !(l.state === 'hidden' || (l.state === 'come' && l.delay > 0)); pv.set(l.p.x, vis ? l.p.y - 0.25 : -999, l.p.z); m4.compose(pv, q, s); im.setMatrixAt(i, m4); });
          pv.set(L.x, L.y - 0.25, L.z); m4.compose(pv, q, s); im.setMatrixAt(lead, m4); im.instanceMatrix.needsUpdate = true;
        });
      }
      this.leadLight.position.set(L.x, L.y + 0.3, L.z); this.leadLight.intensity = S.shade ? 0.35 : 1.3;
      this.cnt.textContent = play ? `${follow} following${waiting ? ` · ${waiting} waiting` : ''}${S.shade ? ' · shaded' : ''}` : '';

      /* ---------- the goal of this part ---------- */
      const G = GOALS[S.part];
      this.goalRing.position.set(G.x, H(G.x, G.z) + 0.15, G.z); this.goalRing.scale.setScalar(G.r * (1 + 0.04 * Math.sin(t * 2))); this.goalRing.material.opacity = play ? 0.35 + 0.15 * Math.sin(t * 2) : 0;
      if (play) {
        const need = (S.part + 1) * 4;
        const inG = this.lan.filter(l => (l.state === 'follow' || l.state === 'wait') && Math.hypot(l.p.x - G.x, l.p.z - G.z) < G.r + 1).length;
        if (Math.hypot(L.x - G.x, L.z - G.z) < G.r && inG >= need) this.reach(env);
        else if (Math.hypot(L.x - G.x, L.z - G.z) < G.r && inG < need && !this.saidShort) { this.saidShort = true; setTimeout(() => { this.saidShort = false; }, 9000); w.step(`${inG} of ${need} are here. Go back and whistle the rest into your line`); }
        S.done = Math.max(S.done, Math.min(need, follow + waiting));
        w.progress(Math.min(12, follow + waiting));
      }

      /* ---------- discoveries: your light near a mote, then E ---------- */
      let near = null; for (const it of this.disc) if (!it.done && Math.hypot(it.pos.x - L.x, it.pos.z - L.z) < it.r) near = it;
      this.nearDisc = near;
      if (near && play) { w.ui.label.textContent = near.label; w.ui.prompt.classList.add('show'); w.ui.ebtn.classList.add('show'); w.focus = near; }
      else { w.focus = null; w.ui.ebtn.classList.remove('show'); }

      /* ---------- sound ---------- */
      this.clocks.murmur -= dt;
      if (this.clocks.murmur < 0) { this.clocks.murmur = 2.5 + Math.random() * 4; const c = U.pick(CAMPS), sp = w.spatial(new T.Vector3(c.x, 0, c.z), 14); if (sp.gain > 0.02) SND.sing(b, U.rnd(95, 125), { vowel: U.pick(['m', 'u', 'o']), dur: U.rnd(0.8, 1.8), gain: 0.025 * sp.gain + 0.002, pan: sp.pan, attack: 0.3, breath: 0.12, vib: 0.002 }); }
      this.clocks.cricket -= dt; if (this.clocks.cricket < 0) { this.clocks.cricket = 0.4 + Math.random() * 1.2; SND.cricket(b, { gain: 0.004 }); }
      this.clocks.camel -= dt; if (this.clocks.camel < 0) { this.clocks.camel = 14 + Math.random() * 14; SND.swell(b, { f0: 120, f1: 260, dur: 1.4, gain: 0.025, q: 3, pan: U.rnd(-0.8, 0.8) }); }
      this.wind.set('freq', L.z < -55 ? 380 : 280, 1);

      /* ---------- the meeting ---------- */
      if (this.meetPreview) this.meetLight.intensity = 0.8;
      if (S.phase === 'end') this.ending(env, dt);
      else if (!this.meetPreview) this.meetLight.intensity = U.damp(this.meetLight.intensity, 0, 2, dt);
    },
    reach(env) {
      const w = this.w, S = this.S;
      SND.glow(env.bus, [196, 220, 293.66][S.part], { gain: 0.04, dur: 5 });
      SND.bell(env.bus, 587.33, { gain: 0.03 }); SND.bell(env.bus, 783.99, { gain: 0.025, delay: 0.3 });
      this.lan.forEach(l => { if (l.state === 'follow' || l.state === 'wait') l.flash = 1; });
      if (S.part < 2) {
        S.done = (S.part + 1) * 4;
        if (S.part === 0) w.say('Twelve, a Year Before', 'A year before this night, twelve men of Yathrib met the Prophet ﷺ here and gave the first pledge. (Ibn Ishaq; Musnad Ahmad 22754)', { ms: 9000 });
        this.setPart(env, S.part + 1);
      } else {
        S.phase = 'end'; S.endT = 0; w.goal(null); this.cnt.style.opacity = 0; this.btns.forEach(q => { q.style.display = 'none'; });
        // a circle round the rock: the twelve first, then the others who came by other ways
        const all = this.lan; let k = 0;
        all.forEach(l => { if (l.part === 3) { l.state = 'come'; } else l.state = 'gather'; });
        const order = all.filter(l => l.part < 3).concat(all.filter(l => l.part === 3));
        order.forEach((l, i) => { const ring = i < 12 ? 0 : i < 36 ? 1 : 2, n = ring === 0 ? 12 : ring === 1 ? 24 : 39, j = ring === 0 ? i : ring === 1 ? i - 12 : i - 36; const a = j / n * Math.PI * 2, r = 3.5 + ring * 2.6; l.slot = new T.Vector3(MEET.x + Math.cos(a) * r, 0, MEET.z + 1.5 + Math.sin(a) * r * 0.9); k++; });
      }
    },
    ending(env, dt) {
      const w = this.w, S = this.S, b = env.bus, T0 = S.endT, T1 = (S.endT += dt), at = s => T0 < s && T1 >= s;
      this.meetLight.intensity = U.lerp(this.meetLight.intensity, 1.4, dt * 0.5);
      // the view turns gently toward the circle
      if (T1 < 6) { const dx = MEET.x - this.L.x, dz = MEET.z - this.L.z, ty = Math.atan2(dx, dz) + Math.PI; let dy = ty - w.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); w.yaw += dy * dt * 0.8; w.pitch = U.damp(w.pitch, -0.48, 1, dt); this.camD = U.damp(this.camD, 19, 0.8, dt); }
      if (at(1.5)) w.say('By Night, at al-‘Aqabah', 'They came by night to al-‘Aqabah. The sirah counts seventy-three men and two women. (Ibn Ishaq; Musnad Ahmad 15798)', { ms: 10000 });
      if (at(2)) SND.glow(b, 146.83, { gain: 0.045, dur: 10 });
      if (T1 > 2 && T1 < 20 && Math.random() < dt * 3) SND.bell(b, U.pick([392, 440, 523.25, 587.33]), { gain: 0.012, glass: true, pan: U.rnd(-0.7, 0.7) });
      if (at(8)) SND.glow(b, 220, { gain: 0.04, dur: 10 });
      if (at(13)) { w.say('The Pledge', 'They pledged to protect him as they protected their own women and children. (Musnad Ahmad 15798, graded hasan; Ibn Ishaq)', { ms: 12000 }); SND.sing(b, 196, { vowel: 'a', dur: 9, gain: 0.035, voices: 4, attack: 3 }); SND.sing(b, 293.66, { vowel: 'o', dur: 8, gain: 0.025, voices: 3, attack: 3, delay: 1 }); }
      if (at(15)) w.finish('Seventy-five lights by the rock');
      if (at(28)) w.say('Toward Yathrib', 'Soon after, the believers of Makkah began to leave for Yathrib, the city that would be called Madinah.', { ms: 9000 });
    },
    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      if (w.filmS) this.drive(env, dt);
    },
    onKey(env, e) {
      if (!this.w || !this.S) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (this.w.cine) return;
      if (k === 'q' && !e.repeat) this.waitAll(env);
      if (k === 'c' && !e.repeat) this.toggleShade(env);
    },
  }));
})();
