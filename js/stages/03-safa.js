/* Makkah — The Call from as-Safa, c. 613 CE.
   A 2.5D side-scrolling platformer in the manner of Limbo, Inside and Journey. You are a small flame
   of dawn crossing Makkah from the western quarter to the rock of as-Safa: the rooftops (run and jump),
   the arches and the market (glide on warm smoke, bounce on awnings), and the rock itself (crumbling
   ledges and the east wind). On the summit the morning cry is raised and the clans' lights gather
   below (Sahih al-Bukhari 4971, 4770). The world is built in full 3D around a side-view camera, so
   the town, the Ka'bah and the mountains move past in true parallax. No person is depicted. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const ID = 'safa';
  const KX = 112, KZ = -62;                 // the Ka'bah, behind the track, west of as-Safa
  const CAMZ = 17, FOV = 38;                // the side camera
  const SUMMIT = { x: 214, y: 14.8 };

  /* ---------------- local helpers ---------------- */
  const LIN = { rough_linen: [0.292, 0.419, 0.627] };
  const linen = (w, hex, rep) => { const c = new T.Color(hex).convertSRGBToLinear(), a = LIN.rough_linen; const m = PHOTO.mat(w, 'rough_linen', { rep: rep || [1, 1], side: T.DoubleSide }); if (PHOTO.enabled) m.color.setRGB(c.r / a[0], c.g / a[1], c.b / a[2]); else m.color.set(hex); return m; };
  const tri = (w, id, k, fb, col) => { const m = PHOTO.mat(w, id, { triplanar: k, fallback: fb, color: col }); if (!PHOTO.enabled) SCAPE.triplanar(m, k); return m; };
  function box(g, mat, sx, sy, sz, x, y, z, ry, cast) {
    const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    m.castShadow = cast !== false; m.receiveShadow = true; g.add(m); return m;
  }
  function cyl(g, mat, r0, r1, h, x, y, z, rx, rz, seg) {
    const m = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg || 7), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, 0, rz || 0);
    m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  }
  /* A house facing +z (toward the camera) with a parapet, beam ends, a door and windows. */
  function house(g, M, x0, x1, top, base, z0, z1, r, o) {
    o = o || {};
    const hw = (x1 - x0) / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hd = (z1 - z0) / 2, h = top - base;
    const wall = o.wall || M.walls[(r() * M.walls.length) | 0];
    box(g, wall, hw * 2, h + 1.5, hd * 2, cx, base - 1.5 + (h + 1.5) / 2, cz);
    box(g, M.roof, hw * 2 - 0.3, 0.08, hd * 2 - 0.3, cx, top + 0.03, cz, 0, false);
    const ph = o.parapet == null ? 0.35 + r() * 0.3 : o.parapet, pt = 0.22;
    if (ph > 0) {
      box(g, wall, hw * 2, ph, pt, cx, top + ph / 2, z0 + pt / 2); box(g, wall, pt, ph, hd * 2, x0 + pt / 2, top + ph / 2, cz); box(g, wall, pt, ph, hd * 2, x1 - pt / 2, top + ph / 2, cz);
      if (!o.walkFront) box(g, wall, hw * 2, ph * 0.6, pt, cx, top + ph * 0.3, z1 - pt / 2);
    }
    const nb = Math.max(2, Math.floor(hw * 2 / 0.95));
    for (let i = 0; i < nb; i++) cyl(g, M.beam, 0.08, 0.09, 0.5, x0 + 0.45 + i * ((hw * 2 - 0.9) / Math.max(1, nb - 1)), top - 0.2, z1 + 0.18, Math.PI / 2, 0, 6);
    // doors and windows on the face we see
    const doors = Math.max(1, Math.floor(hw * 2 / 6));
    for (let i = 0; i < doors; i++) {
      const dx = x0 + (i + 0.5) * (hw * 2 / doors) + (r() - 0.5) * 1.2;
      if (base < top - 2.4) { box(g, M.door, 1.0, 1.95, 0.1, dx, base + 0.97, z1 + 0.02); box(g, M.beam, 1.5, 0.18, 0.2, dx, base + 2.05, z1 + 0.06); }
      for (let k = 0; k < 2; k++) { const wy = base + 3 + k * 2.6; if (wy < top - 0.7) { const wx = dx + (k ? -1.6 : 1.7); if (wx > x0 + 0.6 && wx < x1 - 0.6) box(g, M.dark, 0.55, 0.62, 0.06, wx, wy, z1 + 0.03, 0, false); } }
    }
    if (o.lit && r() < 0.6) { const wy = base + 3, wx = cx + (r() - 0.5) * hw; box(g, M.warm, 0.5, 0.55, 0.05, wx, Math.min(wy, top - 0.8), z1 + 0.04, 0, false); }
  }

  ENGINE.register(WORLD.stage({
    key: ID,
    arabic: 'الصَّفَا',
    title: 'The Call from as-Safa',
    era: 'Makkah · c. 613 CE · the first public call',
    hint: 'A/D or ←/→ run · Space or W jump (hold to glide) · reach each lamp · E on the summit',
    hintTouch: 'Hold ◀ ▶ to run · tap ⤒ to jump, hold it to glide · reach each lamp',
    sound: { reverb: 0.55 },
    captureKeys: true,
    story: `<p>For about three years the message was shared quietly. Then came the verse <i>“And warn your nearest kin”</i> (Qur’an 26:214). He climbed the low rock of as-Safa, beside the Ka‘bah, and gave the cry used to warn of a raid at dawn, until the clans of Quraysh gathered below.</p>
            <p>You are a small flame of the dawn, crossing the roofs and lanes of Makkah to the rock. This station follows the account of Ibn ‘Abbas in Sahih al-Bukhari.</p>`,

    film(env, w) {
      const self = this;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [48, 40],
          path: [[[-40, 120, 170], [80, 10, -40]], [[30, 85, 130], [110, 6, -50]]],
          start: () => { SND.swell(env.bus, { f0: 120, f1: 360, dur: 6.5, gain: 0.035 }); } },
        { dur: 6, fade: 'dip', line: 'Makkah before dawn. For three years the message has been shared quietly.', ar: 'مكة قبيل الفجر. ثلاثَ سنين والدعوةُ سِرّ.',
          path: [[[-150, 9, 10], [-120, 5, -4]], [[-118, 7.5, 8], [-90, 4.5, -4]]], ease: 'linear' },
        { dur: 6, fade: 'cut', line: 'Then a verse is revealed: “And warn your nearest kin.” (Qur’an 26:214)', ar: '﴿وَأَنذِرْ عَشِيرَتَكَ الْأَقْرَبِينَ﴾ (الشعراء: ٢١٤)',
          path: [[[-20, 3, 9], [-10, 6, -2]], [[2, 2.6, 9], [12, 5, -2]]], ease: 'linear',
          start: () => SND.sing(env.bus, 220, { vowel: 'a', dur: 4.5, gain: 0.04, voices: 3, attack: 1 }) },
        { dur: 6, fade: 'dip', line: 'Beside the House, at the foot of Abu Qubays, rises a low rock: as-Safa.', ar: 'وبجوار البيت، عند سفح أبي قُبيس، صخرةٌ منخفضة: الصفا.',
          path: [[[KX - 40, 22, KZ + 30], [KX + 70, 8, -8]], [[KX - 12, 16, KZ + 46], [SUMMIT.x, 10, 0]]], ease: 'glide' },
        { dur: 6, fade: 'cut', line: 'The clans of Quraysh sleep in their houses across the valley.', ar: 'وقبائلُ قريشٍ نيامٌ في بيوتها على امتداد الوادي.',
          path: [[[60, 30, 40], [20, 3, -40]], [[100, 26, 30], [60, 3, -50]]], ease: 'linear',
          during: (w2, k) => { self.windowsGlow(k); } },
        { dur: 6, fade: 'dip', line: 'On a roof in the western quarter, a small flame of dawn wakes.', ar: 'وعلى سطحٍ في الحيّ الغربيّ، تستيقظ شُعلةٌ صغيرةٌ من نور الفجر.',
          path: [[[-210, 6.5, 6], [-204, 4.9, 0]], [[-207, 6.2, 9], [-204, 5.2, 0]]], ease: 'glide',
          start: () => { self.flameScale = 0.1; SND.glow(env.bus, 293.66, { gain: 0.05, dur: 5 }); },
          during: (w2, k) => { self.flameScale = U.smooth(0.2, 0.9, k); self.placeFlame(); } },
      ];
    },
    filmOpts: { end(w) { const s = ENGINE.cur; if (s && s.startPlay) s.startPlay(); } },

    enter(env) {
      const self = this; this.env = env;
      /* ---------------- the valley ---------------- */
      const H = (x, z) => {
        // the track corridor (z near 0) follows a gentle floor; the valley rises into mountains all round
        const dc = Math.hypot((x - 40) * 0.7, (z + 60) * 0.9);
        let y = Math.max(0, dc - 190); y = Math.pow(y, 1.25) * 0.55;
        y += SCAPE.ridge(x * 0.012, z * 0.012, 5) * 50 * U.smooth(170, 280, dc);
        y += 110 * Math.exp(-((x - 270) ** 2 + (z + 70) ** 2) / (2 * 60 * 60));   // Abu Qubays
        y += 12.5 * Math.exp(-((x - 212) ** 2) / (2 * 16 * 16) - (z * z) / (2 * 22 * 22)); // the rock of as-Safa
        y += SCAPE.fbm(x * 0.05, z * 0.05, 3) * 0.6 * U.smooth(4, 14, Math.abs(z)) + SCAPE.fbm(x * 0.3, z * 0.3, 2) * 0.06;
        return y;
      };
      const w = this.w = WORLD.create(env, { start: { x: -205, z: CAMZ, yaw: 0 }, exposure: 1.0, far: 1700, fov: FOV, fog: { color: 0x5a5a78, density: 0.0021 } });
      const S = w.scene;
      const ter = SCAPE.terrain(w, { size: 1200, seg: 300, cx: 40, cz: -60, height: H, rock: [0.82, 0.94], rockHeight: [10, 30],
        colors: { low: '#bba184', high: '#a98e70', rock: '#6e6058', dark: '#4e423c' }, tex: 'gravel', rockTex: 'granite',
        photo: { ground: 'gravelly_sand', rock: 'rock_face_03', normal: 1 }, rep: 0.22, rockRep: 0.05 });
      w.ground = ter.ground;
      w.sky({ top: '#141c40', mid: '#7a6a88', bot: '#2a2438', sunDir: [1, 0.02, -0.3], sun: '#ff9a6a', sunSize: 0.004, stars: 0.4, haze: 0.4 });
      const sun = new T.DirectionalLight(0xffc49a, 1.1); sun.position.set(80, 12, 30); S.add(sun);
      this.hemi = new T.HemisphereLight(0x8090c8, 0x5a4a40, PHOTO.enabled ? 0.12 : 0.6); S.add(this.hemi);
      w.followShadow(sun, 34, 2048);
      PHOTO.sky(w, 'qwantani_dawn_puresky', { sun, intensity: 0.7, rotation: -0.54, haze: '#6a6680', horizon: 0.4, ground: '#6a5a50', bounce: 0.4 }).then(r => {
        if (r && r.sunDir && w._shadow) w._shadow.off.copy(r.sunDir).multiplyScalar(34 * 2.5); // PHOTO.sky leaves the shadow offset at unit length
        if (r && r.sunDir && self.post && self.post.rays) self.post.rays.dir = r.sunDir.toArray();
      });
      SCAPE.horizon(w, { cx: 40, cz: -60, haze: '#6e6a82', layers: [{ r: 700, h: 120, color: '#3c3a48', seed: 13 }, { r: 1000, h: 150, color: '#55526a', seed: 27 }, { r: 1400, h: 170, color: '#6e6a84', seed: 5 }] });

      const M = this.M = {
        walls: [tri(w, 'old_stone_wall', 0.42, KIT.mudBrick(w, [1, 1]), '#c8bcac'), tri(w, 'clay_plaster', 0.3, KIT.plaster(w, [1, 1], '#d8c4a4'), '#e6d4bc'),
                tri(w, 'brown_mud_dry', 0.28, KIT.mudBrick(w, [1, 1]), '#d0bca8'), tri(w, 'clay_block_wall', 0.4, KIT.mudBrick(w, [1, 1]), '#d4c0a8')],
        roof: tri(w, 'mud_cracked_dry_03', 0.3, KIT.sand(w, [1, 1]), '#9a8470'),
        beam: PHOTO.mat(w, 'medieval_wood', { rep: [0.4, 1], color: '#a88a6a', fallback: KIT.wood(w, [1, 1], '#6a4a30') }),
        door: PHOTO.mat(w, 'old_planks_02', { rep: [0.8, 1.2], color: '#b09878', fallback: KIT.wood(w, [1, 1], '#5a3a22') }),
        dark: new T.MeshStandardMaterial({ color: 0x14100e, roughness: 1 }),
        warm: new T.MeshBasicMaterial({ color: 0x000000 }),
        rock: tri(w, 'rock_face_03', 0.3, KIT.basalt(w, [1, 1]), '#a89888'),
        stone: tri(w, 'dry_riverbed_rock', 0.5, KIT.basalt(w, [1, 1]), '#c8beb4'),
        pole: PHOTO.mat(w, 'palm_tree_bark', { rep: [1, 3], color: '#a89078', fallback: KIT.bark(w) }),
        plank: PHOTO.mat(w, 'old_planks_02', { rep: [2, 0.5], color: '#c0a888', fallback: KIT.wood(w, [3, 1], '#7a5838') }),
        log: PHOTO.mat(w, 'medieval_wood', { rep: [1, 2], color: '#b09070', fallback: KIT.wood(w, [1, 2], '#6a4a30') }),
        awnings: ['#d8c8a8', '#b8653e', '#c9a04a', '#8a6a4a', '#e2d6c0'].map(c => linen(w, c, [1.5, 1])),
      };
      this.warmMat = M.warm;

      /* ---------------- the level: solids, one-way ledges, awnings, smoke, lamps, sparks ---------------- */
      this.solids = []; this.ledges = []; this.pits = []; this.smokes = []; this.lamps = []; this.sparks = []; this.discs = [];
      const statics = new T.Group(); S.add(statics);
      const r = U.seeded(4971);
      const L = this;
      const roof = (x0, x1, top, o) => { L.solids.push({ x0, x1, y0: -5, y1: top }); house(statics, M, x0, x1, top, Math.min(0, w.ground((x0 + x1) / 2, 0)), -3.2, 3.2, r, Object.assign({ walkFront: true, parapet: 0.22 }, o)); };
      const crate = (x, wd, h, mat) => { const y0 = w.ground(x, 0); L.solids.push({ x0: x - wd / 2, x1: x + wd / 2, y0: -5, y1: y0 + h }); box(statics, mat || M.stone, wd, h + 0.4, 1.4, x, y0 + (h - 0.4) / 2, 0.6); };
      const ledge = (x0, x1, y, kind, o) => { const l = Object.assign({ x0, x1, y, kind: kind || 'beam' }, o || {}); L.ledges.push(l); return l; };
      const beam = (x0, x1, y) => { ledge(x0, x1, y); cyl(statics, M.log, 0.16, 0.18, x1 - x0 + 0.8, (x0 + x1) / 2, y - 0.17, 0.3, 0, Math.PI / 2, 8); cyl(statics, M.log, 0.14, 0.16, x1 - x0 + 0.8, (x0 + x1) / 2, y - 0.17, -0.5, 0, Math.PI / 2, 8); };
      const awning = (x0, x1, y) => {
        const l = ledge(x0, x1, y, 'awning');
        const g = new T.Group(); g.position.set((x0 + x1) / 2, y, 0.4); S.add(g); g.userData.dynamic = true;
        [[x0 - 0.1, -1.2], [x1 + 0.1, -1.2], [x0 - 0.1, 1.6], [x1 + 0.1, 1.6]].forEach(([px, pz]) => cyl(statics, M.pole, 0.05, 0.06, y + 0.3, px, (y + 0.3) / 2 + w.ground(px, 0) * 0.5, pz + 0.4));
        const cl = new T.Mesh(new T.PlaneGeometry(x1 - x0 + 0.4, 3.0, 10, 6), M.awnings[(r() * M.awnings.length) | 0]); cl.rotation.x = -Math.PI / 2 + 0.12; cl.castShadow = cl.receiveShadow = true; g.add(cl);
        l.mesh = cl; l.base = cl.geometry.attributes.position.array.slice(); l.bounce = 0;
      };
      const arcade = (x0, x1, top) => {
        // a row of arches behind the lane; you can run along its top
        ledge(x0, x1, top);
        const n = Math.max(2, Math.round((x1 - x0) / 3.2)), sw = (x1 - x0) / n, wall = M.walls[0];
        for (let i = 0; i <= n; i++) box(statics, wall, 0.7, top, 1.2, x0 + i * sw, top / 2, -1.6);
        box(statics, wall, x1 - x0 + 0.7, 0.9, 1.3, (x0 + x1) / 2, top - 0.45, -1.6);
        for (let i = 0; i < n; i++) { const a = new T.Mesh(new T.TorusGeometry(sw / 2 - 0.35, 0.28, 6, 14, Math.PI), wall); a.position.set(x0 + (i + 0.5) * sw, top - 1.2, -1.6); a.castShadow = true; statics.add(a); }
        box(statics, M.dark, x1 - x0, top - 1.4, 0.2, (x0 + x1) / 2, (top - 1.4) / 2, -2.4, 0, false);
      };
      const rock = (x0, x1, top, o) => {
        o = o || {};
        L.solids.push({ x0, x1, y0: -5, y1: top });
        const cx = (x0 + x1) / 2, wd = x1 - x0, g0 = w.ground(cx, 0);
        // a rock pillar under a scanned boulder crown
        box(statics, M.rock, wd * 0.98, top - g0 + 2, 2.6, cx, g0 - 2 + (top - g0 + 2) / 2 - 0.3, 0);
        L.rockCaps.push([cx, top, wd]);
      };
      this.rockCaps = [];
      const crumble = (x0, x1, y) => {
        const l = ledge(x0, x1, y, 'crumble'); l.t = -1; l.down = 0;
        const g = new T.Group(); g.position.set((x0 + x1) / 2, y, 0); g.userData.dynamic = true; S.add(g);
        const m = new T.Mesh(new T.BoxGeometry(x1 - x0, 0.5, 1.8), M.stone); m.position.y = -0.25; m.castShadow = m.receiveShadow = true; g.add(m);
        l.mesh = g;
      };
      const pit = (x0, x1, y, mode) => L.pits.push({ x0, x1, y, mode: mode || 'below' });
      const smoke = (x, top) => { L.smokes.push({ x, y0: w.ground(x, 0), top }); };
      const lamp = (x, y, part) => { L.lamps.push({ x, y, part, lit: false }); };
      const spark = (x, y) => L.sparks.push({ x, y, got: false });

      /* Part 1 — the rooftops of the western quarter */
      roof(-213, -199, 4.2); lamp(-202, 4.2, 0);
      pit(-199, -196.5, 1.5); roof(-196.5, -188, 4.6);
      pit(-188, -185, 1.5); roof(-185, -176, 4.0); spark(-180.5, 6.2);
      roof(-176, -170.5, 5.6);
      pit(-170.5, -167, 1.5); roof(-167, -158, 5.0); lamp(-160, 5.0, 1);
      pit(-158, -156, 1.5); roof(-156, -148, 3.6);
      pit(-148, -144, 1.5); roof(-144, -137, 3.8); spark(-146, 5.8);
      pit(-137, -133, 1.5); beam(-137.4, -132.6, 4.9);
      roof(-133, -124, 5.6);
      pit(-124, -121, 1.5); roof(-121, -112, 4.4); roof(-112, -106, 6.0); spark(-107.5, 7.8);
      pit(-106, -101.5, 1.5); roof(-101.5, -92, 5.2); lamp(-95, 5.2, 1);
      pit(-92, -89, 1.5); roof(-89, -80, 4.2); roof(-80, -74.5, 3.0); crate(-73.4, 1.4, 1.5);
      lamp(-71, 0, 1);
      /* Part 2 — the arches, the market and the warm smoke */
      awning(-63, -59, 2.0); arcade(-58, -40, 4.6); spark(-50, 7); crate(-44.5, 1.2, 0.9, M.plank);
      crate(-37.6, 1.0, 1.1); pit(-37, -31, -0.8); crate(-30.4, 1.0, 1.1);  // a cistern with a stone curb
      spark(-34, 3.4); spark(-27.5, 2.2); spark(-25.5, 4.5);
      smoke(-23.5, 11.5); roof(-21, -10, 9.5, { lit: true }); lamp(-13, 9.5, 2);
      awning(-6, -1.5, 2.2); awning(3, 7.5, 2.6); spark(0.5, 6);
      arcade(10, 26, 4.8); spark(14, 6.6);
      crate(26.6, 1.4, 1.3, M.plank); crate(28.6, 1.6, 2.6, M.plank); roof(30.5, 38, 4.2); lamp(34, 4.2, 2);
      pit(40, 51, -0.8); spark(42.5, 6); spark(46.5, 5.5);                // the flood gully
      smoke(53.5, 12.5); roof(56, 64, 8.2); lamp(60.5, 8.2, 2);
      /* Part 3 — the open ground and the rock of as-Safa */
      crate(66, 1.4, 1.0); crate(80, 2.4, 1.3); spark(88, 2.0);
      pit(94, 112, -0.8); crumble(96.5, 98.5, 0.9); crumble(101.5, 103.5, 1.4); crumble(106.5, 108.5, 1.0);
      lamp(118, 0, 3);
      crate(132, 2, 1.0); crate(140.5, 1.6, 1.5);
      pit(148, 224, 0, 'ground');
      rock(150, 155.5, 1.5); rock(157.5, 161.5, 2.9); crumble(163.5, 165.5, 4.2); rock(167.5, 172.5, 5.5); rock(174.5, 179, 6.9); lamp(177, 6.9, 3);
      beam(180.6, 183.4, 8.2); rock(184.5, 189.5, 9.6); crumble(191.5, 193.5, 10.9); rock(195.5, 200, 12.2); rock(202, 205.5, 13.5);
      rock(207.5, 224, 14.8);
      this.lamps.sort((a, b) => a.x - b.x);

      // rock crowns: scanned boulders capping the rock pillars
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', points: this.rockCaps.map(([x, top, wd]) => [x, 0, wd * 0.48]), seed: 61, fallback: 'boulder', fallbackScale: 0.8, sink: 0.55,
        ground: x => { let best = null; for (const c of self.rockCaps) if (!best || Math.abs(c[0] - x) < Math.abs(best[0] - x)) best = c; return best ? best[1] - 0.05 : 0; } });
      PHOTO.place(w, 'namaqualand_cliff_01', { pos: [214, 0, -6], s: 1.5, ry: 0.3 }); PHOTO.place(w, 'namaqualand_cliff_01', { pos: [196, 0, -9], s: 1.3, ry: 2.2 });

      /* ---------------- depth: the town behind, the Ka'bah, foreground silhouettes ---------------- */
      // rows of houses just behind the track and climbing away across the valley
      const hr = U.seeded(612);
      for (let row = 0; row < 3; row++) {
        let x = -226 + hr() * 4;
        while (x < 150 - row * 10) {
          const wd = 5 + hr() * 7, z1 = -6 - row * 8.5 - hr() * 2, z0 = z1 - 5 - hr() * 3, top = 4 + hr() * 5 + row * 0.8;
          if (!(Math.abs(x - KX) < 22 && row > 0)) house(statics, M, x, x + wd, top, Math.min(w.ground(x, z1), w.ground(x + wd, z1)), z0, z1, hr, { lit: true });
          x += wd + (hr() < 0.3 ? 2 + hr() * 3 : 0.3);
        }
      }
      const far = SCAPE.scatter(w, { kind: 'house', n: 240, area: [-240, -260, 190, -36], scale: [6, 11], seed: 21, slopeMax: 0.55, avoid: (x, z) => Math.hypot(x - KX, z - KZ) < 26 });
      far.meshes.forEach(m => { m.material = tri(w, 'clay_plaster', 0.25, m.material.map, '#d8c8b4'); });
      // the Ka'bah in its courtyard, draped
      const kg = new T.Group(); kg.position.set(KX, w.ground(KX, KZ), KZ); kg.rotation.y = 0.35; S.add(kg);
      box(kg, M.stone, 11.4, 0.5, 10.4, 0, 0.25, 0);
      box(kg, linen(w, '#1c1a1a', [3, 3]), 11, 8.6, 10, 0, 4.3, 0);
      box(kg, linen(w, '#3a3028', [3, 1]), 11.06, 0.5, 10.06, 0, 6.6, 0, 0, false);
      this.kGlow = KIT.glow(w, 0xffd8a0, 26, 0.12); this.kGlow.position.set(KX, kg.position.y + 6, KZ); S.add(this.kGlow);
      // foreground: palm trunks, poles and hanging cloth between camera and track, for depth
      const fr = U.seeded(77);
      for (let x = -230; x < 230; x += 9 + fr() * 14) {
        const z = 5.5 + fr() * 4, kind = fr();
        if (kind < 0.45) { const p = KIT.palm(w, 7 + fr() * 5, { lean: (fr() - 0.5) * 0.5 }); p.position.set(x, w.ground(x, z), z); statics.add(p); }
        else if (kind < 0.75) { cyl(statics, M.pole, 0.09, 0.11, 6, x, w.ground(x, z) + 3, z); const c = new T.Mesh(new T.PlaneGeometry(1.6, 2.2, 4, 4), M.awnings[(fr() * 5) | 0]); c.position.set(x + 0.8, w.ground(x, z) + 4.4, z); statics.add(c); }
        else { PHOTO.place(w, U.pick(['namaqualand_boulder_04', 'namaqualand_boulder_05']), { pos: [x, undefined, z + 1], s: 0.8 + fr() * 0.6, ry: fr() * 6 }); }
      }
      // props on roofs and in the market
      [['wicker_basket_01', -186, 4.0, 1.0], ['jug_01', -175, 5.6, 1.1], ['ceramic_vase_01', -127, 5.6, 1.2], ['wicker_basket_01', -52, 0, 1.3], ['wicker_basket_01', -47, 0, 1.2],
        ['brass_pot_01', -24.2, 0, 1.2], ['stone_fire_pit', -23.5, 0, 1.0], ['jug_01', 14, 0, 1.3], ['ceramic_vase_01', 21, 0, 1.4], ['wooden_bowl_01', 2, 0, 1.3], ['food_pomegranate_01', 2.2, 0.25, 1.4],
        ['stone_fire_pit', 53.5, 0, 1.0], ['brass_diya_lantern', -202, 4.2, 2.2]].forEach(([id, x, y, s]) => PHOTO.place(w, id, { pos: [x, y || w.ground(x, 0.8), 0.8], s, ry: x }));
      // stone curb of the cistern
      box(statics, M.stone, 0.4, 0.6, 2.4, -37.2, 0.3, 0.2); box(statics, M.stone, 0.4, 0.6, 2.4, -30.8, 0.3, 0.2);
      box(statics, M.dark, 6, 0.1, 2.6, -34, -0.75, 0.2, 0, false);
      // scatter: stones, scrub and the gully
      SCAPE.scatter(w, { kind: 'pebble', n: 2200, area: [-230, -60, 230, 12], scale: [0.05, 0.2], seed: 4, color: '#a89c90' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 420, area: [-230, -40, 230, 10], scale: [0.8, 1.6], seed: 31, fallback: 'pebble', fallbackScale: 0.15 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 260, area: [40, -80, 240, 12], scale: [0.7, 2], seed: 32, fallback: 'rock', fallbackScale: 0.4 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', n: 140, area: [-300, -400, 400, 20], scale: [2, 5], seed: 34, fallback: 'boulder',
        density: (x, z) => U.smooth(150, 200, Math.hypot((x - 40) * 0.7, (z + 60) * 0.9)) + (x > 150 && z < -8 ? 0.7 : 0) });
      SCAPE.scatter(w, { kind: 'boulder', n: 260, area: [-400, -560, 480, 200], scale: [3, 10], seed: 3, density: (x, z) => U.smooth(180, 240, Math.hypot((x - 40) * 0.7, (z + 60) * 0.9)) });
      SCAPE.scatter(w, { kind: 'rock', n: 600, area: [-300, -400, 400, 30], scale: [0.4, 2.2], seed: 5, density: (x, z) => U.smooth(120, 190, Math.hypot((x - 40) * 0.7, (z + 60) * 0.9)) + (x > 70 ? 0.3 : 0) });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', n: 120, area: [-230, -80, 240, 14], scale: [0.7, 1.4], seed: 37, fallback: 'shrub', density: (x, z) => (x > 40 ? 1 : 0.15) });
      SCAPE.scatter(w, { kind: 'thorn', n: 200, area: [-260, -200, 300, 14], scale: [0.6, 1.3], seed: 8, density: (x, z) => (x > 40 || z < -60 ? 1 : 0.1) });
      SCAPE.scatter(w, { kind: 'grass', n: 1200, area: [36, -40, 240, 12], scale: [0.35, 0.8], seed: 6 });
      SCAPE.scatter(w, { kind: 'acacia', n: 18, area: [60, -70, 200, -14], scale: [0.9, 1.4], seed: 9 });
      SCAPE.scatter(w, { kind: 'palm', n: 30, area: [-120, -110, 60, -40], scale: [8, 12], seed: 12 });

      // life
      SCAPE.birds(w, { n: 10, x: 60, z: -60, y: 40, r: 90, size: 0.7, speed: 0.08, color: 0x2a2630 });
      const hearths = [[-23.5, 0.6, 0.4], [53.5, 0.6, 0.6], [-160, 6, -14], [-90, 6, -22], [-30, 8, -30], [30, 7, -18], [90, 6, -26]];
      SCAPE.smoke(w, { sources: hearths, height: 14, wind: [0.15, 0.05], size: 2.6, opacity: 0.18, color: '#9a94a0' });
      SCAPE.motes(w, { n: 120, area: [-220, 0.5, -6, 230, 18, 8], color: '#ffd8a8', size: 0.12, additive: true });

      statics.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
      this.baked = w.bake(statics);

      /* ---------------- the flame ---------------- */
      this.flame = new T.Group(); this.flame.userData.dynamic = true; S.add(this.flame);
      this.fOuter = KIT.glow(w, 0xff9a40, 1.6, 0.9); this.fInner = KIT.glow(w, 0xfff2c8, 0.7, 1); this.fHalo = KIT.glow(w, 0xffb060, 5, 0.18);
      this.flame.add(this.fHalo, this.fOuter, this.fInner);
      this.fLight = new T.PointLight(0xffa850, 2.4, 13, 2); this.fLight.position.y = 0.6; this.flame.add(this.fLight);
      this.trailN = 26; this.trailP = [];
      const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.BufferAttribute(new Float32Array(this.trailN * 3), 3)); tg.setAttribute('color', new T.BufferAttribute(new Float32Array(this.trailN * 3), 3));
      this.trail = new T.Points(tg, new T.PointsMaterial({ map: KIT.glowTex(w), size: 0.5, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      this.trail.frustumCulled = false; this.trail.userData.dynamic = true; S.add(this.trail);
      this.flameScale = 1;

      // lamps (checkpoints): brass lamps on the ledges, lit as the flame passes
      this.lampLights = [0, 1, 2].map(() => { const l = new T.PointLight(0xffb060, 0, 9, 2); S.add(l); return l; });
      this.lamps.forEach((l, i) => {
        l.y = l.y || w.ground(l.x, 0.8);
        PHOTO.place(w, 'brass_diya_lantern', { pos: [l.x, l.y, 0.8], s: 2.6, ry: i });
        l.glow = KIT.glow(w, 0xffc070, 1.8, 0.0); l.glow.position.set(l.x, l.y + 0.35, 0.8); l.glow.userData.dynamic = true; S.add(l.glow);
        l.ember = KIT.glow(w, 0xff9050, 0.5, 0.35); l.ember.position.copy(l.glow.position); l.ember.userData.dynamic = true; S.add(l.ember);
      });
      // sparks of dawn
      this.sparks.forEach(s => { s.m = KIT.glow(w, 0xffe6b0, 0.9, 0.85); s.m.position.set(s.x, s.y, 0); s.m.userData.dynamic = true; S.add(s.m); });
      // the smoke columns that lift the flame: a hint of warm shimmer
      this.smokes.forEach(s => { s.m = KIT.glow(w, 0xffb070, 3.5, 0.08); s.m.position.set(s.x, s.y0 + 2, 0.3); S.add(s.m); });
      // the summit beacon
      this.summitGlow = KIT.glow(w, 0xfff0c8, 3, 0.25); this.summitGlow.position.set(SUMMIT.x, SUMMIT.y + 1, 0); S.add(this.summitGlow);

      // the lights of the clans, waiting in their houses (they gather at the end)
      const n = 420, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      this.clan = [];
      const cr = U.seeded(4770);
      for (let i = 0; i < n; i++) {
        const sx = -150 + cr() * 290, sz = -14 - cr() * 120, a = cr() * 6.283, d = Math.sqrt(cr());
        const tx = 150 + 24 * d * Math.cos(a) * 1.2, tz = -16 + 12 * d * Math.sin(a);
        this.clan.push({ sx, sy: w.ground(sx, sz) + 1.2 + cr() * 4, sz, tx, ty: w.ground(tx, tz) + 1, tz, delay: cr() * 10, sp: 0.06 + cr() * 0.05 });
        pos.set([sx, -100, sz], i * 3); const c = new T.Color().setHSL(0.08 + cr() * 0.04, 0.8, 0.6); col.set([c.r, c.g, c.b], i * 3);
      }
      const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.BufferAttribute(pos, 3)); cg.setAttribute('color', new T.BufferAttribute(col, 3));
      this.clanPts = new T.Points(cg, new T.PointsMaterial({ map: KIT.glowTex(w), size: 1.6, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
      this.clanPts.frustumCulled = false; this.clanPts.userData.dynamic = true; this.clanPts.visible = false; S.add(this.clanPts);

      /* ---------------- discoveries ---------------- */
      const D = (x, y, title, text, ar) => { const it = w.discover({ pos: [x, y, 0], title, text, ar, r: 1.6 }); this.discs.push(it); };
      D(-150, 5.6, '“And warn your nearest kin”', 'When this verse was revealed (Qur’an 26:214), the Prophet ﷺ went out and climbed as-Safa. (Sahih al-Bukhari 4971)', '﴿وَأَنذِرْ عَشِيرَتَكَ الْأَقْرَبِينَ﴾');
      D(-109, 8.4, 'Three quiet years', 'Ibn Ishaq reports that about three years passed between the beginning of the mission and the command to proclaim it openly: “So proclaim what you are commanded” (Qur’an 15:94). (Ibn Ishaq, in Ibn Hisham)', '﴿فَاصْدَعْ بِمَا تُؤْمَرُ﴾');
      D(18, 7.6, 'Among the signs of God', '“Indeed, as-Safa and al-Marwah are among the symbols of God.” (Qur’an 2:158)', '﴿إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ﴾');
      D(44.5, 5.6, 'Hajar’s running', 'Long before, Hajar, alone in this valley with her infant son, ran between as-Safa and al-Marwah seven times searching for help and water. (Sahih al-Bukhari 3364)', 'سعيُ هاجر بين الصفا والمروة');
      D(140.5, 3.6, 'The house of al-Arqam', 'At the foot of as-Safa stood the house of al-Arqam ibn Abi al-Arqam, where the first Muslims met in those quiet years. (Ibn Sa‘d; Ibn Ishaq)', 'دار الأرقم عند الصفا');
      D(187, 11.4, 'By name', 'In one narration he called out to the clans by name: “O Banu Fihr! O Banu ‘Adi!” — and whoever could not come sent someone to see what it was. (Sahih al-Bukhari 4770)', 'يا بني فهر، يا بني عديّ');

      /* ---------------- state, controls, sound ---------------- */
      this.p = { x: -204, y: 4.2, vx: 0, vy: 0, ground: true, coyote: 0, buffer: 0, hold: false, face: 1, energy: 0, sq: 1, land: 0 };
      this.check = { x: -202, y: 4.2 }; this.part = 1; this.lit = 0; this.state = 'film';
      this.cam = new T.Vector3(-201, 7, CAMZ); this.camL = new T.Vector3(-201, 5, 0);
      // the hand-off: the film ends on the side camera
      w.pos.set(-201, 0, CAMZ); w.eye = 7.2 - w.ground(-201, CAMZ); w.yaw = 0; w.pitch = -0.12;
      this.buildButtons(w);
      w.onPointer = () => self.state === 'play' || self.state === 'kindle';
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.6, gain: 0.03 });
      this.gustN = SND.noise(b, { color: 'white', type: 'bandpass', freq: 900, q: 0.8, gain: 0.0 });
      this.crackle = SND.noise(b, { color: 'brown', type: 'highpass', freq: 1800, q: 0.5, gain: 0.006 });
      this.clocks = { cricket: 1, dog: 9, coo: 6 };
      this.gust = { t: 3, on: 0, warn: 0 };
      this.post = w.post({ bloom: 0.75, threshold: 0.66, rays: { strength: 0.32, dir: [0.98, 0.17, 0.09] }, vignette: 0.42, grain: 0.035, sat: 1.02, contrast: 1.06, lift: [0.01, 0.012, 0.03], gain: [1.04, 0.98, 0.94] });
      this.placeFlame();
    },

    windowsGlow(k) { this.warmMat.color.setRGB(1.0 * k, 0.62 * k, 0.28 * k); },

    startPlay() {
      const w = this.w, self = this;
      this.state = 'play'; this.flameScale = 1; this.windowsGlow(1);
      w.camera.fov = FOV; w.camera.updateProjectionMatrix();
      this.cam.copy(w.camera.position);
      w.mode = dt => self.play(dt);
      this.showButtons(true);
      w.activity('Part 1 of 3 · The rooftops', this.lamps.filter(l => l.part === 1).length, 'Run and jump from roof to roof · light each lamp');
      this.lamps[0].lit = true; this.lamps[0].glow.material.opacity = 0.9; this.lit = 0; this.assignLights();
    },

    /* ---------------- the platformer ---------------- */
    floorAt(x, feet, w) {
      // highest surface under x at or below the feet: terrain, solid tops, ledges
      let y = w.ground(x, 0), kind = 'ground', ref = null;
      for (const pt of this.pits) if (pt.mode === 'below' && x > pt.x0 && x < pt.x1) y = -20;
      for (const s of this.solids) if (x > s.x0 && x < s.x1 && s.y1 <= feet + 0.06 && s.y1 > y) { y = s.y1; kind = 'solid'; ref = s; }
      for (const l of this.ledges) if (!l.gone && x > l.x0 && x < l.x1 && l.y <= feet + 0.06 && l.y > y) { y = l.y; kind = l.kind; ref = l; }
      return { y, kind, ref };
    },
    play(dt) {
      const w = this.w, k = w.keys, P = this.p, env = this.env;
      dt = Math.min(dt, 0.05);
      if (this.state === 'respawn') { this.respawnTick(dt); this.camTick(dt); return; }
      if (this.state === 'ending') { this.endTick(dt); return; }
      const left = k.has('a') || k.has('ArrowLeft') || this.bL, right = k.has('d') || k.has('ArrowRight') || this.bR;
      const jumpHeld = k.has(' ') || k.has('w') || k.has('ArrowUp') || this.bJ;
      const dir = (right ? 1 : 0) - (left ? 1 : 0);
      if (dir) P.face = dir;
      // run
      const maxV = 6.6, acc = P.ground ? 42 : 24;
      if (dir) P.vx += dir * acc * dt; else P.vx = U.damp(P.vx, 0, P.ground ? 14 : 2.2, dt);
      P.vx = U.clamp(P.vx, -maxV, maxV);
      // the east wind of the dawn pushes on the rock
      const G = this.gust;
      if (this.part === 3) {
        G.t -= dt;
        if (G.t < 0 && !G.on) { G.on = 2.2; G.t = 5 + Math.random() * 2.5; }
        if (G.on) { G.on = Math.max(0, G.on - dt); P.vx -= (P.ground ? 7 : 11) * dt * U.smooth(0, 0.4, G.on); }
        const warn = G.on ? 1 : U.smooth(1.2, 0, G.t);
        this.gustN.set('gain', 0.05 * warn, 0.25); this.gustN.set('freq', 600 + warn * 700, 0.3);
      }
      // jump: coyote time and a buffered press
      if (this.jumpPressed) { P.buffer = 0.13; this.jumpPressed = false; }
      P.buffer = Math.max(0, P.buffer - dt); P.coyote = P.ground ? 0.1 : Math.max(0, P.coyote - dt);
      if (P.buffer > 0 && P.coyote > 0) {
        P.vy = 9.8; P.ground = false; P.coyote = 0; P.buffer = 0; P.sq = 1.35;
        SND.step(env.bus, { gain: 0.05, f: 900 }); SND.sing(env.bus, 523.25, { vowel: 'u', dur: 0.25, gain: 0.012, attack: 0.02 });
      }
      // gravity, variable height, the glide and the warm smoke
      const rising = P.vy > 0;
      let g = rising ? (jumpHeld ? 25 : 52) : 30;
      P.gliding = false;
      if (!P.ground && P.vy < 0 && jumpHeld && P.energy > 0) {
        P.gliding = true; P.energy = Math.max(0, P.energy - dt * 0.55);
        g = 6; if (P.vy < -2) P.vy = U.damp(P.vy, -2, 10, dt);
      }
      let inSmoke = null;
      for (const s of this.smokes) if (Math.abs(P.x - s.x) < 1.6 && P.y < s.top && P.y > s.y0 - 1) inSmoke = s;
      if (inSmoke && (P.gliding || jumpHeld)) { P.vy = Math.min(5.5, P.vy + 34 * dt); g = 0; P.energy = Math.max(P.energy, 0.2); }
      P.vy = Math.max(-18, P.vy - g * dt);
      // move in x, then resolve against solids
      const hw = 0.22, prevX = P.x, prevFeet = P.y;
      P.x += P.vx * dt;
      for (const s of this.solids) {
        if (P.y + 0.05 < s.y1 && P.y + 0.7 > s.y0 && P.x + hw > s.x0 && P.x - hw < s.x1) {
          if (prevX <= s.x0 - hw + 0.02) { P.x = s.x0 - hw; P.vx = 0; } else if (prevX >= s.x1 + hw - 0.02) { P.x = s.x1 + hw; P.vx = 0; }
          else if (s.y1 - P.y < 0.35) P.y = s.y1;   // a step up
        }
      }
      // move in y
      P.y += P.vy * dt;
      const fl = this.floorAt(P.x, Math.max(prevFeet, P.y), w);
      const wasGround = P.ground;
      if (P.y <= fl.y && P.vy <= 0 && prevFeet >= fl.y - 0.08 - Math.abs(P.vy) * dt) {
        // landing
        if (fl.kind === 'awning') {
          P.y = fl.y; P.vy = U.clamp(-P.vy * 0.6 + 9, 12.5, 15); P.ground = false; fl.ref.bounce = 1; P.sq = 1.4;
          SND.thump(env.bus, { gain: 0.06 }); SND.sing(env.bus, 392, { vowel: 'o', dur: 0.4, gain: 0.02 });
        } else {
          if (!wasGround && P.vy < -6) { P.sq = 0.62; SND.thump(env.bus, { gain: 0.05 }); }
          if (!wasGround) SND.step(env.bus, { gain: 0.04, f: fl.kind === 'ground' ? 600 : 1100 });
          P.y = fl.y; P.vy = 0; P.ground = true;
          if (fl.kind === 'crumble' && fl.ref.t < 0) { fl.ref.t = 0; SND.knock(env.bus, { f: 160, gain: 0.08, click: 1200 }); }
        }
      } else if (P.y > fl.y + 0.04 || P.vy > 0) P.ground = false;
      if (P.ground && P.y < fl.y) P.y = fl.y;
      if (P.ground && fl.y < P.y - 0.05) P.ground = false;
      P.groundKind = P.ground ? fl.kind : null;
      // ceilings
      for (const s of this.solids) if (P.vy > 0 && P.x > s.x0 && P.x < s.x1 && P.y + 0.7 > s.y0 && P.y < s.y0) { P.y = s.y0 - 0.7; P.vy = 0; }
      P.x = U.clamp(P.x, -212, 223);
      // a fall into an alley or the gully, or a slip on the rock face: back to the last lamp, gently
      for (const pt of this.pits) {
        if (P.x > pt.x0 && P.x < pt.x1 && ((pt.mode === 'below' && P.y < pt.y) || (pt.mode === 'ground' && P.ground && P.groundKind === 'ground'))) { this.startRespawn(); break; }
      }
      // crumbling stones
      for (const l of this.ledges) if (l.kind === 'crumble') {
        if (l.t >= 0) { l.t += dt; l.mesh.position.x = (l.x0 + l.x1) / 2 + (l.t < 0.6 ? Math.sin(l.t * 60) * 0.03 : 0);
          if (l.t > 0.6 && !l.gone) { l.gone = true; SND.knock(env.bus, { f: 90, gain: 0.1, click: 800 }); }
          if (l.gone) { l.down += dt; l.mesh.position.y = l.y - l.down * l.down * 6; l.mesh.visible = l.down < 1.5; }
          if (l.t > 3.6) { l.t = -1; l.gone = false; l.down = 0; l.mesh.position.y = l.y; l.mesh.visible = true; } }
      }
      // sparks, lamps, discoveries, the summit
      for (const s of this.sparks) if (!s.got && Math.abs(P.x - s.x) < 0.8 && Math.abs(P.y + 0.3 - s.y) < 0.9) {
        s.got = true; s.t = 0; P.energy = Math.min(3, P.energy + 1); this.trailN2 = Math.min(26, 10 + (this.got = (this.got || 0) + 1) * 2);
        SND.bell(env.bus, U.pick([659.25, 783.99, 880]), { gain: 0.03, glass: true });
        if (!this.toldGlide && this.part >= 2) { this.toldGlide = true; this.w.say('Sparks of dawn', 'Each spark lets the flame glide: hold jump while falling. Warm smoke from the hearths lifts a gliding flame.', { ms: 7000 }); }
      }
      for (const l of this.lamps) if (!l.lit && Math.abs(P.x - l.x) < 1.4 && Math.abs(P.y - l.y) < 2) this.lightLamp(l);
      for (const it of this.discs) if (!it.done && Math.abs(P.x - it.pos.x) < 1.3 && Math.abs(P.y + 0.3 - it.pos.y) < 1.4) { it.done = true; it.onUse(w, it); }
      if (this.part === 3 && Math.abs(P.x - SUMMIT.x) < 3 && P.ground && P.y > SUMMIT.y - 0.3 && this.state === 'play') {
        this.state = 'kindle'; this.kindleT = 0; w.step('Hold E (or jump) to kindle the summit'); this.env.hint(matchMedia('(pointer: coarse)').matches ? 'Hold ⤒ to kindle the summit' : 'Hold E or Space to kindle the summit');
      }
      if (this.state === 'kindle') {
        const hold = k.has('e') || jumpHeld;
        this.kindleT = hold ? this.kindleT + dt : Math.max(0, this.kindleT - dt * 0.6);
        this.flameScale = 1 + this.kindleT * 1.2; this.summitGlow.material.opacity = 0.25 + this.kindleT * 0.35;
        if (hold && Math.random() < dt * 6) SND.sing(env.bus, 293.66 * (1 + this.kindleT * 0.2), { vowel: 'a', dur: 0.6, gain: 0.02 });
        if (this.kindleT > 2.2) this.startEnding();
      }
      // squash and stretch, and the trail
      P.sq = U.damp(P.sq, 1, 10, dt);
      P.energyShow = U.damp(P.energyShow || 0, P.energy, 6, dt);
      this.placeFlame(dt);
      this.camTick(dt);
    },
    jump() { this.jumpPressed = true; },
    lightLamp(l) {
      const w = this.w, env = this.env;
      l.lit = true; l.flare = 1.4; this.check = { x: l.x, y: l.y };
      this.p.energy = Math.max(this.p.energy, this.part >= 2 ? 1.5 : 0);
      const partLamps = this.lamps.filter(q => q.part === l.part), n = partLamps.filter(q => q.lit).length;
      SND.glow(env.bus, [196, 220, 246.94, 261.63, 293.66][Math.min(4, n)] * (l.part === 3 ? 1.5 : l.part === 2 ? 1.25 : 1), { gain: 0.05, dur: 4 });
      SND.sing(env.bus, 392 * (l.part === 2 ? 1.122 : l.part === 3 ? 1.26 : 1), { vowel: 'a', dur: 1.8, gain: 0.03, voices: 2 });
      this.assignLights();
      w.progress(n);
      if (n === partLamps.length && l.part < 3) {
        this.part = l.part + 1;
        const P2 = this.lamps.filter(q => q.part === this.part).length;
        setTimeout(() => {
          if (!this.w) return;
          if (this.part === 2) { w.activity('Part 2 of 3 · Arches and the market', P2, 'Bounce on awnings · glide on warm smoke'); w.say('The lanes below', 'Down among the arches and stalls the roofs are too high to jump. Gather sparks, hold jump to glide, and let the hearth smoke carry you up.', { ms: 8000 }); }
          else { w.activity('Part 3 of 3 · The rock of as-Safa', P2 + 1, 'Climb the rock · watch for the east wind'); w.say('The rock', 'The ground opens toward as-Safa. Old stones crumble underfoot, and the dawn wind comes in gusts from the east: listen for it, and wait in the lee.', { ms: 8000 }); }
        }, 900);
      }
    },
    assignLights() {
      const lit = this.lamps.filter(l => l.lit).slice(-3);
      this.lampLights.forEach((L, i) => { const l = lit[i]; if (l) { L.position.set(l.x, l.y + 0.8, 1.4); L.intensity = 1.4; } else L.intensity = 0; });
    },
    startRespawn() {
      if (this.state !== 'play') return;
      this.state = 'respawn'; this.rs = { t: 0, from: new T.Vector3(this.p.x, this.p.y, 0) };
      SND.swell(this.env.bus, { f0: 400, f1: 160, dur: 1.1, gain: 0.03 }); SND.sing(this.env.bus, 174.61, { vowel: 'o', dur: 1.4, gain: 0.03 });
    },
    respawnTick(dt) {
      const R = this.rs, P = this.p; R.t += dt;
      const k = U.ease(U.clamp(R.t / 1.1));
      P.x = U.lerp(R.from.x, this.check.x + 0.8, k); P.y = U.lerp(R.from.y, this.check.y, k) + Math.sin(k * Math.PI) * 3;
      this.flameScale = 0.4 + 0.6 * Math.abs(Math.cos(k * Math.PI));
      this.placeFlame(dt);
      if (R.t > 1.15) { this.state = 'play'; P.vx = P.vy = 0; P.ground = true; this.flameScale = 1; }
    },
    camTick(dt) {
      const w = this.w, P = this.p;
      this.look = U.damp(this.look || 0, P.face * 2.2 + P.vx * 0.25, 1.6, dt);
      const tx = P.x + this.look, ty = Math.max(P.y, w.ground(P.x, 0)) + 2.3;
      const wide = this.part === 3 && P.x > 150 ? 4 : 0;
      this.cam.x = U.damp(this.cam.x, tx, 4, dt); this.cam.y = U.damp(this.cam.y, ty + wide * 0.4, 2.6, dt); this.cam.z = U.damp(this.cam.z, CAMZ + wide, 1.5, dt);
      w.camera.position.copy(this.cam);
      w.camera.lookAt(this.cam.x, this.cam.y - 2.1, 0);
      if (w._shadow) { const L = w._shadow.light, px = Math.round(this.cam.x / 1.5) * 1.5; L.target.position.set(px, 0, 0); L.position.set(px + w._shadow.off.x, w._shadow.off.y, w._shadow.off.z); }
      w.pos.set(P.x, 0, 0);
    },
    placeFlame(dt) {
      dt = dt || 0.016;
      const P = this.p, t = this.w.time, s = this.flameScale == null ? 1 : this.flameScale;
      const fl = 1 + Math.sin(t * 23) * 0.06 + Math.sin(t * 37) * 0.05;
      this.flame.position.set(P.x, P.y + 0.42, 0);
      const st = P.sq || 1;
      this.fOuter.scale.set(1.2 * s * fl / Math.sqrt(st), 1.7 * s * fl * st, 1);
      this.fInner.scale.set(0.55 * s / Math.sqrt(st), 0.8 * s * st * fl, 1);
      this.fHalo.scale.setScalar(4.2 * s * (P.gliding ? 1.3 : 1));
      this.fOuter.material.color.setHSL(P.gliding ? 0.1 : 0.075, 1, 0.55);
      this.fLight.intensity = 2.2 * s * fl;
      // the trail of light, longer with each spark gathered
      this.trailP.unshift([P.x - P.vx * 0.01, P.y + 0.42 + Math.sin(t * 9) * 0.03]);
      const N = this.trailN; if (this.trailP.length > N) this.trailP.length = N;
      const a = this.trail.geometry.attributes.position, c = this.trail.geometry.attributes.color, n2 = this.trailN2 || 10;
      for (let i = 0; i < N; i++) {
        const q = this.trailP[Math.min(i, this.trailP.length - 1)] || [P.x, P.y];
        a.setXYZ(i, q[0], q[1] + i * 0.03, -0.05);
        const f = i < n2 ? Math.pow(1 - i / n2, 1.5) * s : 0;
        c.setXYZ(i, f * 1.0, f * 0.6, f * 0.25);
      }
      a.needsUpdate = c.needsUpdate = true;
    },

    /* ---------------- the summit: the call, and the clans' lights gather ---------------- */
    startEnding() {
      const w = this.w, env = this.env;
      this.state = 'ending'; this.endT = 0; this.endStep = 0; this.showButtons(false);
      this.clanPts.visible = true;
      this.endCam = { from: w.camera.position.clone() };
      SND.glow(env.bus, 146.83, { gain: 0.07, dur: 10 });
      SND.sing(env.bus, 293.66, { vowel: 'a', dur: 3.5, gain: 0.06, voices: 4, attack: 0.3 });
      SND.sing(env.bus, 440, { vowel: 'a', dur: 3, gain: 0.04, voices: 3, delay: 0.8 });
      w.progress(this.lamps.filter(l => l.part === 3).length + 1, 'The summit is lit');
    },
    endTick(dt) {
      const w = this.w, env = this.env; this.endT += dt;
      const t = this.endT;
      // the camera draws back over the valley
      const k = U.ease(U.clamp(t / 10));
      w.camera.position.lerpVectors(this.endCam.from, new T.Vector3(150, 32, 46), k);
      w.camera.lookAt(U.lerp(SUMMIT.x, 160, k), U.lerp(SUMMIT.y, 4, k), U.lerp(0, -20, k));
      this.flameScale = U.damp(this.flameScale, 3.4, 1, dt); this.placeFlame(dt);
      this.summitGlow.material.opacity = 0.6 + 0.2 * Math.sin(t * 2); this.summitGlow.scale.setScalar(3 + k * 6);
      // the lights come out of the houses and gather at the foot of the rock
      const a = this.clanPts.geometry.attributes.position;
      this.clan.forEach((c, i) => {
        const q = U.clamp((t - 2 - c.delay) * c.sp * 2.2);
        if (q <= 0) { a.setXYZ(i, c.sx, c.sy, c.sz); return; }
        const e = U.ease(q);
        a.setXYZ(i, U.lerp(c.sx, c.tx, e), U.lerp(c.sy, c.ty, e) + Math.sin(e * Math.PI) * 6, U.lerp(c.sz, c.tz, e));
      });
      a.needsUpdate = true;
      this.clanPts.material.opacity = U.smooth(1.5, 3, t);
      if (t > 1 && Math.random() < dt * 5) { const sp = U.rnd(-0.8, 0.8); SND.sing(env.bus, U.rnd(100, 170), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.3, 0.7), gain: 0.012, pan: sp, breath: 0.4, attack: 0.04 }); }
      const say = [
        [1.5, 'Ya Sabahah!', 'He climbed as-Safa and cried out “Ya Sabahah!”, the cry raised when raiders come at dawn, until the clans gathered to him. (Sahih al-Bukhari 4971)', 'يا صباحاه'],
        [12, 'We have never known you to lie', '“If I told you that horsemen were in the valley, about to fall upon you, would you believe me?” They said, “We have never known you to lie.” (Sahih al-Bukhari 4971)', 'ما جرّبنا عليك كذبًا'],
        [23, 'A warner', '“Then I am a warner to you, before a severe punishment.” (Sahih al-Bukhari 4971)', 'فإني نذيرٌ لكم بين يدي عذابٍ شديد'],
        [32, 'Abu Lahab', 'Abu Lahab said, “Perish you! Was it for this you gathered us?” Then Surat al-Masad was revealed. (Sahih al-Bukhari 4971; Qur’an 111)', 'تبًّا لك، ألهذا جمعتنا؟'],
      ];
      while (this.endStep < say.length && t > say[this.endStep][0]) {
        const [, a2, b2, ar] = say[this.endStep++];
        w.say(a2, b2, { ar, ms: 10500 });
        SND.glow(env.bus, [196, 220, 174.61, 146.83][this.endStep - 1], { gain: 0.05, dur: 6 });
      }
      if (t > 42 && !this.finished) {
        this.finished = true;
        w.finish('The call from as-Safa');
        setTimeout(() => { if (this.w) this.w.say('The open call', 'From that morning the message was proclaimed openly in Makkah. (Ibn Ishaq, in Ibn Hisham)', { ms: 9000 }); }, 5000);
      }
    },

    /* ---------------- controls ---------------- */
    buildButtons(w) {
      const self = this, wrap = document.createElement('div');
      wrap.className = 'safa-pad'; wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
      const mk = (txt, css, down, up, label) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.className = 'safa-btn';
        b.style.cssText = 'position:absolute;pointer-events:auto;width:66px;height:66px;border-radius:50%;border:1px solid rgba(255,214,160,.55);background:rgba(10,12,26,.4);color:#ffe6c0;font:600 24px/1 system-ui,sans-serif;touch-action:none;' + css;
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); SND.init(); down(); });
        const u = e => { if (e) e.stopPropagation(); up && up(); };
        b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u);
        wrap.appendChild(b); return b;
      };
      mk('◀', 'left:18px;bottom:150px;', () => { self.bL = true; }, () => { self.bL = false; }, 'Run left');
      mk('▶', 'left:96px;bottom:150px;', () => { self.bR = true; }, () => { self.bR = false; }, 'Run right');
      mk('⤒', 'right:22px;bottom:150px;width:80px;height:80px;', () => { self.bJ = true; self.jump(); }, () => { self.bJ = false; }, 'Jump (hold to glide)');
      // the glide meter: three small flames
      const meter = document.createElement('div'); meter.className = 'safa-meter';
      meter.style.cssText = 'position:absolute;left:50%;top:15%;transform:translateX(-50%);display:flex;gap:8px;pointer-events:none;';
      for (let i = 0; i < 3; i++) { const d = document.createElement('i'); d.style.cssText = 'display:block;width:10px;height:16px;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 50% 70%,#fff2c8,#ff9a40 60%,rgba(255,120,40,0) 75%);opacity:.15;transition:opacity .2s;'; meter.appendChild(d); }
      w.ui.layer.appendChild(meter); this.meter = meter;
      w.ui.layer.appendChild(wrap); this.pad = wrap;
    },
    showButtons(on) { if (this.pad) this.pad.style.display = on && matchMedia('(pointer: coarse)').matches ? 'block' : 'none'; },
    onKey(env, e) {
      if (!this.w || this.w.filmS) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!e.repeat && (k === ' ' || k === 'w' || k === 'ArrowUp')) this.jump();
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      if (this.state === 'film') this.placeFlame(dt);
      // the meter shows glide sparks
      if (this.meter) [...this.meter.children].forEach((d, i) => { d.style.opacity = this.state === 'play' && this.part >= 2 ? (this.p.energy > i + 0.05 ? 1 : this.p.energy > i ? 0.5 : 0.15) : 0; });
      // lamps breathe; awnings ripple and bounce; sparks bob
      for (const l of this.lamps) {
        if (l.flare) l.flare = Math.max(0, l.flare - dt * 0.8);
        l.glow.material.opacity = l.lit ? 0.75 + 0.1 * Math.sin(t * 7 + l.x) + (l.flare || 0) * 0.5 : 0;
        l.glow.scale.setScalar(1.8 + (l.flare || 0) * 3);
        l.ember.material.opacity = l.lit ? 0 : 0.3 + 0.15 * Math.sin(t * 2 + l.x);
      }
      for (const l of this.ledges) if (l.kind === 'awning' && l.mesh) {
        l.bounce = Math.max(0, (l.bounce || 0) - dt * 2.2);
        const a = l.mesh.geometry.attributes.position, b = l.base, wd = l.x1 - l.x0 + 0.4;
        for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; const f = Math.cos(x / wd * Math.PI) * Math.cos(y / 3 * Math.PI); a.setZ(i, -l.bounce * 0.6 * f * Math.sin(l.bounce * 14) - 0.08 * f + Math.sin(t * 1.5 + x) * 0.02); }
        a.needsUpdate = true;
      }
      for (const s of this.sparks) {
        if (s.got) { s.t += dt; s.m.material.opacity = Math.max(0, 0.85 - s.t * 2); s.m.position.y += dt * 2; s.m.scale.setScalar(0.9 + s.t * 2); }
        else { s.m.position.y = s.y + Math.sin(t * 2 + s.x) * 0.15; s.m.material.opacity = 0.65 + 0.25 * Math.sin(t * 5 + s.x); }
      }
      this.smokes.forEach(s => { s.m.material.opacity = 0.06 + 0.03 * Math.sin(t * 3 + s.x); });
      // the dawn grows as the flame travels east
      const dawn = U.smooth(-210, 220, this.p.x);
      if (this.post && this.post.uniforms) { this.post.uniforms.uLift.value.set(0.01, 0.012 - dawn * 0.004, 0.03 - dawn * 0.02); this.post.uniforms.uGain.value.set(1.04 + dawn * 0.06, 0.98 + dawn * 0.02, 0.94 - dawn * 0.05); }
      w.renderer.toneMappingExposure = 1.0 + dawn * 0.15;
      // night and dawn sounds
      const C = this.clocks;
      C.cricket -= dt; if (C.cricket < 0) { C.cricket = 0.6 + Math.random() * 2.5; SND.cricket && SND.cricket(env.bus, { gain: 0.012 * (1 - dawn), pan: U.rnd(-0.9, 0.9) }); }
      C.coo -= dt; if (C.coo < 0) { C.coo = 5 + Math.random() * 7; SND.coo && SND.coo(env.bus, { gain: 0.015 * dawn + 0.004, pan: U.rnd(-0.8, 0.8) }); }
      // the flame crackles more when gliding or kindling
      this.crackle.set('gain', 0.004 + (this.p.gliding ? 0.01 : 0) + (this.state === 'kindle' ? this.kindleT * 0.01 : 0), 0.2);
    },
    onLeave() { this.pad = null; this.meter = null; this.state = 'film'; this.finished = false; },
  }));
})();
