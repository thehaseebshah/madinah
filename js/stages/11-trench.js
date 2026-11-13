/* Station — The Trench (al-Khandaq, al-Ahzab), 5 AH / 627 CE.
   Genre: maze tower defence (Kingdom Rush / Plants vs Zombies), with no fighting at all.
   Winter dusk on the open plain north of Madinah. Mount Sal' and the camp behind you, the black
   lava fields closing the plain on east and west, the fires of the confederate camps spreading
   across the far plain. Seen from above, the plain is a grid: dig trench cells (each dug cell
   sinks into a real trench that joins its neighbours, with the spoil heaped behind) and set
   lamp-watch posts. Then the riders' torches come: they find their way round what you have dug,
   hesitate in the light of the watch and turn back, and where the line is closed they halt at the
   trench's edge and turn back. Nothing is ever struck: no fighting, no wounds. A torch that slips
   through only dims one lamp of the camp, which is lit again at the end.
   Three waves of torches, each with a little more earth to move, then the rock that would not
   break: three timed strikes (Sahih al-Bukhari 4101; Sunan al-Nasa'i 3176).
   Colour script: cold dusk blue and violet, with fire-orange for lamps, torches and the strikes. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const COLS = 18, ROWS = 12, CELL = 6, X0 = -54, Z0 = -36;            // row 0 is the north edge
  const DIGROWS = [3, 8], POSTROWS = [6, 11];
  const ROCKCELLS = new Set(['0,5', '1,5', '2,5', '0,6', '1,6', '15,5', '16,5', '17,5', '16,6', '17,6', '17,4', '0,4', '6,2', '11,9', '4,10']);
  const WAVES = [
    { dig: 7, posts: 1, torches: 4, cols: [7, 8, 9, 10], gap: 3.2 },
    { dig: 6, posts: 2, torches: 7, cols: [3, 5, 8, 12, 14], gap: 2.4 },
    { dig: 6, posts: 1, torches: 10, cols: [3, 4, 6, 8, 9, 11, 13, 14], gap: 1.8 },
  ];
  const cx = c => X0 + (c + 0.5) * CELL, cz = r => Z0 + (r + 0.5) * CELL;
  const key = (c, r) => c + ',' + r;

  /* ---------------- the plain ---------------- */
  function H(x, z) {
    let y = 0.6 + SCAPE.fbm(x * 0.008, z * 0.008, 3) * 2.2 + SCAPE.fbm(x * 0.05, z * 0.05, 2) * 0.25;
    // the black lava fields east and west
    const lava = U.smooth(70, 160, Math.abs(x)) * (1 - U.smooth(160, 420, z));
    y += lava * (3 + SCAPE.ridge(x * 0.025, z * 0.025, 4) * 6);
    // Mount Sal' behind the camp, south-west
    y += 75 * Math.exp(-((x + 70) * (x + 70) / (2 * 90 * 90) + (z - 210) * (z - 210) / (2 * 70 * 70)));
    y += SCAPE.ridge(x * 0.01 + 3, z * 0.01, 4) * 20 * Math.exp(-((x + 70) * (x + 70) + (z - 210) * (z - 210)) / (2 * 110 * 110));
    // Uhud on the far northern horizon, and hills all round
    y += 160 * Math.exp(-((x - 60) * (x - 60) / (2 * 380 * 380) + (z + 1500) * (z + 1500) / (2 * 140 * 140)));
    y += U.smooth(900, 1500, Math.hypot(x, z * 0.8)) * (40 + SCAPE.ridge(x * 0.003, z * 0.003, 5) * 130);
    // the board itself is level, so the grid reads cleanly
    const bd = Math.max(Math.abs(x) - 58, Math.abs(z) - 40, 0);
    return U.lerp(0.5 + SCAPE.fbm(x * 0.04, z * 0.04, 2) * 0.15, y, U.smooth(0, 24, bd));
  }

  /* ---------------- helpers ---------------- */
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
    return { pts, P, S, A, geo, n, upd() { geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true; } };
  }
  function burstPool(w, n, color, additive) {
    const sp = sprites(w, n, color, additive), V = new Float32Array(n * 3), L = new Float32Array(n), L0 = new Float32Array(n), S0 = new Float32Array(n), A0 = new Float32Array(n);
    let k = 0;
    return {
      emit(x, y, z, vx, vy, vz, life, size, alpha) { const i = k++ % n; sp.P.set([x, y, z], i * 3); V.set([vx, vy, vz], i * 3); L[i] = L0[i] = life; S0[i] = size; A0[i] = alpha; },
      step(dt, drag, grav) {
        for (let i = 0; i < n; i++) {
          if (L[i] <= 0) { sp.A[i] = 0; continue; }
          L[i] -= dt; const t = 1 - Math.max(0, L[i]) / L0[i], f = 1 - drag * dt;
          V[i * 3] *= f; V[i * 3 + 1] = V[i * 3 + 1] * f - grav * dt; V[i * 3 + 2] *= f;
          sp.P[i * 3] += V[i * 3] * dt; sp.P[i * 3 + 1] += V[i * 3 + 1] * dt; sp.P[i * 3 + 2] += V[i * 3 + 2] * dt;
          sp.S[i] = S0[i] * (0.6 + t); sp.A[i] = A0[i] * Math.sin(Math.PI * Math.pow(t, 0.45));
        }
        sp.upd();
      },
    };
  }
  function cullable(w, res, list) {
    const fix = () => res.meshes.forEach(m => {
      if (!m.isInstancedMesh || !m.count) return;
      const m4 = new T.Matrix4(), p = new T.Vector3(), c = new T.Vector3(); let sMax = 0, r = 0;
      for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, m4); c.add(p.setFromMatrixPosition(m4)); }
      c.divideScalar(m.count);
      for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, m4); r = Math.max(r, p.setFromMatrixPosition(m4).distanceTo(c)); sMax = Math.max(sMax, m4.getMaxScaleOnAxis()); }
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      m.geometry = m.geometry.clone(); m.geometry.boundingSphere = new T.Sphere(c, r + (m.geometry.boundingSphere ? m.geometry.boundingSphere.radius : 2) * sMax + 2);
      m.frustumCulled = true; list.push(m);
    });
    if (res.ready) res.ready.then(fix); else fix();
  }

  ENGINE.register(WORLD.stage({
    key: 'trench',
    arabic: 'الخَنْدَق',
    title: 'The Trench',
    era: 'The Battle of al-Ahzab · 5 AH · 627 CE',
    hint: 'Click a cell to dig (1) or set a lamp-watch (2) · click a dug cell to fill it again · Space: let the torches come · WASD or drag to look across the plain',
    hintTouch: 'Tap a cell to dig · the buttons switch to lamp-watch and start the wave · drag to look across the plain',
    sound: { reverb: 0.5 },
    story: `<p>In the winter of the year 5 AH (627 CE) an alliance of tribes, by the sirah's count some ten thousand strong, marched on Madinah. The sirah says Salman al-Farisi advised a trench across the open northern approach, where the lava fields and the gardens did not close the way.</p>
            <p>The whole community dug it, the Prophet ﷺ among them, carrying earth until the dust covered his belly while they sang verses as they worked (Sahih al-Bukhari 4106). When a rock defied their picks, he struck it, and it crumbled like sand (Sahih al-Bukhari 4101).</p>`,

    enter(env) {
      const w = this.w = WORLD.create(env, { start: { x: 0, z: 60, yaw: 0 }, exposure: 0.9, far: 4000, near: 0.2, fov: 50,
        fog: { color: 0x3a3a52, density: 0.0011 } });
      const S = w.scene, Q = w.quality, rnd = U.seeded(627);
      w.renderer.setClearColor(0x2a2a40);

      /* ---------- the plain (coarse), and the board (fine, dug in place) ---------- */
      const far = (x, z) => H(x, z) - 1.2 * (1 - U.smooth(0, 6, Math.max(Math.abs(x) - 64, Math.abs(z) - 46, 0)));
      const ter = SCAPE.terrain(w, { size: 3400, seg: Q < 1 ? 220 : 280, cz: -300, height: far, rock: [0.82, 0.94],
        colors: { low: '#a49480', high: '#b0a08a', rock: '#4a4442', dark: '#2e2a28' }, tex: 'gravel', rockTex: 'lava',
        photo: { ground: 'dry_ground_rocks', rock: 'dark_rock', normal: 1 }, rep: 0.2, rockRep: 0.05 });
      { const p = ter.mesh.geometry.attributes.position, c = ter.mesh.geometry.attributes.color;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), k = U.lerp(1, 0.4, U.smooth(70, 150, Math.abs(x)) * (1 - U.smooth(160, 420, z))); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); } c.needsUpdate = true; }
      this.ter = ter;
      this.buildBoard(w, ter.mesh.material);
      w.ground = (x, z) => (Math.abs(x) < 63 && Math.abs(z) < 45 ? this.boardY(x, z) : ter.ground(x, z));

      /* ---------- dusk sky, cold light ---------- */
      this.sun = new T.DirectionalLight(0xffc8a0, 0.9); this.sun.position.set(-80, 30, 40); S.add(this.sun);
      S.add(new T.HemisphereLight(0x8090c0, 0x302820, PHOTO.enabled ? 0.08 : 0.5));
      w.followShadow(this.sun, 75, Q < 1 ? 1024 : 2048);
      if (PHOTO.enabled) PHOTO.sky(w, 'qwantani_dusk_2_puresky', { sun: this.sun, rotation: 0, intensity: 0.65, haze: '#4a4a62', horizon: 0.45, ground: '#5a5048', bounce: 0.35 }).then(o => {
        if (!o || !o.sunDir || this.w !== w) return;
        // turn the sky so the last light sits in the west, over the lava field
        const want = Math.atan2(0.25, -1), have = Math.atan2(o.sunDir.z, o.sunDir.x);
        if (o.material) o.material.uniforms.uRot.value += want - have;
        const y = Math.max(0.12, o.sunDir.y), c = Math.sqrt(1 - y * y); this.sun.position.set(-c * 100, y * 100, 0.25 * c * 100);
        if (w._shadow) w._shadow.off.copy(this.sun.position).normalize().multiplyScalar(w._shadow.off.length());
      });
      else w.sky({ top: '#2a3058', mid: '#b88a7a', bot: '#3a3448', sunDir: [-1, 0.06, 0.25], sun: '#ffb070', sunSize: 0.002, haze: 0.4 });
      SCAPE.horizon(w, { cz: -300, haze: '#4a4a62', layers: [{ r: 1600, h: 80, color: '#3e3c52', seed: 2, fade: 0.85 }, { r: 2200, h: 120, color: '#46445a', seed: 7, fade: 0.85 }, { r: 2900, h: 160, color: '#504e64', seed: 12, fade: 0.88 }] });

      /* ---------- materials ---------- */
      const M = this.M = {
        linen: PHOTO.mat(w, 'rough_linen', { rep: [2, 2], color: '#c8b89c', side: T.DoubleSide }),
        hair: PHOTO.mat(w, 'rough_linen', { rep: [2, 2], color: '#4a3e36', side: T.DoubleSide }),
        wood: PHOTO.mat(w, 'medieval_wood', { triplanar: 0.9, color: '#8a7462', fallback: KIT.wood(w, [1, 1]) }),
        earth: PHOTO.mat(w, 'brown_mud_dry', { triplanar: 0.35, color: '#9a8064', fallback: SCAPE.tex.mud(w) }),
        plaster: PHOTO.mat(w, 'clay_plaster', { triplanar: 0.3, color: '#cbbca4', fallback: KIT.plaster(w, [1, 1], '#c8b8a0') }),
        rockW: PHOTO.mat(w, 'quarry_wall', { triplanar: 0.6, color: '#e8e2d8', fallback: SCAPE.tex.granite(w) }),
      };

      /* ---------- the scattered plain, the lava fields, the camps ---------- */
      this.cullList = [];
      const offBoard = m => (x, z) => Math.abs(x) < 60 + m && Math.abs(z) < 42 + m;
      const tiles = []; for (let a = 0; a < 4; a++) for (let c = 0; c < 4; c++) tiles.push([-700 + a * 350, -900 + c * 300, -700 + (a + 1) * 350, -900 + (c + 1) * 300]);
      const sc = o => tiles.forEach((A, k) => cullable(w, SCAPE.scatter(w, Object.assign({}, o, { area: A, n: Math.max(1, Math.round(o.n / tiles.length)), seed: o.seed * 29 + k })), this.cullList));
      const lavaD = (x, z) => U.smooth(68, 140, Math.abs(x)) * (1 - U.smooth(160, 420, z));
      sc({ kind: 'boulder', n: 1100, scale: [0.8, 4], seed: 1, tex: 'lava', color: '#605a56', avoid: offBoard(2), density: lavaD });
      sc({ kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 120, scale: [0.8, 2], seed: 2, color: '#4a4644', avoid: offBoard(2), density: lavaD });
      sc({ kind: 'rock', n: 1300, scale: [0.3, 1.1], seed: 3, avoid: offBoard(0), density: (x, z) => 0.25 + lavaD(x, z) });
      sc({ kind: 'model', model: 'namaqualand_rocks_01', fallback: 'rock', fallbackScale: 0.4, n: 500, scale: [0.6, 1.4], seed: 4, avoid: offBoard(0), density: (x, z) => U.smooth(500, 60, Math.hypot(x, z)) });
      sc({ kind: 'model', model: 'namaqualand_stones_01', fallback: 'pebble', fallbackScale: 0.6, n: 900, scale: [0.6, 1.3], seed: 5, castShadow: false, avoid: offBoard(0), density: (x, z) => U.smooth(260, 50, Math.hypot(x, z)) });
      sc({ kind: 'grass', n: 2200, scale: [0.4, 0.85], seed: 6, avoid: offBoard(0), density: (x, z) => (1 - lavaD(x, z)) * U.smooth(700, 60, Math.hypot(x, z)) });
      sc({ kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 200, scale: [0.6, 1.2], seed: 7, avoid: offBoard(1), density: (x, z) => (1 - lavaD(x, z)) * U.smooth(600, 60, Math.hypot(x, z)) });
      sc({ kind: 'thorn', n: 260, scale: [0.6, 1.2], seed: 8, avoid: offBoard(1) });
      sc({ kind: 'acacia', n: 50, scale: [0.9, 1.3], seed: 9, avoid: offBoard(8) });
      // the palm gardens and houses of the city behind the camp, south and south-east
      SCAPE.scatter(w, { kind: 'palm', n: 260, area: [40, 120, 560, 520], scale: [7, 12], seed: 10 });
      const hs = SCAPE.scatter(w, { kind: 'house', n: 70, area: [-40, 280, 420, 620], scale: [6, 10], seed: 11, avoid: (x, z) => Math.hypot(x + 70, z - 210) < 130 });
      hs.meshes.forEach(m => { m.material = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.22, fallback: m.material.map, color: '#b8aa96' }); });

      /* ---------- the camp at the foot of Sal' (tents, fires, baskets, spades) ---------- */
      const camp = new T.Group(); S.add(camp); this.campFires = [];
      for (let i = 0; i < 14; i++) {
        const x = -60 + (i % 7) * 18 + (rnd() - 0.5) * 6, z = 64 + Math.floor(i / 7) * 16 + (rnd() - 0.5) * 6, y = H(x, z), ry = (rnd() - 0.5) * 0.6;
        const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; camp.add(g);
        const tg = new T.ConeGeometry(2.4, 2.6, 4, 1, true); tg.rotateY(Math.PI / 4); const tm = new T.Mesh(tg, i % 3 ? M.linen : M.hair); tm.position.y = 1.3; tm.scale.set(1.2, 1, 0.9); tm.castShadow = tm.receiveShadow = true; g.add(tm);
        const pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 3, 5), M.wood); pole.position.y = 1.5; g.add(pole);
      }
      const lampsAt = [];
      for (let i = 0; i < 8; i++) { const x = -54 + i * 15.5, z = 56 + (i % 2) * 3; lampsAt.push([x, H(x, z) + 0.6, z]); if (i % 2 === 0) PHOTO.place(w, 'stone_fire_pit', { pos: [x, undefined, z + 1.5], s: 0.9 }); }
      this.campLamps = sprites(w, lampsAt.length, '#ff9a48', true); lampsAt.forEach((q, i) => { this.campLamps.P.set(q, i * 3); this.campLamps.S[i] = 2.6; this.campLamps.A[i] = 0.85; }); this.campLamps.upd();
      this.lampDim = lampsAt.map(() => 0);
      SCAPE.smoke(w, { sources: lampsAt.filter((q, i) => i % 2 === 0).map(q => [q[0], q[1] + 0.4, q[2] + 1.5]), n: 14, height: 12, size: 2.4, opacity: 0.12, color: '#706a78' });
      [[-30, 52], [-10, 51], [12, 52], [34, 51]].forEach(([x, z], i) => { PHOTO.place(w, i % 2 ? 'wicker_basket_01' : 'wooden_bowl_01', { pos: [x, undefined, z], s: 1.3 }); });
      for (let i = 0; i < 6; i++) { const x = -40 + i * 16, z = 50, y = H(x, z); const sp = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.6, 5), M.wood); sp.position.set(x + 1.2, y + 0.75, z); sp.rotation.z = 0.35; sp.castShadow = true; camp.add(sp); const bl = new T.Mesh(new T.BoxGeometry(0.28, 0.36, 0.04), M.earth); bl.position.set(x + 1.5, y + 0.12, z); camp.add(bl); }
      // the confederate camps far across the plain: only their fires
      const enemy = []; for (let i = 0; i < 160; i++) { const a = (rnd() - 0.5) * 1.6, d = 420 + rnd() * 700, x = Math.sin(a) * d * 1.2, z = -Math.cos(a) * d - 60; enemy.push([x, H(x, z) + 1, z]); }
      this.fires = sprites(w, enemy.length, '#ff8a3a', true); enemy.forEach((q, i) => { this.fires.P.set(q, i * 3); this.fires.S[i] = 5 + rnd() * 4; this.fires.A[i] = 0; }); this.fires.upd(); this.firesK = 1;

      /* ---------- the grid, the dug cells, the posts, the torches ---------- */
      this.grid = new Map(); for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) this.grid.set(key(c, r), ROCKCELLS.has(key(c, r)) ? 'rock' : '');
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', points: [...ROCKCELLS].flatMap(k => { const [c, r] = k.split(',').map(Number); return [[cx(c) - 1.2, cz(r) - 1, 1.3], [cx(c) + 1.4, cz(r) + 1.2, 1.0]]; }), seed: 12, color: '#4a4644' });
      const lineG = []; for (let c = 0; c <= COLS; c++) lineG.push(X0 + c * CELL, 0, Z0, X0 + c * CELL, 0, Z0 + ROWS * CELL); for (let r = 0; r <= ROWS; r++) lineG.push(X0, 0, Z0 + r * CELL, X0 + COLS * CELL, 0, Z0 + r * CELL);
      const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lineG, 3));
      this.gridLines = new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.18, depthWrite: false })); this.gridLines.position.y = 0.62; this.gridLines.userData.dynamic = true; S.add(this.gridLines);
      const hg = new T.PlaneGeometry(CELL - 0.3, CELL - 0.3); hg.rotateX(-Math.PI / 2);
      this.hover = new T.Mesh(hg, new T.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.25, depthWrite: false })); this.hover.userData.dynamic = true; this.hover.visible = false; S.add(this.hover);
      // bands that show where digging and watching are allowed
      const band = (r0, r1, col) => { const g = new T.PlaneGeometry(COLS * CELL, (r1 - r0 + 1) * CELL); g.rotateX(-Math.PI / 2); const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.06, depthWrite: false })); m.position.set(0, 0.6, Z0 + (r0 + r1 + 1) / 2 * CELL); m.userData.dynamic = true; S.add(m); return m; };
      this.digBand = band(DIGROWS[0], DIGROWS[1], 0xffc080);
      // spoil heaps behind dug cells
      const moundG = new T.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); moundG.scale(2.6, 0.9, 1.3);
      this.mounds = new T.InstancedMesh(moundG, M.earth, COLS * ROWS); this.mounds.userData.dynamic = true; this.mounds.castShadow = this.mounds.receiveShadow = true; this.mounds.frustumCulled = false; this.mounds.count = 0; S.add(this.mounds);
      // watch posts: a pole, a crossbar, a lamp
      this.posts = []; this.postLights = [];
      for (let i = 0; i < 4; i++) { const L = new T.PointLight(0xffa850, 0, 22, 2); S.add(L); this.postLights.push(L); }
      this.postGlow = sprites(w, 4, '#ffb060', true); this.postRing = sprites(w, 4, '#ffd8a0', true);
      const pg = SCAPE.merge([(() => { const g = new T.CylinderGeometry(0.08, 0.11, 4, 6); g.translate(0, 2, 0); return g; })(), (() => { const g = new T.BoxGeometry(1.1, 0.08, 0.08); g.translate(0, 3.6, 0); return g; })(), (() => { const g = new T.CylinderGeometry(0.16, 0.12, 0.3, 8); g.translate(0.45, 3.35, 0); return g; })()]);
      this.postMesh = new T.InstancedMesh(pg, M.wood, 4); this.postMesh.userData.dynamic = true; this.postMesh.count = 0; this.postMesh.castShadow = true; this.postMesh.frustumCulled = false; S.add(this.postMesh);
      this.torchSp = sprites(w, 16, '#ff9840', true); this.torchCore = sprites(w, 16, '#fff0c0', true); this.torches = [];
      this.dust = burstPool(w, 160, '#8a7a68', false); this.sparks = burstPool(w, 140, '#ffd080', true);
      // the white rock that would not break, waiting in the middle of the line
      this.rockCell = { c: 9, r: 5 };
      const rg = new T.IcosahedronGeometry(1, 2); { const p = rg.attributes.position, v = new T.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + SCAPE.fbm(v.x * 2, v.z * 2 + v.y, 3) * 0.35); v.y *= 0.7; p.setXYZ(i, v.x * 1.4, v.y, v.z * 1.1); } rg.computeVertexNormals(); }
      this.rock = new T.Mesh(rg, M.rockW); this.rock.castShadow = this.rock.receiveShadow = true; this.rock.visible = false; this.rock.userData.dynamic = true; S.add(this.rock);
      // the pick in view, for the strikes
      const pick = this.pick = new T.Group(); S.add(w.camera); w.camera.add(pick); pick.visible = false;
      const hd = new T.Mesh(new T.CylinderGeometry(0.03, 0.035, 1.2, 7), M.wood); hd.position.y = -0.1; pick.add(hd);
      const head = new T.Mesh(new T.BoxGeometry(0.5, 0.07, 0.07), new T.MeshStandardMaterial({ color: 0x5a5450, metalness: 0.6, roughness: 0.5 })); head.position.y = 0.5; pick.add(head);
      pick.position.set(0.35, -0.35, -0.7); pick.rotation.set(-0.4, 0, -0.5);
      // the flash of each strike, thrown toward the horizon
      this.flare = KIT.glow(w, 0xffe0a0, 30, 0); this.flare.material.fog = false; S.add(this.flare);

      /* ---------- discoveries: gold lights to click on the plain ---------- */
      this.disc = [];
      const D = (pos, d) => { const it = w.discover(Object.assign({ pos, size: 3.2, color: 0xffd36a }, d)); this.disc.push({ it, pos: new T.Vector3(...pos) }); };
      D([-36, H(-36, 58) + 1.4, 58], { title: 'Salman’s Counsel', text: 'The books of sirah say it was Salman al-Farisi who advised digging a trench, as was done in Persia (Ibn Hisham, “it is said”; al-Waqidi; Ibn Sa‘d).', ar: 'سلمان الفارسي' });
      D([18, H(18, 54) + 1.4, 54], { title: 'Dust on His Belly', text: 'He carried earth until the dust covered the skin of his belly, and they sang verses of ‘Abdullah ibn Rawahah as they dug. (Sahih al-Bukhari 4106)', ar: 'حَتَّى وَارَى عَنِّي التُّرَابُ جِلْدَةَ بَطْنِهِ' });
      D([-58, H(-58, -120) + 2, -120], { title: 'The Confederates', text: 'In the year 5 AH (627 CE) the confederate tribes came against Madinah; the sirah gives their number as about ten thousand, a figure modern historians think high. (Ibn Ishaq; Ibn Sa‘d; Ibn Hajar)', ar: 'الأحزاب' });
      D([62, H(62, 30) + 1.6, 30], { title: 'Forty Cubits', text: 'Tradition says forty cubits of the trench were given to every ten men to dig (al-Tabarani; its chain is weak).', ar: 'أربعون ذراعًا' });
      D([-52, H(-52, 74) + 1.4, 74], { title: 'Hunger', text: 'Jabir said: they had not eaten for three days, and a stone was tied to the Prophet’s belly against the hunger, when the rock appeared. (Sahih al-Bukhari 4101)', ar: 'وَبَطْنُهُ مَعْصُوبٌ بِحَجَرٍ' });

      /* ---------- state ---------- */
      this.G = { on: false, wave: 0, stage: 'build', tool: 'dig', dig: WAVES[0].dig, post: WAVES[0].posts, spawnT: 0, spawned: 0, rockN: 0, cam: new T.Vector3(0, 0, 4), zoom: 1 };
      this.flow();
      // the film ends where the board's camera begins
      const cp = this.boardCam();
      w.pos.set(cp.p.x, 0, cp.p.z); w.eye = cp.p.y - w.ground(cp.p.x, cp.p.z); const dl = cp.l.clone().sub(cp.p); w.yaw = Math.atan2(-dl.x, -dl.z); w.pitch = Math.asin(dl.y / dl.length());

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 500, q: 0.5, gain: 0.07 });
      SND.lfo(b, this.wind.filter && this.wind.filter.frequency, 0.08, 220);
      this.fireN = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 900, gain: 0.02 });
      this.clk = { gust: 3, crack: 1, hoof: 0, chant: 8 };
      this.post = w.post({ bloom: 0.75, threshold: 0.62, vignette: 0.42, grain: 0.03, sat: 0.92, contrast: 1.05, lift: [0.01, 0.01, 0.035], gain: [1.0, 0.97, 1.02], rays: { strength: 0.3, dir: [-1, 0.08, 0.25] } });
      w.tick(dt => this.world(env, dt));
    },

    /* the board: a fine ground mesh whose vertices sink where trench cells are dug */
    buildBoard(w, mat) {
      const nx = 4 * 30 + 1, nz = 4 * 22 + 1, xs = -63, zs = -45, st = 126 / (nx - 1), stz = 90 / (nz - 1);
      const P = new Float32Array(nx * nz * 3), UV = new Float32Array(nx * nz * 2), C = new Float32Array(nx * nz * 3), R = new Float32Array(nx * nz), idx = [];
      const base = new Float32Array(nx * nz);
      const col = U.hex('#a89880').map(v => Math.pow(v / 255, 2.2));
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i, x = xs + i * st, z = zs + j * stz, edge = i === 0 || j === 0 || i === nx - 1 || j === nz - 1, y = H(x, z) - (edge ? 1.5 : 0);
        P.set([x, y, z], k * 3); UV.set([x * 0.2, z * 0.2], k * 2); base[k] = y;
        const m = 0.85 + 0.15 * (SCAPE.fbm(x * 0.03, z * 0.03, 3) + 0.5); C.set([col[0] * m, col[1] * m, col[2] * m], k * 3);
      }
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('uv', new T.BufferAttribute(UV, 2)); g.setAttribute('color', new T.BufferAttribute(C, 3)); g.setAttribute('rockiness', new T.BufferAttribute(R, 1)); g.setIndex(idx); g.computeVertexNormals();
      const m = new T.Mesh(g, mat); m.receiveShadow = true; w.scene.add(m);
      this.board = { g, nx, nz, xs, zs, st, stz, base, depth: new Float32Array(nx * nz), want: new Float32Array(nx * nz), col0: C.slice() };
    },
    boardY(x, z) {
      const B = this.board; const fi = (x - B.xs) / B.st, fj = (z - B.zs) / B.stz;
      if (fi < 0 || fj < 0 || fi >= B.nx - 1 || fj >= B.nz - 1) return H(x, z);
      const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, P = B.g.attributes.position.array, y = k => P[k * 3 + 1];
      const a = y(j * B.nx + i), b = y(j * B.nx + i + 1), c = y((j + 1) * B.nx + i), d = y((j + 1) * B.nx + i + 1);
      return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
    },
    // recompute the wanted depth of every board vertex from the dug cells (joined cells form one trench)
    reshape() {
      const B = this.board, W = B.want; W.fill(0);
      this.grid.forEach((v, k) => {
        if (v !== 'trench') return; const [c, r] = k.split(',').map(Number);
        const x0 = X0 + c * CELL, z0 = Z0 + r * CELL, open = (dc, dr) => this.grid.get(key(c + dc, r + dr)) === 'trench';
        const iA = Math.max(0, Math.floor((x0 - 1.5 - B.xs) / B.st)), iB = Math.min(B.nx - 1, Math.ceil((x0 + CELL + 1.5 - B.xs) / B.st));
        const jA = Math.max(0, Math.floor((z0 - 1.5 - B.zs) / B.stz)), jB = Math.min(B.nz - 1, Math.ceil((z0 + CELL + 1.5 - B.zs) / B.stz));
        for (let j = jA; j <= jB; j++) for (let i = iA; i <= iB; i++) {
          const x = B.xs + i * B.st, z = B.zs + j * B.stz;
          // inset from the cell's edges unless the neighbour is dug too, so joined cells make one long cut
          const ix = x < x0 + CELL / 2 ? (open(-1, 0) ? 99 : x - x0) : (open(1, 0) ? 99 : x0 + CELL - x);
          const iz = z < z0 + CELL / 2 ? (open(0, -1) ? 99 : z - z0) : (open(0, 1) ? 99 : z0 + CELL - z);
          const inside = Math.min(ix, iz) + 0.2;
          const d = 2.6 * U.smooth(0.2, 1.4, inside);
          const k2 = j * B.nx + i; if (d > W[k2]) W[k2] = d;
        }
      });
    },
    // the walkers' distance to the south edge, round whatever is dug, posted or rocky
    flow() {
      const D = this.dist = new Map(), q = [];
      const pass = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !this.grid.get(key(c, r));
      for (let c = 0; c < COLS; c++) if (pass(c, ROWS - 1)) { D.set(key(c, ROWS - 1), 0); q.push([c, ROWS - 1]); }
      while (q.length) { const [c, r] = q.shift(), d = D.get(key(c, r)); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const n = key(c + a, r + b); if (pass(c + a, r + b) && !D.has(n)) { D.set(n, d + 1); q.push([c + a, r + b]); } }); }
      this.sealed = ![...Array(COLS).keys()].some(c => D.has(key(c, 0)));
    },

    /* ---------- the board camera (Kingdom Rush view) ---------- */
    boardCam() { const G = this.G, c = G ? G.cam : new T.Vector3(0, 0, 4), z = G ? G.zoom : 1; return { p: new T.Vector3(c.x, 72 * z, c.z + 50 * z), l: new T.Vector3(c.x, 0, c.z - 4) }; },

    film(env, w) {
      const self = this;
      const Hh = (x, z, h) => [x, H(x, z) + h, z];
      return [
        { dur: 7, fade: 'dip', title: true, fov: [48, 42], path: [[[-240, 120, 300], [0, 10, -120]], [[-170, 90, 220], [0, 6, -160]]], start: () => { self.firesK = 0; } },
        { dur: 7, fade: 'dip', fov: [36, 30], line: 'In 5 AH the confederate tribes come against Madinah, some ten thousand by the sirah’s count.', ar: 'في السنة الخامسة تأتي الأحزاب إلى المدينة',
          path: [[Hh(-20, -40, 4), Hh(0, -500, 10)], [Hh(-10, -70, 5), Hh(20, -600, 12)]], during: (w, k) => { self.firesK = k; } },
        { dur: 6, fade: 'dip', fov: [44, 40], line: 'The sirah says Salman al-Farisi advised a trench across the open plain.', ar: 'وأشار سلمان الفارسي بحفر الخندق',
          path: [[Hh(-40, 30, 9), Hh(0, -10, 0)], [Hh(-10, 34, 6), Hh(10, -14, 0)]], start: () => { self.firesK = 1; } },
        { dur: 7, fade: 'dip', fov: [42, 38], line: 'He carried earth until the dust covered his belly (Sahih al-Bukhari 4106).', ar: 'ينقل التراب حتى وارى التراب جلدة بطنه',
          path: [[Hh(-30, 44, 2.2), Hh(-12, 52, 0.8)], [Hh(-18, 42, 1.8), Hh(4, 54, 0.8)]],
          start: () => { [0, 1.2, 2.4].forEach(d => SND.sing(env.bus, [196, 220, 196][d / 1.2], { vowel: 'a', dur: 1.1, gain: 0.03, delay: d, voices: 4 })); } },
        { dur: 7, fade: 'dip', fov: [44, 50], line: 'Dig the line before the riders’ torches come.', ar: 'احفر الخط قبل أن تأتي مشاعل الفرسان',
          path: [[Hh(0, 30, 3), Hh(0, -30, 0)], [Hh(0, 70, 40), Hh(0, -10, 0)]] },
      ];
    },
    filmOpts: { end(w) { const self = ENGINE.cur && ENGINE.cur.w === w ? ENGINE.cur : null; if (self) { self.firesK = 1; self.start(); } } },

    start() {
      const w = this.w, G = this.G; G.on = true;
      w.mode = dt => this.play(dt);
      w.onPointer = (e, p, ph) => this.pointer(e, ph);
      w.activity('The Trench', 4, '');
      this.ui(); this.setStage('build');
    },
    ui() {
      const w = this.w, L = w.ui.layer, bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);display:flex;gap:10px;pointer-events:auto;z-index:5;font-family:var(--f-display);letter-spacing:.08em';
      const mk = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'trench-btn'; b.textContent = t; b.style.cssText = 'padding:10px 16px;border-radius:999px;border:1px solid rgba(246,220,154,.45);background:rgba(6,9,20,.55);color:#f2e6cc;font-size:13px;text-transform:uppercase;cursor:pointer'; b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); f(); }); bar.appendChild(b); return b; };
      this.btnDig = mk('Dig', () => this.setTool('dig')); this.btnPost = mk('Lamp-watch', () => this.setTool('post')); this.btnGo = mk('Let them come', () => this.go());
      L.appendChild(bar); this.bar = bar; this.setTool('dig');
    },
    setTool(t) { const G = this.G; G.tool = t; if (this.btnDig) { this.btnDig.style.background = t === 'dig' ? 'rgba(200,150,80,.5)' : 'rgba(6,9,20,.55)'; this.btnPost.style.background = t === 'post' ? 'rgba(200,150,80,.5)' : 'rgba(6,9,20,.55)'; } this.status(); },
    status() {
      const G = this.G, w = this.w; if (!G.on) return;
      const T3 = [`Wave 1 of 3 · Dig before dark`, `Wave 2 of 3 · More riders`, `Wave 3 of 3 · Close the line`, 'The rock that would not break'];
      const el = w.ui.layer.querySelector('.wq-title'); if (el) el.textContent = T3[Math.min(3, G.wave)];
      if (G.stage === 'build') w.step(`Earth to move: ${G.dig} cells · lamp-watches: ${G.post}. ${G.wave === 0 ? 'Dig where the plain is open; torches will go round what you dig.' : G.wave === 2 ? 'Close the trench from lava field to lava field, and they will halt at its edge.' : 'Lamp-watch light makes riders hesitate and turn back.'} Then press Space or “Let them come”.`);
      else if (G.stage === 'wave') w.step(`The torches are coming. You can still dig (${G.dig}) and set watches (${G.post}).`);
    },
    setStage(s) {
      const G = this.G, w = this.w; G.stage = s;
      this.gridLines.visible = this.digBand.visible = s === 'build' || s === 'wave';
      if (this.btnGo) this.btnGo.style.display = s === 'build' ? '' : 'none';
      if (this.bar) this.bar.style.display = s === 'build' || s === 'wave' ? 'flex' : 'none';
      w.progress(Math.min(G.wave, 3) + (s === 'wave' ? 0.5 : 0)); this.status();
    },
    go() {
      const G = this.G; if (G.stage !== 'build') return;
      G.spawnT = 0.5; G.spawned = 0; this.setStage('wave');
      SND.swell(this.w.env.bus, { f0: 120, f1: 400, dur: 3, gain: 0.06 });
    },

    /* ---------- input ---------- */
    onKey(env, e) {
      const w = this.w, G = this.G; if (!w || !G || !G.on || w.filmS || e.repeat) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === '1') this.setTool('dig'); else if (k === '2') this.setTool('post');
      else if (k === ' ' || k === 'Enter') { if (G.stage === 'build') this.go(); else if (G.stage === 'rock') this.strike(); }
    },
    cellAt(e) {
      const w = this.w, ndc = new T.Vector2(e.clientX / w.env.w * 2 - 1, -e.clientY / w.env.h * 2 + 1), ray = new T.Raycaster(); ray.setFromCamera(ndc, w.camera);
      const t = (0.6 - ray.ray.origin.y) / ray.ray.direction.y; if (!(t > 0)) return null;
      const x = ray.ray.origin.x + ray.ray.direction.x * t, z = ray.ray.origin.z + ray.ray.direction.z * t;
      const c = Math.floor((x - X0) / CELL), r = Math.floor((z - Z0) / CELL);
      return { c, r, x, z, in: c >= 0 && c < COLS && r >= 0 && r < ROWS, ray: ray.ray };
    },
    pointer(e, ph) {
      const G = this.G, w = this.w; if (!G.on) return false;
      if (G.stage === 'rock') { if (ph === 'down') this.strike(); return true; }
      if (ph === 'down') { this.drag = { x: e.clientX, y: e.clientY, cx: G.cam.x, cz: G.cam.z, id: e.pointerId, moved: false }; return true; }
      if (ph === 'up' && this.drag) {
        const d = this.drag; this.drag = null;
        if (!d.moved) this.click(e);
      }
      return true;
    },
    click(e) {
      const G = this.G, w = this.w, b = w.env.bus, h = this.cellAt(e);
      // a discovery light?
      if (h) { const o = h.ray.origin, dv = h.ray.direction; for (const D of this.disc) { if (D.it.done) continue; const px = D.pos.x - o.x, py = D.pos.y - o.y, pz = D.pos.z - o.z, t = px * dv.x + py * dv.y + pz * dv.z, dd = Math.hypot(px - dv.x * t, py - dv.y * t, pz - dv.z * t); if (t > 0 && dd < 3 + t * 0.01) { D.it.done = true; D.it.onUse(w, D.it); return; } } }
      if (!h || !h.in || (G.stage !== 'build' && G.stage !== 'wave')) return;
      const k = key(h.c, h.r), v = this.grid.get(k);
      const occupied = this.torches.some(t => t.state === 'path' && Math.abs(t.x - cx(h.c)) < CELL * 0.8 && Math.abs(t.z - cz(h.r)) < CELL * 0.8);
      if (v === 'rock') { SND.knock(b, { f: 160, gain: 0.08, click: 2400 }); return; }
      if (v === 'trench') { if (occupied) return; this.grid.set(k, ''); G.dig++; this.reshape(); this.flow(); this.heap(); SND.step(b, { gain: 0.1, f: 300 }); this.status(); return; }
      if (v === 'post') { this.grid.set(k, ''); G.post++; this.setPosts(); this.flow(); this.status(); return; }
      if (occupied) { SND.swell(b, { f0: 300, f1: 200, dur: 0.3, gain: 0.02 }); return; }
      if (G.tool === 'dig') {
        if (h.r < DIGROWS[0] || h.r > DIGROWS[1] || G.dig <= 0) { SND.swell(b, { f0: 300, f1: 200, dur: 0.4, gain: 0.03 }); this.say(G.dig <= 0 ? 'No more earth can be moved before this wave.' : 'Dig in the band across the middle of the plain.'); return; }
        this.grid.set(k, 'trench'); G.dig--; this.reshape(); this.flow(); this.heap();
        SND.step(b, { gain: 0.14, f: 260 }); SND.knock(b, { f: 90, gain: 0.08, click: 700 }); SND.sing(b, [196, 220, 246.94, 261.63][(G.dig + 4) % 4], { vowel: 'a', dur: 0.7, gain: 0.012, voices: 3 });
        for (let i = 0; i < 14; i++) this.dust.emit(cx(h.c) + (Math.random() - 0.5) * 5, 0.8, cz(h.r) + (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2 + 1, 1.4, 2.2, 0.5);
        if (this.sealed && !this.saidSeal) { this.saidSeal = true; this.say('The line is closed from lava field to lava field. Riders will find no way across.'); SND.glow(b, 196, { gain: 0.05, dur: 5 }); }
      } else {
        if (h.r < POSTROWS[0] || h.r > POSTROWS[1] || G.post <= 0) { SND.swell(b, { f0: 300, f1: 200, dur: 0.4, gain: 0.03 }); this.say(G.post <= 0 ? 'No lamp-watch is left for this wave.' : 'Set lamp-watches on your side of the trench.'); return; }
        this.grid.set(k, 'post'); G.post--; this.setPosts(); this.flow();
        SND.knock(b, { f: 200, gain: 0.1, click: 1200 }); SND.sing(b, 293.66, { vowel: 'o', dur: 1, gain: 0.02 });
      }
      this.status();
    },
    say(t) { this.w.say('', t, { ms: 3500 }); },
    heap() {
      const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), s = new T.Vector3(1, 1, 1); let n = 0;
      this.grid.forEach((val, k) => { if (val !== 'trench') return; const [c, r] = k.split(',').map(Number); if (this.grid.get(key(c, r + 1)) === 'trench') return; v.set(cx(c), H(cx(c), cz(r) + CELL * 0.62) - 0.2, cz(r) + CELL * 0.62); q.setFromAxisAngle(new T.Vector3(0, 1, 0), (c * 7 % 5) * 0.08); m4.compose(v, q, s.set(1, 0.8 + (c % 3) * 0.12, 1)); this.mounds.setMatrixAt(n++, m4); });
      this.mounds.count = n; this.mounds.instanceMatrix.needsUpdate = true;
    },
    setPosts() {
      const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(1, 1, 1); this.posts = [];
      this.grid.forEach((val, k) => { if (val === 'post') { const [c, r] = k.split(',').map(Number); this.posts.push({ x: cx(c), z: cz(r), y: H(cx(c), cz(r)) }); } });
      this.posts.forEach((p, i) => { m4.compose(new T.Vector3(p.x, p.y, p.z), q, s); this.postMesh.setMatrixAt(i, m4); });
      this.postMesh.count = this.posts.length; this.postMesh.instanceMatrix.needsUpdate = true;
    },

    /* ---------- the waves ---------- */
    spawn() {
      const G = this.G, W = WAVES[G.wave], c = W.cols[G.spawned % W.cols.length];
      this.torches.push({ x: cx(c) + (Math.random() - 0.5) * 30, z: Z0 - 120 - Math.random() * 40, tx: cx(c), tz: cz(0), state: 'come', c, r: -1, exp: 0, t: 0, ph: Math.random() * 6, a: 0 });
      G.spawned++;
    },
    stepTorch(o, dt) {
      const G = this.G, b = this.w.env.bus;
      o.t += dt;
      let lit = 0; for (const p of this.posts) { const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < CELL * 2.3) lit = Math.max(lit, 1 - d / (CELL * 2.3)); }
      const sp = 3.4 * (lit > 0 ? 0.45 : 1);
      if (o.state === 'path' && lit > 0) { o.exp += dt * (0.5 + lit); if (o.exp > 2.4) { o.state = 'back'; SND.swell(b, { f0: 400, f1: 200, dur: 1.2, gain: 0.03 }); } }
      const toward = (tx, tz) => { const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz); if (d < 1e-3) return true; const st = Math.min(d, sp * dt); o.x += dx / d * st; o.z += dz / d * st; return d < 0.15; };
      if (o.state === 'come') { o.a = Math.min(1, o.a + dt * 0.5); if (toward(o.tx, o.tz)) { o.state = 'path'; o.r = 0; } return; }
      if (o.state === 'path') {
        if (toward(cx(o.c), cz(o.r))) {
          if (o.r >= ROWS - 1) { o.state = 'through'; return; }
          const here = this.dist.get(key(o.c, o.r));
          if (here == null) {
            // no way through: go on south until the trench's edge, then halt
            const nk = key(o.c, o.r + 1), nv = this.grid.get(nk);
            if (nv) { o.state = 'halt'; o.ht = 0; SND.sing(b, 146.83, { vowel: 'u', dur: 1.2, gain: 0.015 }); return; }
            o.r++; return;
          }
          let best = null; [[0, 1], [-1, 0], [1, 0], [0, -1]].forEach(([a, bb]) => { const d = this.dist.get(key(o.c + a, o.r + bb)); if (d != null && d < here && (!best || d < best.d)) best = { c: o.c + a, r: o.r + bb, d }; });
          if (best) { o.c = best.c; o.r = best.r; }
        }
        return;
      }
      if (o.state === 'halt') { o.ht += dt; if (o.ht > 1.6) o.state = 'back'; return; }
      if (o.state === 'through') {
        // slipped past: one lamp of the camp dims, and the rider turns back all the same
        const i = this.lampDim.findIndex(v => v === 0); if (i >= 0) this.lampDim[i] = 1;
        SND.swell(b, { f0: 300, f1: 160, dur: 1.4, gain: 0.04 }); o.state = 'back';
        return;
      }
      if (o.state === 'back') { o.z -= 3.2 * dt; o.a = Math.max(0, o.a - dt * 0.18); if (o.z < Z0 - 140 || o.a <= 0) o.state = 'gone'; }
    },

    /* ---------- the rock ---------- */
    toRock() {
      const G = this.G, w = this.w; G.stage = 'rock'; G.rockN = 0; G.meter = 0;
      // the rest of the line is finished by the many hands of the camp
      for (let c = 0; c < COLS; c++) { const k = key(c, 5); if (!this.grid.get(k)) this.grid.set(k, 'trench'); }
      this.reshape(); this.heap();
      const x = cx(this.rockCell.c), z = cz(this.rockCell.r);
      this.rock.position.set(x, H(x, z) - 2.2, z); this.rock.visible = true; this.rock.scale.setScalar(1.1);
      this.setStage('rock'); this.pick.visible = true;
      w.ui.layer.querySelector('.wq-title').textContent = 'The rock that would not break';
      w.step('Watch the swing. Strike (Space or click) as the light reaches its peak.');
      w.say('The Rock', 'Jabir said: while they were digging, they came upon a great hard rock. They went to the Prophet, and he came down into the trench. (Sahih al-Bukhari 4101)', { ar: 'عَرَضَتْ كُدْيَةٌ شَدِيدَةٌ', ms: 9000 });
      this.meterEl = document.createElement('div');
      this.meterEl.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 30px);transform:translateX(-50%);width:min(420px,80vw);height:14px;border-radius:8px;background:rgba(6,9,20,.55);border:1px solid rgba(246,220,154,.4);pointer-events:none;z-index:5';
      this.meterEl.innerHTML = '<i style="position:absolute;left:44%;width:12%;top:0;bottom:0;background:rgba(255,200,110,.45);border-radius:6px"></i><b style="position:absolute;top:-4px;width:6px;height:22px;margin-left:-3px;border-radius:3px;background:#fff2d0;box-shadow:0 0 10px #ffd890"></b>';
      w.ui.layer.appendChild(this.meterEl);
    },
    strike() {
      const G = this.G, w = this.w, b = w.env.bus; if (G.stage !== 'rock' || G.cool > 0 || G.rockN >= 3) return;
      G.cool = 0.9; G.swing = 1;
      const m = 0.5 + 0.5 * Math.sin(G.meter), good = Math.abs(m - 0.5) < 0.085 + (G.miss || 0) * 0.02;
      const x = this.rock.position.x, y = this.rock.position.y + 1, z = this.rock.position.z;
      if (!good) {
        G.miss = (G.miss || 0) + 1; SND.knock(b, { f: 300, gain: 0.12, click: 4200 }); SND.bellTone ? SND.bellTone(b, 1800, { gain: 0.01, dur: 0.6 }) : 0;
        for (let i = 0; i < 6; i++) this.sparks.emit(x, y, z, (Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3, 0.5, 0.4, 1);
        return;
      }
      G.rockN++; G.miss = 0;
      SND.knock(b, { f: 90, gain: 0.3, click: 2600 }); SND.thump(b, { gain: 0.2, f: 50, dur: 1 });
      SND.glow(b, [196, 246.94, 293.66][G.rockN - 1], { gain: 0.07, dur: 6, vowel: 'a' });
      for (let i = 0; i < 40; i++) this.sparks.emit(x, y, z, (Math.random() - 0.5) * 8, 2 + Math.random() * 6, (Math.random() - 0.5) * 8, 1.4, 0.7, 1);
      this.flareT = 1; this.flareDir = [new T.Vector3(-0.5, 0.15, -1), new T.Vector3(0.6, 0.15, -1), new T.Vector3(0.1, 0.12, 1)][G.rockN - 1].normalize();
      this.rock.scale.setScalar(1.1 - G.rockN * 0.12);
      if (G.rockN < 3) w.say(G.rockN === 1 ? 'The First Strike' : 'The Second Strike', 'A report says he struck the rock three times, and with each strike a light flashed and he spoke of lands that would be opened. (Sunan al-Nasa’i 3176, graded hasan)', { ms: 7000 });
      else {
        for (let i = 0; i < 60; i++) this.dust.emit(x + (Math.random() - 0.5) * 3, y, z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 2.4, 2.6, 0.6);
        this.rock.visible = false; this.lampDim = this.lampDim.map(() => 0);
        w.say('Like Sand', 'He took the spade and struck the great rock, and it became like loose sand. (Sahih al-Bukhari 4101)', { ar: 'فَعَادَ كَثِيبًا أَهْيَلَ', ms: 10000 });
        setTimeout(() => this.wrap(), 4500);
      }
    },
    wrap() {
      const w = this.w, G = this.G; if (G.done) return; G.done = 1;
      w.finish('The line holds');
      if (this.meterEl) this.meterEl.remove();
      setTimeout(() => {
        if (this.w !== w) return;
        G.on = false; w.mode = null; w.onPointer = null; this.pick.visible = false; if (this.bar) this.bar.remove();
        w.pos.set(cx(this.rockCell.c) + 4, 0, cz(this.rockCell.r) + 9); w.y = w.ground(w.pos.x, w.pos.z); w.eye = 1.62; w.yaw = 0; w.pitch = -0.15;
        w.camera.fov = 50; w.camera.updateProjectionMatrix();
        w.env.hint('WASD to walk along the finished trench');
      }, 5500);
    },

    /* ---------- the frame ---------- */
    play(dt) {
      const w = this.w, G = this.G, cam = w.camera, b = w.env.bus, k = w.keys;
      dt = Math.min(dt, 0.06); G.cool = Math.max(0, (G.cool || 0) - dt);
      // pan the view: keys, or drag
      if (G.stage !== 'rock') {
        const pv = 40 * dt; if (k.has('a') || k.has('ArrowLeft')) G.cam.x -= pv; if (k.has('d') || k.has('ArrowRight')) G.cam.x += pv; if (k.has('w') || k.has('ArrowUp')) G.cam.z -= pv; if (k.has('s') || k.has('ArrowDown')) G.cam.z += pv;
        if (this.drag && w.env.pointer) { const P = w.env.pointer, dx = (P.x - this.drag.x), dz = (P.y - this.drag.y); if (Math.hypot(dx, dz) > 8) this.drag.moved = true; if (this.drag.moved) { G.cam.x = this.drag.cx - dx * 0.15; G.cam.z = this.drag.cz - dz * 0.15; } }
        G.cam.x = U.clamp(G.cam.x, -40, 40); G.cam.z = U.clamp(G.cam.z, -40, 30);
        const c = this.boardCam(); cam.position.lerp(c.p, 1 - Math.exp(-dt * 6)); cam.lookAt(c.l);
        if (cam.fov !== 50) { cam.fov = 50; cam.updateProjectionMatrix(); }
        // hover
        if (w.env.pointer && !this.drag) { const h = this.cellAt({ clientX: w.env.pointer.x, clientY: w.env.pointer.y }); this.hover.visible = !!(h && h.in && !w.layerTouch); if (h && h.in) { this.hover.position.set(cx(h.c), 0.66, cz(h.r)); const v = this.grid.get(key(h.c, h.r)), okR = G.tool === 'dig' ? h.r >= DIGROWS[0] && h.r <= DIGROWS[1] : h.r >= POSTROWS[0] && h.r <= POSTROWS[1]; this.hover.material.color.set(v === 'rock' || !okR ? 0x8090b0 : 0xffd890); } }
      } else {
        // down in the trench, before the rock
        const x = this.rock.position.x, z = this.rock.position.z, y = this.rock.position.y;
        const want = new T.Vector3(x + 0.6, y + 2.0, z + 3.4); cam.position.lerp(want, 1 - Math.exp(-dt * 3)); cam.lookAt(x, y + 0.6, z);
        if (cam.fov !== 60) { cam.fov = 60; cam.updateProjectionMatrix(); }
        G.meter += dt * (2.2 + G.rockN * 0.5); const m = 0.5 + 0.5 * Math.sin(G.meter);
        if (this.meterEl) this.meterEl.querySelector('b').style.left = (m * 100).toFixed(1) + '%';
        G.swing = Math.max(0, (G.swing || 0) - dt * 3);
        this.pick.rotation.set(-0.4 - (1 - G.swing) * 0 + G.swing * 1.2 - Math.sin(G.meter) * 0.25, 0, -0.5);
      }
      w.pos.set(cam.position.x, 0, cam.position.z); w.y = cam.position.y - 1.62;
      // the waves
      if (G.stage === 'wave') {
        const W = WAVES[G.wave];
        G.spawnT -= dt; if (G.spawned < W.torches && G.spawnT <= 0) { this.spawn(); G.spawnT = W.gap * (0.7 + Math.random() * 0.6); }
        this.torches.forEach(o => this.stepTorch(o, dt));
        this.torches = this.torches.filter(o => o.state !== 'gone');
        if (G.spawned >= W.torches && !this.torches.length) {
          G.wave++;
          if (G.wave >= WAVES.length) { this.setStage('done'); setTimeout(() => this.toRock(), 2500); SND.glow(b, 196, { gain: 0.06, dur: 6 }); this.w.say('The Line Holds', 'The riders’ torches have halted at the trench and turned back. Not one blow was struck here.', { ms: 6000 }); }
          else { G.dig += WAVES[G.wave].dig; G.post += WAVES[G.wave].posts; this.setStage('build'); SND.glow(b, [0, 220, 246.94][G.wave], { gain: 0.05, dur: 5 }); }
        }
        this.clk.hoof -= dt;
        if (this.clk.hoof < 0 && this.torches.length) { this.clk.hoof = 0.5; const near = this.torches.reduce((m, o) => Math.min(m, Math.hypot(o.x - G.cam.x, o.z - G.cam.z)), 1e9); const g = 0.12 / (1 + Math.pow(near / 50, 2)); [0, 0.12, 0.25].forEach((d0, k2) => setTimeout(() => SND.knock(b, { f: 75 + k2 * 10, gain: g * (k2 === 2 ? 1.1 : 0.8), click: 650 }), d0 * 1000)); }
      }
      if (w._shadow) { const S2 = w._shadow, px = Math.round(G.cam.x / 3) * 3, pz = Math.round(G.cam.z / 3) * 3; S2.light.target.position.set(px, 0, pz); S2.light.position.set(px + S2.off.x, S2.off.y, pz + S2.off.z); }
    },

    world(env, dt) {
      const w = this.w, t = w.time, b = env.bus, G = this.G;
      if (this.cullList) for (const m of this.cullList) { const S0 = m.geometry.boundingSphere; m.visible = S0.center.distanceTo(w.camera.position) - S0.radius < 900; }
      // the board sinks toward its dug shape
      const B = this.board, P = B.g.attributes.position.array, C = B.g.attributes.color.array; let moved = false;
      for (let i = 0; i < B.depth.length; i++) { const d = B.depth[i], wt = B.want[i]; if (Math.abs(d - wt) > 0.005) { const nd = U.damp(d, wt, 3.5, dt); B.depth[i] = nd; P[i * 3 + 1] = B.base[i] - nd; const k = 1 - U.smooth(0, 2.4, nd) * 0.45; C[i * 3] = B.col0[i * 3] * k; C[i * 3 + 1] = B.col0[i * 3 + 1] * k * 0.97; C[i * 3 + 2] = B.col0[i * 3 + 2] * k * 0.94; moved = true; } }
      if (moved) { B.g.attributes.position.needsUpdate = B.g.attributes.color.needsUpdate = true; this.normT = (this.normT || 0) + dt; if (this.normT > 0.12) { this.normT = 0; B.g.computeVertexNormals(); } }
      // torches
      const ts = this.torchSp, tc = this.torchCore;
      for (let i = 0; i < 16; i++) {
        const o = this.torches[i];
        if (!o) { ts.A[i] = 0; tc.A[i] = 0; continue; }
        const fl = 0.8 + 0.2 * U.noise1(t * 9 + i * 3), bob = Math.abs(Math.sin(t * 5 + o.ph)) * 0.2, y = H(o.x, o.z) + 2.7 + bob;
        const hes = o.state === 'halt' ? 0.6 + 0.4 * Math.sin(t * 12) : 1;
        ts.P.set([o.x, y, o.z], i * 3); ts.S[i] = 3.2; ts.A[i] = o.a * fl * hes * 0.9; tc.P.set([o.x, y, o.z], i * 3); tc.S[i] = 0.8; tc.A[i] = o.a * fl;
        if (Math.random() < dt * 6 && o.a > 0.2) this.dust.emit(o.x, H(o.x, o.z) + 0.3, o.z, (Math.random() - 0.5), 0.4, (Math.random() - 0.5) - 0.3, 1.2, 1.6, 0.25);
      }
      ts.upd(); tc.upd();
      // posts and their light
      const pg = this.postGlow, pr = this.postRing;
      for (let i = 0; i < 4; i++) {
        const p = this.posts[i], L = this.postLights[i];
        if (!p) { L.intensity = 0; pg.A[i] = 0; pr.A[i] = 0; continue; }
        const fl = 0.85 + 0.15 * U.noise1(t * 6 + i);
        L.position.set(p.x + 0.45, p.y + 3.4, p.z); L.intensity = 1.6 * fl;
        pg.P.set([p.x + 0.45, p.y + 3.4, p.z], i * 3); pg.S[i] = 2.4; pg.A[i] = 0.9 * fl;
        pr.P.set([p.x, p.y + 0.4, p.z], i * 3); pr.S[i] = CELL * 4.2; pr.A[i] = (G.stage === 'build' || G.stage === 'wave') ? 0.08 : 0;
      }
      pg.upd(); pr.upd();
      // the camp's lamps (dimmed ones are lit again at the end)
      const cl = this.campLamps; for (let i = 0; i < cl.n; i++) cl.A[i] = (0.85 - this.lampDim[i] * 0.65) * (0.85 + 0.15 * U.noise1(t * 5 + i * 2)); cl.upd();
      // the confederate fires spread across the plain
      const fi = this.fires; for (let i = 0; i < fi.n; i++) fi.A[i] = U.smooth(i / fi.n * 0.9, i / fi.n * 0.9 + 0.1, this.firesK) * (0.55 + 0.25 * U.noise1(t * 3 + i)); fi.upd();
      // the strike's flash, thrown far
      if (this.flareT > 0) { this.flareT = Math.max(0, this.flareT - dt * 0.5); this.flare.position.copy(w.camera.position).addScaledVector(this.flareDir, 900); this.flare.scale.setScalar(300 + (1 - this.flareT) * 300); this.flare.material.opacity = this.flareT * 0.8; if (this.post) this.post.set({ bloom: 0.75 + this.flareT * 0.8 }); }
      this.dust.step(dt, 1.2, 0.2); this.sparks.step(dt, 1.4, 6);
      // sound: wind of the plain, fire, a sung digging chant now and then
      this.clk.gust -= dt; if (this.clk.gust < 0) { this.clk.gust = 4 + Math.random() * 6; SND.swell(b, { f0: 300, f1: 1300, dur: 3.5, gain: 0.05, pan: U.rnd(-1, 1) }); }
      this.clk.crack -= dt; if (this.clk.crack < 0) { this.clk.crack = 0.3 + Math.random() * 1.2; SND.drop(b, { f: U.rnd(1800, 3000), gain: 0.008, dur: 0.05 }); }
      this.clk.chant -= dt; if (this.clk.chant < 0 && G.stage === 'build') { this.clk.chant = 14 + Math.random() * 10; [0, 0.7, 1.4, 2.1].forEach((d, i) => SND.sing(b, [196, 220, 196, 174.61][i], { vowel: 'a', dur: 0.8, gain: 0.014, delay: d, voices: 4, pan: -0.4 })); }
    },

    update(env, dt) { const w = this.w; if (!w) return; w.update(Math.min(dt, 0.1)); },
    onLeave() { this.bar = null; this.meterEl = null; },
  }));
})();
