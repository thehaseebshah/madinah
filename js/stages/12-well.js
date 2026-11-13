/* Madinah — The Well of Rumah, about 2 AH.
   Genre: flow puzzle (Pipe Mania, water routing). A sweet-water well in the al-‘Aqiq area: palm
   gardens to the north, pasture and troughs to the east, the edge of the town to the south, the sandy
   bed of the wadi to the west. The bucket rises; while it rises you lay and turn stone channel pieces
   on the ground; then the water runs, piece by piece, and must reach the gardens, troughs and town
   before it spills into the sand. A spill is only a wet patch: the bucket is drawn again and the water
   tries once more. Three networks, each harder; then the well is given freely to all and every
   channel runs at once.
   Feeling: generosity. Colour script: noon sand and palm green; water blue-silver; gold for the
   piece in hand. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- the three networks (local grids, row 0 nearest the well) ---------------- */
  const CS = 2.2, D0 = 3.6;            // cell size; first row's distance from the well's centre
  const N = 1, E = 2, S = 4, W = 8;
  const DIRS = [[N, 0, 1], [E, 1, 0], [S, 0, -1], [W, -1, 0]];   // mask, di, dj
  const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
  const rot = m => ((m << 1) | (m >> 3)) & 15;
  const PIECES = { straight: 5, bend: 3, tee: 7, cross: 15 };
  const LEVELS = [
    { name: 'The first garden', ang: 0, nx: 5, nz: 5, src: 2, cd: 22, speed: 2.3, palette: true,
      targets: [{ i: 3, j: 4, d: N, kind: 'garden' }], rocks: [[2, 2], [1, 3], [4, 1]], fixed: [],
      title: 'Part 1 of 3 · The first garden', step: 'While the bucket rises, lay channels from the well to the garden · click to lay, R to turn' },
    { name: 'Garden and trough', ang: -Math.PI / 2, nx: 6, nz: 6, src: 2, cd: 18, speed: 1.7, palette: false,
      targets: [{ i: 0, j: 3, d: W, kind: 'trough' }, { i: 4, j: 5, d: N, kind: 'garden' }], rocks: [[2, 3], [3, 2], [5, 1], [1, 1]], fixed: [],
      title: 'Part 2 of 3 · Garden and trough', step: 'The pieces now come in turn. Branch the water to the trough and the garden' },
    { name: 'To the town', ang: Math.PI, nx: 7, nz: 6, src: 3, cd: 18, speed: 1.3, palette: false,
      targets: [{ i: 1, j: 5, d: N, kind: 'cistern' }, { i: 6, j: 2, d: E, kind: 'trough' }, { i: 5, j: 5, d: N, kind: 'garden' }], rocks: [[2, 2], [4, 3], [0, 2], [6, 4], [3, 4]],
      fixed: [[3, 0, PIECES.straight], [3, 1, PIECES.tee]],
      title: 'Part 3 of 3 · To the town', step: 'Three to reach, and the old channels cannot be moved. Close every open end' },
  ];

  /* ---------------- ground ---------------- */
  function H(x, z) {
    const r = Math.hypot(x, z);
    let y = (SCAPE.fbm(x * 0.008, z * 0.008 + 6, 3) * 2.4 + SCAPE.fbm(x * 0.05, z * 0.05, 2) * 0.3) * U.smooth(22, 60, r);
    y += SCAPE.fbm(x * 0.4, z * 0.4, 2) * 0.03;
    // the bed of al-'Aqiq to the west
    const wx = x + 70 + Math.sin(z * 0.012) * 18; y -= 2.6 * Math.exp(-wx * wx / (2 * 18 * 18));
    // the harrah to the east and the far ring
    y += U.smooth(110, 220, x) * (4 + 8 * SCAPE.ridge(x * 0.02, z * 0.02, 3));
    y += U.smooth(420, 720, r) * (30 + 110 * SCAPE.ridge(x * 0.004 + 2, z * 0.004, 4));
    return y;
  }

  function cellLocal(L, i, j) { return { x: (i - (L.nx - 1) / 2) * CS, z: -(D0 + CS / 2 + j * CS) }; }
  function toWorld(L, x, z) { const c = Math.cos(L.ang), s = Math.sin(L.ang); return { x: x * c + z * s, z: -x * s + z * c }; }
  function cellWorld(L, i, j) { const l = cellLocal(L, i, j); return toWorld(L, l.x, l.z); }
  // a mask's connector in local terms, turned into a world-space yaw for meshes
  const maskRot = (base, m) => { for (let r = 0; r < 4; r++) { if (m === base) return r; base = rot(base); } return -1; };
  const typeOf = m => { const c = [N, E, S, W].filter(d => m & d).length; if (c === 4) return 'cross'; if (c === 3) return 'tee'; if (m === 5 || m === 10) return 'straight'; return 'bend'; };

  /* ---------------- channel geometry: stone walls round a bed, with the arms that are open ---------------- */
  function channelGeo(mask, part) {
    // a 5 x 5 sub-grid of the cell: the channel runs through the middle strip of each open arm
    const sub = CS / 5, list = [], open = new Set(['2,2']);
    if (mask & N) { open.add('2,3'); open.add('2,4'); } if (mask & S) { open.add('2,1'); open.add('2,0'); }
    if (mask & E) { open.add('3,2'); open.add('4,2'); } if (mask & W) { open.add('1,2'); open.add('0,2'); }
    for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
      const k = a + ',' + b, x = (a - 2) * sub, z = -(b - 2) * sub;
      if (part === 'water') { if (open.has(k)) list.push(new T.BoxGeometry(sub * 1.02, 0.2, sub * 1.02).translate(x, 0.1, z)); continue; }
      if (open.has(k)) { list.push(new T.BoxGeometry(sub, 0.06, sub).translate(x, -0.05, z)); continue; }
      // walls only next to the channel
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => open.has((a + da) + ',' + (b + db)));
      if (near) list.push(new T.BoxGeometry(sub * 0.98, 0.34, sub * 0.98).translate(x, 0.12, z));
    }
    return SCAPE.merge(list);
  }

  ENGINE.register(WORLD.stage({
    key: 'well',
    arabic: 'بِئْرُ رُومَة',
    title: 'The Well of Rumah',
    era: 'al-‘Aqiq, Madinah · the early years after the Hijrah',
    hint: 'While the bucket rises, click cells to lay channel · R or right-click turns the piece · 1–4 choose (first garden) · V to walk',
    hintTouch: 'Tap cells to lay channel · ⟳ turns the piece · reach every garden and trough before the water spills',
    sound: { reverb: 0.3 },
    story: `<p>When the Prophet ﷺ came to Madinah there was no sweet water but the well of Rumah. He asked: <span class="q">“Who will buy the well of Rumah and place his bucket alongside the buckets of the Muslims, for something better than it in Paradise?”</span> ‘Uthman bought it from his own wealth (Jami‘ al-Tirmidhi 3703).</p>
            <p>The well lies in the area of al-‘Aqiq, north-west of the Prophet’s Mosque.</p>`,

    enter(env) {
      const w = this.w = WORLD.create(env, {
        start: { x: 0, z: 8, yaw: 0, pitch: -0.1 }, exposure: 0.8, far: 2600, speed: 3.2, run: 6.4,
        fog: { color: 0xd8ccb8, density: 0.0011 }, bounds: [-150, -150, 150, 150], ground: H,
        surface: (x, z) => (Math.hypot(x, z) < 3 ? 'stone' : 'sand'),
      });
      const S = w.scene, r = U.seeded(3703);
      this.queue = []; this.dipV = 0; this.dipGoal = 0; this.li = -1; this.mode = 'build'; this.hand = { type: 'straight', m: PIECES.straight }; this.nextQ = [];
      this.cells = []; this.watered = new Set(); this.done = false;

      /* ---------- sky: a clear, hot day ---------- */
      w.sky({ top: '#5a88c8', mid: '#e8dcc8', bot: '#d8ccb8', sunDir: [0.5, 0.68, 0.4], sun: '#fff0d8', sunSize: 0.0014, clouds: 0.15, haze: 0.35 });
      this.sun = new T.DirectionalLight(0xfff0dc, 2.0); this.sun.position.set(50, 68, 40); S.add(this.sun);
      S.add(new T.HemisphereLight(0xc8d8f0, 0x9a7a5a, PHOTO.enabled ? 0.06 : 0.6));
      w.followShadow(this.sun, 36, 2048);
      PHOTO.sky(w, 'kloofendal_43d_clear_puresky', { sun: this.sun, intensity: 0.7, rotation: 0.67 - 0.629, haze: '#d8ccb8', horizon: 0.4, ground: '#b89a78', bounce: 0.5 });

      /* ---------- the land ---------- */
      SCAPE.terrain(w, { size: 1600, seg: 300, height: H, rock: [0.82, 0.94], rockHeight: [5, 16], colors: { low: '#ccb08a', high: '#b89a74', rock: '#4a3e3a', dark: '#2a2422' },
        tex: 'dune', rockTex: 'lava', photo: { ground: 'dense_sand', rock: 'dark_rock', normal: 1 }, rep: 0.22, rockRep: 0.06 });
      SCAPE.horizon(w, { haze: '#d8ccb8', layers: [{ r: 1000, h: 80, color: '#6e5e54', seed: 6 }, { r: 1450, h: 120, color: '#948478', seed: 10 }, { r: 2050, h: 150, color: '#b6aaa0', seed: 14 }] });
      const inGrid = (x, z, pad) => LEVELS.some(L => { const c = Math.cos(-L.ang), s = Math.sin(-L.ang), lx = x * c + z * s, lz = -x * s + z * c; return Math.abs(lx) < L.nx * CS / 2 + (pad || 3) && lz < 0 && lz > -(D0 + L.nz * CS + (pad || 3) + 5); }) || Math.hypot(x, z) < 6 + (pad || 0);
      const wadi = (x, z) => Math.abs(x + 70 + Math.sin(z * 0.012) * 18) < 26;
      SCAPE.scatter(w, { kind: 'palm', n: 280, area: [-200, -220, 200, 60], scale: [7, 13], density: (x, z) => (z < -10 ? 1 : 0.3) * U.smooth(-0.3, 0.2, SCAPE.fbm(x * 0.012 + 9, z * 0.012, 2)) * (wadi(x, z) ? 0.15 : 1), avoid: (x, z) => inGrid(x, z, 5), seed: 81, collide: 0.03 });
      SCAPE.scatter(w, { kind: 'palm', n: 240, area: [-650, -650, 650, 650], scale: [8, 13], density: (x, z) => U.smooth(210, 250, Math.hypot(x, z)) * (1 - U.smooth(380, 460, Math.hypot(x, z))), seed: 82, castShadow: false });
      SCAPE.scatter(w, { kind: 'acacia', n: 40, area: [-140, -150, -10, 150], scale: [0.9, 1.5], density: (x, z) => (wadi(x, z) ? 1 : 0.1), avoid: (x, z) => inGrid(x, z, 6), seed: 83, collide: true });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 50, area: [60, -150, 150, 150], scale: [0.8, 2.4], avoid: (x, z) => inGrid(x, z, 6), seed: 84, collide: 0.4 });
      SCAPE.scatter(w, { kind: 'boulder', tex: 'lava', n: 300, area: [80, -600, 700, 600], density: (x, z) => U.smooth(100, 160, x), scale: [1, 5], seed: 85 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', variant: 0, fallback: 'pebble', n: 1300, area: [-150, -150, 150, 150], scale: [0.8, 1.6], avoid: (x, z) => inGrid(x, z, 0), seed: 86 });
      SCAPE.scatter(w, { kind: 'rock', n: 500, area: [-150, -150, 150, 150], scale: [0.2, 0.9], avoid: (x, z) => inGrid(x, z, 1), seed: 87 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', variant: 2, fallback: 'grass', n: 600, area: [-150, -150, 150, 150], scale: [0.8, 1.5], avoid: (x, z) => inGrid(x, z, 1), seed: 88 });
      SCAPE.scatter(w, { kind: 'grass', n: 1300, area: [-150, -150, 150, 150], scale: [0.4, 0.9], color: '#d8cc9a', avoid: (x, z) => inGrid(x, z, 1), seed: 89, castShadow: false });
      SCAPE.scatter(w, { kind: 'model', model: 'wild_rooibos_bush', variant: 0, fallback: 'shrub', n: 120, area: [-150, -150, 150, 150], scale: [0.7, 1.3], avoid: (x, z) => inGrid(x, z, 3), seed: 90 });
      SCAPE.scatter(w, { kind: 'thorn', n: 80, area: [-150, -150, 150, 150], scale: [0.6, 1.2], avoid: (x, z) => inGrid(x, z, 3), seed: 91 });
      SCAPE.birds(w, { n: 9, x: 0, z: -30, y: 45, r: 70 });
      // the edge of the town, beyond the southern network
      const plaster = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.35, color: 0xffeedd, fallback: SCAPE.tex.mud(w) });
      const hs = SCAPE.scatter(w, { kind: 'house', n: 40, area: [-80, 30, 80, 140], scale: [5, 9], avoid: (x, z) => inGrid(x, z, 8), density: (x, z) => U.smooth(150, 40, Math.hypot(x, z - 40)), seed: 92, collide: true });
      hs.meshes.forEach(m => { m.material = plaster; });
      SCAPE.smoke(w, { sources: [[-30, H(-30, 70) + 3, 70], [40, H(40, 90) + 3, 90]], height: 14, opacity: 0.12 });

      /* ---------- materials ---------- */
      const stone = this.stone = PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.9, color: 0xf0e6d8, fallback: SCAPE.tex.granite(w) });
      this.oldStone = PHOTO.mat(w, 'dry_riverbed_rock', { triplanar: 0.9, color: 0xc8bca8, fallback: SCAPE.tex.granite(w) });
      const wood = PHOTO.mat(w, 'medieval_wood', { triplanar: 1.2, color: 0xc8b4a0, fallback: KIT.wood(w) });
      const leather = PHOTO.mat(w, 'brown_leather', { rep: [1, 1], fallback: KIT.wood(w, [1, 1], '#6a4430') });
      this.waterMat = new T.MeshStandardMaterial({ color: 0x5a8ca4, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.86, emissive: 0x0a2230, emissiveIntensity: 0.4 });
      const cracked = PHOTO.mat(w, 'mud_cracked_dry_03', { rep: [3, 3], fallback: SCAPE.tex.gravel(w) });

      /* ---------- the well ---------- */
      const wy = H(0, 0);
      const ring = new T.Mesh(new T.CylinderGeometry(1.7, 1.85, 1.0, 20, 1, true), stone); ring.position.set(0, wy + 0.45, 0); ring.castShadow = ring.receiveShadow = true; S.add(ring);
      const ringIn = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 1.05, 20, 1, true), stone); ringIn.material = stone; ringIn.position.copy(ring.position); S.add(ringIn);
      const lip = new T.Mesh(new T.RingGeometry(1.3, 1.78, 20).rotateX(-Math.PI / 2), stone); lip.position.set(0, wy + 0.96, 0); S.add(lip);
      const dark = new T.Mesh(new T.CircleGeometry(1.3, 20).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x050403 })); dark.position.set(0, wy + 0.2, 0); S.add(dark);
      const shine = new T.Mesh(new T.CircleGeometry(0.9, 20).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x3a5a6a, transparent: true, opacity: 0.6 })); shine.position.set(0, wy + 0.22, 0); S.add(shine);
      [-1.6, 1.6].forEach(x => { const p = new T.Mesh(new T.CylinderGeometry(0.12, 0.14, 3.2, 8), wood); p.position.set(x, wy + 1.6, 0); p.castShadow = true; S.add(p); });
      const bar = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 3.6, 8).rotateZ(Math.PI / 2), wood); bar.position.set(0, wy + 3.05, 0); bar.castShadow = true; S.add(bar);
      const pulley = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.14, 14).rotateX(Math.PI / 2), wood); pulley.position.set(0, wy + 2.85, 0); pulley.userData.dynamic = true; S.add(pulley); this.pulley = pulley;
      w.addCircle(0, 0, 1.9);
      // the buckets: one now; at the end, the buckets of the Muslims
      this.buckets = [];
      for (let k = 0; k < 7; k++) {
        const a = k ? (k - 1) / 6 * Math.PI * 2 : 0, rr = k ? 0.85 : 0;
        const g = new T.Group(); g.userData.dynamic = true; S.add(g);
        const bk = new T.Mesh(new T.CylinderGeometry(0.24, 0.18, 0.34, 10, 1, true), leather); bk.castShadow = true; g.add(bk);
        const rope = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1, 4).translate(0, 0.5, 0), new T.MeshStandardMaterial({ color: 0x8a7050, roughness: 1 })); rope.position.y = 0.17; g.add(rope);
        g.position.set(Math.cos(a) * rr, wy + 1.4, Math.sin(a) * rr); g.visible = k === 0;
        this.buckets.push({ g, rope, a, rr, y: wy + 1.4 });
      }
      this.wy = wy;
      // a stone basin where the bucket pours into the channels
      const basin = new T.Mesh(new T.BoxGeometry(1.2, 0.4, 1.2).translate(0, 0.2, 0), stone); basin.position.set(0, wy, -2.4); S.add(basin);

      /* ---------- each network: its ground, targets and pieces ---------- */
      const channelMat = stone, oldMat = this.oldStone;
      this.geos = {}; ['straight', 'bend', 'tee', 'cross'].forEach(t => { this.geos[t] = { stone: channelGeo(PIECES[t], 'stone'), water: channelGeo(PIECES[t], 'water') }; });
      this.inst = {};
      ['straight', 'bend', 'tee', 'cross'].forEach(t => {
        const mk = (geo, mat, cap) => { const im = new T.InstancedMesh(geo, mat, cap); im.count = 0; im.castShadow = mat !== this.waterMat; im.receiveShadow = true; im.frustumCulled = false; im.userData.dynamic = true; im.userData.list = []; S.add(im); return im; };
        this.inst[t] = { stone: mk(this.geos[t].stone, channelMat, 60), old: mk(this.geos[t].stone, oldMat, 6), water: mk(this.geos[t].water, this.waterMat, 60) };
      });
      this.levels = LEVELS.map((L, li) => {
        const grid = []; for (let i = 0; i < L.nx; i++) { grid.push([]); for (let j = 0; j < L.nz; j++) grid[i].push(null); }
        const gy = H(cellWorld(L, 0, 0).x, cellWorld(L, 0, 0).z);
        const lv = { L, li, grid, gy, rocks: new Set(L.rocks.map(([i, j]) => i + ',' + j)), targets: L.targets.map(t => Object.assign({ watered: false }, t)) };
        // the dry earth under the network
        const c = toWorld(L, 0, -(D0 + L.nz * CS / 2)), ground = new T.Mesh(new T.PlaneGeometry(L.nx * CS + 1.2, L.nz * CS + 1.2).rotateX(-Math.PI / 2), cracked);
        ground.position.set(c.x, gy + 0.02, c.z); ground.rotation.y = L.ang; ground.receiveShadow = true; S.add(ground);
        // obstacles: rocks and old stumps where no channel can go
        L.rocks.forEach(([i, j], k) => { const p = cellWorld(L, i, j); PHOTO.place(w, k % 2 ? 'namaqualand_boulder_05' : 'rock_07', { pos: [p.x, gy - 0.1, p.z], s: k % 2 ? 0.9 : 0.55, ry: k * 1.7 }); if (!PHOTO.enabled) { const m = new T.Mesh(new T.DodecahedronGeometry(0.7, 1), stone); m.position.set(p.x, gy + 0.3, p.z); S.add(m); } });
        // the old channels that cannot be moved
        L.fixed.forEach(([i, j, m]) => { grid[i][j] = { m, fixed: true, fill: 0, born: -9 }; });
        // the targets
        lv.targets.forEach(t => this.makeTarget(lv, t));
        return lv;
      });

      /* ---------- the ghost piece and the flow front ---------- */
      this.ghostMat = new T.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.45, depthWrite: false });
      this.ghost = new T.Mesh(this.geos.straight.stone, this.ghostMat); this.ghost.visible = false; this.ghost.userData.dynamic = true; this.ghost.renderOrder = 4; S.add(this.ghost);
      this.front = KIT.glow(w, 0xd8f0ff, 1.2, 0); this.front.userData.dynamic = true; S.add(this.front);
      this.spills = [];
      this.splash = SCAPE.motes(w, { n: 40, area: [-0.6, 0, -0.6, 0.6, 0.6, 0.6], color: '#d8f0ff', size: 0.16, opacity: 0 });

      this.post = w.post({ bloom: 0.42, threshold: 0.78, rays: { strength: 0.2, dir: [0.5, 0.68, 0.4] }, vignette: 0.32, grain: 0.03, sat: 1.05, contrast: 1.06, lift: [0.008, 0.008, 0.01], gain: [1.02, 1.0, 0.97] });
      w.bake();

      /* ---------- discoveries in the land ---------- */
      const D = (x, z, h, o) => w.discover(Object.assign({ pos: [x, H(x, z) + (h || 1.4), z] }, o));
      D(3.2, 2.4, 1.2, { title: 'Sweet water', label: 'Look into the well', text: 'When the Prophet ﷺ came to Madinah, there was no sweet water but the well of Rumah. (Jami‘ al-Tirmidhi 3703)', ar: 'وَلَيْسَ بِهَا مَاءٌ يُسْتَعْذَبُ غَيْرَ بِئْرِ رُومَةَ' });
      D(-70, -30, 1.4, { title: 'The blessed valley', label: 'Stand in the wadi', text: 'In Wadi al-‘Aqiq he said that one had come to him from his Lord and said: <span class="q">“Pray in this blessed valley.”</span> (Sahih al-Bukhari 1534)', ar: 'صَلِّ فِي هَذَا الْوَادِي الْمُبَارَكِ' });
      D(36, 24, 1.4, { title: 'Where it lies', label: 'Look toward the city', text: 'The well of Rumah lies in the area of al-‘Aqiq, about six kilometres north-west of the Prophet’s Mosque. (Bi’r Rumah; Saudi Awqaf)' });
      D(-30, 40, 1.4, { title: 'Years later', label: 'Rest in the shade', text: 'Years later, besieged in his house, ‘Uthman reminded the people that he had bought the well of Rumah for the Muslims, while now they kept him from its water. (Jami‘ al-Tirmidhi 3703)' });
      D(24, -40, 1.4, { title: '“Whoever digs Rumah”', label: 'Look at the gardens', text: 'Al-Bukhari cites, without a full chain, the words: <span class="q">“Whoever digs Rumah will have Paradise,”</span> and ‘Uthman did it. Al-Tirmidhi gives the report of the purchase with a good chain. (Sahih al-Bukhari, before 2778; Jami‘ al-Tirmidhi 3703)' });

      /* ---------- controls ---------- */
      const Lr = w.ui.layer, touchy = matchMedia('(pointer: coarse)').matches, sz = touchy ? 52 : 44;
      const bar2 = this.bar = document.createElement('div');
      bar2.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:999px;background:rgba(6,9,20,.5);border:1px solid rgba(242,233,214,.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .4s;pointer-events:auto;';
      const icon = (m, col) => { const seg = { 1: 'M20 20 L20 3', 2: 'M20 20 L37 20', 4: 'M20 20 L20 37', 8: 'M20 20 L3 20' }; return `<svg width="26" height="26" viewBox="0 0 40 40"><rect x="1" y="1" width="38" height="38" rx="6" fill="rgba(0,0,0,.25)" stroke="rgba(242,233,214,.25)"/><path d="${[1, 2, 4, 8].filter(d => m & d).map(d => seg[d]).join(' ')}" stroke="${col || '#9cc8e0'}" stroke-width="8" stroke-linecap="round" fill="none"/></svg>`; };
      this.icon = icon;
      const mk = (html, title, fn) => { const b = document.createElement('button'); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = html;
        b.style.cssText = `min-width:${sz}px;height:${sz}px;border-radius:12px;border:1px solid rgba(242,233,214,.25);background:rgba(255,255,255,.04);color:#f6efe2;font-size:1.05rem;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:none;padding:0 4px;`;
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SND.init(); fn(); }); bar2.appendChild(b); return b; };
      this.palBtns = ['straight', 'bend', 'tee', 'cross'].map((t, i) => mk(icon(PIECES[t]), `${i + 1} ${t}`, () => this.choose(t)));
      this.queueEl = document.createElement('div'); this.queueEl.style.cssText = 'display:flex;gap:4px;align-items:center;padding:0 4px;'; bar2.appendChild(this.queueEl);
      mk('⟳', 'Turn the piece (R)', () => this.turnHand());
      this.walkBtn = mk('🚶', 'Walk the land (V)', () => this.toggleWalk());
      Lr.appendChild(bar2);
      this.fadeEl = Lr.querySelector('.w-fade');
      const host = document.getElementById('host');
      this.noMenu = e => { if (this.mode === 'build') e.preventDefault(); };
      host.addEventListener('contextmenu', this.noMenu);
      w.onPointer = (e, p, phase) => {
        if (this.mode !== 'build' || w.filmS) return false;
        if (phase === 'down') { if (e.button === 2) this.turnHand(); else { const c = this.pickCell(e.clientX, e.clientY); if (c) this.lay(c.i, c.j); } }
        return true;
      };

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 600, q: 0.6, gain: 0.03 });
      this.waterN = SND.noise(b, { color: 'white', type: 'bandpass', freq: 1800, q: 0.7, gain: 0 });
      this.choir = SND.drone(b, 146.83, { vowel: 'a', gain: 0 });
      this.birdClock = 1; this.goatClock = 4;

      w.activity(LEVELS[0].title, 1, LEVELS[0].step);
    },

    makeTarget(lv, t) {
      const w = this.w, S = w.scene, L = lv.L;
      // the target sits just outside the grid, past the open side of its cell
      const dd = DIRS.find(d => d[0] === t.d), p = cellLocal(L, t.i + dd[1] * 1.45, t.j + dd[2] * 1.45), q = toWorld(L, p.x, p.z), y = lv.gy;
      t.pos = new T.Vector3(q.x, y, q.z);
      const g = new T.Group(); g.position.copy(t.pos); g.rotation.y = L.ang; S.add(g); g.userData.dynamic = true; t.g = g;
      if (t.kind === 'garden') {
        const bed = new T.Mesh(new T.BoxGeometry(3.6, 0.1, 3.6), new T.MeshStandardMaterial({ color: 0x9a7a58, roughness: 1 })); bed.position.y = 0.02; bed.receiveShadow = true; g.add(bed); t.bed = bed;
        const rimG = SCAPE.merge([[0, 1.85, 3.9, 0.3], [0, -1.85, 3.9, 0.3], [1.85, 0, 0.3, 3.9], [-1.85, 0, 0.3, 3.9]].map(([x, z, a, c]) => new T.BoxGeometry(a, 0.3, c).translate(x, 0.12, z)));
        const rim = new T.Mesh(rimG, this.stone); rim.castShadow = true; g.add(rim);
        for (let k = 0; k < 3; k++) { const pl = KIT.palm(w, 5 + k * 1.3, { lean: 0.15 * (k - 1) }); pl.position.set((k - 1) * 1.2, 0, 0.6 - (k % 2) * 1.2); pl.scale.setScalar(0.9); g.add(pl); }
        t.sprouts = SCAPE.scatter(w, { kind: 'grass', points: Array.from({ length: 24 }, (_, k) => { const a = toWorld(L, p.x + (k % 6 - 2.5) * 0.55, p.z + (Math.floor(k / 6) - 1.5) * 0.7); return [a.x, a.z, 0.01]; }), scale: [0.01, 0.01], color: '#7aa050', seed: 93 + t.i, castShadow: false, ground: () => y + 0.05 });
      } else if (t.kind === 'trough') {
        const tr = new T.Mesh(SCAPE.merge([new T.BoxGeometry(3.2, 0.12, 1.1).translate(0, 0.06, 0), new T.BoxGeometry(3.2, 0.6, 0.15).translate(0, 0.3, 0.5), new T.BoxGeometry(3.2, 0.6, 0.15).translate(0, 0.3, -0.5), new T.BoxGeometry(0.15, 0.6, 1.1).translate(1.6, 0.3, 0), new T.BoxGeometry(0.15, 0.6, 1.1).translate(-1.6, 0.3, 0)]), this.stone);
        tr.castShadow = tr.receiveShadow = true; g.add(tr);
        const wat = new T.Mesh(new T.BoxGeometry(3.0, 0.4, 0.9).translate(0, 0.2, 0), this.waterMat); wat.position.y = 0.1; wat.scale.y = 0.01; g.add(wat); t.wat = wat;
        // goats wait by the trough
        t.goats = [];
        for (let k = 0; k < 4; k++) { const gt = this.goat(k); gt.position.set((k - 1.5) * 0.95, 0, 1.3 + (k % 2) * 0.4); gt.rotation.y = Math.PI + (k - 1.5) * 0.15; g.add(gt); t.goats.push(gt); }
      } else {
        const cis = new T.Mesh(new T.CylinderGeometry(1.4, 1.5, 0.8, 18, 1, true), this.stone); cis.position.y = 0.4; cis.castShadow = true; g.add(cis);
        const wat = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.6, 18).translate(0, 0.3, 0), this.waterMat); wat.scale.y = 0.01; g.add(wat); t.wat = wat;
        [['jug_01', 1.9, 0.5, 1.6], ['ceramic_vase_01', 2.2, -0.6, 1.8], ['jug_01', -2, 0.3, 1.5]].forEach(([id, x, z, s]) => { const a = toWorld(L, p.x + x, p.z + z); PHOTO.place(w, id, { pos: [a.x, y, a.z], s }); });
      }
      t.glow = KIT.glow(w, 0x9fd4ff, 2.2, 0.0); t.glow.position.copy(t.pos).add(new T.Vector3(0, 1.4, 0)); S.add(t.glow);
      w.addCircle(t.pos.x, t.pos.z, 1.8);
    },
    goat(k) {
      const g = new T.Group(), m = new T.MeshStandardMaterial({ color: [0x3a302a, 0xd8ccb8, 0x6a5444, 0x2a2420][k % 4], roughness: 1 });
      const body = new T.Mesh(new T.SphereGeometry(1, 10, 8).scale(0.42, 0.22, 0.2), m); body.position.y = 0.52; g.add(body);
      const head = new T.Mesh(new T.SphereGeometry(1, 8, 6).scale(0.14, 0.1, 0.09), m); head.position.set(0.48, 0.66, 0); g.add(head); g.userData.head = head;
      [[0.28, 0.12], [0.28, -0.12], [-0.28, 0.12], [-0.28, -0.12]].forEach(([x, z]) => { const l = new T.Mesh(new T.CylinderGeometry(0.03, 0.025, 0.42, 5), m); l.position.set(x, 0.21, z); g.add(l); });
      [0.05, -0.05].forEach(z => { const h = new T.Mesh(new T.ConeGeometry(0.02, 0.14, 4), m); h.position.set(0.44, 0.78, z); h.rotation.z = 0.5; g.add(h); });
      g.rotation.y = 0; g.scale.setScalar(1.05);
      return g;
    },

    /* ---------------- play ---------------- */
    startLevel(i) {
      const w = this.w, L = LEVELS[i], lv = this.levels[i];
      this.li = i; this.lv = lv; this.flowing = null; this.state = 'drawing'; this.countdown = L.cd; this.cdMax = L.cd;
      w.activity(L.title, L.targets.length, L.step); w.progress(0);
      this.palBtns.forEach(b => { b.style.display = L.palette ? 'flex' : 'none'; });
      if (!L.palette) { this.nextQ = []; this.refillQueue(); this.hand = this.nextQ.shift(); this.refillQueue(); }
      this.renderQueue();
      const c = toWorld(L, 0, -(D0 + L.nz * CS / 2) + 1);
      this.camGoal = { tgt: new T.Vector3(c.x, lv.gy, c.z), ang: L.ang };
      this.enterBuild();
      this.drawBucket(L.cd);
    },
    refillQueue() {
      const r = this._qr || (this._qr = U.seeded(57));
      while (this.nextQ.length < 4) { const x = r(); const t = x < 0.4 ? 'straight' : x < 0.75 ? 'bend' : x < 0.92 ? 'tee' : 'cross'; let m = PIECES[t]; for (let k = Math.floor(r() * 4); k > 0; k--) m = rot(m); this.nextQ.push({ type: t, m }); }
    },
    renderQueue() {
      const L = this.lv ? this.lv.L : LEVELS[0];
      this.palBtns.forEach((b, i) => { const t = ['straight', 'bend', 'tee', 'cross'][i]; const on = this.hand.type === t; b.innerHTML = this.icon(on ? this.hand.m : PIECES[t], on ? '#ffd98a' : '#9cc8e0'); b.style.background = on ? 'rgba(255,217,138,.18)' : 'rgba(255,255,255,.04)'; });
      if (L.palette) { this.queueEl.innerHTML = ''; return; }
      this.queueEl.innerHTML = `<span style="font-family:var(--f-display),serif;font-size:.6rem;letter-spacing:.14em;color:#e8d2a0;margin-right:4px">IN HAND</span>` + this.icon(this.hand.m, '#ffd98a') + `<span style="width:8px"></span>` + this.nextQ.map(q => `<span style="opacity:.6">${this.icon(q.m)}</span>`).join('');
    },
    choose(t) { if (!this.lv || !this.lv.L.palette) return; this.hand = { type: t, m: PIECES[t] }; this.renderQueue(); SND.bell(ENGINE.env.bus, 660, { gain: 0.015, glass: true }); },
    turnHand() { this.hand = { type: this.hand.type, m: rot(this.hand.m) }; this.renderQueue(); this.ghostSpin = 1; SND.knock(ENGINE.env.bus, { f: 300, gain: 0.08, click: 2400 }); },
    enterBuild() {
      const w = this.w; this.mode = 'build'; if (!this.camFn) this.camFn = dt => this.buildCam(dt);
      w.mode = this.camFn; w.focus = null; this.bar.style.opacity = 1; Array.from(this.bar.children).forEach(ch => { ch.style.visibility = ''; });
      this.walkBtn.innerHTML = '🚶';
    },
    toggleWalk() {
      const w = this.w; if (this.li < 0) return;
      if (this.mode === 'build') {
        this.mode = 'walk'; w.mode = null; this.ghost.visible = false;
        w.pos.set(0, 0, 6); w.yaw = 0; w.pitch = -0.05;
        Array.from(this.bar.children).forEach(ch => { if (ch !== this.walkBtn) ch.style.visibility = 'hidden'; });
        this.walkBtn.innerHTML = '⌂'; w.step('Walking the land · press V (or ⌂) to return to the channels');
      } else { this.enterBuild(); w.step(this.lv.L.step); }
    },
    pickCell(cx, cy) {
      const w = this.w, env = ENGINE.env, lv = this.lv; if (!lv) return null;
      const ray = this._ray || (this._ray = new T.Raycaster()); ray.setFromCamera(new T.Vector2(cx / env.w * 2 - 1, -(cy / env.h) * 2 + 1), w.camera);
      const o = ray.ray.origin, d = ray.ray.direction; if (d.y > -0.01) return null;
      const t = (lv.gy - o.y) / d.y, x = o.x + d.x * t, z = o.z + d.z * t;
      const L = lv.L, c = Math.cos(-L.ang), s = Math.sin(-L.ang), lx = x * c + z * s, lz = -x * s + z * c;
      const i = Math.round(lx / CS + (L.nx - 1) / 2), j = Math.round((-lz - D0 - CS / 2) / CS);
      if (i < 0 || j < 0 || i >= L.nx || j >= L.nz) return null;
      return { i, j };
    },
    lay(i, j) {
      const lv = this.lv, env = ENGINE.env, w = this.w; if (!lv || this.state === 'won') return;
      const cell = lv.grid[i][j], p = cellWorld(lv.L, i, j);
      if (lv.rocks.has(i + ',' + j)) { SND.knock(env.bus, { f: 90, gain: 0.12, click: 500 }); this.nudge(p); return; }
      if (cell && cell.fixed) { SND.knock(env.bus, { f: 120, gain: 0.1, click: 700 }); this.hintOnce('fixed', 'The old channel is set in stone; build around it.'); return; }
      if (cell && cell.fill > 0) { SND.drop(env.bus, { f: 600, gain: 0.04 }); this.hintOnce('wet', 'That channel already holds water.'); return; }
      if (cell) this.puff(p, 0.6);
      lv.grid[i][j] = { m: this.hand.m, fill: 0, born: w.time };
      SND.knock(env.bus, { f: 110 + Math.random() * 30, gain: 0.35, click: 900 }); this.later(0.08, () => SND.knock(env.bus, { f: 160, gain: 0.12, click: 1400 }));
      this.puff(p, 1);
      if (!lv.L.palette) { this.hand = this.nextQ.shift(); this.refillQueue(); }
      this.renderQueue(); this.syncInstances();
    },
    hintOnce(id, text) { this._h = this._h || {}; if (this._h[id]) return; this._h[id] = 1; this.w.say('The channels', text, { ms: 5000 }); },
    nudge(p) { this.puff(p, 0.4); },
    puff(p, k) {
      this.puffs = this.puffs || [];
      const s = KIT.glow(this.w, 0xe8d8c0, 1, 0.45 * k); s.material.blending = T.NormalBlending; s.position.set(p.x, this.lv.gy + 0.4, p.z); this.w.scene.add(s);
      this.puffs.push({ s, t: 0, k });
    },
    later(dt, fn) { this.queue.push([this.w.time + dt, fn]); },

    /* ---------- the bucket and the flow ---------- */
    drawBucket(secs) {
      this.state = 'drawing'; this.countdown = secs; this.cdMax = secs;
      SND.sing(ENGINE.env.bus, 196, { vowel: 'o', dur: 1.4, gain: 0.03 });
    },
    startFlow() {
      const lv = this.lv, L = lv.L, env = ENGINE.env;
      this.state = 'flowing';
      // the bucket tips into the basin, and the water enters the first row
      SND.swell(env.bus, { f0: 2200, f1: 500, dur: 1.2, gain: 0.05 }); SND.drop(env.bus, { f: 500, gain: 0.06 });
      this.flowing = [{ i: L.src, j: 0, from: S, t: 0 }];
      this.check(L.src, 0, S, true);
    },
    check(i, j, from, first) {
      // water arrives at a cell from `from`: it fills if a channel opens that way; otherwise it spills
      const lv = this.lv, L = lv.L;
      if (i < 0 || j < 0 || i >= L.nx || j >= L.nz) return false;
      const c = lv.grid[i][j];
      if (!c || !(c.m & from)) { this.spill(i, j, from); return false; }
      return true;
    },
    flowStep(dt) {
      if (this.state !== 'flowing') return;
      const lv = this.lv, L = lv.L, env = ENGINE.env, w = this.w, next = [];
      let any = false;
      for (const f of this.flowing) {
        const c = lv.grid[f.i] && lv.grid[f.i][f.j];
        if (!c || !(c.m & f.from)) continue;
        any = true;
        if (c.fill >= 1) continue;
        c.fill = Math.min(1, c.fill + dt / L.speed);
        const p = cellWorld(L, f.i, f.j); this.front.position.set(p.x, lv.gy + 0.4, p.z); this.frontK = 1;
        if (c.fill >= 1) {
          SND.drop(env.bus, { f: U.rnd(500, 900), gain: 0.04, pan: w.spatial(p, 10).pan });
          for (const [d, di, dj] of DIRS) {
            if (!(c.m & d) || d === f.from) continue;
            const ni = f.i + di, nj = f.j + dj;
            const tg = lv.targets.find(t => t.i === f.i && t.j === f.j && t.d === d);
            if (tg) { this.reach(tg); continue; }
            if (ni < 0 || nj < 0 || ni >= L.nx || nj >= L.nz || lv.rocks.has(ni + ',' + nj)) { this.spill(f.i, f.j, d, true); continue; }
            const nc = lv.grid[ni][nj];
            if (!nc || !(nc.m & OPP[d])) { this.spill(ni, nj, OPP[d]); continue; }
            if (nc.fill <= 0) next.push({ i: ni, j: nj, from: OPP[d] });
          }
        } else next.push(f);
      }
      this.flowing = next;
      if (this.state === 'flowing' && !next.length) this.flowEnds(any);
    },
    reach(t) {
      const w = this.w, env = ENGINE.env;
      if (!t.watered) {
        t.watered = true; t.wetT = w.time;
        SND.glow(env.bus, { garden: 220, trough: 246.94, cistern: 196 }[t.kind], { gain: 0.06, dur: 6 }); SND.bell(env.bus, 659.25, { gain: 0.03, delay: 0.3, glass: true });
        if (t.kind === 'trough') { SND.coo(env.bus, { gain: 0.03, delay: 0.8 }); this.later(1.2, () => this.bleat(t.pos)); }
        const n = this.lv.targets.filter(x => x.watered).length; w.progress(n);
        if (n === this.lv.targets.length && this.state === 'flowing') this.levelDone();
        w.say({ garden: 'The garden drinks', trough: 'The trough fills', cistern: 'The town’s cistern fills' }[t.kind], { garden: 'The water reaches the roots of the palms.', trough: 'The flocks come to drink.', cistern: 'Jars are filled for the houses.' }[t.kind], { ms: 4500 });
      }
    },
    spill(i, j, from, edge) {
      // water runs out into the sand: a dark patch, a hiss, and the bucket is spent
      const lv = this.lv, L = lv.L, env = ENGINE.env, w = this.w;
      if (this.state !== 'flowing') return;
      const dd = DIRS.find(d => d[0] === (edge ? from : OPP[from]));
      const l = cellLocal(L, edge ? i + dd[1] * 0.6 : i - dd[1] * 0.4, edge ? j + dd[2] * 0.6 : j - dd[2] * 0.4), p = toWorld(L, l.x, l.z);
      const wet = new T.Mesh(new T.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.5, transparent: true, opacity: 0.55, depthWrite: false }));
      wet.position.set(p.x, lv.gy + 0.04, p.z); wet.scale.setScalar(0.1); wet.userData.dynamic = true; w.scene.add(wet);
      this.spills.push({ m: wet, t: 0 });
      SND.swell(env.bus, { f0: 1600, f1: 400, dur: 1.4, gain: 0.04 });
      this.state = 'spilt'; this.flowing = [];
      this.splash.pts.position.set(p.x, lv.gy + 0.1, p.z); this.splashK = 1;
      w.step('The water spilt into the sand. Mend the channel; the bucket is being drawn again');
      this.later(2.4, () => this.resetFlow());
    },
    flowEnds(any) {
      // every branch closed: if every target drinks, the network is done; otherwise draw again
      const lv = this.lv;
      if (lv.targets.every(t => t.watered)) return this.levelDone();
      this.state = 'spilt';
      this.w.step(any ? 'The water stopped short. Lay more channel; the bucket is being drawn again' : this.lv.L.step);
      this.later(1.6, () => this.resetFlow());
    },
    resetFlow() {
      const lv = this.lv; if (this.state === 'won') return;
      lv.grid.forEach(col => col.forEach(c => { if (c) c.drain = true; }));
      this.drawBucket(9);
      this.w.step('The bucket rises again · ' + (lv.targets.filter(t => !t.watered).length) + ' still to reach');
    },
    levelDone() {
      const w = this.w, env = ENGINE.env, li = this.li;
      this.state = 'won';
      SND.glow(env.bus, [196, 220, 246.94][li], { gain: 0.07, dur: 7 }); SND.bell(env.bus, 587.33, { gain: 0.035, delay: 0.4, glass: true });
      w.progress(this.lv.L.targets.length);
      this.later(3, () => { if (li < 2) this.startLevel(li + 1); else this.givenFreely(); });
    },
    givenFreely() {
      // the well is bought, and made free: every bucket goes down at once, and every channel runs
      const w = this.w, env = ENGINE.env;
      this.state = 'free'; this.freeT = 0; this.bar.style.opacity = 0; this.bar.style.pointerEvents = 'none';
      w.activity('Given freely', 1, 'The well is open to all');
      this.camGoal = { tgt: new T.Vector3(0, this.wy, -2), ang: Math.PI / 4, dist: 34 };
      this.buckets.forEach(b => { b.g.visible = true; });
      this.levels.forEach(lv => { lv.grid.forEach(col => col.forEach(c => { if (c) { c.drain = false; c.fill = 0; c.free = 1; } })); lv.targets.forEach(t => { t.watered = true; t.wetT = t.wetT || w.time; }); });
      SND.glow(env.bus, 146.83, { gain: 0.08, dur: 14, vowel: 'a' }); SND.glow(env.bus, 220, { gain: 0.05, dur: 12, delay: 1.5, vowel: 'o' });
      this.later(2, () => w.say('Given freely to all', 'He asked: <span class="q">“Who will buy the well of Rumah and place his bucket alongside the buckets of the Muslims, for something better than it in Paradise?”</span> ‘Uthman bought it from his own wealth, and the well was open to everyone. (Jami‘ al-Tirmidhi 3703)', { ar: 'مَنْ يَشْتَرِي بِئْرَ رُومَةَ فَيَجْعَلُ دَلْوَهُ مَعَ دِلَاءِ الْمُسْلِمِينَ', ms: 16000 }));
      this.later(11, () => { w.finish('The well of Rumah is given to all'); this.done = true; this.dip('#000', 0.3, () => { this.mode = 'walk'; w.mode = null; w.pos.set(0, 0, 7); w.yaw = 0; w.pitch = -0.05; w.step('Walk among the gardens; every channel runs'); }); });
    },
    bleat(p) { const sp = this.w.spatial(p, 12); SND.sing(ENGINE.env.bus, 380 + Math.random() * 60, { vowel: 'a', dur: 0.5, gain: 0.03 * sp.gain + 0.005, pan: sp.pan, attack: 0.02, hold: 0.2, vib: 0.06 }); },
    dip(color, hold, fn) { this.fadeEl.style.background = color; this.dipGoal = 1; this.later(0.6, () => { fn && fn(); this.later(hold || 0.2, () => { this.dipGoal = 0; }); }); },

    syncInstances() {
      const m4 = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), v = new T.Vector3(), sc = new T.Vector3();
      const lists = {}; ['straight', 'bend', 'tee', 'cross'].forEach(t => { lists[t] = { stone: [], old: [], water: [] }; });
      const t = this.w.time;
      this.levels.forEach(lv => lv.grid.forEach((col, i) => col.forEach((c, j) => {
        if (!c) return;
        const ty = typeOf(c.m), r = maskRot(PIECES[ty], c.m), p = cellWorld(lv.L, i, j);
        const yaw = lv.L.ang - r * Math.PI / 2;
        const pop = U.clamp((t - c.born) / 0.5), s = pop < 1 ? U.easeOut(pop) + Math.sin(pop * Math.PI) * 0.12 : 1;
        lists[ty][c.fixed ? 'old' : 'stone'].push(m4.compose(v.set(p.x, lv.gy + 0.04, p.z), q.setFromAxisAngle(up, yaw), sc.set(s, s, s)).clone());
        if (c.fill > 0.001) lists[ty].water.push(m4.compose(v.set(p.x, lv.gy - 0.06, p.z), q.setFromAxisAngle(up, yaw), sc.set(1, Math.max(0.02, c.fill), 1)).clone());
      })));
      Object.keys(lists).forEach(ty => ['stone', 'old', 'water'].forEach(k => { const im = this.inst[ty][k], L2 = lists[ty][k]; im.count = L2.length; L2.forEach((m, n) => im.setMatrixAt(n, m)); im.instanceMatrix.needsUpdate = true; }));
    },

    buildCam(dt) {
      const w = this.w, cam = w.camera, g = this.camGoal; if (!g) return;
      this.camT = this.camT || g.tgt.clone(); this.camA = this.camA == null ? g.ang : this.camA;
      this.camT.lerp(g.tgt, 1 - Math.exp(-dt * 2)); let da = g.ang - this.camA; da = Math.atan2(Math.sin(da), Math.cos(da)); this.camA += da * (1 - Math.exp(-dt * 2));
      const dist = U.damp(this.camD || 26, g.dist || 24, 2, dt); this.camD = dist;
      // looking outward from behind the well, down onto the network
      const back = new T.Vector3(Math.sin(this.camA), 0, Math.cos(this.camA));
      const want = this.camT.clone().addScaledVector(back, dist * 0.62).add(new T.Vector3(0, dist * 0.78, 0));
      if (this.fromFilm) { cam.position.lerp(want, 1 - Math.exp(-dt * 2.5)); if (cam.position.distanceTo(want) < 0.4) this.fromFilm = false; } else cam.position.copy(want);
      cam.lookAt(this.camT);
      w.pos.set(this.camT.x, 0, this.camT.z);
      if (w._shadow) { const L = w._shadow.light; L.target.position.set(this.camT.x, 0, this.camT.z); L.position.copy(L.target.position).add(w._shadow.off); }
      // the ghost of the piece in hand
      const p = ENGINE.pointer, c = p.inside && this.state !== 'won' && this.state !== 'free' ? this.pickCell(p.x, p.y) : null;
      if (c && !matchMedia('(pointer: coarse)').matches) {
        const lv = this.lv, ty = typeOf(this.hand.m), r = maskRot(PIECES[ty], this.hand.m), q = cellWorld(lv.L, c.i, c.j);
        this.ghost.geometry = this.geos[ty].stone; this.ghost.position.set(q.x, lv.gy + 0.1, q.z);
        this.ghostSpin = U.damp(this.ghostSpin || 0, 0, 12, dt);
        this.ghost.rotation.y = lv.L.ang - r * Math.PI / 2 + this.ghostSpin * Math.PI / 2; this.ghost.visible = true;
        const bad = lv.rocks.has(c.i + ',' + c.j) || (lv.grid[c.i][c.j] && (lv.grid[c.i][c.j].fixed || lv.grid[c.i][c.j].fill > 0));
        this.ghostMat.color.set(bad ? 0xff9a7a : 0xffd98a);
      } else this.ghost.visible = false;
    },

    film(env, w) {
      const wy = this.wy, tr = this.levels[1].targets[0].pos, gd = this.levels[2].targets[2].pos;
      return [
        { dur: 7, fade: 'dip', title: true, fov: [46, 40], path: [[[-170, 60, -140], [0, 0, -10]], [[-120, 44, -100], [0, 0, -5]], [[-80, 32, -60], [0, 2, 0]]] },
        { dur: 6.5, fade: 'dip', line: 'In Madinah, there was no sweet water but the well of Rumah.', ar: 'لَمْ يَكُنْ بِهَا مَاءٌ يُسْتَعْذَبُ غَيْرَ بِئْرِ رُومَةَ', lineAt: 0.5, fov: [44, 38],
          path: [[[4, wy + 2.2, 4.5], [0, wy + 1.2, 0]], [[2.6, wy + 3.4, 2.6], [0, wy + 0.4, 0]]],
          during: (w, k) => { const b = this.buckets[0]; b.y = this.wy + 1.4 - Math.sin(k * Math.PI) * 1.2; } },
        { dur: 6, fade: 'cut', line: 'The gardens wait, and the troughs are dry.', ar: 'الْبَسَاتِينُ تَنْتَظِرُ، وَالْأَحْوَاضُ جَافَّةٌ', lineAt: 0.5,
          path: [[[tr.x + 5, tr.y + 1.6, tr.z + 4], [tr.x, tr.y + 0.6, tr.z]], [[tr.x + 3.4, tr.y + 1.2, tr.z + 3], [tr.x, tr.y + 0.5, tr.z]]] },
        { dur: 7, fade: 'dip', lines: [[0.5, '“Who will buy the well of Rumah,', 'مَنْ يَشْتَرِي بِئْرَ رُومَةَ'], [3.4, 'and place his bucket with the buckets of the Muslims?” (Tirmidhi 3703)', 'فَيَجْعَلُ دَلْوَهُ مَعَ دِلَاءِ الْمُسْلِمِينَ']],
          path: [[[-6, wy + 1.3, 3], [0, wy + 1.6, 0]], [[-3.4, wy + 1.1, 2.2], [0, wy + 2.4, 0]]], fov: [40, 34] },
        { dur: 6, fade: 'cut', line: 'Every garden, trough and cistern must be reached.', ar: 'لِكُلِّ بُسْتَانٍ وَحَوْضٍ وَصِهْرِيجٍ نَصِيبٌ مِنَ الْمَاءِ', lineAt: 0.4,
          path: [[[gd.x + 6, gd.y + 3, gd.z + 6], [gd.x, gd.y + 1, gd.z]], [[gd.x - 2, gd.y + 7, gd.z + 9], [gd.x, gd.y, gd.z]]] },
        { dur: 6.5, fade: 'white', line: 'Lay the channels while the bucket rises. Give the water.', ar: 'مُدَّ الْقَنَوَاتِ وَالدَّلْوُ يَصْعَدُ، وَأَوْصِلِ الْمَاء', lineAt: 0.6,
          path: [[[0, wy + 26, 18], [0, wy, -10]], [[0, wy + 19, 13], [0, wy, -9]]] },
      ];
    },
    filmOpts: { end(w) { const st = ENGINE.cur; if (!st || !st.levels) return; st.fromFilm = true; st.startLevel(0); } },

    onKey(env, e) {
      if (e.repeat || !this.w || this.w.filmS) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'v') return this.toggleWalk();
      if (this.mode !== 'build') return;
      if (k === 'r' || k === 'q' || k === 'e') this.turnHand();
      const t = { '1': 'straight', '2': 'bend', '3': 'tee', '4': 'cross' }[k]; if (t) this.choose(t);
    },
    wheel(env, dy) { if (this.mode === 'build' && Math.abs(dy) > 2) this.turnHand(); },
    move(env, p, e) { if (this.w && this.mode !== 'build') this.w.move(p, e); },

    update(env, dt) {
      const w = this.w; if (!w) return;
      if (this.queue.length) { const due = this.queue.filter(q => w.time >= q[0]); this.queue = this.queue.filter(q => w.time < q[0]); due.forEach(q => q[1]()); }
      if (!w.filmS) { this.dipV = U.damp(this.dipV, this.dipGoal, 9, dt); this.fadeEl.style.opacity = this.dipV < 0.004 ? 0 : this.dipV.toFixed(3); }
      // the bucket rises while you build
      if (this.state === 'drawing') {
        this.countdown -= dt;
        const k = 1 - U.clamp(this.countdown / this.cdMax);
        this.buckets[0].y = this.wy - 2.6 + k * 4.0; this.pulley.rotation.z -= dt * 3;
        if (Math.floor((this.countdown + dt) / 3) !== Math.floor(this.countdown / 3) && this.countdown > 0.5) SND.knock(env.bus, { f: 220, gain: 0.05, click: 1600 });
        w.step && this.li >= 0 && this.countdown > 0 && (this._cdShown !== Math.ceil(this.countdown)) && (this._cdShown = Math.ceil(this.countdown), w.step(`The bucket rises · the water runs in ${Math.ceil(this.countdown)} s`));
        if (this.countdown <= 0) { this.buckets[0].y = this.wy + 1.4; this.startFlow(); w.step('The water runs'); }
      }
      this.flowStep(dt);
      // drained channels empty slowly; in the end every channel runs
      this.levels.forEach(lv => lv.grid.forEach(col => col.forEach(c => { if (!c) return; if (c.drain) { c.fill = Math.max(0, c.fill - dt * 0.8); if (c.fill <= 0) c.drain = false; } if (c.free) c.fill = Math.min(1, c.fill + dt * 0.5); })));
      this.syncInstances();
      w.update(dt);
      const t = w.time;
      // buckets: the one on the rope, and at the end the buckets of the Muslims going down together
      this.buckets.forEach((b, k) => {
        if (this.state === 'free') { this.freeT += k === 0 ? dt : 0; b.y = this.wy + 1.0 - (0.5 + 0.5 * Math.sin(t * 0.9 + k * 0.9)) * 2.4; }
        b.g.position.y = b.y; b.rope.scale.y = Math.max(0.05, this.wy + 2.85 - b.y - 0.17);
      });
      this.front.material.opacity = U.damp(this.front.material.opacity, this.state === 'flowing' ? 0.85 : 0, 6, dt); this.front.scale.setScalar(1.1 + Math.sin(t * 9) * 0.15);
      this.splashK = U.damp(this.splashK || 0, 0, 1.2, dt); this.splash.pts.material.uniforms && (this.splash.pts.visible = this.splashK > 0.02);
      this.spills.forEach(s => { s.t += dt; s.m.scale.setScalar(Math.min(1.6, 0.2 + s.t * 1.2)); s.m.material.opacity = 0.55 * (1 - U.smooth(4, 9, s.t)); });
      this.spills = this.spills.filter(s => { if (s.t > 9) { w.scene.remove(s.m); return false; } return true; });
      (this.puffs || []).forEach(p => { p.t += dt; p.s.material.opacity = 0.45 * (1 - p.t / 1.2) * p.k; p.s.scale.setScalar(1.2 + p.t * 2.5); p.s.position.y += dt * 0.5; });
      if (this.puffs) this.puffs = this.puffs.filter(p => { if (p.t > 1.2) { w.scene.remove(p.s); return false; } return true; });
      // the targets come alive
      let wet = 0;
      this.levels.forEach(lv => lv.targets.forEach(tg => {
        const k = tg.watered ? U.smooth(0, 3, t - tg.wetT) : 0; if (tg.watered) wet++;
        tg.glow.material.opacity = tg.watered ? 0.25 * (1 - U.smooth(2, 6, t - tg.wetT)) : (this.lv === lv && this.mode === 'build' ? 0.35 + 0.15 * Math.sin(t * 2.5) : 0);
        if (tg.bed) tg.bed.material.color.setRGB(U.lerp(0.6, 0.26, k), U.lerp(0.48, 0.2, k), U.lerp(0.35, 0.14, k));
        if (tg.sprouts && tg.sprouts.meshes[0]) { const im = tg.sprouts.meshes[0]; if (k > 0 && !tg.grown) { tg.grown = true; } if (tg.grown) { const m4 = new T.Matrix4(); tg.sprouts.list.forEach((it, n) => { m4.compose(new T.Vector3(it.x, lv.gy + 0.05, it.z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), it.ry), new T.Vector3(0.6 * k, 0.6 * k, 0.6 * k)); im.setMatrixAt(n, m4); }); im.instanceMatrix.needsUpdate = true; } }
        if (tg.wat) tg.wat.scale.y = Math.max(0.01, k);
        if (tg.goats) tg.goats.forEach((g, n) => { const dip = tg.watered ? 0.5 + 0.5 * Math.sin(t * 1.4 + n * 1.7) : 0; g.userData.head.position.y = 0.66 - dip * 0.22; g.userData.head.position.x = 0.48 + dip * 0.06; });
      }));
      const flowing = this.state === 'flowing' || this.state === 'free';
      this.waterN.set('gain', flowing ? 0.03 : 0.004 * wet, 0.4);
      this.choir.setGain(0.002 + 0.006 * wet + (this.state === 'free' ? 0.02 : 0), 1);
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 2 + Math.random() * 4; Math.random() < 0.4 ? SND.coo(env.bus, { gain: 0.025 }) : SND.chirp(env.bus, { gain: 0.014 }); }
      this.goatClock -= dt;
      if (this.goatClock < 0) { this.goatClock = 5 + Math.random() * 7; const tr = this.levels[1].targets[0]; if (tr && this.lv) this.bleat(tr.pos); }
    },
    onLeave() { const host = document.getElementById('host'); if (this.noMenu) host.removeEventListener('contextmenu', this.noMenu); },
  }));
})();
