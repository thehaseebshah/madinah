/* Makkah — The Ka'bah Rebuilt, c. 605 CE.
   A whole valley: the courtyard where the House is being rebuilt, the stone houses of Quraysh, the
   timber yard with the wrecked ship's beams, the dry wadi and the quarry on the slope of Abu Qubays.
   The game is a falling-block stacker played in a crane view over the rising wall: stones and teak
   beams are lowered on ropes; move, turn and set them so each course is complete (Ibn Ishaq; the
   courses of teak and stone after al-Halabi). Then the Black Stone on a cloak: tilt to keep it level
   while the four corners rise together. No person is depicted: clans are banners, lights and voices. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const ID = 'kabah';
  const KW = 11.7, KD = 10.2, HW = KW / 2, HD = KD / 2;            // the House: north-east face along x, south-east face along z
  const COLS = 10, ROWS = 11, CH = 0.42, Y0 = 0.36, DEPTH = 0.8;  // the stacking well on each face
  const FULL_H = 8.6;                                              // eighteen cubits
  const START = { x: 3, z: -HD - 15, yaw: Math.PI };
  const CRANE_A = { x: 0, z: -HD - 3.4 }, CRANE_B = { x: HW + 3.4, z: 0 };
  const CLOAK0 = { x: HW + 6.6, z: -HD - 6.6 }, CORNER = { x: HW, z: -HD };
  const FACES = {
    A: { o: [HW, -HD], u: [-1, 0], n: [0, -1], len: KW, niche: [[0, 2], [0, 3]], teak: [], name: 'north-east' },
    B: { o: [HW, HD], u: [0, -1], n: [1, 0], len: KD, niche: [[9, 2], [9, 3]], teak: [1, 3], name: 'south-east' },
  };
  const SHAPES = {
    I2: [[0, 0], [1, 0]], I3: [[0, 0], [1, 0], [2, 0]], I4: [[0, 0], [1, 0], [2, 0], [3, 0]],
    O: [[0, 0], [1, 0], [0, 1], [1, 1]], L: [[0, 0], [1, 0], [2, 0], [2, 1]], J: [[0, 0], [1, 0], [2, 0], [0, 1]],
    T: [[0, 0], [1, 0], [2, 0], [1, 1]], S: [[0, 0], [1, 0], [1, 1], [2, 1]], Z: [[1, 0], [2, 0], [0, 1], [1, 1]],
  };
  const TINTS = ['#bdb4a8', '#aea69c', '#c6baa8', '#a89e94', '#b8aa96', '#b4ada4'];
  const CLANS = [0x8a2a22, 0x2a4a7a, 0x3a6a3a, 0xb8902e];

  /* ---------------- small helpers (local to this station) ---------------- */
  const linen = (w, hex, rep) => { const c = new T.Color(hex).convertSRGBToLinear(), a = [0.292, 0.419, 0.627]; const m = PHOTO.mat(w, 'rough_linen', { rep: rep || [1, 1], side: T.DoubleSide }); if (PHOTO.enabled) m.color.setRGB(c.r / a[0], c.g / a[1], c.b / a[2]); else m.color.set(hex); return m; };
  const tri = (w, id, k, fb, col) => { const m = PHOTO.mat(w, id, { triplanar: k, fallback: fb, color: col }); if (!PHOTO.enabled) SCAPE.triplanar(m, k); return m; };
  function box(g, mat, sx, sy, sz, x, y, z, ry, cast) {
    const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    m.castShadow = cast !== false; m.receiveShadow = true; g.add(m); return m;
  }
  function cyl(g, mat, r0, r1, h, x, y, z, rx, rz, seg) {
    const m = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg || 7), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, 0, rz || 0);
    m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  }
  /* A soft-edged patch of another ground texture laid over the terrain (a trodden courtyard, a lane). */
  function patch(w, x, z, r, id, rep, col) {
    if (!PHOTO.enabled) return null;
    const g = new T.RingGeometry(0.01, r, 48, 10); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv, C = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i), pz = p.getZ(i), d = Math.hypot(px, pz) / r;
      p.setY(i, w.ground(x + px, z + pz) + 0.03); uv.setXY(i, (x + px) * rep, (z + pz) * rep);
      const a = U.clamp((1 - U.smooth(0.55, 1, d + U.noise2(px * 0.3 + x, pz * 0.3) * 0.18)));
      C.set([1, 1, 1, a], i * 4);
    }
    g.setAttribute('color', new T.BufferAttribute(C, 4)); g.computeVertexNormals();
    const m = PHOTO.mat(w, id, { rep: [1, 1], color: col || '#ffffff' });
    m.vertexColors = true; m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2;
    const mesh = new T.Mesh(g, m); mesh.receiveShadow = true; mesh.position.set(x, 0, z); mesh.userData.dynamic = true; mesh.renderOrder = 1; w.scene.add(mesh);
    return mesh;
  }
  function shadowAt(w, x, z) {
    if (!w._shadow) return; const L = w._shadow.light, s = 1.5, px = Math.round(x / s) * s, pz = Math.round(z / s) * s;
    L.target.position.set(px, 0, pz); L.position.set(px + w._shadow.off.x, w._shadow.off.y, pz + w._shadow.off.z);
  }
  /* A flat-roofed house of Quraysh: stone or mud walls, a parapet, palm-log roof beams, a plank door, small windows. */
  function house(g, M, ground, x, z, hw, hd, hh, ry, r) {
    const grp = new T.Group(); grp.rotation.y = ry;
    const c = Math.cos(ry), s = Math.sin(ry);
    let y0 = 1e9; for (const [a, b] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) y0 = Math.min(y0, ground(x + a * c + b * s, z - a * s + b * c));
    grp.position.set(x, y0, z);
    const wall = M.walls[(r() * M.walls.length) | 0];
    const body = box(grp, wall, hw * 2, hh + 0.8, hd * 2, 0, (hh + 0.8) / 2 - 0.8, 0);
    { const p = body.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const jx = p.getX(i), jz = p.getZ(i); if (p.getY(i) > 0) p.setY(i, p.getY(i) + Math.sin(jx * 7.1 + jz * 3.3 + x) * 0.12); else { p.setX(i, jx * 1.03); p.setZ(i, jz * 1.03); } } body.geometry.computeVertexNormals(); }
    box(grp, M.roof, hw * 2 - 0.3, 0.06, hd * 2 - 0.3, 0, hh + 0.03, 0, 0, false);
    const ph = 0.45 + r() * 0.5, pt = 0.25;
    box(grp, wall, hw * 2, ph, pt, 0, hh + ph / 2, hd - pt / 2); box(grp, wall, hw * 2, ph, pt, 0, hh + ph / 2, -hd + pt / 2);
    box(grp, wall, pt, ph, hd * 2 - pt * 2, hw - pt / 2, hh + ph / 2, 0); box(grp, wall, pt, ph, hd * 2 - pt * 2, -hw + pt / 2, hh + ph / 2, 0);
    // roof beams poking out of the front and back walls
    const nb = Math.max(2, Math.floor(hw * 2 / 0.9));
    for (let i = 0; i < nb; i++) { const bx = -hw + 0.45 + i * ((hw * 2 - 0.9) / (nb - 1)); cyl(grp, M.beam, 0.09, 0.1, 0.55, bx, hh - 0.18, hd + 0.18, Math.PI / 2, 0, 6); if (r() < 0.6) cyl(grp, M.beam, 0.09, 0.1, 0.5, bx, hh - 0.18, -hd - 0.16, Math.PI / 2, 0, 6); }
    // a second storey on some
    if (r() < 0.42 && hw > 2.4) {
      const uw = hw * (0.45 + r() * 0.3), ud = hd * (0.5 + r() * 0.3), uh = 2.3 + r() * 0.7, ox = (r() - 0.5) * (hw - uw);
      box(grp, wall, uw * 2, uh, ud * 2, ox, hh + uh / 2, -hd + ud + 0.3);
      box(grp, wall, uw * 2, 0.4, 0.22, ox, hh + uh + 0.2, -hd + 0.3 + ud * 2 - 0.11);
      box(grp, M.dark, 0.45, 0.55, 0.06, ox, hh + uh * 0.55, -hd + 0.3 + ud * 2 + 0.03, 0, false);
    }
    // door with its lintel, a step, a window or two, a water spout
    const dx = (r() - 0.5) * (hw * 2 - 2.2);
    box(grp, M.door, 1.0, 1.95, 0.12, dx, 0.97, hd + 0.02);
    box(grp, M.beam, 1.5, 0.2, 0.22, dx, 2.05, hd + 0.06);
    box(grp, M.stone, 1.4, 0.18, 0.5, dx, 0.05, hd + 0.3);
    if (r() < 0.8) { const wx = dx + (dx > 0 ? -1 : 1) * (1.4 + r()); if (Math.abs(wx) < hw - 0.5) box(grp, M.dark, 0.5, 0.55, 0.06, wx, Math.min(hh - 0.8, 2.2), hd + 0.03, 0, false); }
    if (r() < 0.5) cyl(grp, M.beam, 0.06, 0.07, 0.7, hw * (r() - 0.5), hh + 0.1, hd + 0.3, Math.PI / 2 - 0.3, 0, 5);
    g.add(grp);
    return { x, z, hw, hd, ry };
  }

  ENGINE.register(WORLD.stage({
    key: ID,
    arabic: 'بِنَاءُ الكَعْبَة',
    title: 'The Ka‘bah Rebuilt',
    era: 'Makkah · c. 605 CE · five years before the first revelation',
    hint: 'WASD walk · E at a scaffold · crane view: A/D move, W turn, S lower, Space set, Q step back',
    hintTouch: 'Left thumb walks · tap E at a scaffold · in the crane view use the buttons or swipe',
    sound: { reverb: 0.4 },
    story: `<p>When Muhammad ﷺ was about thirty-five, Quraysh pulled down the Ka‘bah, then only loose stones a little above a man’s height, and rebuilt it in courses of stone and teak. He carried stones for it alongside his uncle al-‘Abbas.</p>
            <p>When the walls reached the place of the Black Stone, every clan wanted the honour of setting it. They agreed that the first man to come in would judge. It was Muhammad, whom they called <i>al-Amin</i>, the trustworthy; he laid the stone on a cloth and asked each clan to lift an edge together.</p>`,

    film(env, w) {
      const self = this;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [50, 42],
          path: [[[110, 70, -104], [-90, 64, 90]], [[76, 46, -74], [-60, 34, 60]]],
          start: () => { SND.swell(env.bus, { f0: 160, f1: 420, dur: 6, gain: 0.04 }); } },
        { dur: 6, fade: 'dip', line: 'Its walls were loose stones, roofless, a little above a man’s height.', ar: 'كانت جدرانُه حجارةً مرصوفةً بلا سقف، فوق القامة بقليل.',
          path: [[[-24, 1.9, -19], [-9, 0.8, -7]], [[-15, 1.4, -23], [-3, 0.9, -6]]], ease: 'linear' },
        { dur: 6, fade: 'cut', line: 'The sea cast a merchant’s ship ashore at Jeddah. Its timber will roof the House.', ar: 'ألقى البحرُ سفينةً لتاجرٍ روميٍّ بجُدّة، فأخذوا خشبها لسقف البيت.',
          path: [[[-40, 3.2, 26], [-26, 0.8, 14]], [[-33, 2.2, 4], [-24, 0.8, 15]]], ease: 'linear' },
        { dur: 7, fade: 'dip', lines: [[0.3, 'Al-Walid ibn al-Mughirah struck first. The city waited a night.', 'بدأ الوليدُ بنُ المغيرة الهدم، وتربّص الناسُ ليلة.'], [3.6, 'Beneath lay Ibrahim’s foundation: green stones like camel humps.', 'وتحته أساسُ إبراهيم: حجارةٌ خضرٌ كالأسنمة.']],
          path: [[[-6, 3.2, -HD - 10], [0, 0.3, -HD - 1]], [[-2.5, 2.0, -HD - 5.5], [0.5, 0.3, -HD - 1]]], ease: 'glide' },
        { dur: 6, fade: 'cut', line: 'Each clan gathered its own stones and raised its own part.', ar: 'جمعت كلُّ قبيلةٍ حجارتها، وبنت كلٌّ منها ناحيتها.',
          path: [[[28, 11, 26], [0, 2, 0]], [[34, 9, -16], [0, 2, 0]], [[14, 8, -32], [0, 2, 0]]], ease: 'linear',
          start: () => { self.banners.forEach(b => { b.rise = 0; }); },
          during: (w2, k) => { self.banners.forEach((b, i) => { b.rise = U.clamp(k * 1.6 - i * 0.15); }); } },
        { dur: 6, fade: 'dip', line: 'Course by course, the walls must rise to the corner of the Black Stone.', ar: 'مِدماكًا بعد مِدماك، تعلو الجدرانُ حتى موضع الحجر الأسود.',
          path: [[[HW + 9, 2.6, -HD - 9], [HW, 1.3, -HD]], [[HW + 4.2, 1.7, -HD - 4.4], [HW, 1.3, -HD]]], ease: 'glide',
          start: () => { SND.glow(env.bus, 196, { gain: 0.05, dur: 6 }); },
          during: (w2, k) => { self.nicheGlow.material.opacity = 0.35 + 0.4 * Math.sin(k * Math.PI); } },
        { dur: 6, fade: 'dip', line: 'He carried stones for it with his uncle al-‘Abbas (Sahih al-Bukhari).', ar: 'وكان ﷺ ينقل الحجارة مع عمّه العبّاس (صحيح البخاري).',
          path: [[[CRANE_A.x - 6, 11, CRANE_A.z - 14], [0, 1.5, -HD]], [[START.x + 1, 4, START.z - 4], [0, 1.2, -HD]]] },
      ];
    },
    filmOpts: { end(w) { const s = ENGINE.cur; if (s && s.banners) s.banners.forEach(b => { b.rise = 1; }); if (s && s.nicheGlow) s.nicheGlow.material.opacity = 0.4; w.pos.set(START.x, 0, START.z); w.yaw = START.yaw; w.pitch = -0.05; } },

    enter(env) {
      const self = this; this.env = env;
      /* ---------------- the valley of Makkah ---------------- */
      const H = (x, z) => {
        const d = Math.hypot(x * 0.92, z * 0.72);
        let y = Math.max(0, d - 135); y = y * 0.72 * (0.55 + 0.9 * (SCAPE.fbm(x * 0.006 + 3, z * 0.006, 3) * 0.5 + 0.5));
        if (y > 90) y = 90 + (y - 90) * 0.25;
        y += SCAPE.ridge(x * 0.014, z * 0.014, 5) * 42 * U.smooth(125, 200, d) + SCAPE.ridge(x * 0.05, z * 0.05, 3) * 7 * U.smooth(128, 160, d);
        y += 80 * Math.exp(-((x - 230) ** 2 + (z + 20) ** 2) / (2 * 70 * 70));        // Abu Qubays to the east
        y += 26 * U.smooth(95, 150, x) * (0.6 + 0.4 * SCAPE.fbm(x * 0.03, z * 0.03, 3)); // its first slopes, the quarry
        const wadi = Math.exp(-((x + 78 + Math.sin(z * 0.02) * 10) ** 2) / (2 * 9 * 9));  // the dry wadi to the west
        y -= wadi * 1.6;
        const flat = U.smooth(24, 40, Math.hypot(x, z));
        y += (SCAPE.fbm(x * 0.04, z * 0.04, 3) * 0.9 + SCAPE.fbm(x * 0.25, z * 0.25, 2) * 0.12) * flat + 0.04 * U.noise2(x * 0.5, z * 0.5);
        return y;
      };
      const w = this.w = WORLD.create(env, {
        start: START, exposure: 0.8, far: 1600, fov: 66,
        fog: { color: 0xd8c6aa, density: 0.0016 }, bounds: [-130, -130, 130, 130],
      });
      const S = w.scene;
      const ter = SCAPE.terrain(w, { size: 1100, seg: 300, height: H, rock: [0.86, 0.95], rockHeight: [6, 18],
        colors: { low: '#b89e80', high: '#a88e70', rock: '#5c5049', dark: '#3c332f' },
        tex: 'gravel', rockTex: 'granite', photo: { ground: 'gravelly_sand', rock: 'rock_face_03', normal: 1 }, rep: 0.22, rockRep: 0.085 });
      w.ground = ter.ground;
      w.surface = (x, z) => (Math.hypot(x, z) < 30 ? 'gravel' : 'sand');
      w.sky({ top: '#5f8fc4', mid: '#e8d6b8', bot: '#d8c4a8', sunDir: [0.5, 0.5, 0.6], sun: '#ffe2b0', sunSize: 0.0016, clouds: 0.3, haze: 0.4 });
      const sun = new T.DirectionalLight(0xfff0dc, 1.85); sun.position.set(60, 28, -44); S.add(sun);
      S.add(new T.HemisphereLight(0xbdd4f0, 0x9a7a5a, PHOTO.enabled ? 0.12 : 0.7));
      w.followShadow(sun, 46, 2048);
      PHOTO.sky(w, 'qwantani_morning_puresky', { sun, intensity: 0.7, rotation: -1.27, haze: '#dccab0', horizon: 0.45, ground: '#b89c7c' }).then(r => { if (r && r.sunDir && w._shadow) w._shadow.off.copy(r.sunDir).multiplyScalar(46 * 2.5); // PHOTO.sky leaves the shadow offset at unit length
        if (r && r.sunDir && self.post && self.post.rays) self.post.rays.dir = r.sunDir.toArray(); });
      SCAPE.horizon(w, { haze: '#dccab0', layers: [{ r: 650, h: 120, color: '#8c766a', seed: 21 }, { r: 950, h: 150, color: '#a89488', seed: 33 }, { r: 1350, h: 170, color: '#c4b6aa', seed: 41 }] });

      /* ---------------- materials ---------------- */
      const M = this.M = {
        walls: [tri(w, 'old_stone_wall', 0.42, KIT.mudBrick(w, [1, 1]), '#d6d0c6'), tri(w, 'clay_plaster', 0.3, KIT.plaster(w, [1, 1], '#e6dccb'), '#fff2de'),
                tri(w, 'brown_mud_dry', 0.28, KIT.mudBrick(w, [1, 1]), '#d8c0a6'), tri(w, 'clay_block_wall', 0.4, KIT.mudBrick(w, [1, 1]), '#e2ccb0'), tri(w, 'old_stone_wall', 0.38, KIT.mudBrick(w, [1, 1]), '#b8aca0')],
        roof: tri(w, 'mud_cracked_dry_03', 0.25, KIT.sand(w, [1, 1]), '#a08c78'),
        beam: PHOTO.mat(w, 'medieval_wood', { rep: [0.4, 1], color: '#a88a6a', fallback: KIT.wood(w, [1, 1], '#6a4a30') }),
        door: PHOTO.mat(w, 'old_planks_02', { rep: [0.8, 1.2], color: '#b09878', fallback: KIT.wood(w, [1, 1], '#5a3a22') }),
        stone: tri(w, 'dry_riverbed_rock', 0.5, KIT.basalt(w, [1, 1]), '#c8beb4'),
        dark: new T.MeshStandardMaterial({ color: 0x1c1612, roughness: 1 }),
        pole: PHOTO.mat(w, 'palm_tree_bark', { rep: [1, 3], color: '#b8a088', fallback: KIT.bark(w) }),
        plank: PHOTO.mat(w, 'old_planks_02', { rep: [2, 0.4], color: '#c0a888', fallback: KIT.wood(w, [3, 1], '#7a5838') }),
        log: PHOTO.mat(w, 'medieval_wood', { rep: [1, 2], color: '#b09070', fallback: KIT.wood(w, [1, 2], '#6a4a30') }),
        linen: linen(w, '#d8c4a2', [2, 2]), linen2: linen(w, '#a8643c', [2, 2]), linen3: linen(w, '#c9b48a', [2, 2]),
        wallCore: tri(w, 'dry_riverbed_rock', 0.6, KIT.basalt(w, [1, 1]), '#bfb3a6'),
        teakCore: tri(w, 'old_planks_02', 0.9, KIT.wood(w, [1, 1], '#6a4a30'), '#a07c58'),
        found: tri(w, 'dry_riverbed_rock', 0.5, KIT.basalt(w, [1, 1]), '#9fae98'),
        blockStone: PHOTO.mat(w, 'rock_boulder_dry', { rep: [0.7, 0.3], color: '#ffffff', normal: 1.4, fallback: KIT.basalt(w, [1, 0.4]) }),
        blockTeak: PHOTO.mat(w, 'old_planks_02', { rep: [0.3, 1.4], color: '#ffffff', fallback: KIT.wood(w, [1, 1], '#7a5838') }),
      };

      /* ---------------- the courtyard: the House on Ibrahim's foundation ---------------- */
      const statics = new T.Group(); S.add(statics);
      // the foundation course of green stones, all round
      box(statics, M.found, KW + 0.5, Y0 + 0.3, 0.9, 0, (Y0 - 0.3) / 2, -HD + 0.35); box(statics, M.found, KW + 0.5, Y0 + 0.3, 0.9, 0, (Y0 - 0.3) / 2, HD - 0.35);
      box(statics, M.found, 0.9, Y0 + 0.3, KD - 1.2, -HW + 0.35, (Y0 - 0.3) / 2, 0); box(statics, M.found, 0.9, Y0 + 0.3, KD - 1.2, HW - 0.35, (Y0 - 0.3) / 2, 0);
      w.addBox(-HW - 0.3, -HD - 0.3, HW + 0.3, HD + 0.3);
      // the walls the other clans are raising (south-west and north-west), and the upper walls for the end
      this.autoWalls = [];
      const mkWall = (mat, sx, sz, x, z, y0) => { const m = new T.Mesh(new T.BoxGeometry(sx, 1, sz), mat); m.position.set(x, y0, z); m.castShadow = m.receiveShadow = true; m.userData.dynamic = true; m.scale.y = 0.001; S.add(m); return m; };
      this.autoWalls.push(mkWall(M.wallCore, KW, DEPTH, 0, HD - DEPTH / 2, Y0), mkWall(M.wallCore, DEPTH, KD - DEPTH * 2, -HW + DEPTH / 2, 0, Y0));
      this.upper = [mkWall(M.wallCore, KW, DEPTH, 0, -HD + DEPTH / 2, Y0 + 4 * CH), mkWall(M.wallCore, KW, DEPTH, 0, HD - DEPTH / 2, Y0 + 4 * CH),
        mkWall(M.wallCore, DEPTH, KD - DEPTH * 2, -HW + DEPTH / 2, 0, Y0 + 4 * CH), mkWall(M.wallCore, DEPTH, KD - DEPTH * 2, HW - DEPTH / 2, 0, Y0 + 4 * CH)];
      this.bands = [];
      for (let k = 0; k < 5; k++) {
        const y = Y0 + 4 * CH + 0.55 + k * 0.85, g = new T.Group(); g.userData.dynamic = true; g.visible = false; S.add(g);
        box(g, M.teakCore, KW + 0.06, 0.24, DEPTH + 0.06, 0, y, -HD + DEPTH / 2); box(g, M.teakCore, KW + 0.06, 0.24, DEPTH + 0.06, 0, y, HD - DEPTH / 2);
        box(g, M.teakCore, DEPTH + 0.06, 0.24, KD - DEPTH * 2, -HW + DEPTH / 2, y, 0); box(g, M.teakCore, DEPTH + 0.06, 0.24, KD - DEPTH * 2, HW - DEPTH / 2, y, 0);
        this.bands.push({ g, y });
      }
      this.roof = new T.Group(); this.roof.userData.dynamic = true; this.roof.visible = false; S.add(this.roof);
      box(this.roof, M.teakCore, KW + 0.2, 0.3, KD + 0.2, 0, FULL_H + 0.15, 0);
      for (let i = 0; i < 9; i++) cyl(this.roof, M.log, 0.11, 0.12, KD + 0.9, -HW + 0.7 + i * (KW - 1.4) / 8, FULL_H - 0.05, 0, Math.PI / 2, 0, 7);
      // the Hijr: a low curved wall on the north-west side, left outside when the money ran short
      for (let i = 0; i < 18; i++) {
        const a0 = Math.PI / 2 + (i / 18) * Math.PI, a1 = Math.PI / 2 + ((i + 1) / 18) * Math.PI, am = (a0 + a1) / 2;
        const x0 = -HW - 0.4 + Math.cos(a0) * 7.2, z0 = Math.sin(a0) * 6.2, x1 = -HW - 0.4 + Math.cos(a1) * 7.2, z1 = Math.sin(a1) * 6.2;
        box(statics, M.walls[0], Math.hypot(x1 - x0, z1 - z0) + 0.12, 1.05, 0.8, (x0 + x1) / 2, 0.4, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0));
        w.addCircle((x0 + x1) / 2, (z0 + z1) / 2, 0.6);
      }
      // the corner of the Black Stone, still empty
      this.nicheGlow = KIT.glow(w, 0xfff0d0, 2.4, 0.4); this.nicheGlow.position.set(CORNER.x + 0.1, Y0 + 2.6 * CH, CORNER.z - 0.1); this.nicheGlow.userData.dynamic = true; S.add(this.nicheGlow);
      // a faint chalk grid on each face, seen only from the crane: the columns and courses of the well
      this.guides = {};
      const gridTex = w.tex(128, (g, S2) => { g.clearRect(0, 0, S2, S2); g.strokeStyle = 'rgba(255,244,220,0.5)'; g.lineWidth = 2; g.setLineDash([6, 5]); g.strokeRect(1, 1, S2 - 2, S2 - 2); });
      ['A', 'B'].forEach(f => {
        const F = FACES[f], gt = gridTex.clone(); gt.needsUpdate = true; gt.repeat.set(COLS, ROWS - 1);
        const m = new T.Mesh(new T.PlaneGeometry(F.len, (ROWS - 1) * CH), new T.MeshBasicMaterial({ map: gt, transparent: true, opacity: 0.0, depthWrite: false }));
        m.position.set(F.o[0] + F.u[0] * F.len / 2 + F.n[0] * 0.03, Y0 + (ROWS - 1) * CH / 2, F.o[1] + F.u[1] * F.len / 2 + F.n[1] * 0.03);
        m.rotation.y = Math.atan2(F.n[0], F.n[1]); m.userData.dynamic = true; m.renderOrder = 4; S.add(m); this.guides[f] = m;
      });
      // the mason's line marking the height the courses must reach
      const lineMat = new T.MeshBasicMaterial({ color: 0xf2e2c0, transparent: true, opacity: 0.7 });
      this.lines = {};
      ['A', 'B'].forEach(f => {
        const F = FACES[f], len = F.len + 1.4, y = Y0 + 4 * CH + 0.02;
        const m = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, len, 4), lineMat); m.userData.dynamic = true;
        const cx = F.o[0] + F.u[0] * F.len / 2 + F.n[0] * 0.05, cz = F.o[1] + F.u[1] * F.len / 2 + F.n[1] * 0.05;
        m.position.set(cx, y, cz); m.rotation.set(0, 0, 0); if (F.u[0]) m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2;
        S.add(m); this.lines[f] = m;
      });

      // a gantry of palm trunks over each of your two walls: A-frames at both ends and a beam on top
      ['A', 'B'].forEach(f => {
        const F = FACES[f], g = statics;
        const at = (t, out) => [F.o[0] + F.u[0] * t + F.n[0] * out, F.o[1] + F.u[1] * t + F.n[1] * out];
        [-1.4, F.len + 1.4].forEach(t => {
          [-0.4, 2.6].forEach(o => {
            const [bx, bz] = at(t, o), [tx, tz] = at(t, 1.1);
            const leg = new T.Mesh(new T.CylinderGeometry(0.11, 0.15, 9.2, 7), M.pole); leg.castShadow = true;
            const top = new T.Vector3(tx, 8.7, tz), bot = new T.Vector3(bx, 0, bz);
            leg.position.copy(top).add(bot).multiplyScalar(0.5); leg.lookAt(top); leg.rotateX(Math.PI / 2); g.add(leg);
            w.addCircle(bx, bz, 0.25);
          });
          const [cx2, cz2] = at(t, 1.1); box(g, M.plank, F.u[0] ? 0.5 : 2.8, 0.08, F.u[0] ? 2.8 : 0.5, cx2, 3.2, cz2);
        });
        const [mx, mz] = at(F.len / 2, 1.1);
        cyl(g, M.log, 0.13, 0.14, F.len + 3.4, mx, 8.75, mz, F.u[0] ? 0 : Math.PI / 2, F.u[0] ? Math.PI / 2 : 0, 8);
      });
      // scaffolds of trunks and planks where the other clans are building
      for (let i = 0; i <= 4; i++) {
        const t = -HW - 0.6 + i * (KW + 1.2) / 4, u = -HD - 0.6 + i * (KD + 1.2) / 4;
        cyl(statics, M.pole, 0.1, 0.13, 6, t, 3, HD + 0.6); cyl(statics, M.pole, 0.1, 0.13, 6, t, 3, HD + 1.6);
        cyl(statics, M.pole, 0.1, 0.13, 6, -HW - 0.6, 3, u); cyl(statics, M.pole, 0.1, 0.13, 6, -HW - 1.6, 3, u);
      }
      [2.1, 4.2].forEach(y => { box(statics, M.plank, KW + 1.6, 0.08, 1.0, 0, y, HD + 1.1); box(statics, M.plank, 1.0, 0.08, KD + 1.6, -HW - 1.1, y, 0); });
      // stones waiting in piles, rubble of the old walls, teak from the ship
      const pileG = new T.BoxGeometry(1, 0.42, 0.7), rr = U.seeded(605);
      const pileIM = new T.InstancedMesh(pileG, M.blockStone, 150); pileIM.castShadow = pileIM.receiveShadow = true; pileIM.userData.dynamic = true; S.add(pileIM);
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), pv = new T.Vector3(), sv = new T.Vector3(), cc = new T.Color();
      let np = 0;
      const pile = (x, z, n, rad) => { for (let i = 0; i < n && np < 150; i++, np++) { const a = rr() * 6.28, d = Math.sqrt(rr()) * rad, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, lay = Math.floor(i / (n / 3)); pv.set(px, w.ground(px, pz) + 0.2 + lay * 0.4 * (1 - d / rad), pz); e.set((rr() - 0.5) * 0.15, rr() * 3, (rr() - 0.5) * 0.15); q.setFromEuler(e); sv.set(0.8 + rr() * 0.5, 0.9 + rr() * 0.3, 0.8 + rr() * 0.4); m4.compose(pv, q, sv); pileIM.setMatrixAt(np, m4); pileIM.setColorAt(np, cc.set(U.pick(TINTS))); } w.addCircle(x, z, rad * 0.8); };
      pile(-17, -15, 30, 2.8); pile(17, 15, 30, 2.8); pile(-15, 17, 24, 2.4); pile(-6, -19, 16, 1.8); pile(19, 2, 18, 2); pile(110, 6, 30, 4); pile(116, -12, 20, 3);
      pileIM.count = np; pileIM.instanceMatrix.needsUpdate = true; if (pileIM.instanceColor) pileIM.instanceColor.needsUpdate = true;
      // the ship's timber: long beams and planks stacked on chocks
      for (let i = 0; i < 9; i++) { const y = 0.2 + Math.floor(i / 3) * 0.3, z = 9 + (i % 3) * 0.36 + Math.floor(i / 3) * 0.18; box(statics, M.teakCore, 7.5, 0.28, 0.3, -24, w.ground(-24, 10) + y, z, 0.02 * (i % 2)); }
      for (let i = 0; i < 6; i++) box(statics, M.plank, 5.5, 0.07, 0.42, -24.5, w.ground(-24, 15) + 0.1 + i * 0.075, 15 + (i % 2) * 0.05, 0.05 * (i % 3));
      for (let i = 0; i < 4; i++) { const a = rr() * 6.28; box(statics, M.teakCore, 4 + rr() * 3, 0.26, 0.28, -30 + Math.cos(a) * 3, w.ground(-30, 13) + 0.14, 13 + Math.sin(a) * 2, a); }
      w.addBox(-28, 8, -20, 16.5);
      // awnings of linen where the masons rest
      [[-20, -8, 0.4], [20, -10, -0.5], [-8, 22, 1.2]].forEach(([x, z, ry]) => {
        const g = new T.Group(); g.position.set(x, w.ground(x, z), z); g.rotation.y = ry; statics.add(g);
        [[-2, -1.6], [2, -1.6], [-2, 1.6], [2, 1.6]].forEach(([a, b]) => cyl(g, M.pole, 0.06, 0.07, 2.6, a, 1.3, b));
        const cl = new T.Mesh(new T.PlaneGeometry(4.6, 3.8, 6, 4), [M.linen, M.linen2, M.linen3][Math.abs(Math.round(x)) % 3]); cl.rotation.x = -Math.PI / 2 + 0.08; cl.position.y = 2.55; cl.castShadow = true; g.add(cl);
      });

      // the trodden ground of the courtyard and a lane or two
      patch(w, 0, 0, 23, 'dry_ground_rocks', 0.12, '#d8ccbc');
      patch(w, -24, 13, 9, 'dirt', 0.2, '#c8b8a0'); patch(w, 30, -20, 10, 'mud_cracked_dry_03', 0.1, '#b8a48c');
      // more of the work: stones, mats with water jars, ropes of palm fibre
      SCAPE.scatter(w, { kind: 'model', model: 'sand_rocks_small_01', n: 16, area: { x: 0, z: 0, r: 60 }, scale: [0.6, 1], seed: 42, avoid: (x, z) => Math.hypot(x, z) < 20, fallback: 'pebble' });
      [[-8, 17, 0.4], [9, -17.5, -0.3], [-19.5, 3, 1.2]].forEach(([x, z, ry]) => {
        const mat = new T.Mesh(new T.PlaneGeometry(2.4, 1.6), M.linen3); mat.rotation.set(-Math.PI / 2, 0, ry); mat.position.set(x, w.ground(x, z) + 0.04, z); mat.receiveShadow = true; statics.add(mat);
        PHOTO.place(w, 'ceramic_vase_01', { pos: [x + 0.6, undefined, z + 0.2], s: 1.3 }); PHOTO.place(w, 'jug_01', { pos: [x - 0.5, undefined, z - 0.3], s: 1.2 }); PHOTO.place(w, 'wooden_bowl_01', { pos: [x, undefined, z + 0.5], s: 1.2 });
      });
      // the houses of Quraysh, ringing the courtyard
      const hr = U.seeded(35), houses = [];
      const wadiX = z => -78 - Math.sin(z * 0.02) * 10;
      for (let i = 0; i < 900 && houses.length < 130; i++) {
        const ring = hr(), a = hr() * 6.283, d = 27 + Math.pow(ring, 1.1) * 92, x = Math.cos(a) * d, z = Math.sin(a) * d * 1.1;
        if (Math.abs(x - wadiX(z)) < 15 || x > 94 || Math.abs(z) > 126 || Math.abs(x) > 124) continue;
        if (Math.hypot(x + 26, z - 12) < 9 || (Math.abs(Math.sin(a * 6 + 0.4)) < 0.1)) continue;   // the timber yard, and lanes radiating out
        const hw = 2.4 + hr() * 3.2, hd = 2.2 + hr() * 2.6;
        if (houses.some(h => Math.hypot(h.x - x, h.z - z) < Math.max(h.hw, h.hd) + Math.max(hw, hd) + 0.9)) continue;
        const ry = Math.atan2(-x, -z) + Math.round(hr() * 2 - 1) * 0.3;
        const h = house(statics, M, w.ground, x, z, hw, hd, 3 + hr() * 2.6, ry, hr);
        houses.push(h);
        const c = Math.cos(ry), s = Math.sin(ry); w.addCircle(x, z, Math.min(hw, hd) * 0.95); w.addCircle(x + c * hw * 0.55, z - s * hw * 0.55, Math.min(hw, hd) * 0.9); w.addCircle(x - c * hw * 0.55, z + s * hw * 0.55, Math.min(hw, hd) * 0.9);
      }
      this.houses = houses;
      // more houses climbing the lower slopes far away (simple, instanced)
      const far = SCAPE.scatter(w, { kind: 'house', n: 170, area: { x: 0, z: 0, r: 260 }, scale: [6, 10], seed: 11, slopeMax: 0.5,
        density: (x, z) => { const d = Math.hypot(x, z); return d > 128 && d < 250 && Math.abs(x - wadiX(z)) > 14 ? 1 : 0; } });
      far.meshes.forEach(m => { m.material = tri(w, 'clay_plaster', 0.25, m.material.map, '#e6d6c0'); });

      /* ---------------- scatter: the valley's stones, scrub and the wadi ---------------- */
      const notHouse = (x, z) => (Math.abs(x) < HW + 1 && Math.abs(z) < HD + 1) || houses.some(h => Math.hypot(h.x - x, h.z - z) < Math.max(h.hw, h.hd) + 0.6);
      SCAPE.scatter(w, { kind: 'pebble', n: 3000, area: { x: 0, z: 0, r: 135 }, scale: [0.05, 0.2], seed: 4, avoid: notHouse, color: '#b8ab9c' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', variant: 1, n: 520, area: { x: 0, z: 0, r: 125 }, scale: [0.8, 1.7], seed: 31, avoid: notHouse, fallback: 'pebble', fallbackScale: 0.15 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', variant: 2, n: 320, area: { x: 0, z: 0, r: 150 }, scale: [0.6, 1.8], seed: 32, avoid: notHouse, fallback: 'rock', fallbackScale: 0.4 });
      // rubble of the demolished walls round the House
      SCAPE.scatter(w, { kind: 'model', model: 'rock_07', n: 46, area: { x: 0, z: 0, r: 16 }, scale: [0.25, 0.6], seed: 33, fallback: 'rock', fallbackScale: 0.8,
        density: (x, z) => (Math.abs(x) < HW + 2.5 && Math.abs(z) < HD + 2.5 ? 0 : 1), avoid: (x, z) => Math.hypot(x - CLOAK0.x, z - CLOAK0.z) < 3.5 || Math.hypot(x - START.x, z - START.z) < 3 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', n: 110, area: { x: 0, z: 0, r: 200 }, scale: [1.2, 3.2], seed: 34, collide: true, fallback: 'boulder', sink: 0.3, color: '#7a6e68', slopeMax: 0.3,
        density: (x, z) => { const d = Math.hypot(x * 0.92, z * 0.72); return U.smooth(112, 122, d) * (1 - U.smooth(132, 140, d)) + (x > 95 && x < 120 && d < 132 ? 0.8 : 0); } });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', n: 60, area: [96, -60, 128, 60], scale: [1.2, 3], seed: 35, collide: true, fallback: 'boulder', color: '#7e726a', slopeMax: 0.3 });
      PHOTO.place(w, 'namaqualand_cliff_01', { pos: [126, undefined, -22], s: 1.4, ry: -1.4 }); PHOTO.place(w, 'namaqualand_cliff_01', { pos: [124, undefined, 26], s: 1.2, ry: -1.9 });
      SCAPE.scatter(w, { kind: 'boulder', n: 120, area: { x: 0, z: 0, r: 520 }, scale: [3, 8], seed: 3, sink: 0.45, slopeMax: 0.7, density: (x, z) => U.smooth(150, 220, Math.hypot(x * 0.92, z * 0.72)) });
      SCAPE.scatter(w, { kind: 'rock', n: 700, area: { x: 0, z: 0, r: 420 }, scale: [0.4, 2.2], seed: 5, density: (x, z) => U.smooth(110, 170, Math.hypot(x, z)) });
      const inWadi = (x, z) => Math.abs(x - wadiX(z)) < 14;
      SCAPE.scatter(w, { kind: 'grass', n: 1500, area: [-110, -130, -45, 130], scale: [0.35, 0.8], seed: 6, density: (x, z) => (inWadi(x, z) ? 1 : 0.06) });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', variant: 3, n: 300, area: [-105, -130, -50, 130], scale: [0.7, 1.3], seed: 36, density: (x, z) => (inWadi(x, z) ? 1 : 0), fallback: 'grass' });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', variant: 0, n: 140, area: { x: 0, z: 0, r: 200 }, scale: [0.7, 1.5], seed: 37, avoid: notHouse, fallback: 'shrub', density: (x, z) => (inWadi(x, z) ? 1 : Math.hypot(x, z) > 60 ? 0.35 : 0.04) });
      SCAPE.scatter(w, { kind: 'model', model: 'wild_rooibos_bush', variant: 1, n: 70, area: [-110, -130, -45, 130], scale: [0.8, 1.4], seed: 38, density: (x, z) => (inWadi(x, z) ? 1 : 0), fallback: 'shrub' });
      SCAPE.scatter(w, { kind: 'thorn', n: 220, area: { x: 0, z: 0, r: 300 }, scale: [0.6, 1.3], seed: 8, avoid: notHouse, density: (x, z) => (Math.hypot(x, z) > 50 ? 1 : 0) });
      SCAPE.scatter(w, { kind: 'acacia', n: 34, area: [-112, -128, -44, 128], scale: [0.9, 1.5], seed: 9, collide: true, density: (x, z) => (inWadi(x, z) ? 1 : 0.05) });
      SCAPE.scatter(w, { kind: 'model', model: 'dead_tree_trunk', n: 10, area: [-100, -120, -56, 120], scale: [0.7, 1.1], seed: 39, density: (x, z) => (inWadi(x, z) ? 1 : 0), fallback: 'rock' });
      SCAPE.scatter(w, { kind: 'model', model: 'dry_branches_medium_01', variant: 0, n: 40, area: [-104, -128, -52, 128], scale: [0.8, 1.4], seed: 40, density: (x, z) => (inWadi(x, z) ? 1 : 0), fallback: 'thorn' });
      SCAPE.scatter(w, { kind: 'palm', n: 9, area: [-70, 60, -40, 100], scale: [8, 12], seed: 12 });
      // the green stones of the foundation, showing at the south-west corner
      SCAPE.scatter(w, { kind: 'boulder', tex: 'granite', points: [[-3.6, -HD - 1.2, 0.55], [-1.3, -HD - 1.1, 0.5], [1.2, -HD - 1.25, 0.55], [3.7, -HD - 1.1, 0.48], [-HW + 0.4, HD + 0.9, 0.5], [-HW - 0.9, HD - 0.4, 0.45]].map(([x, z, sc]) => [x, z, sc * 1.3]), color: '#7c9a76', vary: 0.1, seed: 41, sink: 0.05 });
      // vessels and baskets of the work
      [['wicker_basket_01', -15.5, -12, 1.4], ['wicker_basket_01', 15, 12.5, 1.3], ['jug_01', -19.8, -9.4, 1.3], ['ceramic_vase_01', -20.6, -8.2, 1.4], ['wooden_bowl_01', -19.6, -7.6, 1.3],
        ['stone_fire_pit', 21, -17, 1], ['brass_pot_01', 21.2, -17.1, 1.1], ['jug_01', 19.4, -9.2, 1.2], ['wicker_basket_01', -22, 14, 1.2], ['ceramic_vase_01', 4, 22, 1.3]].forEach(([id, x, z, s]) => PHOTO.place(w, id, { pos: [x, undefined, z], s, ry: x * 0.7 }));

      // the four clans' banners at the four sides of the House
      this.banners = CLANS.map((c, i) => {
        const a = (i / 4) * 6.283 + 1.185, x = Math.cos(a) * 19, z = Math.sin(a) * 19;
        cyl(statics, M.pole, 0.06, 0.08, 5.2, x, w.ground(x, z) + 2.6, z); w.addCircle(x, z, 0.3);
        const cl = new T.Mesh(new T.PlaneGeometry(1.5, 1.0, 8, 3), linen(w, '#' + new T.Color(c).getHexString(), [1, 1]));
        cl.userData.dynamic = true; cl.castShadow = true; S.add(cl);
        return { x, z, y0: w.ground(x, z), cl, base: cl.geometry.attributes.position.array.slice(), rise: 1, ry: -a };
      });

      // life: pigeons over the valley, hearth smoke, dust in the sun
      SCAPE.birds(w, { n: 18, x: 0, z: 0, y: 34, r: 46, color: 0x6a6a72, size: 0.45, speed: 0.16 });
      SCAPE.birds(w, { n: 8, x: 60, z: -50, y: 70, r: 80, seed: 7, size: 0.9, speed: 0.07 });
      const hearths = houses.filter((h, i) => i % 9 === 0).map(h => [h.x, w.ground(h.x, h.z) + 5, h.z]);
      hearths.push([21, w.ground(21, -17) + 0.5, -17]);
      SCAPE.smoke(w, { sources: hearths, height: 16, wind: [0.5, 0.25], size: 3 });
      SCAPE.motes(w, { n: 90, area: [-24, 0.3, -24, 24, 7, 24], color: '#fff0d0', size: 0.18, additive: true });

      // bake the static town into a few draw calls
      statics.traverse(o => { if (o.isMesh) { o.receiveShadow = true; } });
      this.baked = w.bake(statics);

      /* ---------------- the stacking well ---------------- */
      const geoStone = new T.BoxGeometry(1, 1, 1);
      { const p = geoStone.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * (1 - Math.abs(y) * 0.05), y * (1 - Math.abs(x) * 0.04), z); } geoStone.computeVertexNormals(); }
      this.imStone = new T.InstancedMesh(geoStone, M.blockStone, 260); this.imTeak = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), M.blockTeak, 120);
      this.imGhost = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.22, depthWrite: false }), 8);
      for (let i = 0; i < 260; i++) this.imStone.setColorAt(i, new T.Color(1, 1, 1));
      for (let i = 0; i < 120; i++) this.imTeak.setColorAt(i, new T.Color(1, 1, 1));
      [this.imStone, this.imTeak, this.imGhost].forEach(m => { m.userData.dynamic = true; m.frustumCulled = false; m.count = 0; S.add(m); });
      this.imStone.castShadow = this.imTeak.castShadow = true; this.imStone.receiveShadow = this.imTeak.receiveShadow = true;
      this.rope = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1, 4), new T.MeshStandardMaterial({ color: 0x8a7458, roughness: 1 })); this.rope.userData.dynamic = true; this.rope.visible = false; S.add(this.rope);
      this.blocks = [];       // set and loose stones: { f, c, r, kind, tint, set, flash, squash, fall }
      this.grid = { A: this.emptyGrid('A'), B: this.emptyGrid('B') };
      this.done = { A: 0, B: 0 };
      this.flashG = KIT.glow(w, 0xfff0c8, 2.2, 0); this.flashG.userData.dynamic = true; S.add(this.flashG);
      this.sweepG = KIT.glow(w, 0xffe6b0, 3.2, 0); this.sweepG.userData.dynamic = true; S.add(this.sweepG);
      this.burstT = 0;

      /* ---------------- the cloak and the Black Stone ---------------- */
      this.cloakRig = new T.Group(); this.cloakRig.userData.dynamic = true; S.add(this.cloakRig);
      this.cloakGeo = new T.PlaneGeometry(2.8, 2.8, 14, 14); this.cloakGeo.rotateX(-Math.PI / 2);
      this.cloak = new T.Mesh(this.cloakGeo, linen(w, '#6e3a2c', [3, 3]));
      this.cloak.castShadow = this.cloak.receiveShadow = true; this.cloakRig.add(this.cloak);
      const ringG = new T.RingGeometry(0.5, 0.56, 40); ringG.rotateX(-Math.PI / 2);
      this.ring = new T.Mesh(ringG, new T.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.0, depthWrite: false })); this.ring.position.y = 0.03; this.cloakRig.add(this.ring);
      const bsG = new T.SphereGeometry(0.27, 28, 18); { const p = bsG.attributes.position; for (let i = 0; i < p.count; i++) { const v = new T.Vector3().fromBufferAttribute(p, i); v.multiplyScalar(1 + 0.08 * U.noise2(v.x * 9, v.z * 9 + v.y * 5)); v.y *= 0.72; v.x *= 1.15; p.setXYZ(i, v.x, v.y, v.z); } bsG.computeVertexNormals(); }
      this.stone = new T.Mesh(bsG, new T.MeshStandardMaterial({ color: 0x0e0b0a, roughness: 0.42, metalness: 0.05, envMapIntensity: 0.6 }));
      this.stone.castShadow = true; this.stone.userData.dynamic = true; this.cloakRig.add(this.stone);
      this.stoneGlow = KIT.glow(w, 0xfff2d6, 1.6, 0.25); this.cloakRig.add(this.stoneGlow);
      this.cornerLights = CLANS.map(c => { const g = KIT.glow(w, new T.Color(c).lerp(new T.Color(0xffd8a0), 0.6), 1.3, 0.85); this.cloakRig.add(g); return g; });
      this.cloakRig.position.set(CLOAK0.x, w.ground(CLOAK0.x, CLOAK0.z) + 0.08, CLOAK0.z); this.cloakRig.rotation.y = -Math.PI / 4;
      this.ball = { x: 0, z: 0, vx: 0, vz: 0 }; this.lift = { prog: 0, h: 0, edge: 0, gust: 0, gustI: 0, gustT: 3 };
      this.shapeCloak(0, 0, 0);

      /* ---------------- interactions ---------------- */
      this.phase = 1;
      w.interact({ key: 'craneA', pos: [CRANE_A.x, 1.4, CRANE_A.z], r: 4.5, label: 'Take the crane view · raise the north-east wall', enabled: () => self.phase === 1 && !self.mode, onUse: () => self.startStack('A') });
      w.interact({ key: 'craneB', pos: [CRANE_B.x, 1.4, CRANE_B.z], r: 4.5, label: 'Take the crane view · stone and teak', enabled: () => self.phase === 2 && !self.mode, onUse: () => self.startStack('B') });
      w.interact({ key: 'cloak', pos: [CLOAK0.x, 0.7, CLOAK0.z], r: 4.2, label: 'Take up the cloak with the four clans', enabled: () => self.phase === 3 && !self.mode, onUse: () => self.startCloak() });
      w.activity('Part 1 of 3 · The foundation courses', 4, 'Walk to the scaffold on the north-east wall');
      w.goal([CRANE_A.x, 2, CRANE_A.z]);

      /* ---------------- discoveries ---------------- */
      const D = (x, z, dy, title, text, ar) => w.discover({ pos: [x, w.ground(x, z) + (dy || 1.2), z], title, text, ar });
      D(-11, -11, 1, 'The old walls', 'Before this rebuilding the House was a wall of loose stones a little above a man’s height, with no roof. Quraysh wished to raise it and roof it, but were afraid to pull it down. (Ibn Ishaq, in Ibn Hisham)', 'كانت الكعبة رَضْمًا فوق القامة، فأرادوا رفعها وتسقيفها');
      D(-23, 18.5, 1.2, 'A ship’s timber', 'The sea cast the ship of a Byzantine merchant ashore at Jeddah, and it broke apart. Quraysh took its timber for the roof, and a Coptic carpenter living in Makkah helped them prepare it. (Ibn Ishaq, in Ibn Hisham)', 'خشبُ سفينةٍ رومية تحطّمت بجُدّة');
      D(-HW - 2.2, HD + 2.4, 0.9, 'The foundation of Ibrahim', 'Al-Walid ibn al-Mughirah struck the first blow, and the people waited a night to see if harm would come to him. Then they dug down until they reached the foundation of Ibrahim: green stones like camel humps, locked together. There they stopped. (Ibn Ishaq, in Ibn Hisham)', 'أساسُ إبراهيم: حجارةٌ خُضرٌ كالأسنمة');
      D(-HW - 7.4, 0, 1.1, 'The rounded wall', '‘A’ishah asked whether the rounded wall was part of the House. The Prophet ﷺ said it was, and that her people had left it out because they ran short of money. (Sahih al-Bukhari 1584) Abu Wahb had urged Quraysh to spend on the House only what was earned lawfully. (Ibn Ishaq)', 'قصرت بهم النفقة');
      D(-3.5, -HD - 1.6, 1.6, 'A raised door', 'The Prophet ﷺ told ‘A’ishah that her people raised the door of the House above the ground so that they could let in whom they wished and keep out whom they wished. (Sahih al-Bukhari 1584)', 'رفعوا بابها ليُدخلوا من شاؤوا');
      D(112, -2, 1.4, 'Stones from the hills', 'Each clan of Quraysh gathered stones on its own, and each built its own part of the House, until the walls reached the place of the Black Stone. (Ibn Ishaq, in Ibn Hisham)', 'جمعت كلُّ قبيلةٍ حجارتها على حدة');
      D(-78, -40, 1.3, 'Teak and stone', 'Later sirah writers describe the rebuilt walls as courses of teak alternating with courses of stone, raised to eighteen cubits, twice the old height. (al-Sirah al-Halabiyyah)', 'مِدماكٌ من خشب الساج ومِدماكٌ من حجارة');

      /* ---------------- sound ---------------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 0.5, gain: 0.035 });
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 1.2, gain: 0.014 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.3, 80);
      this.clocks = { voice: 2, chisel: 1, bird: 3, coo: 5 };

      /* ---------------- touch / pointer controls for the crane view ---------------- */
      this.buildButtons(w);
      w.onPointer = (e, p, ph) => self.pointer(e, p, ph);

      this.post = w.post({ bloom: 0.42, threshold: 0.78, rays: { strength: 0.28, dir: [0.76, 0.35, -0.55] }, vignette: 0.38, grain: 0.03, sat: 1.04, contrast: 1.05, lift: [0.012, 0.01, 0.0], gain: [1.03, 1.0, 0.95] });
      this.mode = null; this.camT = 0;
      this.updBlocks();
    },

    /* ======================= the falling-block game ======================= */
    emptyGrid(f) {
      const g = []; for (let r = 0; r < ROWS; r++) { g.push(new Array(COLS).fill(null)); }
      FACES[f].niche.forEach(([c, r]) => { g[r][c] = { niche: true }; });
      return g;
    },
    cellWorld(f, c, r, out) {
      const F = FACES[f], cw = F.len / COLS;
      return out.set(F.o[0] + F.u[0] * (c + 0.5) * cw - F.n[0] * DEPTH / 2, Y0 + (r + 0.5) * CH, F.o[1] + F.u[1] * (c + 0.5) * cw - F.n[1] * DEPTH / 2);
    },
    startStack(f) {
      const w = this.w, self = this;
      w.focus = null; this.mode = 'stack'; this.face = f; this.camT = 0; this.camFrom = w.camera.position.clone(); this.camFromQ = w.camera.quaternion.clone();
      this.bag = []; this.piece = null; this.next = this.draw(); this.fallT = 0; this.lockT = 0; this.lockMoves = 0; this.das = { dir: 0, t: 0 };
      this.spawn();
      w.mode = (dt) => self.stackTick(dt);
      w.goal(null);
      this.showButtons('stack');
      const F = FACES[f];
      if (f === 'A') w.progress(this.done.A, 'Fill each course across the wall · Space sets a stone down');
      else w.progress(this.done.B, 'The second and fourth courses are teak beams');
      this.env.hint(matchMedia('(pointer: coarse)').matches ? 'Swipe or use ◀ ▶ to move · tap to turn · ▼ to lower · ⤓ to set · ✕ to step back' : 'A/D or ←/→ move · W or ↑ turn · S or ↓ lower · Space sets it down · Q steps back');
      SND.swell(this.env.bus, { f0: 220, f1: 520, dur: 1.4, gain: 0.03 });
      if (!this['told' + f]) {
        this['told' + f] = true;
        if (f === 'A') w.say('The north-east wall', 'Stones are lowered on the rope. Move and turn each one so the course lies full from end to end; a full course is set for good. Leave the corner of the Black Stone open.', { ms: 9000 });
        else w.say('Stone and teak', 'Here the courses alternate: a course of stone, then a course of teak beams laid along it, as the sirah writers describe the rebuilt walls. (al-Sirah al-Halabiyyah)', { ms: 9000, ar: 'مِدماكٌ من حجارة ومِدماكٌ من ساج' });
      }
      void F;
    },
    leaveMode() {
      const w = this.w; if (!this.mode) return;
      if (this.mode === 'stack' && this.piece) this.piece = null;
      this.mode = null; w.mode = null; this.rope.visible = false; this.imGhost.count = 0; this.ring.material.opacity = 0;
      this.guides.A.material.opacity = this.guides.B.material.opacity = 0;
      this.showButtons(null); this.updBlocks();
      const f = new T.Vector3(); w.camera.getWorldDirection(f); w.yaw = Math.atan2(-f.x, -f.z); w.pitch = -0.1;
      // step back onto the ground in front of the scaffold
      const p = this.phase === 1 ? CRANE_A : this.phase === 2 ? CRANE_B : CLOAK0;
      const back = this.phase === 1 ? [0, -3] : this.phase === 2 ? [3, 0] : [2.5, -2.5];
      w.pos.set(p.x + back[0], 0, p.z + back[1]); w.y = w.ground(w.pos.x, w.pos.z);
      w.goal(this.phase === 1 ? [CRANE_A.x, 2, CRANE_A.z] : this.phase === 2 ? [CRANE_B.x, 2, CRANE_B.z] : this.phase === 3 ? [CLOAK0.x, 1, CLOAK0.z] : null);
      this.env.hint(matchMedia('(pointer: coarse)').matches ? this.hintTouch : this.hint);
    },
    draw() {
      const f = this.face, d = f === 'A' ? this.done.A : this.done.B;
      // teak courses take beams only, sized to the gaps left in that course
      const low = this.lowestOpen();
      if (f === 'B' && low != null && FACES.B.teak.includes(low)) {
        const row = this.grid.B[low], gaps = []; let run = 0;
        for (let c = 0; c <= COLS; c++) { if (c < COLS && !row[c]) run++; else { if (run) gaps.push(run); run = 0; } }
        const g = gaps.length ? U.pick(gaps) : 3, L = g > 5 ? (g >= 8 ? 4 : 3) : g;
        return { kind: 'teak', cells: Array.from({ length: Math.max(1, L) }, (_, i) => [i, 0]), id: 'B' + L };
      }
      if (!this.bag.length) {
        const set = f === 'A' ? ['O', 'I2', 'I3', 'L', 'J', 'I4', 'O', 'I3'] : ['O', 'L', 'J', 'T', 'S', 'Z', 'I3', 'I4'];
        this.bag = set.slice().sort(() => Math.random() - 0.5);
      }
      void d;
      const id = this.bag.pop();
      return { kind: 'stone', cells: SHAPES[id].map(c => c.slice()), id, tint: U.pick(TINTS) };
    },
    lowestOpen() {
      const g = this.grid[this.face]; for (let r = 0; r < 4; r++) if (g[r].some(c => !c)) return r; return null;
    },
    spawn() {
      const p = this.next; this.next = this.draw();
      const w = Math.max(...p.cells.map(c => c[0])) + 1;
      this.piece = { kind: p.kind, cells: p.cells, id: p.id, tint: p.tint || '#c08a5a', x: Math.floor((COLS - w) / 2), y: ROWS - 2, vx: null, vy: null };
      if (p.kind === 'teak' && this.piece.cells.length === 0) this.piece.cells = [[0, 0]];
      this.piece.vx = this.piece.x; this.piece.vy = this.piece.y + 2.5;
      this.lockT = 0; this.lockMoves = 0; this.fallT = 0;
      if (!this.fits(this.piece.cells, this.piece.x, this.piece.y)) this.slip();
      this.drawNext();
    },
    fits(cells, x, y) {
      const g = this.grid[this.face];
      for (const [cx, cy] of cells) { const gx = x + cx, gy = y + cy; if (gx < 0 || gx >= COLS || gy < 0) return false; if (gy < ROWS && g[gy][gx]) return false; }
      return true;
    },
    move(dx) {
      const p = this.piece; if (!p) return false;
      if (this.fits(p.cells, p.x + dx, p.y)) { p.x += dx; if (this.lockT > 0 && this.lockMoves++ < 10) this.lockT = 0.001; SND.knock(this.env.bus, { f: 340 + dx * 20, gain: 0.03, click: 2600 }); return true; }
      p.vx += dx * 0.18; SND.knock(this.env.bus, { f: 120, gain: 0.04, click: 900 });
      return false;
    },
    rotate(dir) {
      const p = this.piece; if (!p) return;
      if (p.kind === 'teak') { p.wob = 1; SND.knock(this.env.bus, { f: 200, gain: 0.05, click: 800 }); return; }
      const W0 = Math.max(...p.cells.map(c => c[0])) + 1, H0 = Math.max(...p.cells.map(c => c[1])) + 1;
      let rc = p.cells.map(([x, y]) => (dir > 0 ? [y, -x] : [-y, x]));
      const mx = Math.min(...rc.map(c => c[0])), my = Math.min(...rc.map(c => c[1]));
      rc = rc.map(([x, y]) => [x - mx, y - my]);
      const W1 = Math.max(...rc.map(c => c[0])) + 1, H1 = Math.max(...rc.map(c => c[1])) + 1;
      const bx = p.x + Math.round((W0 - W1) / 2), by = p.y + Math.round((H0 - H1) / 2);
      for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [0, 1], [-2, 0], [2, 0], [-1, 1], [1, 1]]) {
        if (this.fits(rc, bx + kx, by + ky)) { p.cells = rc; p.x = bx + kx; p.y = by + ky; p.spin = dir; if (this.lockT > 0 && this.lockMoves++ < 10) this.lockT = 0.001; SND.knock(this.env.bus, { f: 260, gain: 0.05, click: 3200 }); SND.step(this.env.bus, { gain: 0.03, f: 1400 }); return; }
      }
      p.wob = 1; SND.knock(this.env.bus, { f: 110, gain: 0.04, click: 700 });
    },
    dropY() { const p = this.piece; let y = p.y; while (this.fits(p.cells, p.x, y - 1)) y--; return y; },
    hardDrop() {
      const p = this.piece; if (!p) return;
      const y = this.dropY(), d = p.y - y; p.y = y; p.vy = y + Math.min(1.2, d * 0.4);
      this.shake = 0.12 + Math.min(0.2, d * 0.02);
      this.lock();
    },
    lock() {
      const p = this.piece; if (!p) return;
      const g = this.grid[this.face], env = this.env;
      let over = false;
      for (const [cx, cy] of p.cells) {
        const gx = p.x + cx, gy = p.y + cy;
        if (gy >= ROWS) { over = true; continue; }
        const b = { f: this.face, c: gx, r: gy, kind: p.kind, tint: new T.Color(p.kind === 'teak' ? '#ffffff' : p.tint).multiplyScalar(0.92 + Math.random() * 0.16), set: false, flash: 0.25, squash: 1, beamLen: p.kind === 'teak' ? p.cells.length : 0 };
        g[gy][gx] = b; this.blocks.push(b);
        if (gy >= 8) over = true;
      }
      const sp = this.w.spatial(this.cellWorld(this.face, p.x, p.y, new T.Vector3()), 12);
      SND.knock(env.bus, { f: p.kind === 'teak' ? 170 : 95, gain: 0.32, click: p.kind === 'teak' ? 900 : 1800, pan: sp.pan });
      SND.thump && SND.thump(env.bus, { gain: 0.08 });
      this.dust(p);
      this.piece = null;
      // full courses are set for good
      let newly = 0;
      for (let r = 0; r < ROWS; r++) {
        if (g[r].every(c => c) && !g[r].every(c => c.niche || c.set)) {
          g[r].forEach((c, i) => { if (!c.niche) { c.set = true; c.flash = 1.4; } });
          if (r < 4) newly++;
          this.sweep = { r, t: 0, f: this.face };
        }
      }
      if (newly) {
        const n = this.countSet(this.face);
        this.done[this.face] = n;
        const notes = [196, 246.94, 293.66, 392];
        SND.sing(env.bus, notes[Math.min(3, n - 1)], { vowel: 'a', dur: 2.6, gain: 0.05, voices: 3, attack: 0.15 });
        SND.glow(env.bus, notes[Math.min(3, n - 1)] / 2, { gain: 0.04, dur: 4 });
        this.w.progress(n, n < 4 ? `Course ${n} of 4 is set · ${this.face === 'B' && FACES.B.teak.includes(this.lowestOpen()) ? 'now a course of teak' : 'keep the next course full'}` : 'The wall has reached the corner');
        this.raiseOthers();
        if (n >= 4) { this.finishFace(); return; }
      }
      if (over) { this.slip(); return; }
      this.spawn();
    },
    countSet(f) { const g = this.grid[f]; let n = 0; for (let r = 0; r < 4; r++) if (g[r].every(c => c && (c.set || c.niche))) n++; return n; },
    slip() {
      // the loose stones slip back to the pile; the courses already set stay
      const g = this.grid[this.face];
      let n = 0;
      this.blocks.forEach(b => { if (b.f === this.face && !b.set && !b.fall) { b.fall = { t: 0, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 2 }; g[b.r][b.c] = null; n++; } });
      if (n) {
        SND.swell(this.env.bus, { f0: 300, f1: 120, dur: 1.6, gain: 0.04 }); SND.sing(this.env.bus, 146.83, { vowel: 'o', dur: 2.2, gain: 0.035 });
        this.w.say('A stone slips back', 'The loose stones above the finished courses are lifted down and carried back to the pile. Set the next course again; what is finished stays.', { ms: 6000 });
      }
      this.piece = null;
      setTimeout(() => { if (this.mode === 'stack' && !this.piece) this.spawn(); }, 900);
    },
    finishFace() {
      const f = this.face, w = this.w, env = this.env;
      // stray stones above the line are carried away
      this.blocks.forEach(b => { if (b.f === f && !b.set && !b.fall) { b.fall = { t: 0, vx: (Math.random() - 0.5) * 2, vy: 1.5 }; this.grid[f][b.r][b.c] = null; } });
      this.lines[f].visible = false;
      SND.glow(env.bus, 130.81, { gain: 0.06, dur: 7 }); SND.sing(env.bus, 261.63, { vowel: 'a', dur: 4, gain: 0.05, voices: 4, delay: 0.4 });
      this.later = { t: 2.6, fn: () => {
        this.leaveMode();
        if (f === 'A') {
          this.phase = 2;
          w.activity('Part 2 of 3 · Stone and teak', 4, 'Walk round the corner to the south-east scaffold');
          w.goal([CRANE_B.x, 2, CRANE_B.z]);
          w.say('The north-east wall stands', 'Four courses are set and the other clans keep pace on their walls. The south-east wall still waits for its courses of stone and teak.', { ms: 8000 });
        } else {
          this.phase = 'dispute'; this.disputeT = 0;
          w.activity('Part 3 of 3 · The Black Stone', 4, 'The walls have reached the corner of the Black Stone');
          w.say('Who will set the stone?', 'The walls reached the place of the Black Stone, and every clan wanted the honour of lifting it into place. The quarrel lasted four or five nights; some clans swore to fight. (Ibn Ishaq, in Ibn Hisham)', { ms: 11000 });
          w.goal(null);
        }
      } };
    },
    raiseOthers() {
      const n = Math.max(this.done.A, this.done.B);
      this.autoTarget = n;
    },
    dust(p) {
      const v = this.cellWorld(this.face, p.x + 0.5, p.y, new T.Vector3()), F = FACES[this.face];
      v.x += F.n[0] * 0.5; v.z += F.n[1] * 0.5; v.y -= CH * 0.3;
      this.flashG.position.copy(v); this.burstT = 0.6;
    },
    stackTick(dt) {
      const w = this.w, k = w.keys, p = this.piece, F = FACES[this.face];
      // camera: a crane view in front of and above the wall
      this.camT = Math.min(1, this.camT + dt / 1.1);
      const aspect = w.camera.aspect, vf = T.MathUtils.degToRad(46), hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
      const dist = Math.max(8.5 / Math.tan(hf / 2), 3.9 / Math.tan(vf / 2)) * 1.02;
      const cx = F.o[0] + F.u[0] * F.len / 2, cz = F.o[1] + F.u[1] * F.len / 2, ty = Y0 + 2.4;
      const camP = new T.Vector3(cx + F.n[0] * dist * 0.95, ty + dist * 0.3, cz + F.n[1] * dist * 0.95);
      const look = new T.Vector3(cx - F.n[0] * 0.6, ty - 0.1, cz - F.n[1] * 0.6);
      const kk = U.ease(this.camT);
      w.camera.fov = U.lerp(66, 46, kk); w.camera.updateProjectionMatrix();
      const m = new T.Matrix4().lookAt(camP, look, new T.Vector3(0, 1, 0)), qT = new T.Quaternion().setFromRotationMatrix(m);
      w.camera.position.lerpVectors(this.camFrom, camP, kk); w.camera.quaternion.copy(this.camFromQ).slerp(qT, kk);
      if (this.shake > 0) { w.camera.position.y += (Math.random() - 0.5) * this.shake * 0.4; w.camera.position.x += (Math.random() - 0.5) * this.shake * 0.3; this.shake = Math.max(0, this.shake - dt * 1.2); }
      shadowAt(w, cx, cz);
      this.guides[this.face].material.opacity = 0.55 * kk;
      if (p && this.camT > 0.6) {
        // held left/right: auto-repeat after a short delay
        const dir = (k.has('a') || k.has('ArrowLeft') ? -1 : 0) + (k.has('d') || k.has('ArrowRight') ? 1 : 0) + (this.btnDir || 0);
        if (dir !== this.das.dir) { this.das.dir = dir; this.das.t = 0; }
        else if (dir) { this.das.t += dt; if (this.das.t > 0.17) { this.das.t -= 0.055; this.move(dir); } }
        const soft = k.has('s') || k.has('ArrowDown') || this.btnSoft;
        const grav = this.face === 'A' ? 0.95 - this.done.A * 0.08 : 0.7 - this.done.B * 0.06;
        this.fallT += dt;
        const step = soft ? 0.045 : grav;
        if (this.fits(p.cells, p.x, p.y - 1)) { this.lockT = 0; if (this.fallT >= step) { this.fallT = 0; p.y--; if (soft) SND.step(this.env.bus, { gain: 0.012, f: 900 }); } }
        else { this.lockT += dt; if (this.lockT > (soft ? 0.18 : 0.5)) this.lock(); }
        // pointer drag moves the piece column by column
        if (this.drag && this.piece) {
          const P = this.env.pointer, px = this.colPx();
          let n = Math.trunc((P.x - this.drag.x) / px);
          while (n !== 0) { const d = Math.sign(n); if (this.move(d)) this.drag.moved = true; this.drag.x += d * px; n -= d; }
          if (P.y - this.drag.y0 > 40) this.drag.moved = true;
        }
      }
      this.updBlocks(dt);
    },
    colPx() {
      const F = FACES[this.face], a = this.cellWorld(this.face, 4, 4, new T.Vector3()).project(this.w.camera), b = this.cellWorld(this.face, 5, 4, new T.Vector3()).project(this.w.camera);
      void F; return Math.max(18, Math.abs(b.x - a.x) * 0.5 * this.env.w);
    },
    updBlocks(dt) {
      dt = dt || 0;
      const v = new T.Vector3(), m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), col = new T.Color();
      let ns = 0, nt = 0;
      const put = (b, f, c, r, kind, tint, extra) => {
        const F = FACES[f], cw = F.len / COLS;
        this.cellWorld(f, c, r, v);
        const yaw = Math.atan2(-F.u[1], F.u[0]);
        q.setFromEuler(new T.Euler(extra && extra.rx || 0, yaw, extra && extra.rz || 0));
        if (extra && extra.off) v.add(extra.off);
        const sq = extra && extra.sq ? extra.sq : 1;
        if (kind === 'teak') { s.set(cw * 1.0, CH * 0.82 * sq, DEPTH * 0.96); if (nt < 120) { m4.compose(v, q, s); this.imTeak.setMatrixAt(nt, m4); this.imTeak.setColorAt(nt, col.copy(tint)); nt++; } }
        else { s.set(cw * 0.975, CH * 0.93 * sq, DEPTH); if (ns < 260) { m4.compose(v, q, s); this.imStone.setMatrixAt(ns, m4); this.imStone.setColorAt(ns, col.copy(tint)); ns++; } }
      };
      const keep = [];
      for (const b of this.blocks) {
        if (b.flash > 0) b.flash = Math.max(0, b.flash - dt * 1.4);
        const tint = col.clone().copy(b.tint).multiplyScalar(1 + b.flash * 1.4);
        if (b.fall) {
          b.fall.t += dt; if (b.fall.t > 1.6) continue;
          const F = FACES[b.f], t = b.fall.t;
          const off = new T.Vector3(F.n[0] * (t * 2.2) + F.u[0] * b.fall.vx * t, b.fall.vy * t - 6 * t * t, F.n[1] * (t * 2.2) + F.u[1] * b.fall.vx * t);
          tint.multiplyScalar(Math.max(0.2, 1 - t * 0.5));
          put(b, b.f, b.c, b.r, b.kind, tint, { off, rx: t * 1.5, rz: t * b.fall.vx });
        } else put(b, b.f, b.c, b.r, b.kind, tint, { sq: b.set ? 1 : 1 });
        keep.push(b);
      }
      this.blocks = keep;
      // the piece on its rope, and its ghost where it will land
      let ng = 0;
      const p = this.piece;
      if (p && this.mode === 'stack') {
        p.vx = U.damp(p.vx, p.x, 24, dt); p.vy = U.damp(p.vy, p.y, 20, dt);
        p.wob = Math.max(0, (p.wob || 0) - dt * 3);
        const swing = Math.sin(this.w.time * 7) * (p.wob || 0) * 0.08;
        const tint = new T.Color(p.kind === 'teak' ? '#ffffff' : p.tint);
        let minx = 9, maxx = 0, maxy = 0;
        for (const [cx, cy] of p.cells) {
          const fx = p.vx + cx, fy = p.vy + cy; minx = Math.min(minx, fx); maxx = Math.max(maxx, fx); maxy = Math.max(maxy, fy);
          const F = FACES[this.face], cw = F.len / COLS;
          const off = new T.Vector3(F.u[0] * (fx - (p.x + cx)) * cw, (fy - (p.y + cy)) * CH, F.u[1] * (fx - (p.x + cx)) * cw);
          put(null, this.face, p.x + cx, p.y + cy, p.kind, tint, { off, rz: swing });
        }
        const gy = this.dropY();
        const F = FACES[this.face], cw = F.len / COLS;
        for (const [cx, cy] of p.cells) {
          if (gy + cy >= ROWS) continue;
          this.cellWorld(this.face, p.x + cx, gy + cy, v); v.addScaledVector(new T.Vector3(F.n[0], 0, F.n[1]), 0.02);
          q.setFromEuler(new T.Euler(0, Math.atan2(-F.u[1], F.u[0]), 0)); s.set(cw * 0.99, CH * 0.97, DEPTH * 1.04);
          m4.compose(v, q, s); this.imGhost.setMatrixAt(ng++, m4);
        }
        // the rope from the hoist to the middle of the load
        const top = new T.Vector3(F.o[0] + F.u[0] * F.len / 2 + F.n[0] * 0.6, 8.6, F.o[1] + F.u[1] * F.len / 2 + F.n[1] * 0.6);
        const midc = (minx + maxx) / 2 + 0.5;
        const bot = new T.Vector3(F.o[0] + F.u[0] * midc * cw - F.n[0] * DEPTH / 2, Y0 + (maxy + 1) * CH, F.o[1] + F.u[1] * midc * cw - F.n[1] * DEPTH / 2);
        this.rope.visible = true; this.rope.position.copy(top).add(bot).multiplyScalar(0.5); this.rope.scale.y = top.distanceTo(bot);
        this.rope.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
      } else this.rope.visible = false;
      this.imStone.count = ns; this.imTeak.count = nt; this.imGhost.count = ng;
      this.imStone.instanceMatrix.needsUpdate = this.imTeak.instanceMatrix.needsUpdate = this.imGhost.instanceMatrix.needsUpdate = true;
      if (this.imStone.instanceColor) this.imStone.instanceColor.needsUpdate = true;
      if (this.imTeak.instanceColor) this.imTeak.instanceColor.needsUpdate = true;
    },

    /* ======================= the cloak: keep the stone level ======================= */
    startCloak() {
      const w = this.w, self = this;
      w.focus = null; this.mode = 'cloak'; this.phase = 3; this.camT = 0; this.camFrom = w.camera.position.clone(); this.camFromQ = w.camera.quaternion.clone();
      w.mode = dt => self.cloakTick(dt); w.goal(null);
      this.showButtons('cloak');
      this.ring.material.opacity = 0.6;
      this.env.hint(matchMedia('(pointer: coarse)').matches ? 'Drag anywhere to tilt the cloak · keep the stone inside the ring · ✕ to step back' : 'WASD or arrows (or drag) tilt the cloak · keep the stone inside the ring · Q steps back');
      w.progress(Math.floor(this.lift.prog * 4), 'Keep the stone in the ring while the corners rise');
      SND.glow(this.env.bus, 146.83, { gain: 0.06, dur: 8 });
      if (!this.toldCloak) { this.toldCloak = true; w.say('The cloak', 'He asked for a cloth, placed the stone on it with his own hand, and said that each clan should take hold of a side, then all of them should lift it together. (Ibn Ishaq; Musnad Ahmad 15504)', { ms: 10000 }); }
    },
    shapeCloak(gx, gz, sag) {
      const p = this.cloakGeo.attributes.position, b = this.ball;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
        const dip = Math.exp(-((x - b.x) ** 2 + (z - b.z) ** 2) / 0.18) * 0.12;
        p.setY(i, x * gx + z * gz - sag * Math.max(0, 1 - (Math.max(Math.abs(x), Math.abs(z)) / 1.4) ** 2) - dip + Math.sin(this.w.time * 2 + x * 3 + z * 2) * 0.008 * r);
      }
      p.needsUpdate = true; this.cloakGeo.computeVertexNormals();
      const corners = [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]];
      this.cornerLights.forEach((g, i) => { const [x, z] = corners[i]; g.position.set(x, x * gx + z * gz + 0.12, z); });
    },
    cloakTick(dt) {
      const w = this.w, k = w.keys, L = this.lift, b = this.ball, env = this.env;
      // the crane view looks down over the cloak toward the corner
      this.camT = Math.min(1, this.camT + dt / 1.2);
      const rig = this.cloakRig.position;
      const out = new T.Vector3(1, 0, -1).normalize();
      const camP = new T.Vector3(rig.x + out.x * 5.4, rig.y + 3.1, rig.z + out.z * 5.4), look = new T.Vector3(rig.x - out.x * 1.0, rig.y + 0.3, rig.z - out.z * 1.0);
      const kk = U.ease(this.camT);
      w.camera.fov = U.lerp(66, 52, kk); w.camera.updateProjectionMatrix();
      const qT = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(camP, look, new T.Vector3(0, 1, 0)));
      w.camera.position.lerpVectors(this.camFrom, camP, kk); w.camera.quaternion.copy(this.camFromQ).slerp(qT, kk);
      shadowAt(w, rig.x, rig.z);
      if (this.camT < 0.5) { this.shapeCloak(0, 0, 0.05); return; }
      // input in screen terms: right and forward relative to the camera
      const fwd = new T.Vector3(-out.x, 0, -out.z), right = new T.Vector3(-fwd.z, 0, fwd.x);
      let ix = 0, iz = 0;
      if (k.has('d') || k.has('ArrowRight')) ix += 1; if (k.has('a') || k.has('ArrowLeft')) ix -= 1;
      if (k.has('w') || k.has('ArrowUp')) iz += 1; if (k.has('s') || k.has('ArrowDown')) iz -= 1;
      if (this.drag) { const P = env.pointer; ix += U.clamp((P.x - this.drag.x) / 70, -1, 1); iz += U.clamp(-(P.y - this.drag.y) / 70, -1, 1); }
      const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
      // world tilt wanted by the player (the downhill direction), in the cloak's local frame
      const wantW = right.clone().multiplyScalar(ix).addScaledVector(fwd, iz);
      const ry = this.cloakRig.rotation.y, c = Math.cos(ry), s = Math.sin(ry);
      const lx = wantW.x * c - wantW.z * s, lz = wantW.x * s + wantW.z * c;
      this.tilt = this.tilt || { x: 0, z: 0 };
      this.tilt.x = U.damp(this.tilt.x, -lx * 0.16, 7, dt); this.tilt.z = U.damp(this.tilt.z, -lz * 0.16, 7, dt);
      // the four corners rise together, but never quite evenly; now and then one clan lifts too eagerly
      const amp = 0.035 + 0.075 * L.prog;
      L.gustT -= dt;
      if (L.gustT < 0) { L.gustT = 4.5 - L.prog * 2 + Math.random() * 2; L.gustI = (Math.random() * 4) | 0; L.gust = 1;
        const cl = this.cornerLights[L.gustI], wp = cl.getWorldPosition(new T.Vector3()), sp = w.spatial(wp, 6);
        SND.sing(env.bus, U.rnd(110, 160), { vowel: U.pick(['a', 'o']), dur: 0.6, gain: 0.03, pan: sp.pan, breath: 0.3, attack: 0.05 }); }
      L.gust = Math.max(0, L.gust - dt * 0.7);
      const t = w.time, ch = [0, 1, 2, 3].map(i => U.noise1(t * 0.35 + i * 17) * amp + (i === L.gustI ? L.gust * (0.06 + 0.1 * L.prog) : 0));
      // corners: 0 (-x,-z) 1 (+x,-z) 2 (+x,+z) 3 (-x,+z)
      const gx = ((ch[1] + ch[2]) - (ch[0] + ch[3])) / 2 / 2.8 + this.tilt.x, gz = ((ch[2] + ch[3]) - (ch[0] + ch[1])) / 2 / 2.8 + this.tilt.z;
      // the stone rolls downhill; the cloth cups it a little
      const r = Math.hypot(b.x, b.z), cup = 0.9 + (L.edge > 0 ? 6 : 0);
      b.vx += (-gx * 9.8 * 0.6 - b.x * cup) * dt; b.vz += (-gz * 9.8 * 0.6 - b.z * cup) * dt;
      b.vx *= Math.exp(-dt * 1.1); b.vz *= Math.exp(-dt * 1.1);
      b.x += b.vx * dt; b.z += b.vz * dt;
      if (r > 1.12 && L.edge <= 0) {
        L.edge = 1.6; L.prog = Math.max(0, L.prog - 0.04);
        SND.sing(env.bus, 130.81, { vowel: 'o', dur: 1.8, gain: 0.04, voices: 2 }); SND.swell(env.bus, { f0: 260, f1: 140, dur: 1.2, gain: 0.03 });
        if (!this.toldEdge) { this.toldEdge = true; w.say('Gently', 'The stone rolled toward the edge, so the corners pause and the cloth gathers it back. Lean against the slope to keep it in the ring.', { ms: 5000 }); }
      }
      L.edge = Math.max(0, L.edge - dt);
      const rr = Math.hypot(b.x, b.z); if (rr > 1.25) { b.x *= 1.25 / rr; b.z *= 1.25 / rr; b.vx *= -0.3; b.vz *= -0.3; }
      // the lift goes on while the stone rides in the ring
      const inRing = Math.hypot(b.x, b.z) < 0.56;
      if (inRing && L.edge <= 0) L.prog = Math.min(1, L.prog + dt / 42);
      this.ring.material.opacity = inRing ? 0.75 : 0.25 + 0.2 * Math.sin(t * 6);
      const q4 = Math.floor(L.prog * 4 + 1e-6);
      if (q4 !== this.lastQ) { if (this.lastQ != null && q4 > this.lastQ) { SND.sing(env.bus, [196, 220, 261.63, 293.66, 392][q4], { vowel: 'a', dur: 2, gain: 0.045, voices: 3 }); } this.lastQ = q4; w.progress(Math.min(4, q4), q4 < 4 ? 'Keep the stone in the ring while the corners rise' : 'The cloak has reached the corner'); }
      // the cloak rises and carries the stone toward the corner
      const pos = new T.Vector3(U.lerp(CLOAK0.x, CORNER.x + 1.7, U.smooth(0.15, 1, L.prog)), 0, U.lerp(CLOAK0.z, CORNER.z - 1.7, U.smooth(0.15, 1, L.prog)));
      const sag = 0.08 + (L.edge > 0 ? 0.12 : 0);
      this.cloakRig.position.set(pos.x, w.ground(pos.x, pos.z) + 0.1 + U.ease(L.prog) * 1.35 - (L.edge > 0 ? 0.08 : 0), pos.z);
      this.shapeCloak(gx, gz, sag);
      const surf = b.x * gx + b.z * gz - sag * Math.max(0, 1 - (Math.max(Math.abs(b.x), Math.abs(b.z)) / 1.4) ** 2) - 0.12;
      this.stone.position.set(b.x, surf + 0.2, b.z); this.stone.rotation.z -= b.vx * dt / 0.27; this.stone.rotation.x += b.vz * dt / 0.27;
      this.stoneGlow.position.copy(this.stone.position).y += 0.15; this.stoneGlow.material.opacity = 0.2 + L.prog * 0.4;
      // wind murmurs with the effort
      this.crowd.set('gain', 0.014 + 0.03 * L.prog, 0.5);
      if (L.prog >= 1 && !this.setting) this.setStone();
    },
    setStone() {
      const w = this.w, env = this.env;
      this.setting = { t: 0, from: this.stone.getWorldPosition(new T.Vector3()) };
      this.cloakRig.attach(this.stone);
      w.scene.attach(this.stone);
      this.showButtons(null); this.ring.material.opacity = 0;
      this.mode = 'final'; w.mode = () => {};
      SND.glow(env.bus, 98, { gain: 0.07, dur: 12 }); SND.sing(env.bus, 196, { vowel: 'a', dur: 6, gain: 0.05, voices: 5, attack: 1 });
      w.say('Set in its place', 'When the cloth reached the corner, he set the Black Stone in its place with his own hand, and built on over it. The quarrel was over. (Ibn Ishaq; Musnad Ahmad 15504)', { ms: 12000 });
      this.phase = 4;
    },

    /* ======================= controls ======================= */
    buildButtons(w) {
      const self = this, wrap = document.createElement('div');
      wrap.className = 'kabah-pad';
      wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
      const mk = (txt, css, down, up, label) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label);
        b.className = 'kabah-btn';
        b.style.cssText = 'position:absolute;pointer-events:auto;width:58px;height:58px;border-radius:50%;border:1px solid rgba(246,220,154,.55);background:rgba(10,12,22,.42);color:#f6e6c0;font:600 22px/1 system-ui,sans-serif;touch-action:none;backdrop-filter:blur(4px);' + css;
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); SND.init(); down(); });
        if (up) { b.addEventListener('pointerup', e => { e.stopPropagation(); up(); }); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up); }
        wrap.appendChild(b); return b;
      };
      this.btns = {
        left: mk('◀', 'left:18px;bottom:180px;', () => { self.move(-1); self.btnDir = -1; }, () => { self.btnDir = 0; }, 'Move left'),
        right: mk('▶', 'left:86px;bottom:180px;', () => { self.move(1); self.btnDir = 1; }, () => { self.btnDir = 0; }, 'Move right'),
        rot: mk('⟳', 'right:86px;bottom:180px;', () => self.rotate(1), null, 'Turn'),
        soft: mk('▼', 'right:18px;bottom:180px;', () => { self.btnSoft = true; }, () => { self.btnSoft = false; }, 'Lower'),
        drop: mk('⤓', 'right:52px;bottom:246px;', () => self.hardDrop(), null, 'Set down'),
        back: mk('✕', 'right:18px;top:38%;width:44px;height:44px;font-size:16px;', () => self.leaveMode(), null, 'Step back'),
      };
      const next = document.createElement('div');
      next.className = 'kabah-next';
      next.style.cssText = 'position:absolute;left:18px;top:30%;padding:10px 12px;border:1px solid rgba(246,220,154,.35);border-radius:10px;background:rgba(10,12,22,.4);color:#f2e6cc;font:600 10px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;';
      next.innerHTML = '<div>Next</div><div class="kabah-next-grid" style="display:grid;grid-template-columns:repeat(5,12px);grid-auto-rows:9px;gap:2px;margin-top:8px;"></div>';
      wrap.appendChild(next); this.nextEl = next;
      w.ui.layer.appendChild(wrap); this.pad = wrap;
    },
    showButtons(mode) {
      if (!this.pad) return;
      const touch = matchMedia('(pointer: coarse)').matches;
      this.pad.style.display = mode ? 'block' : 'none';
      const B = this.btns;
      ['left', 'right', 'rot', 'soft', 'drop'].forEach(k => { B[k].style.display = mode === 'stack' && touch ? 'block' : 'none'; });
      B.back.style.display = mode ? 'block' : 'none';
      this.nextEl.style.display = mode === 'stack' ? 'block' : 'none';
    },
    drawNext() {
      if (!this.nextEl || !this.next) return;
      const g = this.nextEl.querySelector('.kabah-next-grid'); g.innerHTML = '';
      const cells = this.next.cells, H2 = Math.max(...cells.map(c => c[1])) + 1;
      for (let y = H2 - 1; y >= 0; y--) for (let x = 0; x < 5; x++) {
        const d = document.createElement('i'); const on = cells.some(c => c[0] === x && c[1] === y);
        d.style.cssText = `display:block;border-radius:2px;background:${on ? (this.next.kind === 'teak' ? '#a87a4a' : '#cfc4b4') : 'rgba(255,255,255,.06)'}`;
        g.appendChild(d);
      }
    },
    pointer(e, p, ph) {
      if (!this.mode) return false;
      if (ph === 'down') { this.drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false }; return true; }
      if (ph === 'up' && this.drag) {
        const d = this.drag; this.drag = null;
        if (this.mode === 'stack' && this.piece) {
          const dx = e.clientX - d.x0, dy = e.clientY - d.y0, dtm = performance.now() - d.t;
          if (dy > 60 && dy > Math.abs(dx) * 1.3 && dtm < 600) this.hardDrop();
          else if (!d.moved && Math.hypot(dx, dy) < 14) this.rotate(1);
        }
        return true;
      }
      return true;
    },
    onKey(env, e) {
      if (!this.w || this.w.filmS || e.type !== 'keydown' && e.type) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if ((this.mode === 'stack' || this.mode === 'cloak') && (k === 'q' || k === 'Escape')) { this.leaveMode(); return; }
      if (this.mode !== 'stack' || !this.piece || e.repeat) return;
      if (k === 'a' || k === 'ArrowLeft') this.move(-1);
      else if (k === 'd' || k === 'ArrowRight') this.move(1);
      else if (k === 'w' || k === 'ArrowUp' || k === 'x' || k === 'k') this.rotate(1);
      else if (k === 'z') this.rotate(-1);
      else if (k === ' ') this.hardDrop();
    },

    /* ======================= the frame ======================= */
    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      if (this.later) { this.later.t -= dt; if (this.later.t <= 0) { const f = this.later.fn; this.later = null; f(); } }
      if (!this.mode) this.updBlocks(dt);
      // the other clans' walls rise to keep pace
      const target = this.phase === 4 || this.phase === 5 ? 4 : (this.autoTarget || 0);
      this.autoWalls.forEach(m => { const h = Math.max(0.001, target * CH); m.scale.y = U.damp(m.scale.y, h, 0.8, dt); m.position.y = Y0 + m.scale.y / 2; });
      // banners stir in the wind, and rise in the film
      for (const bn of this.banners) {
        const a = bn.cl.geometry.attributes.position, y = bn.y0 + 1.2 + 3.4 * bn.rise;
        for (let i = 0; i < a.count; i++) { const x0 = bn.base[i * 3]; a.setZ(i, Math.sin(t * 3.2 + x0 * 3 + bn.x) * 0.12 * (x0 + 0.75)); }
        a.needsUpdate = true;
        bn.cl.position.set(bn.x + Math.cos(-bn.ry) * 0, y, bn.z); bn.cl.rotation.y = bn.ry + Math.PI / 2; bn.cl.translateX(0.78);
      }
      // a set course sends a wave of light along it
      if (this.burstT > 0) { this.burstT = Math.max(0, this.burstT - dt); this.flashG.material.opacity = this.burstT * 0.9; this.flashG.scale.setScalar(1.6 + (0.6 - this.burstT) * 3); }
      if (this.sweep) {
        this.sweep.t += dt; const k = this.sweep.t / 1.3, v = this.cellWorld(this.sweep.f, k * (COLS - 1), this.sweep.r, new T.Vector3()), F = FACES[this.sweep.f];
        v.x += F.n[0] * 0.5; v.z += F.n[1] * 0.5; this.sweepG.position.copy(v); this.sweepG.material.opacity = Math.sin(Math.min(1, k) * Math.PI) * 0.9;
        if (k >= 1) { this.sweep = null; this.sweepG.material.opacity = 0; }
      }
      this.nicheGlow.material.opacity = this.phase === 'dispute' || this.phase === 3 ? 0.55 + 0.3 * Math.sin(t * 2) : this.nicheGlow.material.opacity;

      // the dispute: voices rise, then the judgement
      if (this.phase === 'dispute') {
        this.disputeT += dt;
        this.crowd.set('gain', 0.06, 0.8);
        if (this.disputeT > 11 && !this.judged) {
          this.judged = true;
          SND.glow(env.bus, 196, { gain: 0.06, dur: 8 }); SND.sing(env.bus, 293.66, { vowel: 'a', dur: 4, gain: 0.04, voices: 3, delay: 0.6 });
          w.say('Al-Amin', 'They agreed that the first man to come in would judge between them. It was Muhammad ﷺ. <span class="q">“This is al-Amin; we accept him,”</span> they said. (Musnad Ahmad 15504; Ibn Ishaq)', { ms: 11000, ar: 'هذا الأمين، رضينا' });
        }
        if (this.disputeT > 20) { this.phase = 3; this.crowd.set('gain', 0.02, 1.5); w.goal([CLOAK0.x, 1, CLOAK0.z]); w.step('Go to the cloak by the corner and take it up with the clans'); env.hint(matchMedia('(pointer: coarse)').matches ? 'Walk to the cloak · tap E' : 'Walk to the cloak by the corner · press E'); }
      }
      // the stone is set, and the walls rise to their full height
      if (this.phase === 4 && this.setting) {
        const S2 = this.setting; S2.t += dt;
        const k = U.clamp(S2.t / 2.2), to = new T.Vector3(CORNER.x - 0.05, Y0 + 2.5 * CH, CORNER.z + 0.05);
        this.stone.position.lerpVectors(S2.from, to, U.ease(k)); this.stone.position.y += Math.sin(k * Math.PI) * 0.5;
        this.stone.rotation.set(0, -Math.PI / 4, 0);
        this.stoneGlow.visible = false; this.nicheGlow.material.opacity = 0.5 + k * 0.6; this.nicheGlow.scale.setScalar(2.4 + k * 2);
        // the camera draws back and up
        const cam = w.camera, kk = U.ease(U.clamp((S2.t - 2.5) / 9));
        if (S2.t > 2.5) {
          const from = new T.Vector3(CLOAK0.x + 2.4, 3.6, CLOAK0.z - 2.4), toP = new T.Vector3(26, 15, -30);
          cam.position.lerpVectors(from, toP, kk); cam.lookAt(0, 2.5 + kk * 2, 0); shadowAt(w, 0, 0);
          this.upper.forEach(m => { const h = Math.max(0.001, (FULL_H - Y0 - 4 * CH) * U.smooth(0.1, 0.85, kk)); m.scale.y = h; m.position.y = Y0 + 4 * CH + h / 2; });
          this.bands.forEach(bd => { bd.g.visible = Y0 + 4 * CH + (FULL_H - Y0 - 4 * CH) * U.smooth(0.1, 0.85, kk) > bd.y + 0.12; });
          this.roof.visible = kk > 0.9;
          this.cloakRig.position.y = U.damp(this.cloakRig.position.y, w.ground(this.cloakRig.position.x, this.cloakRig.position.z) + 0.05, 1.5, dt);
          this.shapeCloak(0, 0, 0.02);
        }
        if (S2.t > 12 && !this.finished) {
          this.finished = true; this.phase = 5;
          w.finish('The Black Stone is set in its place');
          setTimeout(() => {
            if (!this.w) return; w.say('Eighteen cubits', 'The walls rose to eighteen cubits, twice their old height, in courses of stone and teak, under a roof of the ship’s timber. Five years later, the man they trusted would receive the first revelation, at forty. (al-Sirah al-Halabiyyah; Sahih al-Bukhari 3902)', { ms: 14000 });
            this.mode = null; w.mode = null; w.pos.set(11, 0, -17); w.yaw = Math.atan2(11, -17); w.pitch = 0.16; this.env.hint('WASD walk · the valley is yours to explore · find the places that glow');
            this.lines.A.visible = this.lines.B.visible = false;
          }, 2500);
        }
        if (S2.t > 2.5 && !this.finished) return;
      }
      // sound of the work: chisels from the other walls, voices, pigeons
      const C = this.clocks;
      C.chisel -= dt;
      if (C.chisel < 0 && this.phase !== 5) {
        C.chisel = 0.25 + Math.random() * 0.9;
        const a = Math.random() * 6.28, p = new T.Vector3(Math.cos(a) * 9, 0, Math.sin(a) * 9 + (Math.random() < 0.5 ? 20 : 0)), sp = w.spatial(p, 8);
        SND.knock(env.bus, { f: U.rnd(700, 1100), gain: 0.03 * sp.gain + 0.004, click: 4200, pan: sp.pan });
      }
      C.voice -= dt * (this.phase === 'dispute' ? 3 : 1);
      if (C.voice < 0) {
        C.voice = 1.4 + Math.random() * 2.6;
        const bn = this.banners[(Math.random() * 4) | 0], sp = w.spatial(bn, 10);
        SND.sing(env.bus, U.rnd(100, 150) * (this.phase === 'dispute' ? 1.25 : 1), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.3, 0.8), gain: 0.02 * sp.gain + 0.004, pan: sp.pan, voices: 1, breath: 0.35, attack: 0.04, hold: 0.25, vib: 0.002 });
      }
      C.coo -= dt; if (C.coo < 0) { C.coo = 3 + Math.random() * 6; SND.coo && SND.coo(env.bus, { gain: 0.02, pan: U.rnd(-0.8, 0.8) }); }
      C.bird -= dt; if (C.bird < 0) { C.bird = 4 + Math.random() * 6; SND.chirp(env.bus, { gain: 0.01 }); }
      this.wind.set('gain', 0.03 + 0.02 * Math.sin(t * 0.2), 1);
    },
    onLeave() { this.mode = null; this.pad = null; this.btns = null; this.blocks = []; this.setting = null; this.finished = false; this.judged = false; },
  }));
})();
