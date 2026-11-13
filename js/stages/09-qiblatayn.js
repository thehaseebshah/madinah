/* Madinah — The Two Qiblas, 2 AH / 624 CE.
   Genre: perspective-rotation puzzle (Fez, Monument Valley). The palm gardens and lava terraces of
   Banu Salimah in the late afternoon, and the small mosque on its rise. Seen from the side, as in a
   diorama, three structures stand in the landscape. You are a small light; tap a tile and it walks
   there. Turn the world a quarter at a time: where two paths at different depths line up on the
   screen, they join, and the light can cross. Three puzzles, the last in the prayer hall itself:
   first the way to the old niche, then the qibla turns and the way to the new one opens only when the
   world is turned half round.
   Feeling: a heart turned. Colour script: late-afternoon gold on lava black and palm green; ivory
   for the light and the niche. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- the puzzles (block coordinates; one block = 2 m) ---------------- */
  const BS = 2;
  const VIEWS = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const N4 = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
  const LEVELS = [
    { name: 'The garden terrace', site: { x: -70, z: 52 }, mat: 'brick', title: 'Part 1 of 3 · Turn the world', step: 'Tap a tile to walk there · turn the world (Q / E) until the high path meets yours',
      start: [0, 0, 0], goal: [11, 3, -6], boxes: [[0, 0, 0, 4, 0, 0], [4, 0, -3, 4, 0, 0], [7, 3, -6, 11, 3, -6]], disc: [8, 3, -6] },
    { name: 'The lava terraces', site: { x: 78, z: 30 }, mat: 'basalt', title: 'Part 2 of 3 · Paths at every depth', step: 'Some paths meet as you are; some only after turning. Reach the high lamp',
      start: [0, 0, 0], goal: [6, 5, -3], boxes: [[0, 0, 0, 4, 0, 0], [4, 0, -3, 4, 0, 0], [7, 4, -1, 7, 4, 3], [2, 5, -3, 6, 5, -3]], disc: [7, 4, 3] },
    { name: 'The prayer hall', site: { x: 4, z: -64 }, mat: 'plaster', title: 'Part 3 of 3 · The qibla turns', step: 'Walk the light to the niche at the head of the rows',
      start: [3, 0, 0], goal: [3, 0, 4], goal2: [-1, 3, -3], boxes: [[0, 0, 0, 6, 0, 4]], late: [[-1, 3, -3, 1, 3, -3]] },
  ];
  const key = (x, y, z) => x + ',' + y + ',' + z;

  /* ---------------- ground ---------------- */
  const SITES = LEVELS.map(L => L.site);
  function H(x, z) {
    let y = SCAPE.fbm(x * 0.007, z * 0.007 + 2, 3) * 2.6 + SCAPE.fbm(x * 0.05, z * 0.05, 2) * 0.35;
    // the rise the mosque stands on
    y += 5 * Math.exp(-(Math.pow(x - 4, 2) + Math.pow(z + 64, 2)) / (2 * 38 * 38));
    // the harrah: black lava swelling to the east
    const lv = U.smooth(40, 120, x); y += lv * (3 + 6 * SCAPE.ridge(x * 0.03, z * 0.03, 3));
    // a wadi to the south-west
    const wd = z - 110 - Math.sin(x * 0.01) * 30; y -= 3 * Math.exp(-wd * wd / 200);
    const r = Math.hypot(x, z); y += U.smooth(420, 700, r) * (30 + 110 * SCAPE.ridge(x * 0.004 + 1, z * 0.004, 4));
    // each puzzle stands on a levelled pad
    for (const s of SITES) { const d = Math.max(Math.abs(x - s.x), Math.abs(z - s.z)); const k = U.smooth(30, 18, d); if (k > 0) y = U.lerp(y, padY(s), k); }
    return y;
  }
  const padCache = new Map();
  function padY(s) { const k = s.x + ',' + s.z; if (!padCache.has(k)) { let y = SCAPE.fbm(s.x * 0.007, s.z * 0.007 + 2, 3) * 2.6 + 5 * Math.exp(-(Math.pow(s.x - 4, 2) + Math.pow(s.z + 64, 2)) / (2 * 38 * 38)) + U.smooth(40, 120, s.x) * 5; padCache.set(k, y); } return padCache.get(k); }

  function buildLevel(L, withLate) {
    const B = new Set();
    const add = list => list.forEach(([x0, y0, z0, x1, y1, z1]) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) B.add(key(x, y, z)); });
    add(L.boxes); if (withLate && L.late) add(L.late);
    const tiles = [...B].map(s => s.split(',').map(Number)).filter(([x, y, z]) => !B.has(key(x, y + 1, z)));
    return { B, tiles, T: new Set(tiles.map(t => key(...t))) };
  }

  ENGINE.register(WORLD.stage({
    key: 'qiblatayn',
    arabic: 'مَسْجِدُ القِبْلَتَيْن',
    title: 'The Two Qiblas',
    era: 'Madinah · Rajab or Sha‘ban, 2 AH · 624 CE',
    hint: 'Click a tile to walk the light there · Q / E or ◀ ▶ turn the world · where paths meet on screen, they join · V to walk the land',
    hintTouch: 'Tap a tile to walk the light there · ⟲ ⟳ to turn the world · where paths meet on screen, they join',
    sound: { reverb: 0.45 },
    story: `<p>For sixteen or seventeen months after the Hijrah, the Prophet ﷺ prayed toward Jerusalem, and he loved to face the Ka‘bah. Then came the verse: <span class="q">“So turn your face toward al-Masjid al-Haram”</span> (Qur’an 2:144; Sahih al-Bukhari 399).</p>
            <p>The first prayer he prayed toward the Ka‘bah was the afternoon prayer. A man who had prayed with him passed a mosque whose people were bowing, and they turned toward the Ka‘bah as they were (Sahih al-Bukhari 40). The people of Quba turned at the dawn prayer the next morning (Sahih al-Bukhari 403).</p>
            <p>The mosque known as Masjid al-Qiblatayn is associated with Banu Salimah, though the sources differ on where the turning happened.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 4, z: -40, yaw: 0, pitch: 0 }, exposure: 0.84, far: 2600, speed: 3.2, run: 6.4,
        fog: { color: 0xdcc4a4, density: 0.0011 }, bounds: [-150, -150, 150, 150], ground: H,
        surface: (x, z) => (x > 50 ? 'gravel' : 'sand'),
      });
      const S = w.scene, r = U.seeded(624);
      this.queue = []; this.dipV = 0; this.dipGoal = 0; this.li = -1; this.view = 0; this.viewA = 0; this.turning = 0; this.path = []; this.mode = 'puzzle';

      /* ---------- the late-afternoon sky ---------- */
      w.sky({ top: '#6a8cc0', mid: '#f0d2a4', bot: '#dcc4a4', sunDir: [-0.7, 0.33, 0.6], sun: '#ffe0b0', sunSize: 0.0016, clouds: 0.3, haze: 0.4 });
      this.sun = new T.DirectionalLight(0xffe0b8, 1.85); this.sun.position.set(-70, 33, 60); S.add(this.sun);
      S.add(new T.HemisphereLight(0xc8d8f0, 0x9a7a5a, PHOTO.enabled ? 0.07 : 0.6));
      w.followShadow(this.sun, 40, 2048);
      PHOTO.sky(w, 'qwantani_late_afternoon_puresky', { sun: this.sun, intensity: 0.75, rotation: 2.4 - 0.629, haze: '#dcc4a4', horizon: 0.45, ground: '#b89a78', bounce: 0.5 });

      /* ---------- terrain, harrah, horizon ---------- */
      SCAPE.terrain(w, { size: 1500, seg: 300, height: H, rock: [0.82, 0.94], rockHeight: [6, 16], colors: { low: '#c8aa82', high: '#b49470', rock: '#4a3e3a', dark: '#2a2422' },
        tex: 'gravel', rockTex: 'lava', photo: { ground: 'dry_ground_rocks', rock: 'dark_rock', normal: 1 }, rep: 0.22, rockRep: 0.06 });
      SCAPE.horizon(w, { haze: '#dcc4a4', layers: [{ r: 950, h: 80, color: '#6e5c52', seed: 4 }, { r: 1400, h: 120, color: '#948276', seed: 8 }, { r: 2000, h: 150, color: '#b4a69c', seed: 12 }] });
      const nearSite = (x, z, pad) => SITES.some(s => Math.max(Math.abs(x - s.x), Math.abs(z - s.z)) < (pad || 26));
      SCAPE.scatter(w, { kind: 'palm', n: 300, area: [-200, -200, 200, 200], scale: [7, 13], density: (x, z) => (1 - U.smooth(20, 70, x)) * U.smooth(-0.25, 0.2, SCAPE.fbm(x * 0.012, z * 0.012 + 5, 2)), avoid: (x, z) => nearSite(x, z, 22) || Math.hypot(x - 4, z + 64) < 40, seed: 61, collide: 0.03 });
      SCAPE.scatter(w, { kind: 'palm', n: 220, area: [-650, -650, 650, 650], scale: [8, 13], density: (x, z) => U.smooth(200, 240, Math.hypot(x, z)) * (1 - U.smooth(380, 460, Math.hypot(x, z))) * (x < 60 ? 1 : 0.1), seed: 62, castShadow: false });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', fallback: 'boulder', n: 90, area: [40, -150, 150, 150], scale: [0.8, 2.2], avoid: (x, z) => nearSite(x, z, 20), seed: 63, collide: 0.4 });
      SCAPE.scatter(w, { kind: 'boulder', tex: 'lava', n: 360, area: [30, -500, 700, 500], density: (x, z) => U.smooth(40, 90, x), scale: [1, 5], avoid: (x, z) => nearSite(x, z, 20), seed: 64 });
      SCAPE.scatter(w, { kind: 'rock', tex: 'lava', n: 600, area: [-150, -150, 150, 150], scale: [0.2, 0.8], avoid: (x, z) => nearSite(x, z, 14), seed: 65 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', variant: 3, fallback: 'pebble', n: 1300, area: [-150, -150, 150, 150], scale: [0.8, 1.6], seed: 66 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', variant: 1, fallback: 'grass', n: 600, area: [-150, -150, 60, 150], scale: [0.8, 1.5], avoid: (x, z) => nearSite(x, z, 14), seed: 67 });
      SCAPE.scatter(w, { kind: 'grass', n: 1300, area: [-150, -150, 70, 150], scale: [0.4, 0.9], color: '#d4cc9c', avoid: (x, z) => nearSite(x, z, 12), seed: 68, castShadow: false });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', variant: 1, fallback: 'shrub', n: 140, area: [-150, -150, 150, 150], scale: [0.7, 1.4], avoid: (x, z) => nearSite(x, z, 16), seed: 69 });
      SCAPE.scatter(w, { kind: 'thorn', n: 90, area: [-150, -150, 150, 150], scale: [0.6, 1.2], avoid: (x, z) => nearSite(x, z, 16), seed: 70 });
      SCAPE.birds(w, { n: 10, x: -20, z: 0, y: 50, r: 90 });
      // houses of Banu Salimah round the rise
      const plaster = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.35, color: 0xffeedd, fallback: SCAPE.tex.mud(w) });
      const hs = SCAPE.scatter(w, { kind: 'house', n: 34, area: [-110, -140, 40, -20], scale: [5, 9], avoid: (x, z) => nearSite(x, z, 30) || Math.hypot(x - 4, z + 64) < 34, seed: 71, collide: true });
      hs.meshes.forEach(m => { m.material = plaster; });
      SCAPE.smoke(w, { sources: [[-40, H(-40, -100) + 3, -100], [20, H(20, -120) + 3, -120]], height: 14, opacity: 0.14 });

      /* ---------- materials for the three structures ---------- */
      this.mats = {
        brick: PHOTO.mat(w, 'clay_block_wall', { triplanar: 0.45, color: 0xf2e2cc, fallback: KIT.mudBrick(w, [1, 1]) }),
        basalt: PHOTO.mat(w, 'dark_rock', { triplanar: 0.45, color: 0xd8d0c8, fallback: SCAPE.tex.lava(w) }),
        plaster: PHOTO.mat(w, 'plastered_stone_wall', { triplanar: 0.4, color: 0xfff4e4, fallback: SCAPE.tex.mud(w) }),
      };
      this.topMat = PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.5, color: 0xf4e8d8, fallback: SCAPE.tex.granite(w) });
      this.bark = PHOTO.mat(w, 'palm_tree_bark', { triplanar: 1.4, color: 0xb0a090, fallback: KIT.bark(w) });
      this.levels = LEVELS.map((L, i) => this.makeLevel(L, i));

      /* ---------- the light you guide ---------- */
      this.lamp = new T.Group(); this.lamp.userData.dynamic = true; S.add(this.lamp);
      this.lampGlow = KIT.glow(w, 0xfff2d6, 2.2, 0.85); this.lampGlow.material.depthTest = false; this.lampGlow.renderOrder = 20; this.lamp.add(this.lampGlow);
      this.lampCore = KIT.glow(w, 0xffffff, 0.55, 1); this.lampCore.material.depthTest = false; this.lampCore.renderOrder = 21; this.lamp.add(this.lampCore);
      this.lampLight = new T.PointLight(0xffe0b0, 1.6, 9, 1.8); this.lamp.add(this.lampLight);
      this.trail = SCAPE.motes(w, { n: 24, area: [-0.4, -0.2, -0.4, 0.4, 0.8, 0.4], color: '#fff0d0', size: 0.18, opacity: 0.7 });
      this.lamp.add(this.trail.pts);
      // markers: the goal's beam, the tile under the pointer
      const beamTex = w.tex(64, (g, s) => { const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      this.goalBeam = new T.Mesh(new T.CylinderGeometry(0.5, 0.9, 16, 16, 1, true), new T.MeshBasicMaterial({ map: beamTex, color: 0xffe6b0, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      this.goalBeam.userData.dynamic = true; S.add(this.goalBeam);
      this.goalGlow = KIT.glow(w, 0xffe0a0, 2.4, 0.8); S.add(this.goalGlow);
      this.hover = new T.Mesh(new T.RingGeometry(0.62, 0.86, 4, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 4), new T.MeshBasicMaterial({ color: 0xfff2d6, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
      this.hover.scale.setScalar(BS); this.hover.renderOrder = 19; this.hover.userData.dynamic = true; S.add(this.hover);

      this.post = w.post({ bloom: 0.5, threshold: 0.72, rays: { strength: 0.25, dir: [-0.7, 0.33, 0.6] }, vignette: 0.36, grain: 0.03, sat: 1.05, contrast: 1.06, lift: [0.012, 0.008, 0], gain: [1.03, 1.0, 0.95] });
      w.bake();

      /* ---------- discoveries in the land (walk with V) ---------- */
      const D = (x, z, h, o) => w.discover(Object.assign({ pos: [x, H(x, z) + (h || 1.4), z] }, o));
      D(-40, -86, 1.4, { title: 'Banu Salimah', label: 'Look at the houses', text: 'The mosque known as Masjid al-Qiblatayn, the Mosque of the Two Qiblas, is associated with Banu Salimah; the reports differ on which mosque turned during the prayer. (Ibn Hajar, Fath al-Bari; Ibn Sa‘d)' });
      D(-52, 30, 1.4, { title: 'Sixteen or seventeen months', label: 'Rest in the garden', text: 'After the Hijrah he prayed toward Jerusalem for sixteen or seventeen months, and he loved to face the Ka‘bah. (Sahih al-Bukhari 399)' });
      D(30, -96, 1.4, { title: 'East and west', label: 'Look at the horizon', text: '<span class="q">“To God belong the east and the west: wherever you turn, there is the Face of God.”</span> (Qur’an 2:115)', ar: 'وَلِلَّهِ الْمَشْرِقُ وَالْمَغْرِبُ ۚ فَأَيْنَمَا تُوَلُّوا فَثَمَّ وَجْهُ اللَّهِ' });
      D(96, 64, 1.4, { title: 'What turned them?', label: 'Read the stone', text: '<span class="q">“The foolish among the people will say: What has turned them from the qiblah they used to face? Say: To God belong the east and the west; He guides whom He wills to a straight path.”</span> (Qur’an 2:142)' });
      D(-10, -20, 1.4, { title: 'The dawn at Quba', label: 'Look toward Quba', text: 'The news reached the people of Quba the next morning, during the dawn prayer, and they turned toward the Ka‘bah as they prayed. (Sahih al-Bukhari 403)' });
      this.puzzleDisc = [
        { title: 'The turning of a face', text: '<span class="q">“We have certainly seen the turning of your face toward the heaven, and We will surely turn you to a qiblah that will please you.”</span> (Qur’an 2:144)', ar: 'قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ' },
        { title: 'The afternoon prayer', text: 'The first prayer he prayed toward the Ka‘bah was the afternoon prayer, and people prayed it with him. (Sahih al-Bukhari 40)' },
      ];

      /* ---------- controls: turn buttons, walk toggle ---------- */
      const L = w.ui.layer, touchy = matchMedia('(pointer: coarse)').matches, sz = touchy ? 54 : 44;
      const bar = this.bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateX(-50%);display:flex;gap:10px;opacity:0;transition:opacity .4s;pointer-events:auto;';
      const mk = (html, title, fn) => { const b = document.createElement('button'); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = html;
        b.style.cssText = `width:${sz}px;height:${sz}px;border-radius:50%;border:1px solid rgba(242,233,214,.35);background:rgba(6,9,20,.5);color:#fff4dc;font-size:1.1rem;cursor:pointer;touch-action:none;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);`;
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SND.init(); fn(); }); bar.appendChild(b); return b; };
      mk('⟲', 'Turn the world left', () => this.turn(1)); mk('⟳', 'Turn the world right', () => this.turn(-1));
      this.walkBtn = mk('🚶', 'Walk the land', () => this.toggleWalk());
      L.appendChild(bar);
      this.fadeEl = L.querySelector('.w-fade');

      w.onPointer = (e, p, phase) => {
        if (this.mode !== 'puzzle' || w.filmS) return false;
        if (phase === 'down') this.tapAt(e.clientX, e.clientY);
        return true;
      };

      /* ---------- sound ---------- */
      const b = env.bus;
      this.breeze = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 460, q: 0.6, gain: 0.035 });
      this.leaves = SND.noise(b, { color: 'white', type: 'bandpass', freq: 5000, q: 0.8, gain: 0.004 });
      SND.lfo(b, this.leaves.gain && this.leaves.gain.gain, 0.11, 0.003);
      this.hum = SND.drone(b, 196, { vowel: 'u', gain: 0 });
      this.birdClock = 1;

      // the light waits at the first terrace
      this.lamp.position.copy(this.tileWorld(this.levels[0], LEVELS[0].start));
      w.activity(LEVELS[0].title, 3, LEVELS[0].step);
    },

    makeLevel(L, li) {
      const w = this.w, S = w.scene, s = L.site, base = padY(s) - 0.02;
      const org = new T.Vector3(s.x, base, s.z);
      const g = buildLevel(L, false);
      const geo = [], tops = [];
      const blocks = [...g.B].map(k => k.split(',').map(Number));
      blocks.forEach(([x, y, z]) => { const b = new T.BoxGeometry(BS, BS, BS); b.translate(org.x + x * BS + BS / 2, org.y + y * BS + BS / 2, org.z + z * BS + BS / 2); geo.push(b); });
      g.tiles.forEach(([x, y, z]) => { const t = new T.BoxGeometry(BS * 0.96, 0.08, BS * 0.96); t.translate(org.x + x * BS + BS / 2, org.y + (y + 1) * BS + 0.04, org.z + z * BS + BS / 2); tops.push(t); });
      const body = new T.Mesh(SCAPE.merge(geo), this.mats[L.mat]); body.castShadow = body.receiveShadow = true; S.add(body);
      const top = new T.Mesh(SCAPE.merge(tops), this.topMat); top.receiveShadow = true; S.add(top);
      // slim palm-trunk pillars carry the high paths down to the ground
      g.tiles.forEach(([x, y, z]) => { if (y < 2 || g.B.has(key(x, y - 1, z)) || (x + z) % 2) return; const h = y * BS; const c = new T.Mesh(new T.CylinderGeometry(0.18, 0.24, h, 8), this.bark); c.position.set(org.x + x * BS + BS / 2, org.y + h / 2, org.z + z * BS + BS / 2); c.castShadow = true; S.add(c); });
      const lv = { L, li, org, g, late: null };
      if (li === 2) this.makeHall(lv);
      if (li < 2) {
        // a small lamp waits at the goal; a lantern at the start
        PHOTO.place(w, 'brass_diya_lantern', { pos: [org.x + L.goal[0] * BS + BS / 2, org.y + (L.goal[1] + 1) * BS + 0.08, org.z + L.goal[2] * BS + BS / 2], s: 3 });
        PHOTO.place(w, 'ceramic_vase_01', { pos: [org.x - 1.4, org.y, org.z + 2.6], s: 1.5 });
        PHOTO.place(w, 'wicker_basket_01', { pos: [org.x + 2.6, org.y, org.z + 2.8], s: 1.2 });
      }
      return lv;
    },
    makeHall(lv) {
      // the prayer hall: an open-roofed floor, low walls, palm-trunk pillars, rows of mats with a lamp each
      const w = this.w, S = w.scene, o = lv.org, T2 = T;
      const wallM = this.mats.plaster;
      const wall = (x0, z0, x1, z1, h) => { const m = new T2.Mesh(new T2.BoxGeometry(Math.abs(x1 - x0) || 0.5, h, Math.abs(z1 - z0) || 0.5), wallM); m.position.set(o.x + (x0 + x1) / 2, o.y + BS + h / 2, o.z + (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; S.add(m); };
      // the old qibla wall with its niche (toward Jerusalem), low walls on two sides
      wall(0, 10.6, 14, 10.6, 2.6); wall(-0.25, 0, -0.25, 10.6, 0.7); wall(14.25, 0, 14.25, 10.6, 0.7);
      const niche = new T2.Mesh(new T2.BoxGeometry(1.6, 2.2, 0.3), new T2.MeshStandardMaterial({ color: 0x2a1c14, roughness: 1 })); niche.position.set(o.x + 7, o.y + BS + 1.1, o.z + 10.42); S.add(niche);
      lv.oldNiche = KIT.glow(w, 0xffe0a0, 3, 0.7); lv.oldNiche.position.set(o.x + 7, o.y + BS + 1.4, o.z + 10.2); S.add(lv.oldNiche);
      [[-1, 0], [15, 0], [-1, 10.6], [15, 10.6], [-1, 5], [15, 5]].forEach(([x, z]) => { const c = new T2.Mesh(new T2.CylinderGeometry(0.2, 0.26, 3.6, 8), this.bark); c.position.set(o.x + x, o.y + BS + 1.8 - 0.2, o.z + z); c.castShadow = true; S.add(c); });
      // the rows: mats and small lamps, facing the old qibla; they will turn
      const matT = w.tex(128, (g, s) => { g.fillStyle = '#a8865a'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 6) { g.fillStyle = i % 12 ? 'rgba(80,50,24,.3)' : 'rgba(255,230,180,.2)'; g.fillRect(0, i, s, 3); } g.fillStyle = 'rgba(120,40,30,.6)'; g.fillRect(0, 0, s, 10); }, [1, 1]);
      const matM = new T2.MeshStandardMaterial({ map: matT, roughness: 1 });
      lv.rows = [];
      for (let rz = 0; rz < 3; rz++) for (let rx = 0; rx < 6; rx++) {
        const g = new T2.Group(); g.position.set(o.x + 1.4 + rx * 2.25, o.y + BS + 0.03, o.z + 2.2 + rz * 2.6); S.add(g); g.userData.dynamic = true;
        const m = new T2.Mesh(new T2.PlaneGeometry(0.9, 1.8).rotateX(-Math.PI / 2), matM); m.receiveShadow = true; g.add(m);
        const lamp = KIT.glow(w, 0xffd090, 0.7, 0.75); lamp.position.set(0, 0.35, 1.05); g.add(lamp);
        lv.rows.push({ g, turn: 0 });
      }
      // the new niche, raised where the way opens only when the world is turned half round
      const late = buildLevel(lv.L, true), extra = [], tops = [];
      late.B.forEach(k => { if (lv.g.B.has(k)) return; const [x, y, z] = k.split(',').map(Number); const b = new T2.BoxGeometry(BS, BS, BS); b.translate(o.x + x * BS + BS / 2, o.y + y * BS + BS / 2, o.z + z * BS + BS / 2); extra.push(b); if (!late.B.has(key(x, y + 1, z))) { const t = new T2.BoxGeometry(BS * 0.96, 0.08, BS * 0.96); t.translate(o.x + x * BS + BS / 2, o.y + (y + 1) * BS + 0.04, o.z + z * BS + BS / 2); tops.push(t); } });
      const lg = new T2.Group(); lg.userData.dynamic = true; S.add(lg);
      const lb = new T2.Mesh(SCAPE.merge(extra), wallM); lb.castShadow = lb.receiveShadow = true; lg.add(lb);
      const lt = new T2.Mesh(SCAPE.merge(tops), this.topMat); lg.add(lt);
      const g2 = lv.L.goal2, nx = o.x + g2[0] * BS + BS / 2, ny = o.y + (g2[1] + 1) * BS, nz = o.z + g2[2] * BS + BS / 2;
      const arch = new T2.Mesh(new T2.BoxGeometry(2.2, 3.2, 0.4), wallM); arch.position.set(nx - 0.4, ny + 1.6, nz - 1.0); arch.castShadow = true; lg.add(arch);
      const niche2 = new T2.Mesh(new T2.BoxGeometry(1.2, 2.2, 0.2), new T2.MeshStandardMaterial({ color: 0x2a1c14, roughness: 1 })); niche2.position.set(nx - 0.4, ny + 1.1, nz - 0.78); lg.add(niche2);
      lg.position.y = -14; lg.visible = false;
      lv.lateGroup = lg; lv.lateG = late;
    },
    tileWorld(lv, t) { const o = lv.org; return new T.Vector3(o.x + t[0] * BS + BS / 2, o.y + (t[1] + 1) * BS + 0.75, o.z + t[2] * BS + BS / 2); },
    graph() { const lv = this.levels[this.li]; return lv.late && lv.lateOn ? lv.lateG : lv.g; },
    neighbours(t, v) {
      const G = this.graph(), [sx, sz] = VIEWS[v], out = [];
      for (const n of N4) for (let k = -8; k <= 8; k++) { const b = [t[0] + n[0] + k * sx, t[1] + k, t[2] + n[2] + k * sz]; if (G.T.has(key(...b))) out.push({ b, n, k }); }
      return out;
    },
    route(from, to) {
      // breadth-first over the joins visible in the present view
      const v = this.view, seen = new Map([[key(...from), null]]), q = [from];
      while (q.length) { const t = q.shift(); if (key(...t) === key(...to)) break; this.neighbours(t, v).forEach(n => { const kk = key(...n.b); if (!seen.has(kk)) { seen.set(kk, { t, n }); q.push(n.b); } }); }
      if (!seen.has(key(...to))) return null;
      const out = []; let c = to; while (key(...c) !== key(...from)) { const s = seen.get(key(...c)); out.unshift({ from: s.t, to: c, n: s.n.n, k: s.n.k }); c = s.t; }
      return out;
    },
    screenOf(v3) { const p = v3.clone().project(this.w.camera), env = ENGINE.env; return { x: (p.x * 0.5 + 0.5) * env.w, y: (-p.y * 0.5 + 0.5) * env.h, z: p.z }; },
    tapAt(cx, cy) {
      if (this.li < 0 || this.turning || this.solved) return;
      const lv = this.levels[this.li], G = this.graph();
      // every tile whose top lies under the finger; prefer one the light can reach
      const cands = [];
      G.tiles.forEach(t => { const s = this.screenOf(this.tileWorld(lv, t).add(new T.Vector3(0, -0.7, 0))); const d = Math.hypot(s.x - cx, s.y - cy); if (d < this.tilePx() * 0.75) cands.push({ t, d, z: s.z }); });
      if (!cands.length) return;
      cands.sort((a, b) => a.d - b.d || a.z - b.z);
      let best = null;
      for (const c of cands) { const rt = this.route(this.cur, c.t); if (rt) { best = { c, rt }; break; } }
      const env = ENGINE.env;
      if (!best) { this.flash(cands[0].t, false); SND.sing(env.bus, 220, { vowel: 'u', dur: 0.6, gain: 0.025 }); this.nudge = 1; return; }
      this.flash(best.c.t, true); SND.bell(env.bus, 660, { gain: 0.02, glass: true });
      this.path = best.rt; this.stepT = 0;
    },
    tilePx() { const env = ENGINE.env; return BS / (this.orthoH * 2) * env.h * 1.15; },
    flash(t, ok) { const lv = this.levels[this.li]; this.hover.position.copy(this.tileWorld(lv, t)).add(new T.Vector3(0, -0.7, 0)); this.hover.material.opacity = 1; this.hover.material.color.set(ok ? 0xfff2d6 : 0xff9a7a); },
    turn(dir) {
      if (this.mode !== 'puzzle' || this.turning || this.path.length || this.li < 0 || this.solved) { if (this.mode === 'puzzle' && !this.solved) this.turnQueued = dir; return; }
      this.view = (this.view + (dir > 0 ? 1 : 3)) % 4; this.turning = 1;
      SND.swell(ENGINE.env.bus, { f0: dir > 0 ? 300 : 700, f1: dir > 0 ? 700 : 300, dur: 0.8, gain: 0.035 });
      SND.sing(ENGINE.env.bus, [196, 220, 246.94, 293.66][this.view], { vowel: 'o', dur: 1.2, gain: 0.03, voices: 2, delay: 0.2 });
      this.turns = (this.turns || 0) + 1;
    },
    startLevel(i, glide) {
      const w = this.w, L = LEVELS[i];
      this.li = i; this.cur = L.start.slice(); this.path = []; this.view = 0; this.solved = false; this.phase2 = false;
      const lv = this.levels[i];
      if (lv.L.late) { lv.lateOn = false; lv.lateGroup.visible = false; lv.lateGroup.position.y = -14; }
      this.goalTile = L.goal;
      w.activity(L.title, 3, L.step); w.progress(i);
      this.camTgt = this.camTgt || new T.Vector3();
      const c = this.levelCentre(lv);
      if (glide) { this.glide = { from: this.camTgt.clone(), to: c, t: 0 }; } else this.camTgt.copy(c);
      this.flyLamp = { from: this.lamp.position.clone(), to: this.tileWorld(lv, L.start), t: 0 };
      this.enterPuzzle();
    },
    levelCentre(lv) { const ts = lv.g.tiles; const c = new T.Vector3(); ts.forEach(t => c.add(this.tileWorld(lv, t))); c.multiplyScalar(1 / ts.length); c.y -= 1; return c; },
    enterPuzzle() {
      const w = this.w; this.mode = 'puzzle';
      if (!this.camFn) this.camFn = dt => this.isoCam(dt);
      w.mode = this.camFn; w.focus = null; this.bar.style.opacity = 1; this.bar.querySelectorAll('button').forEach(b => { b.style.visibility = ''; });
      this.walkBtn.innerHTML = '🚶'; w.goal(null);
    },
    toggleWalk() {
      const w = this.w; if (this.li < 0) return;
      if (this.mode === 'puzzle') {
        if (this.path.length || this.turning) return;
        this.mode = 'walk'; w.mode = null; w.camera.updateProjectionMatrix();
        const lv = this.levels[this.li]; const c = this.levelCentre(lv), [sx, sz] = VIEWS[this.view];
        w.pos.set(c.x + sx * 22, 0, c.z + sz * 22); w.yaw = Math.atan2(sx, sz); w.pitch = -0.05;
        this.bar.querySelectorAll('button').forEach(b => { if (b !== this.walkBtn) b.style.visibility = 'hidden'; });
        this.walkBtn.innerHTML = '⌂'; this.hover.material.opacity = 0;
        w.step('Walking the land · press V (or ⌂) to return to the light'); w.goal([c.x, c.y, c.z]);
      } else { this.enterPuzzle(); w.step(this.phase2 ? 'The qibla has turned: find the way to the new niche' : LEVELS[this.li].step); }
    },
    isoCam(dt) {
      const w = this.w, cam = w.camera, env = ENGINE.env;
      // the view turns smoothly between the four corners
      const target = this.view * Math.PI / 2;
      let d = target - this.viewA; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.viewA += d * (1 - Math.exp(-dt * 7));
      if (this.turning && Math.abs(d) < 0.003) { this.viewA = target; this.turning = 0; if (this.turnQueued) { const q = this.turnQueued; this.turnQueued = 0; this.turn(q); } }
      if (this.glide) { this.glide.t += dt / 3.5; const k = U.ease(U.clamp(this.glide.t)); this.camTgt.copy(this.glide.from).lerp(this.glide.to, k); if (this.glide.t >= 1) this.glide = null; }
      const a = Math.PI / 4 + this.viewA, D = 140;   // view 0 looks from (+x,+z)
      const dir = new T.Vector3(Math.cos(a) * Math.SQRT2, 1, Math.sin(a) * Math.SQRT2).normalize();
      cam.position.copy(this.camTgt).addScaledVector(dir, D); cam.up.set(0, 1, 0); cam.lookAt(this.camTgt);
      this.orthoH = U.damp(this.orthoH || 30, this.li === 2 ? 15 : 16, 2, dt);
      const hh = this.orthoH * (env.w < 640 ? 1.35 : 1), ww = hh * env.w / env.h;
      cam.projectionMatrix.makeOrthographic(-ww, ww, hh, -hh, 1, 1200); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
      w.pos.set(this.camTgt.x, 0, this.camTgt.z);
      if (w._shadow) { const L = w._shadow.light; L.target.position.set(this.camTgt.x, 0, this.camTgt.z); L.position.copy(L.target.position).add(w._shadow.off); }
      // hover ring under the pointer
      const p = ENGINE.pointer;
      if (!this.turning && p.inside && this.li >= 0 && !matchMedia('(pointer: coarse)').matches) {
        const lv = this.levels[this.li]; let best = null, bd = this.tilePx() * 0.7;
        this.graph().tiles.forEach(t => { const s = this.screenOf(this.tileWorld(lv, t).add(new T.Vector3(0, -0.7, 0))); const dd = Math.hypot(s.x - p.x, s.y - p.y); if (dd < bd) { bd = dd; best = t; } });
        if (best && this.hover.material.opacity < 0.5) { this.hover.position.copy(this.tileWorld(lv, best)).add(new T.Vector3(0, -0.7, 0)); this.hover.material.color.set(0xfff2d6); this.hover.material.opacity = 0.45; }
      }
    },
    walkStep(dt) {
      // the light walks the route; across a join it slips along the line of sight, unseen
      const lv = this.levels[this.li];
      if (this.flyLamp) { this.flyLamp.t += dt / 3.2; const k = U.ease(U.clamp(this.flyLamp.t)); this.lamp.position.copy(this.flyLamp.from).lerp(this.flyLamp.to, k); this.lamp.position.y += Math.sin(k * Math.PI) * 10; if (this.flyLamp.t >= 1) this.flyLamp = null; return; }
      if (!this.path.length || this.turning) { if (!this.path.length) this.lamp.position.lerp(this.tileWorld(lv, this.cur), 1 - Math.exp(-dt * 10)); return; }
      const s = this.path[0]; this.stepT += dt / 0.34;
      const k = U.clamp(this.stepT), A = this.tileWorld(lv, s.from), [sx, sz] = VIEWS[this.view];
      const p = A.clone().add(new T.Vector3(s.n[0], 0, s.n[2]).multiplyScalar(BS * k));
      if (k > 0.5 && s.k) p.add(new T.Vector3(sx, 1, sz).multiplyScalar(s.k * BS));
      p.y += Math.sin(k * Math.PI) * 0.25;
      this.lamp.position.copy(p);
      if (this.stepT >= 1) {
        this.cur = s.to; this.path.shift(); this.stepT = 0;
        SND.step(ENGINE.env.bus, { gain: 0.03, f: 1400 });
        if (s.k) { SND.bell(ENGINE.env.bus, 784, { gain: 0.025, glass: true }); SND.swell(ENGINE.env.bus, { f0: 600, f1: 1800, dur: 0.6, gain: 0.02 }); }
        this.checkTile();
      }
    },
    checkTile() {
      const w = this.w, env = ENGINE.env, L = LEVELS[this.li], lv = this.levels[this.li], c = key(...this.cur);
      // a light resting off the path holds a verse
      if (L.disc && c === key(...L.disc) && !lv.discFound) { lv.discFound = true; const d = this.puzzleDisc[this.li]; w.say(d.title, d.text, { ar: d.ar, ms: 11000 }); SND.bell(env.bus, 880, { gain: 0.03 }); SND.bell(env.bus, 1174.66, { gain: 0.025, delay: 0.25 }); }
      if (c !== key(...this.goalTile)) return;
      this.path = [];
      if (this.li === 2 && !this.phase2) return this.qiblaTurns();
      this.solved = true;
      SND.glow(env.bus, [196, 220, 146.83][this.li], { gain: 0.06, dur: 6 }); SND.bell(env.bus, 587.33, { gain: 0.035, delay: 0.3, glass: true });
      if (this.li < 2) { w.progress(this.li + 1); this.later(2.2, () => this.startLevel(this.li + 1, true)); }
      else this.finale();
    },
    qiblaTurns() {
      // at the old niche: the verse comes, the old niche dims, and the new niche rises behind
      const w = this.w, env = ENGINE.env, lv = this.levels[2];
      this.phase2 = true; this.solved = true;
      SND.glow(env.bus, 146.83, { gain: 0.07, dur: 10, vowel: 'a' }); SND.glow(env.bus, 220, { gain: 0.04, dur: 9, delay: 1.2, vowel: 'o' });
      w.say('The qibla turns', 'He loved to face the Ka‘bah. Then the verse came: <span class="q">“So turn your face toward al-Masjid al-Haram; and wherever you are, turn your faces toward it.”</span> (Qur’an 2:144; Sahih al-Bukhari 399)', { ar: 'فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ', ms: 14000 });
      lv.lateGroup.visible = true; this.rising = 0;
      this.later(4.5, () => {
        lv.lateOn = true; this.solved = false; this.goalTile = LEVELS[2].goal2;
        w.step('The qibla has turned. The way to the new niche opens only when the world is turned half round');
        SND.bell(env.bus, 523.25, { gain: 0.03, glass: true });
      });
    },
    finale() {
      const w = this.w, env = ENGINE.env, lv = this.levels[2];
      w.progress(3);
      // the rows turn where they are, as they were, mid-prayer
      lv.rows.forEach((r, i) => { r.turnAt = w.time + 0.6 + (i % 6) * 0.12 + Math.floor(i / 6) * 0.25; });
      SND.glow(env.bus, 146.83, { gain: 0.08, dur: 12, vowel: 'a' }); SND.glow(env.bus, 293.66, { gain: 0.04, dur: 10, delay: 1.5, vowel: 'o' });
      this.later(3, () => w.say('Two qiblas', 'The first prayer he prayed toward the Ka‘bah was the afternoon prayer. A man who had prayed with him passed a mosque whose people were bowing; he told them, and they turned toward the Ka‘bah as they were. (Sahih al-Bukhari 40)', { ms: 15000 }));
      this.later(9, () => { w.finish('The qibla has turned toward the Ka‘bah'); w.step('Turn the world and look, or walk the land (V)'); this.solved = false; this.done = true; });
    },
    later(dt, fn) { this.queue.push([this.w.time + dt, fn]); },

    film(env, w) {
      const h = this.levels[2].org, hx = h.x + 7, hz = h.z + 5, hy = h.y + 2;
      return [
        { dur: 7, fade: 'dip', title: true, fov: [46, 40], path: [[[-160, 80, 120], [0, 0, -40]], [[-110, 60, 90], [0, 4, -50]], [[-70, 44, 60], [4, 4, -60]]] },
        { dur: 6.5, fade: 'dip', line: 'For sixteen or seventeen months, the prayer faced Jerusalem.', ar: 'صَلَّى نَحْوَ بَيْتِ الْمَقْدِسِ سِتَّةَ عَشَرَ أَوْ سَبْعَةَ عَشَرَ شَهْرًا', lineAt: 0.5,
          path: [[[hx, hy + 1.6, hz - 9], [hx, hy + 1.2, hz + 6]], [[hx + 1, hy + 1.3, hz - 5], [hx, hy + 1.4, hz + 6]]] },
        { dur: 6.5, fade: 'cut', line: 'He loved to face the Ka‘bah, and turned his face toward the sky.', ar: 'وَكَانَ يُحِبُّ أَنْ يُوَجَّهَ إِلَى الْكَعْبَةِ', lineAt: 0.5,
          path: [[[hx - 3, hy + 1.6, hz - 2], [hx - 3, hy + 4, hz - 4]], [[hx - 3, hy + 1.6, hz - 2], [hx - 6, hy + 30, hz - 20]]], fov: [55, 60] },
        { dur: 6.5, fade: 'white', line: '“So turn your face toward al-Masjid al-Haram.” (Qur’an 2:144)', ar: 'فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ', lineAt: 0.6,
          path: [[[-50, 30, 40], [-70, 4, 52]], [[-30, 40, 0], [0, 4, -40]]] },
        { dur: 6.5, fade: 'cut', line: 'A man passed a mosque at the afternoon prayer. They turned as they bowed.', ar: 'فَمَرَّ عَلَى أَهْلِ مَسْجِدٍ وَهُمْ رَاكِعُونَ فَدَارُوا', lineAt: 0.5,
          path: [[[hx + 14, hy + 3, hz - 10], [hx, hy, hz]], [[hx + 10, hy + 2.4, hz + 2], [hx, hy, hz]]], ease: 'linear' },
        { dur: 6.5, fade: 'dip', line: 'Turn the world, and find the way.', ar: 'أَدِرِ الْعَالَمَ، وَاهْتَدِ إِلَى الطَّرِيق', lineAt: 0.6,
          path: [[[-20, 60, 110], [-70, 4, 52]], [[-30, 50, 80], [-66, 4, 50]]] },
      ];
    },
    filmOpts: {
      end(w) { const st = ENGINE.cur; if (!st || !st.levels) return; st.dip('#f6efe2', 0.2); st.startLevel(0, false); },
    },
    dip(color, hold, fn) { this.fadeEl.style.background = color; this.dipV = 1; this.dipGoal = 1; this.later(0.05, () => { fn && fn(); this.later(hold || 0.2, () => { this.dipGoal = 0; }); }); },

    onKey(env, e) {
      if (e.repeat || !this.w || this.w.filmS) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'v') return this.toggleWalk();
      if (this.mode !== 'puzzle') return;
      if (k === 'q' || k === 'ArrowLeft') this.turn(1);
      if (k === 'e' || k === 'ArrowRight') this.turn(-1);
      // W / S / A / D step to the neighbour that lies that way on the screen
      const dirs = { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (dirs[k] && !this.path.length && !this.turning && this.li >= 0 && !this.solved) {
        const lv = this.levels[this.li], here = this.screenOf(this.tileWorld(lv, this.cur)); let best = null, bs = 0.5;
        this.neighbours(this.cur, this.view).forEach(n => { const s = this.screenOf(this.tileWorld(lv, n.b)); const dx = s.x - here.x, dy = s.y - here.y, l = Math.hypot(dx, dy) || 1, dot = (dx * dirs[k][0] + dy * dirs[k][1]) / l; if (dot > bs) { bs = dot; best = n; } });
        if (best) { this.path = [{ from: this.cur, to: best.b, n: best.n, k: best.k }]; this.stepT = 0; }
      }
    },
    move(env, p, e) { if (this.w && this.mode !== 'puzzle') this.w.move(p, e); },

    update(env, dt) {
      const w = this.w; if (!w) return;
      if (this.queue.length) { const due = this.queue.filter(q => w.time >= q[0]); this.queue = this.queue.filter(q => w.time < q[0]); due.forEach(q => q[1]()); }
      if (!w.filmS) { this.dipV = U.damp(this.dipV, this.dipGoal, 6, dt); this.fadeEl.style.opacity = this.dipV < 0.004 ? 0 : this.dipV.toFixed(3); }
      if (this.li >= 0 && !w.filmS) this.walkStep(dt);
      w.update(dt);
      const t = w.time;
      this.lampGlow.scale.setScalar(2.1 + Math.sin(t * 2.6) * 0.15 + (this.nudge || 0) * 0.8); this.nudge = U.damp(this.nudge || 0, 0, 4, dt);
      this.lampLight.intensity = 1.4 + Math.sin(t * 5) * 0.1;
      this.hover.material.opacity = U.damp(this.hover.material.opacity, 0, 3, dt);
      this.lamp.visible = !w.filmS;
      // the goal
      if (this.li >= 0) {
        const lv = this.levels[this.li], gp = this.tileWorld(lv, this.goalTile);
        this.goalGlow.position.copy(gp); this.goalGlow.material.opacity = this.solved ? 0.3 : 0.7 + 0.2 * Math.sin(t * 3);
        this.goalBeam.position.set(gp.x, gp.y + 7, gp.z); this.goalBeam.material.opacity = this.solved || w.filmS ? 0 : 0.22 + 0.08 * Math.sin(t * 2);
      }
      // the new niche rises out of the ground
      const hall = this.levels[2];
      if (hall.lateGroup.visible) { hall.lateGroup.position.y = U.damp(hall.lateGroup.position.y, 0, 1.3, dt); hall.oldNiche.material.opacity = U.damp(hall.oldNiche.material.opacity, this.phase2 ? 0.15 : 0.7, 1, dt); }
      hall.rows.forEach(r => { if (r.turnAt && t > r.turnAt) { r.turn = U.damp(r.turn, 1, 2.2, dt); r.g.rotation.y = r.turn * Math.PI; } });
      // the hum of the light: higher as it nears the goal
      if (this.li >= 0 && this.mode === 'puzzle' && !w.filmS) {
        const lv = this.levels[this.li], d = this.lamp.position.distanceTo(this.tileWorld(lv, this.goalTile));
        this.hum.set(196 * Math.pow(2, U.clamp(1 - d / 30) * 0.5), 0.4); this.hum.setGain(this.solved ? 0.004 : 0.006 + 0.008 * U.clamp(1 - d / 30), 0.5);
      } else this.hum.setGain(0, 0.5);
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 2 + Math.random() * 4; Math.random() < 0.4 ? SND.coo(env.bus, { gain: 0.025 }) : SND.chirp(env.bus, { gain: 0.014 }); }
    },
  }));
})();
