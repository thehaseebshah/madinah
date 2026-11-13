/* Madinah — Quba, the First Stones. Rabi' al-Awwal, 1 AH (622 CE).
   The oasis of Quba on the southern edge of Yathrib: palm groves and wells, the village of Banu 'Amr
   ibn 'Awf, the black lava field (harrah) where the people of Madinah waited each morning, and the
   site where the first mosque was founded (Sahih al-Bukhari 3906; Qur'an 9:108).
   The game is a Sokoban push-block puzzle in three grids of rising difficulty: push the foundation
   stones onto their chalk marks, with undo and reset. As each grid clears, the mosque rises: its
   walls, then the palm-trunk columns of the qibla side, which then faced Jerusalem (Sahih al-Bukhari 40).
   The player is a small light; no person is depicted. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const ID = 'quba';
  const CELL = 1.5, SITE = 15;   // grid cell size; the mosque's half-width
  const LEVELS = [
    { name: 'Part 1 of 3 · The courtyard corner', at: [7.5, 6.5], step: 'Push both stones onto their chalk marks', rows: [
      '#########',
      '#   #   #',
      '# $   $ #',
      '#   @   #',
      '## . . ##',
      '#########'] },
    { name: 'Part 2 of 3 · The prayer ground', at: [-7.5, 6], step: 'Three stones, three marks. Z steps back, R starts over', rows: [
      '  #######',
      '  #  .  #',
      '### $#$ #',
      '# .  @  #',
      '# #$##  #',
      '#   .   #',
      '#########'] },
    { name: 'Part 3 of 3 · The qibla side', at: [0, -8], step: 'Four bases for the columns of the qibla side', rows: [
      '#########',
      '#. . . .#',
      '#  ## # #',
      '# $  $  #',
      '#  $# $ #',
      '##  @  ##',
      '#########'] },
  ];
  const START = { x: 4, z: 26, yaw: 0.1 };

  /* ---------------- local helpers ---------------- */
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
  /* A low mud-brick house of the oasis, with a roof of palm trunks and fronds. */
  function house(g, M, ground, x, z, hw, hd, hh, ry, r) {
    const grp = new T.Group(); grp.rotation.y = ry;
    const c = Math.cos(ry), s = Math.sin(ry);
    let y0 = 1e9; for (const [a, b] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) y0 = Math.min(y0, ground(x + a * c + b * s, z - a * s + b * c));
    grp.position.set(x, y0, z);
    const wall = M.walls[(r() * M.walls.length) | 0];
    box(grp, wall, hw * 2, hh + 0.6, hd * 2, 0, (hh + 0.6) / 2 - 0.6, 0);
    box(grp, M.thatch, hw * 2 + 0.3, 0.16, hd * 2 + 0.3, 0, hh + 0.08, 0);
    const ph = 0.3 + r() * 0.3;
    box(grp, wall, hw * 2, ph, 0.22, 0, hh + ph / 2, hd - 0.11); box(grp, wall, hw * 2, ph, 0.22, 0, hh + ph / 2, -hd + 0.11);
    const nb = Math.max(2, Math.floor(hw * 2 / 0.8));
    for (let i = 0; i < nb; i++) cyl(grp, M.beam, 0.08, 0.1, 0.5, -hw + 0.4 + i * ((hw * 2 - 0.8) / (nb - 1)), hh - 0.15, hd + 0.16, Math.PI / 2, 0, 6);
    const dx = (r() - 0.5) * (hw * 2 - 2);
    box(grp, M.door, 0.95, 1.85, 0.1, dx, 0.92, hd + 0.02); box(grp, M.beam, 1.4, 0.18, 0.2, dx, 1.95, hd + 0.06);
    if (r() < 0.7) box(grp, M.dark, 0.45, 0.45, 0.06, dx + (dx > 0 ? -1.4 : 1.4), 1.9, hd + 0.03, 0, false);
    // a courtyard wall on one side, sometimes
    if (r() < 0.5) { const L = hd * 2 + 2; box(grp, wall, 0.4, 1.7, L, hw + 1.6, 0.6, 0); box(grp, wall, 3.2, 1.7, 0.4, hw, 0.6, L / 2); }
    g.add(grp);
    return { x, z, hw, hd };
  }
  /* A garden well: a stone curb, a frame of palm trunks, a pulley beam. */
  function well(g, M, ground, x, z) {
    const y = ground(x, z), curb = new T.Mesh(new T.CylinderGeometry(1.1, 1.2, 0.9, 16, 1, true), M.stone); curb.position.set(x, y + 0.35, z); curb.castShadow = curb.receiveShadow = true; g.add(curb);
    const rim = new T.Mesh(new T.TorusGeometry(1.15, 0.16, 6, 18), M.stone); rim.rotation.x = Math.PI / 2; rim.position.set(x, y + 0.8, z); g.add(rim);
    const water = new T.Mesh(new T.CircleGeometry(1.05, 16), M.water); water.rotation.x = -Math.PI / 2; water.position.set(x, y - 0.6, z); g.add(water);
    cyl(g, M.pole, 0.1, 0.12, 2.6, x - 1.2, y + 1.3, z); cyl(g, M.pole, 0.1, 0.12, 2.6, x + 1.2, y + 1.3, z); cyl(g, M.log, 0.08, 0.08, 2.8, x, y + 2.55, z, 0, Math.PI / 2);
  }

  ENGINE.register(WORLD.stage({
    key: ID,
    arabic: 'قُباء',
    title: 'Quba, the First Stones',
    era: 'Rabi‘ al-Awwal, 1 AH · 622 CE',
    hint: 'Arrows or WASD push · Z undo · R reset · Q to walk the oasis, E to return',
    hintTouch: 'Use the arrows to push · ↶ undo · ⟲ reset · ✕ to walk the oasis',
    sound: { reverb: 0.35 },
    story: `<p>Before entering the city, the Prophet ﷺ stayed in Quba, on the southern edge of the oasis, among Banu ‘Amr ibn ‘Awf for some ten nights or more. There the first mosque in Islam was founded; a report in al-Tabarani says he carried stones for it himself.</p>
            <p>Push the foundation stones onto their marks. Each part you finish raises the mosque a little more.</p>`,

    film(env, w) {
      const self = this;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [52, 42],
          path: [[[160, 90, 190], [0, 4, 0]], [[90, 55, 130], [0, 3, 0]]],
          start: () => SND.swell(env.bus, { f0: 150, f1: 420, dur: 6.5, gain: 0.035 }) },
        { dur: 6.5, fade: 'dip', line: 'Each morning the people of Madinah went out to the lava field to wait for him.', ar: 'كان أهلُ المدينة يغدون كلَّ غداةٍ إلى الحَرّة ينتظرونه.',
          path: [[[-150, 6, 60], [-200, 4, 10]], [[-128, 5, 30], [-190, 3, -20]]], ease: 'linear',
          start: () => { self.waitLights(true); } },
        { dur: 6, fade: 'cut', line: 'They turned back only when the heat of noon drove them home. (Sahih al-Bukhari 3906)', ar: 'حتى يردَّهم حرُّ الظهيرة. (صحيح البخاري ٣٩٠٦)',
          path: [[[-170, 14, 0], [-120, 3, 40]], [[-160, 18, 20], [-100, 2, 60]]], ease: 'linear',
          during: (w2, k) => { self.waitLightsFade(1 - k); } },
        { dur: 6.5, fade: 'dip', line: 'He came on a Monday in Rabi‘ al-Awwal, and stayed with Banu ‘Amr ibn ‘Awf.', ar: 'قدم يوم الاثنين في شهر ربيع الأول، فنزل في بني عمرو بن عوف.',
          path: [[[40, 4, 70], [30, 3, 40]], [[52, 3.2, 52], [26, 2.5, 28]]], ease: 'glide',
          start: () => { self.waitLights(false); SND.sing(env.bus, 220, { vowel: 'a', dur: 4, gain: 0.04, voices: 4, attack: 0.8 }); } },
        { dur: 6, fade: 'dip', line: 'There, in some ten nights, the first mosque was founded.', ar: 'وهناك، في بضع عشرة ليلة، أُسِّس أولُ مسجد.',
          path: [[[-24, 16, 30], [0, 0, 0]], [[24, 18, 26], [0, 0, 0]]], ease: 'linear' },
        { dur: 6, fade: 'dip', line: 'A report in al-Tabarani says he carried its stones himself.', ar: 'وفي روايةٍ عند الطبراني أنه ﷺ كان ينقل حجارته بنفسه.',
          path: [[[LEVELS[0].at[0] + 4, 7, LEVELS[0].at[1] + 12], [LEVELS[0].at[0], 0, LEVELS[0].at[1]]], [[START.x + 1, 3.4, START.z - 4], [LEVELS[0].at[0], 0.5, LEVELS[0].at[1]]]],
          start: () => SND.glow(env.bus, 196, { gain: 0.05, dur: 6 }) },
      ];
    },
    filmOpts: { end(w) { const s = ENGINE.cur; s.waitLights && s.waitLights(false); w.pos.set(START.x, 0, START.z); w.yaw = START.yaw; w.pitch = -0.2; s.startLevel && s.startLevel(s.level || 0); } },

    enter(env) {
      const self = this; this.env = env;
      /* ---------------- the oasis of Quba ---------------- */
      const harrah = (x, z) => U.smooth(-80, -125, x + Math.sin(z * 0.013) * 22 - Math.max(0, z - 120) * 0.4);
      const H = (x, z) => {
        let y = SCAPE.fbm(x * 0.012, z * 0.012, 3) * 1.4 + SCAPE.fbm(x * 0.08, z * 0.08, 2) * 0.15;
        const hr = harrah(x, z);
        y += hr * (3 + SCAPE.ridge(x * 0.05, z * 0.05, 4) * 2.2 + SCAPE.fbm(x * 0.3, z * 0.3, 2) * 0.35);
        const d = Math.hypot(x, z);
        y += Math.pow(Math.max(0, d - 520), 1.2) * 0.35 * (0.6 + 0.6 * SCAPE.ridge(x * 0.006, z * 0.006, 4));   // far hills
        y += 120 * Math.exp(-((x - 60) ** 2 + (z - 700) ** 2) / (2 * 140 * 140));                                  // Jabal 'Ayr, to the south
        y *= U.smooth(10, 20, d) * 0.9 + 0.1;                                                                       // the site is level
        return y;
      };
      const w = this.w = WORLD.create(env, { start: START, exposure: 0.85, far: 1800, fov: 64, fog: { color: 0xd9c8b0, density: 0.0014 }, bounds: [-170, -170, 170, 170] });
      const S = w.scene;
      const ter = SCAPE.terrain(w, { size: 1500, seg: 320, height: H, rock: [0.8, 0.92], rockHeight: [1.8, 2.8],
        colors: { low: '#c9b08e', high: '#b9a07e', rock: '#4a4442', dark: '#2e2a2a' }, tex: 'dune', rockTex: 'lava',
        photo: { ground: 'dense_sand', rock: 'dark_rock', normal: 1 }, rep: 0.2, rockRep: 0.08 });
      w.ground = ter.ground;
      w.surface = (x, z) => (harrah(x, z) > 0.5 ? 'stone' : 'sand');
      w.sky({ top: '#5f8fc4', mid: '#e8d6b8', bot: '#d8c4a8', sunDir: [0.6, 0.4, 0.5], sun: '#ffe2b0', sunSize: 0.0016, clouds: 0.3, haze: 0.4 });
      const sun = new T.DirectionalLight(0xffe6c8, 1.9); sun.position.set(-40, 30, 40); S.add(sun);
      S.add(new T.HemisphereLight(0xbdd4f0, 0x9a7a5a, PHOTO.enabled ? 0.12 : 0.7));
      w.followShadow(sun, 40, 2048);
      // late afternoon light from the west-south-west, so the grids are lit from the camera's side
      PHOTO.sky(w, 'qwantani_late_afternoon_puresky', { sun, intensity: 0.75, rotation: 1.4, haze: '#d8c6aa', horizon: 0.45, ground: '#b09272' }).then(r => { if (r && r.sunDir && w._shadow) w._shadow.off.copy(r.sunDir).multiplyScalar(40 * 2.5); // PHOTO.sky leaves the shadow offset at unit length
        if (r && r.sunDir && self.post && self.post.rays) self.post.rays.dir = r.sunDir.toArray(); });
      SCAPE.horizon(w, { haze: '#d8c6aa', layers: [{ r: 800, h: 70, color: '#8a7a72', seed: 51, flat: 4 }, { r: 1150, h: 110, color: '#a49488', seed: 63 }, { r: 1500, h: 140, color: '#c0b2a6', seed: 77 }] });

      const M = this.M = {
        walls: [tri(w, 'clay_block_wall', 0.4, KIT.mudBrick(w, [1, 1]), '#d8c4a8'), tri(w, 'brown_mud_dry', 0.3, KIT.mudBrick(w, [1, 1]), '#d4c0a6'), tri(w, 'clay_plaster', 0.3, KIT.plaster(w, [1, 1], '#d8c4a4'), '#e2cfb4')],
        thatch: PHOTO.mat(w, 'medieval_wood', { rep: [3, 3], color: '#8a7458', fallback: KIT.wood(w, [3, 3], '#6a5038') }),
        beam: PHOTO.mat(w, 'palm_tree_bark', { rep: [0.4, 1], color: '#a89078', fallback: KIT.bark(w) }),
        door: PHOTO.mat(w, 'old_planks_02', { rep: [0.8, 1.2], color: '#b09878', fallback: KIT.wood(w, [1, 1], '#5a3a22') }),
        dark: new T.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 }),
        stone: tri(w, 'old_stone_wall', 0.5, KIT.basalt(w, [1, 1]), '#a8a098'),
        rubble: tri(w, 'old_stone_wall', 0.55, KIT.basalt(w, [1, 1]), '#8a847e'),
        pole: PHOTO.mat(w, 'palm_tree_bark', { rep: [1, 3], color: '#b8a088', fallback: KIT.bark(w) }),
        log: PHOTO.mat(w, 'medieval_wood', { rep: [1, 2], color: '#b09070', fallback: KIT.wood(w, [1, 2], '#6a4a30') }),
        water: new T.MeshStandardMaterial({ color: 0x24343a, roughness: 0.06, metalness: 0.2 }),
        mudwall: tri(w, 'brown_mud_dry', 0.35, KIT.mudBrick(w, [1, 1]), '#c8b49c'),
        block: PHOTO.mat(w, 'rock_boulder_dry', { rep: [0.9, 0.7], color: '#cfc6b8', normal: 1.5, fallback: KIT.basalt(w, [1, 1]) }),
        trunk: tri(w, 'palm_tree_bark', 1.2, KIT.bark(w), '#c8b49c'),
        mosque: tri(w, 'clay_block_wall', 0.42, KIT.mudBrick(w, [1, 1]), '#dcc8ac'),
      };
      const statics = new T.Group(); S.add(statics);

      /* ---------------- the village of Banu 'Amr ibn 'Awf ---------------- */
      const hr = U.seeded(1622), houses = [];
      const road = (x, z) => Math.abs(x - 6 - Math.sin(z * 0.02) * 6) < 5 && z < -14;   // the road north to the city
      for (let i = 0; i < 700 && houses.length < 64; i++) {
        const a = hr() * 6.283, d = 26 + Math.pow(hr(), 1.3) * 70, x = Math.cos(a) * d * 1.2, z = Math.sin(a) * d;
        if (road(x, z) || harrah(x, z) > 0.1 || Math.abs(x - START.x) < 6 && z > 18 && z < 40) continue;
        const hw = 2.4 + hr() * 2.6, hd = 2.2 + hr() * 2.2;
        if (houses.some(h => Math.hypot(h.x - x, h.z - z) < Math.max(h.hw, h.hd) + Math.max(hw, hd) + 3.5)) continue;
        const ry = Math.atan2(-x, -z) + (hr() - 0.5) * 0.6;
        houses.push(house(statics, M, w.ground, x, z, hw, hd, 2.6 + hr() * 1.4, ry, hr));
        w.addCircle(x, z, Math.max(hw, hd) * 0.95);
      }
      this.houses = houses;
      /* ---------------- palm groves, garden walls, wells and channels ---------------- */
      const notBuilt = (x, z) => Math.hypot(x, z) < 22 || houses.some(h => Math.hypot(h.x - x, h.z - z) < Math.max(h.hw, h.hd) + 3) || road(x, z);
      const palms = SCAPE.scatter(w, { kind: 'palm', n: 520, area: { x: 0, z: 0, r: 420 }, scale: [8, 14], seed: 10, avoid: notBuilt,
        density: (x, z) => { const d = Math.hypot(x, z); return (1 - harrah(x, z)) * (d < 40 ? 0.15 : 1) * (SCAPE.fbm(x * 0.02, z * 0.02, 2) > -0.15 ? 1 : 0.2) * (1 - U.smooth(330, 420, d)); }, collide: 0.4 });
      if (palms.meshes[0]) palms.meshes[0].material = tri(w, 'palm_tree_bark', 1.4, palms.meshes[0].material.map, '#d8c4ac');
      SCAPE.scatter(w, { kind: 'palm', n: 60, area: { x: 0, z: 0, r: 150 }, scale: [1.6, 3.2], seed: 13, avoid: notBuilt, density: (x, z) => 1 - harrah(x, z) });  // young offshoots
      // garden walls of mud along the grove edges
      const wr = U.seeded(88);
      for (let i = 0; i < 46; i++) {
        const a = wr() * 6.283, d = 40 + wr() * 120, x = Math.cos(a) * d, z = Math.sin(a) * d, L = 8 + wr() * 16, ry = wr() * 3.14;
        if (notBuilt(x, z) || harrah(x, z) > 0.1) continue;
        box(statics, M.mudwall, L, 1.6 + wr() * 0.6, 0.5, x, w.ground(x, z) + 0.6, z, ry);
        const c = Math.cos(ry), s = Math.sin(ry); for (let k = -1; k <= 1; k++) w.addCircle(x + c * k * L / 3, z - s * k * L / 3, 0.6);
      }
      [[-46, 12], [32, 44], [-30, -40], [58, -24], [12, 70]].forEach(([x, z]) => { well(statics, M, w.ground, x, z); w.addCircle(x, z, 1.4); });
      this.aris = { x: -46, z: 12 };
      // irrigation channels from the wells
      const chM = new T.MeshStandardMaterial({ color: 0x2a3a3e, roughness: 0.05, metalness: 0.2 });
      [[-46, 12, 0.3, 30], [32, 44, -0.9, 26], [58, -24, 2.2, 24]].forEach(([x, z, a, L]) => {
        for (let k = 0; k < L; k += 2) { const px = x + Math.cos(a) * (k + 2), pz = z + Math.sin(a) * (k + 2); const m = new T.Mesh(new T.PlaneGeometry(2.1, 0.45), chM); m.rotation.set(-Math.PI / 2, 0, -a); m.position.set(px, w.ground(px, pz) + 0.03, pz); statics.add(m); }
      });
      // the harrah: black basalt boulders and broken flows
      SCAPE.scatter(w, { kind: 'boulder', n: 380, area: [-420, -420, -70, 420], scale: [0.8, 3.2], seed: 3, tex: 'lava', color: '#6a6260', density: (x, z) => harrah(x, z) });
      SCAPE.scatter(w, { kind: 'rock', n: 900, area: [-400, -400, -60, 400], scale: [0.3, 1.2], seed: 5, tex: 'lava', color: '#5a5450', density: (x, z) => harrah(x, z) });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', n: 70, area: [-200, -160, -80, 200], scale: [1, 2.5], seed: 34, color: '#585250', density: (x, z) => harrah(x, z), collide: true, fallback: 'boulder' });
      SCAPE.scatter(w, { kind: 'model', model: 'rock_07', n: 120, area: [-200, -160, -75, 200], scale: [0.6, 1.6], seed: 35, color: '#4e4846', density: (x, z) => harrah(x, z), fallback: 'rock' });
      // scrub, grass and stones of the oasis floor
      SCAPE.scatter(w, { kind: 'grass', n: 1800, area: { x: 0, z: 0, r: 200 }, scale: [0.4, 0.9], seed: 6, avoid: (x, z) => Math.hypot(x, z) < 18, density: (x, z) => (1 - harrah(x, z)) * 0.8 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', n: 500, area: { x: 0, z: 0, r: 140 }, scale: [0.7, 1.3], seed: 36, avoid: notBuilt, density: (x, z) => 1 - harrah(x, z), fallback: 'grass' });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_01', n: 160, area: { x: 0, z: 0, r: 180 }, scale: [0.7, 1.4], seed: 37, avoid: notBuilt, fallback: 'shrub' });
      SCAPE.scatter(w, { kind: 'model', model: 'wild_rooibos_bush', n: 100, area: { x: 0, z: 0, r: 200 }, scale: [0.8, 1.4], seed: 38, avoid: notBuilt, fallback: 'shrub' });
      SCAPE.scatter(w, { kind: 'pebble', n: 2200, area: { x: 0, z: 0, r: 150 }, scale: [0.05, 0.2], seed: 4, color: '#b8ab9c', avoid: (x, z) => Math.abs(x) < SITE && Math.abs(z) < SITE });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 360, area: { x: 0, z: 0, r: 130 }, scale: [0.8, 1.6], seed: 31, avoid: notBuilt, fallback: 'pebble', fallbackScale: 0.15 });
      SCAPE.scatter(w, { kind: 'acacia', n: 26, area: { x: 0, z: 0, r: 260 }, scale: [0.9, 1.4], seed: 9, avoid: notBuilt, collide: true, density: (x, z) => 0.3 + harrah(x, z) * 0.7 });
      // life: birds over the groves, smoke from the village, dust and pollen in the low sun
      SCAPE.birds(w, { n: 16, x: 30, z: -30, y: 30, r: 60, size: 0.5, speed: 0.15 });
      SCAPE.smoke(w, { sources: houses.filter((h, i) => i % 8 === 2).map(h => [h.x, w.ground(h.x, h.z) + 3.5, h.z]), height: 14, wind: [0.4, -0.2], size: 2.8, opacity: 0.16 });
      SCAPE.motes(w, { n: 90, area: [-30, 0.3, -30, 30, 6, 30], color: '#fff2d0', size: 0.16, additive: true });
      // props of the building work
      [['wicker_basket_01', 17.5, 9, 1.3], ['wicker_basket_01', -17, 12, 1.3], ['jug_01', 18, 14, 1.2], ['ceramic_vase_01', 18.6, 13.4, 1.4], ['wooden_bowl_01', 17.8, 15, 1.2],
        ['wicker_basket_01', 6, -18, 1.2], ['brass_pot_01', -19, -6, 1.1], ['stone_fire_pit', -20, -8, 1], ['food_pomegranate_01', 18.3, 14.6, 1.6]].forEach(([id, x, z, s]) => PHOTO.place(w, id, { pos: [x, undefined, z], s, ry: x }));
      // a pile of cut stones and a heap of palm trunks waiting by the site
      for (let i = 0; i < 12; i++) box(statics, M.block, 1.1, 0.7, 0.9, 19 + (i % 4) * 1.15, w.ground(19, -4) + 0.35 + Math.floor(i / 4) * 0.7, -4 + (Math.floor(i / 4) % 2) * 0.3);
      for (let i = 0; i < 7; i++) cyl(statics, M.trunk, 0.22, 0.24, 9, -20.5, w.ground(-20, 2) + 0.24 + Math.floor(i / 4) * 0.42, -2 + (i % 4) * 0.5 + Math.floor(i / 4) * 0.25, Math.PI / 2, 0, 9);
      w.addBox(18, -5, 24, -2.5); w.addBox(-21.5, -7, -19.5, 3);
      // linen shades where the builders rest
      [[21, 10, 0.3, '#d8c4a2'], [-22, 9, -0.4, '#a8643c'], [12, -21, 1.2, '#c9b48a']].forEach(([x, z, ry, c]) => {
        const g = new T.Group(); g.position.set(x, w.ground(x, z), z); g.rotation.y = ry; statics.add(g);
        [[-1.8, -1.4], [1.8, -1.4], [-1.8, 1.4], [1.8, 1.4]].forEach(([a, b2]) => cyl(g, M.pole, 0.06, 0.07, 2.5, a, 1.25, b2));
        const cl = new T.Mesh(new T.PlaneGeometry(4.2, 3.4, 6, 4), linen(w, c, [2, 2])); cl.rotation.x = -Math.PI / 2 + 0.1; cl.position.y = 2.45; cl.castShadow = true; g.add(cl);
        w.addCircle(x, z, 2);
      });
      statics.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
      w.bake(statics);

      /* ---------------- the mosque that rises as the grids clear ---------------- */
      this.rise = [];
      const wallSeg = (x0, z0, x1, z1, part) => {
        const L = Math.hypot(x1 - x0, z1 - z0), m = new T.Mesh(new T.BoxGeometry(L, 1, 0.7), M.mosque);
        m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); m.castShadow = m.receiveShadow = true; m.userData.dynamic = true; m.scale.y = 0.001; S.add(m);
        this.rise.push({ m, part, h: 3.1, k: 0 });
      };
      // east wall after the first grid; south and west after the second; the qibla (north) wall after the third
      wallSeg(SITE, -SITE, SITE, SITE, 0);
      wallSeg(-SITE, SITE, -2, SITE, 1); wallSeg(2, SITE, SITE, SITE, 1); wallSeg(-SITE, -SITE, -SITE, SITE, 1);
      wallSeg(-SITE, -SITE, SITE, -SITE, 2);
      this.mosqueParts = [0, 0, 0];
      // the low foundation course already traced on the ground
      [[0, -SITE, SITE * 2 + 0.7, 0.8], [0, SITE, SITE * 2 + 0.7, 0.8], [-SITE, 0, 0.8, SITE * 2], [SITE, 0, 0.8, SITE * 2]].forEach(([x, z, sx, sz]) => box(S, M.stone, sx, 0.3, sz, x, 0.12, z));
      // columns and roof of the qibla side (rise at the end)
      this.cols = []; this.roof = new T.Group(); this.roof.visible = false; this.roof.userData.dynamic = true; S.add(this.roof);
      const frond = KIT.frondRoof(w, [5, 2]);
      const roofM = new T.MeshStandardMaterial({ map: frond, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.9, color: 0xc8b080 });
      const rp = new T.Mesh(new T.PlaneGeometry(SITE * 2, 10.5), roofM); rp.rotation.x = -Math.PI / 2; rp.position.set(0, 3.25, -SITE + 5.25); rp.castShadow = true; this.roof.add(rp);
      for (let i = 0; i < 8; i++) cyl(this.roof, M.log, 0.13, 0.14, SITE * 2, 0, 3.1, -SITE + 0.6 + i * 1.4, 0, Math.PI / 2, 7);

      /* ---------------- the puzzle grids ---------------- */
      this.wallMat = M.rubble; this.blockMat = M.block;
      this.chalkTex = w.tex(128, (g, s2) => { g.clearRect(0, 0, s2, s2); g.strokeStyle = 'rgba(255,250,236,0.95)'; g.lineWidth = 7; g.strokeRect(14, 14, s2 - 28, s2 - 28); g.lineWidth = 3; g.beginPath(); g.moveTo(14, 14); g.lineTo(s2 - 14, s2 - 14); g.moveTo(s2 - 14, 14); g.lineTo(14, s2 - 14); g.stroke(); });
      this.chalkTex.wrapS = this.chalkTex.wrapT = T.ClampToEdgeWrapping;
      this.gridTex = w.tex(64, (g, s2) => { g.clearRect(0, 0, s2, s2); g.strokeStyle = 'rgba(250,240,220,0.22)'; g.lineWidth = 2; g.setLineDash([5, 4]); g.strokeRect(1, 1, s2 - 2, s2 - 2); });
      this.levels = LEVELS.map((L, i) => this.buildLevel(L, i));
      this.level = 0; this.mode = null;

      /* ---------------- the light that pushes ---------------- */
      this.light = new T.Group(); this.light.userData.dynamic = true; S.add(this.light);
      this.lHalo = KIT.glow(w, 0xffd090, 3.2, 0.35); this.lCore = KIT.glow(w, 0xfff4d8, 0.9, 1); this.lMid = KIT.glow(w, 0xffb060, 1.6, 0.8);
      this.light.add(this.lHalo, this.lMid, this.lCore);
      this.pl = new T.PointLight(0xffc070, 1.6, 9, 2); this.pl.position.y = 0.4; this.light.add(this.pl);
      this.light.visible = false;

      // the people who waited on the harrah: only their lights, in the film
      const n = 60, pos = new Float32Array(n * 3), r3 = U.seeded(3906);
      for (let i = 0; i < n; i++) { const x = -150 - r3() * 60, z = -30 + r3() * 90; pos.set([x, w.ground(x, z) + 1.4, z], i * 3); }
      const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.BufferAttribute(pos, 3));
      this.waiters = new T.Points(wg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffd8a0, size: 1.4, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      this.waiters.visible = false; this.waiters.frustumCulled = false; S.add(this.waiters);

      /* ---------------- discoveries ---------------- */
      const D = (x, z, dy, title, text, ar) => w.discover({ pos: [x, w.ground(x, z) + (dy || 1.3), z], title, text, ar });
      D(-112, 18, 1.5, 'Waiting on the lava field', 'When news came that he had left Makkah, the people of Madinah went out every morning to the harrah to wait for him, until the heat of noon drove them back. (Sahih al-Bukhari 3906)', 'كانوا يغدون كلَّ غداةٍ إلى الحرّة');
      D(-150, -40, 1.5, 'Between two lava fields', 'Madinah lies between two black lava fields, part of Harrat Rahat. Its last eruption, in 1256 CE, sent lava to within a few kilometres of the city. (Smithsonian Global Volcanism Program)', 'المدينة بين لابتين');
      D(this.aris.x + 1.8, this.aris.z + 1.6, 1.2, 'The well of Aris', 'Near Quba is the well of Aris. The Prophet’s ring, worn after him by Abu Bakr, ‘Umar and ‘Uthman, fell from ‘Uthman’s hand into this well and was never found. (Sahih al-Bukhari 5866, 5879)', 'بئر أريس');
      D(30, 30, 1.4, 'Ten nights and more', 'He reached Quba on a Monday in Rabi‘ al-Awwal and stayed with Banu ‘Amr ibn ‘Awf some ten nights or more, and founded the mosque built on piety. (Sahih al-Bukhari 3906, 428)', 'بضع عشرة ليلة');
      D(9, -60, 1.4, 'Every Saturday', 'In later years the Prophet ﷺ used to come to the Mosque of Quba every Saturday, walking or riding, and pray two rak‘ahs there. (Sahih al-Bukhari 1193, 1194)', 'كان يأتي قباءً كلَّ سبت');
      D(0, SITE + 2.2, 1.6, 'Like an ‘umrah', '“Whoever purifies himself at home, then comes to the Mosque of Quba and prays in it, has a reward like that of an ‘umrah.” (Sunan Ibn Majah 1412; Sunan al-Nasa’i 699, hasan)', 'كان له كأجر عمرة');
      D(-SITE - 2.5, -SITE + 2, 1.4, 'Toward Jerusalem', 'For sixteen or seventeen months after the Hijrah the Muslims prayed facing Jerusalem, to the north of Madinah, until the qibla was turned to the Ka‘bah. (Sahih al-Bukhari 40)', 'صلّى قِبَل بيت المقدس ستة عشر أو سبعة عشر شهرًا');

      /* ---------------- controls and sound ---------------- */
      this.buildButtons(w);
      w.onPointer = (e, p, ph) => self.mode === 'grid' ? self.swipe(e, ph) : false;
      w.interact({ key: 'site', pos: [0, 1, 0], r: SITE + 1, label: () => `Return to the stones · ${LEVELS[self.level] ? LEVELS[self.level].name.split('·')[1].trim() : ''}`, enabled: () => !self.mode && self.level < 3, onUse: () => self.startLevel(self.level) });
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 520, q: 0.5, gain: 0.03 });
      this.leaves = SND.noise(b, { color: 'white', type: 'bandpass', freq: 3200, q: 0.7, gain: 0.006 });
      SND.lfo(b, this.leaves.gain && this.leaves.gain.gain, 0.15, 0.004);
      this.clocks = { dove: 2, bird: 3, voice: 4, water: 1 };
      this.post = w.post({ bloom: 0.4, threshold: 0.8, rays: { strength: 0.3, dir: [-0.6, 0.35, 0.7] }, vignette: 0.36, grain: 0.03, sat: 1.05, contrast: 1.05, lift: [0.012, 0.01, 0.0], gain: [1.04, 1.0, 0.94] });
      w.activity(LEVELS[0].name, 2, LEVELS[0].step);
      w.goal(null);
    },

    waitLights(on) { if (this.waiters) this.waiters.visible = on; if (on) this.waiters.material.opacity = 1; },
    waitLightsFade(k) { if (this.waiters) this.waiters.material.opacity = U.clamp(k); },

    /* ======================= the Sokoban grids ======================= */
    buildLevel(L, li) {
      const w = this.w, S = w.scene, rows = L.rows, Hn = rows.length, Wn = Math.max(...rows.map(r => r.length));
      const lv = { L, li, Wn, Hn, walls: new Set(), goals: [], boxes0: [], p0: null, meshes: [], done: false, g: new T.Group() };
      lv.g.userData.dynamic = true; S.add(lv.g);
      const ox = L.at[0] - (Wn - 1) * CELL / 2, oz = L.at[1] - (Hn - 1) * CELL / 2;
      lv.cell = (x, y, out) => (out || new T.Vector3()).set(ox + x * CELL, 0, oz + y * CELL);
      for (let y = 0; y < Hn; y++) for (let x = 0; x < Wn; x++) {
        const c = rows[y][x] || ' ';
        if (c === '#') lv.walls.add(y * 100 + x);
        if ('.*+'.includes(c)) lv.goals.push([x, y]);
        if ('$*'.includes(c)) lv.boxes0.push([x, y]);
        if ('@+'.includes(c)) lv.p0 = [x, y];
      }
      // floor cells inside the grid (reachable from the start) get faint chalk lines
      const inside = new Set(), q = [lv.p0];
      while (q.length) { const [x, y] = q.pop(), k = y * 100 + x; if (inside.has(k) || lv.walls.has(k) || x < 0 || y < 0 || x >= Wn || y >= Hn) continue; inside.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
      lv.inside = inside;
      const v = new T.Vector3();
      const floorM = new T.MeshBasicMaterial({ map: this.gridTex, transparent: true, depthWrite: false, opacity: 0.9 });
      const fim = new T.InstancedMesh(new T.PlaneGeometry(CELL, CELL).rotateX(-Math.PI / 2), floorM, inside.size);
      let i = 0; const m4 = new T.Matrix4();
      inside.forEach(k => { lv.cell(k % 100, Math.floor(k / 100), v); v.y = 0.035; m4.makeTranslation(v.x, v.y, v.z); fim.setMatrixAt(i++, m4); });
      fim.renderOrder = 2; lv.g.add(fim);
      // walls: rubble blocks, palm stumps and old trunks, so each grid reads as a corner of a real site
      const rr = U.seeded(700 + li), wallG = new T.BoxGeometry(CELL * 0.98, 0.95, CELL * 0.98);
      { const p = wallG.attributes.position; for (let j = 0; j < p.count; j++) { const yv = p.getY(j); if (yv > 0) { p.setX(j, p.getX(j) * (0.9 + 0.05 * Math.sin(j))); p.setZ(j, p.getZ(j) * (0.92 + 0.05 * Math.cos(j * 1.7))); } } wallG.computeVertexNormals(); }
      const wim = new T.InstancedMesh(wallG, this.wallMat, lv.walls.size); wim.castShadow = wim.receiveShadow = true;
      i = 0; const q4 = new T.Quaternion(), sc = new T.Vector3(), col = new T.Color();
      lv.walls.forEach(k => {
        const x = k % 100, y = Math.floor(k / 100); lv.cell(x, y, v);
        const h = 0.75 + rr() * 0.5; v.y = w.ground(v.x, v.z) + h * 0.95 / 2 - 0.1; q4.setFromEuler(new T.Euler(0, (rr() - 0.5) * 0.12, 0)); sc.set(1, h, 1);
        m4.compose(v, q4, sc); wim.setMatrixAt(i, m4); wim.setColorAt(i, col.setHSL(0.08, 0.12, 0.62 + rr() * 0.18)); i++;
        w.addBox(v.x - CELL / 2, v.z - CELL / 2, v.x + CELL / 2, v.z + CELL / 2); lv.boxRefs = lv.boxRefs || []; lv.boxRefs.push(w.boxes[w.boxes.length - 1]);
      });
      lv.g.add(wim); lv.wim = wim; lv.fim = fim;
      // chalk marks
      const gm = new T.MeshBasicMaterial({ map: this.chalkTex, transparent: true, depthWrite: false, color: 0xfff2d8 });
      lv.goalMeshes = lv.goals.map(([x, y]) => { const m = new T.Mesh(new T.PlaneGeometry(CELL * 0.92, CELL * 0.92).rotateX(-Math.PI / 2), gm.clone()); lv.cell(x, y, m.position); m.position.y = 0.05; m.renderOrder = 3; lv.g.add(m); return m; });
      // stones
      const stoneG = new T.BoxGeometry(CELL * 0.82, 0.86, CELL * 0.82);
      { const p = stoneG.attributes.position; for (let j = 0; j < p.count; j++) { p.setX(j, p.getX(j) * (1 - Math.abs(p.getY(j)) * 0.06)); p.setZ(j, p.getZ(j) * (1 - Math.abs(p.getY(j)) * 0.05)); } stoneG.computeVertexNormals(); }
      lv.stones = lv.boxes0.map(([x, y], j) => {
        const m = new T.Mesh(stoneG, this.blockMat.clone()); m.castShadow = m.receiveShadow = true; m.rotation.y = (j % 3 - 1) * 0.04;
        m.material.color.set(['#d8d0c4', '#c8bfb2', '#d2c6b4', '#bfb8ae'][j % 4]); m.material.emissive = new T.Color(0x000000);
        lv.g.add(m); return { m, x, y, vx: x, vy: y, on: false, bump: 0 };
      });
      lv.p = lv.p0.slice(); lv.hist = [];
      this.placeStones(lv);
      return lv;
    },
    placeStones(lv) {
      const v = new T.Vector3();
      lv.stones.forEach(s => { lv.cell(s.vx, s.vy, v); s.m.position.set(v.x, this.w.ground(v.x, v.z) + 0.43 - (s.on ? 0.12 : 0) + Math.sin(s.bump * Math.PI) * 0.08, v.z); });
    },
    startLevel(i) {
      const w = this.w, self = this;
      if (i >= LEVELS.length) return;
      this.level = i; const lv = this.levels[i];
      w.focus = null; this.mode = 'grid'; this.camT = 0; this.camFrom = w.camera.position.clone(); this.camFromQ = w.camera.quaternion.clone();
      w.mode = dt => self.gridTick(dt);
      this.light.visible = true; this.moveQ = []; this.tween = null;
      w.activity(lv.L.name, lv.goals.length, lv.L.step); w.progress(this.onCount(lv));
      w.goal(null); this.showButtons(true);
      this.env.hint(matchMedia('(pointer: coarse)').matches ? this.hintTouch : this.hint);
      SND.swell(this.env.bus, { f0: 200, f1: 480, dur: 1.4, gain: 0.03 });
      if (i === 0 && !this.told0) { this.told0 = true; w.say('The first stones', 'Push each stone onto a chalk mark. A stone can be pushed but never pulled, so think a step ahead. Z steps back; R lays the stones out again.', { ms: 9000 }); }
      if (i === 2 && !this.told2) { this.told2 = true; w.say('The qibla side', 'The prayer then faced Jerusalem, to the north. These four stones will carry the palm-trunk columns of the covered side. (Sahih al-Bukhari 40)', { ms: 9000, ar: 'قِبَل بيت المقدس' }); }
    },
    leaveGrid() {
      const w = this.w; if (this.mode !== 'grid') return;
      this.mode = null; w.mode = null; this.light.visible = false; this.showButtons(false);
      const f = new T.Vector3(); w.camera.getWorldDirection(f); w.yaw = Math.atan2(-f.x, -f.z); w.pitch = -0.15;
      const lv = this.levels[this.level];
      // step out just south of the grid's walls
      w.pos.set(lv.L.at[0], 0, lv.L.at[1] + lv.Hn * CELL / 2 + 2.5); w.yaw = 0; w.pitch = -0.25;
      w.goal([lv.L.at[0], 1, lv.L.at[1]]);
      this.env.hint('WASD walk · E near the stones to return to the puzzle');
    },
    onCount(lv) { return lv.stones.filter(s => lv.goals.some(g => g[0] === s.x && g[1] === s.y)).length; },
    stoneAt(lv, x, y) { return lv.stones.find(s => s.x === x && s.y === y); },
    tryMove(dx, dy) {
      const lv = this.levels[this.level], env = this.env; if (!lv || lv.done) return;
      const nx = lv.p[0] + dx, ny = lv.p[1] + dy;
      if (lv.walls.has(ny * 100 + nx)) { this.bump = { dx, dy, t: 0 }; SND.knock(env.bus, { f: 130, gain: 0.05, click: 700 }); return; }
      const st = this.stoneAt(lv, nx, ny);
      if (st) {
        const bx = nx + dx, by = ny + dy;
        if (lv.walls.has(by * 100 + bx) || this.stoneAt(lv, bx, by)) { this.bump = { dx, dy, t: 0 }; st.bump = 0.5; SND.knock(env.bus, { f: 95, gain: 0.08, click: 900 }); return; }
        lv.hist.push({ p: lv.p.slice(), s: lv.stones.map(s => [s.x, s.y]) });
        st.x = bx; st.y = by; st.bump = 1;
        const sp = this.w.spatial(lv.cell(bx, by), 10);
        SND.knock(env.bus, { f: 80 + Math.random() * 20, gain: 0.22, click: 1500, pan: sp.pan }); SND.step(env.bus, { gain: 0.08, f: 500 });
        const was = st.on; st.on = lv.goals.some(g => g[0] === bx && g[1] === by);
        if (st.on && !was) { st.flash = 1.2; SND.sing(env.bus, [261.63, 293.66, 329.63, 392][this.onCount(lv) - 1] || 392, { vowel: 'a', dur: 1.8, gain: 0.04, voices: 3 }); }
        this.w.progress(this.onCount(lv));
        this.checkWedged(lv, st);
      } else lv.hist.push({ p: lv.p.slice(), s: lv.stones.map(s => [s.x, s.y]) });
      lv.p = [nx, ny];
      this.tween = { t: 0 };
      SND.sing(env.bus, 523.25 + (dx + dy) * 30, { vowel: 'u', dur: 0.14, gain: 0.006, attack: 0.02 });
      if (lv.stones.every(s => s.on)) this.clearLevel(lv);
    },
    checkWedged(lv, st) {
      if (st.on) return;
      const W2 = (x, y) => lv.walls.has(y * 100 + x);
      const corner = (W2(st.x - 1, st.y) || W2(st.x + 1, st.y)) && (W2(st.x, st.y - 1) || W2(st.x, st.y + 1));
      if (corner) {
        st.wedged = true;
        SND.sing(this.env.bus, 155.56, { vowel: 'o', dur: 1.6, gain: 0.035 });
        this.w.say('A stone is wedged', 'This stone has been pushed into a corner and can no longer reach a mark. Press Z to step back, or R to lay the stones out again.', { ms: 6000 });
      }
    },
    undo() {
      const lv = this.levels[this.level]; if (!lv || lv.done || !lv.hist.length) return;
      const h = lv.hist.pop(); lv.p = h.p; lv.stones.forEach((s, i) => { s.x = h.s[i][0]; s.y = h.s[i][1]; s.on = lv.goals.some(g => g[0] === s.x && g[1] === s.y); s.wedged = false; });
      this.tween = { t: 0 }; this.w.progress(this.onCount(lv));
      SND.swell(this.env.bus, { f0: 500, f1: 300, dur: 0.35, gain: 0.02 });
    },
    reset() {
      const lv = this.levels[this.level]; if (!lv || lv.done) return;
      lv.hist.push({ p: lv.p.slice(), s: lv.stones.map(s => [s.x, s.y]) });
      lv.p = lv.p0.slice(); lv.stones.forEach((s, i) => { s.x = lv.boxes0[i][0]; s.y = lv.boxes0[i][1]; s.on = lv.goals.some(g => g[0] === s.x && g[1] === s.y); s.wedged = false; s.bump = 1; });
      this.tween = { t: 0 }; this.w.progress(this.onCount(lv));
      SND.swell(this.env.bus, { f0: 300, f1: 600, dur: 0.8, gain: 0.03 });
    },
    clearLevel(lv) {
      const w = this.w, env = this.env; lv.done = true; this.clearT = 0;
      SND.glow(env.bus, [130.81, 146.83, 98][lv.li], { gain: 0.06, dur: 7 });
      SND.sing(env.bus, [261.63, 293.66, 196][lv.li], { vowel: 'a', dur: 4, gain: 0.05, voices: 5, attack: 0.3, delay: 0.3 });
      this.mosqueParts[lv.li] = 1;
      const msg = [['The courtyard corner', 'The first stones lie on their marks, and the east wall of mud brick rises on its foundation.'],
        ['The prayer ground', 'The south and west walls rise. The mosque has a shape now, open to the sky.'],
        ['The qibla side', 'Palm trunks rise as columns on the four stones and are roofed with fronds, on the side facing Jerusalem.']][lv.li];
      setTimeout(() => { if (this.w) w.say(msg[0], msg[1], { ms: 7000 }); }, 600);
      if (lv.li === 2) this.raiseColumns(lv);
    },
    raiseColumns(lv) {
      const w = this.w, M = this.M;
      lv.goals.forEach(([x, y], i) => {
        const v = lv.cell(x, y), m = new T.Mesh(new T.CylinderGeometry(0.24, 0.3, 3.2, 10), M.trunk);
        m.position.set(v.x, 0.8, v.z); m.castShadow = true; m.userData.dynamic = true; m.scale.y = 0.001; w.scene.add(m);
        this.cols.push({ m, delay: i * 0.4 });
      });
      // the rest of the columns of the covered side
      for (let cx = -12; cx <= 12; cx += 4) for (const cz of [-12.6, -9.2]) {
        if (lv.goals.some(([x, y]) => { const v = lv.cell(x, y); return Math.hypot(v.x - cx, v.z - cz) < 1.6; })) continue;
        const m = new T.Mesh(new T.CylinderGeometry(0.22, 0.28, 3.3, 10), M.trunk); m.position.set(cx, 1.65, cz); m.castShadow = true; m.userData.dynamic = true; m.scale.y = 0.001; w.scene.add(m);
        this.cols.push({ m, delay: 1.6 + Math.abs(cx) * 0.05, full: true });
      }
    },
    gridTick(dt) {
      const w = this.w, env = this.env, lv = this.levels[this.level], k = w.keys;
      // camera: an isometric view over the grid, from the south-east, north at the top
      this.camT = Math.min(1, this.camT + dt / 1.3);
      const c = new T.Vector3(lv.L.at[0], 0, lv.L.at[1]);
      const fov = 34, half = Math.max(lv.Wn * CELL * 0.62, lv.Hn * CELL * 0.62 * 1.25) / Math.min(1, w.camera.aspect * 0.8);
      const dist = half / Math.tan(T.MathUtils.degToRad(fov / 2)) * 1.12;
      const dir = new T.Vector3(0.32, 1.05, 0.95).normalize();
      const camP = c.clone().addScaledVector(dir, dist), look = c.clone().add(new T.Vector3(0, -0.4, -0.4));
      const kk = U.ease(this.camT);
      w.camera.fov = U.lerp(64, fov, kk); w.camera.updateProjectionMatrix();
      const qT = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(camP, look, new T.Vector3(0, 1, 0)));
      w.camera.position.lerpVectors(this.camFrom, camP, kk); w.camera.quaternion.copy(this.camFromQ).slerp(qT, kk);
      if (w._shadow) { const L = w._shadow.light; L.target.position.copy(c); L.position.copy(c).add(w._shadow.off); }
      // input: one cell per press; held keys repeat
      if (!lv.done && this.camT > 0.5) {
        const dx = (k.has('d') || k.has('ArrowRight') || this.btn === 'r' ? 1 : 0) - (k.has('a') || k.has('ArrowLeft') || this.btn === 'l' ? 1 : 0);
        const dy = (k.has('s') || k.has('ArrowDown') || this.btn === 'd' ? 1 : 0) - (k.has('w') || k.has('ArrowUp') || this.btn === 'u' ? 1 : 0);
        const want = dx ? [dx, 0] : dy ? [0, dy] : null;
        this.hold = want ? (this.hold || 0) + dt : 0;
        if (want && this.hold > 0.24 && !this.tween) { this.tryMove(want[0], want[1]); this.hold = 0.12; }
        if (this.moveQ.length && !this.tween) { const [a, b] = this.moveQ.shift(); this.tryMove(a, b); }
      }
      // the light glides from cell to cell
      if (this.tween) { this.tween.t += dt / 0.13; if (this.tween.t >= 1) this.tween = null; }
      const target = lv.cell(lv.p[0], lv.p[1]);
      const lp = this.light.position;
      lp.x = U.damp(lp.x || target.x, target.x, 18, dt); lp.z = U.damp(lp.z || target.z, target.z, 18, dt);
      if (this.bump) { this.bump.t += dt; const b = Math.sin(Math.min(1, this.bump.t / 0.18) * Math.PI) * 0.25; lp.x += this.bump.dx * b * 0.3; lp.z += this.bump.dy * b * 0.3; if (this.bump.t > 0.18) this.bump = null; }
      lp.y = w.ground(lp.x, lp.z) + 0.75 + Math.sin(w.time * 2.4) * 0.08;
      const fl = 1 + Math.sin(w.time * 19) * 0.05;
      this.lCore.scale.setScalar(0.9 * fl); this.lMid.scale.setScalar(1.7 * fl);
      // stones slide to their cells, settle onto marks, glow
      lv.stones.forEach(s => {
        s.vx = U.damp(s.vx, s.x, 16, dt); s.vy = U.damp(s.vy, s.y, 16, dt); s.bump = Math.max(0, s.bump - dt * 4);
        s.flash = Math.max(0, (s.flash || 0) - dt * 0.8);
        s.m.material.emissive.setRGB(0.5 * s.flash, 0.38 * s.flash, 0.18 * s.flash);
        if (s.wedged) s.m.material.emissive.setRGB(0.02, 0.02, 0.06);
      });
      this.placeStones(lv);
      lv.goalMeshes.forEach((m, i) => { const g = lv.goals[i], cov = lv.stones.some(s => s.x === g[0] && s.y === g[1]); m.material.opacity = cov ? 0.15 : 0.55 + 0.35 * Math.sin(w.time * 3 + i); });
      // after a grid is cleared: the mosque rises, then on to the next grid
      if (lv.done) {
        this.clearT += dt;
        if (this.clearT > 5.5 && !lv.moved) {
          lv.moved = true;
          if (this.level < 2) { this.startLevel(this.level + 1); }
          else this.finale();
        }
      }
    },
    finale() {
      const w = this.w, env = this.env, self = this;
      this.mode = 'final'; this.finalT = 0; this.light.visible = false; this.showButtons(false);
      this.camFrom = w.camera.position.clone();
      w.mode = dt => self.finalTick(dt);
      SND.glow(env.bus, 98, { gain: 0.07, dur: 12 }); SND.sing(env.bus, 196, { vowel: 'a', dur: 7, gain: 0.05, voices: 6, attack: 1.2, delay: 1 });
    },
    finalTick(dt) {
      const w = this.w; this.finalT += dt;
      const k = U.ease(U.clamp(this.finalT / 12));
      w.camera.position.lerpVectors(this.camFrom, new T.Vector3(26, 14, 34), k);
      w.camera.lookAt(0, 1.5, -2);
      if (w._shadow) { const L = w._shadow.light; L.target.position.set(0, 0, 0); L.position.copy(w._shadow.off); }
      this.roof.visible = this.finalT > 3.2;
      if (this.finalT > 2 && !this.saidTaqwa) { this.saidTaqwa = true; w.say('Founded on piety', '“A mosque founded on piety from the first day is more worthy for you to stand in.” (Qur’an 9:108) Many, with Ibn ‘Abbas, held that this is the Mosque of Quba; others, the Prophet’s Mosque in Madinah.', { ms: 12000, ar: '﴿لَّمَسْجِدٌ أُسِّسَ عَلَى التَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ﴾' }); }
      if (this.finalT > 12 && !this.finished) {
        this.finished = true; w.finish('The first mosque stands at Quba');
        setTimeout(() => { if (!this.w) return; this.mode = null; w.mode = null; w.pos.set(0, 0, SITE + 6); w.yaw = 0; w.pitch = -0.05; w.goal(null); this.env.hint('WASD walk · the oasis is yours to explore'); }, 3000);
      }
    },

    /* ---------------- controls ---------------- */
    buildButtons(w) {
      const self = this, wrap = document.createElement('div');
      wrap.className = 'quba-pad'; wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
      const touch = matchMedia('(pointer: coarse)').matches;
      const mk = (txt, css, down, up, label, always) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.className = 'quba-btn';
        b.style.cssText = 'position:absolute;pointer-events:auto;width:56px;height:56px;border-radius:14px;border:1px solid rgba(246,220,154,.5);background:rgba(10,12,22,.42);color:#f6e6c0;font:600 22px/1 system-ui,sans-serif;touch-action:none;' + css + (touch || always ? '' : 'display:none;');
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); SND.init(); down(); });
        if (up) { const u = e => { e && e.stopPropagation(); up(); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u); }
        wrap.appendChild(b); return b;
      };
      const dir = (n, d) => [() => { self.moveQ.push(d); self.btn = n; self.hold = 0; }, () => { if (self.btn === n) self.btn = null; }];
      mk('▲', 'left:78px;bottom:226px;', ...dir('u', [0, -1]), 'Push north');
      mk('▼', 'left:78px;bottom:110px;', ...dir('d', [0, 1]), 'Push south');
      mk('◀', 'left:18px;bottom:168px;', ...dir('l', [-1, 0]), 'Push west');
      mk('▶', 'left:138px;bottom:168px;', ...dir('r', [1, 0]), 'Push east');
      mk('↶', 'right:18px;bottom:226px;', () => self.undo(), null, 'Undo', true);
      mk('⟲', 'right:18px;bottom:162px;', () => self.reset(), null, 'Reset', true);
      mk('✕', 'right:18px;top:38%;width:44px;height:44px;font-size:16px;border-radius:50%;', () => self.leaveGrid(), null, 'Walk the oasis', true);
      w.ui.layer.appendChild(wrap); this.pad = wrap;
    },
    showButtons(on) { if (this.pad) this.pad.style.display = on ? 'block' : 'none'; },
    swipe(e, ph) {
      if (ph === 'down') { this.sw = { x: e.clientX, y: e.clientY }; return true; }
      if (ph === 'up' && this.sw) {
        const dx = e.clientX - this.sw.x, dy = e.clientY - this.sw.y; this.sw = null;
        if (Math.hypot(dx, dy) > 30) { if (Math.abs(dx) > Math.abs(dy)) this.moveQ.push([Math.sign(dx), 0]); else this.moveQ.push([0, Math.sign(dy)]); }
      }
      return true;
    },
    onKey(env, e) {
      if (!this.w || this.w.filmS) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (this.mode !== 'grid') return;
      if (k === 'q' || k === 'Escape') { this.leaveGrid(); return; }
      if (k === 'z' || k === 'Backspace' || k === 'u') { this.undo(); return; }
      if (k === 'r') { this.reset(); return; }
      if (e.repeat) return;
      const d = { w: [0, -1], ArrowUp: [0, -1], s: [0, 1], ArrowDown: [0, 1], a: [-1, 0], ArrowLeft: [-1, 0], d: [1, 0], ArrowRight: [1, 0] }[k];
      if (d) { this.moveQ.push(d); this.hold = 0; }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      // the mosque rises
      for (const r of this.rise) { const want = this.mosqueParts[r.part] ? r.h : 0.001; r.k = U.damp(r.m.scale.y, want, 0.9, dt); r.m.scale.y = r.k; r.m.position.y = r.k / 2; }
      // a cleared grid: its rubble is carried off and its chalk lines fade, leaving the stones as foundations
      if (this.levels) for (const lv of this.levels) if (lv.done) {
        lv.sink = Math.min(1, (lv.sink || 0) + dt / 4);
        if (lv.sink > 0.3) { lv.wim.position.y = -1.3 * U.smooth(0.3, 1, lv.sink); lv.fim.material.opacity = 0.9 * (1 - lv.sink); lv.goalMeshes.forEach(m => { m.visible = lv.sink < 0.9; }); }
        if (lv.boxRefs && lv.sink >= 1) { w.boxes = w.boxes.filter(b => !lv.boxRefs.includes(b)); lv.boxRefs = null; lv.wim.visible = false; }
      }
      for (const c of this.cols) { c.delay -= dt; if (c.delay < 0) { c.m.scale.y = U.damp(c.m.scale.y, 1, 1.4, dt); c.m.position.y = (c.full ? 0 : 0.8) + 3.2 * c.m.scale.y / 2; } }
      // sound of the oasis
      const C = this.clocks;
      C.dove -= dt; if (C.dove < 0) { C.dove = 3 + Math.random() * 5; SND.coo && SND.coo(env.bus, { gain: 0.02, pan: U.rnd(-0.8, 0.8) }); }
      C.bird -= dt; if (C.bird < 0) { C.bird = 1.5 + Math.random() * 3; SND.chirp(env.bus, { gain: 0.012, pan: U.rnd(-0.9, 0.9) }); }
      C.water -= dt; if (C.water < 0) { C.water = 0.3 + Math.random() * 0.8; const d = Math.hypot(w.pos.x - this.aris.x, w.pos.z - this.aris.z); if (d < 25) SND.drop(env.bus, { f: U.rnd(500, 900), gain: 0.03 / (1 + d * 0.2) }); }
      C.voice -= dt; if (C.voice < 0) { C.voice = 2 + Math.random() * 4; const h = U.pick(this.houses), sp = w.spatial(h, 12); SND.sing(env.bus, U.rnd(110, 180), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.3, 0.8), gain: 0.015 * sp.gain + 0.003, pan: sp.pan, breath: 0.35, attack: 0.05 }); }
      this.wind.set('gain', 0.025 + 0.015 * Math.sin(t * 0.25), 1);
    },
    onLeave() { this.pad = null; this.mode = null; this.finished = false; this.saidTaqwa = false; },
  }));
})();
