/* Madinah — The Lanes of Old Madinah, around 1900.
   A maze game in the manner of Pac-Man: the lanes of the old city, between tall houses with wooden
   roshan windows, seen from high above at night. You are a glass lantern. Light every lamp of the
   quarter before your oil runs low; open doorways glow where oil is shared; the cats of the quarter sit
   in the lanes and purr, and you go around them. Three quarters open one after another, and the last
   leads to the square before the Prophet's Mosque. A minimap and an oil gauge sit at the side.
   No person is depicted: only doors, lamps, voices and the cats. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const ID = 'lanes';
  const N = 33, CS = 6, HALF = 16;          // the maze grid (odd cells are lanes), cell size in metres
  const X = i => (i - HALF) * CS, Z = j => (j - HALF) * CS;
  const REG = [{ j0: 23, j1: 31, lamps: 10, doors: 3, cats: 1, drain: 1.25, name: 'Part 1 of 3 · The south quarter' },
    { j0: 11, j1: 21, lamps: 13, doors: 3, cats: 3, drain: 1.6, name: 'Part 2 of 3 · The market lanes' },
    { j0: 1, j1: 9, lamps: 14, doors: 2, cats: 4, drain: 1.9, name: 'Part 3 of 3 · Toward the Prophet’s Mosque' }];
  const GATES = [[[9, 22], [23, 22]], [[7, 10], [25, 10]], [[15, 0], [17, 0]]];
  const START = [17, 31];
  const SQUARE_Z = Z(0) - 22;               // the square before the mosque

  /* ---------------- local helpers ---------------- */
  const AVG = { patterned_clay_plaster: [0.38, 0.289, 0.221], rough_linen: [0.292, 0.419, 0.627], old_planks_02: [0.123, 0.09, 0.06], dry_ground_rocks: [0.318, 0.185, 0.083] };
  // a photo material whose average colour becomes `hex` (so a beige plaster can read as whitewash)
  const toned = (w, id, hex, o) => { o = o || {}; const m = PHOTO.mat(w, id, Object.assign({ fallback: o.fallback }, o)); const c = new T.Color(hex).convertSRGBToLinear(), a = AVG[id];
    if (PHOTO.enabled && a) m.color.setRGB(c.r / a[0], c.g / a[1], c.b / a[2]); else m.color.set(hex); if (o.triplanar && !PHOTO.enabled) SCAPE.triplanar(m, o.triplanar); return m; };
  function box(g, mat, sx, sy, sz, x, y, z, ry, cast) {
    const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    m.castShadow = cast !== false; m.receiveShadow = true; g.add(m); return m;
  }
  /* A cat sitting like a loaf, built of a few soft shapes, in one draw call; its eyes catch the light. */
  function catMesh(w, col, eyeMat) {
    const parts = [];
    const add = (g, x, y, z, sx, sy, sz, rx, ry, rz) => { g.scale(sx || 1, sy || 1, sz || 1); g.rotateX(rx || 0); g.rotateY(ry || 0); g.rotateZ(rz || 0); g.translate(x, y, z); parts.push(g); };
    add(new T.SphereGeometry(0.2, 14, 10), 0, 0.15, -0.02, 1.0, 0.75, 1.55);            // body
    add(new T.SphereGeometry(0.16, 14, 10), 0, 0.26, 0.2, 1.0, 1.05, 1.0);          // chest
    add(new T.SphereGeometry(0.115, 14, 10), 0, 0.42, 0.27, 1.05, 0.92, 1.0);       // head
    add(new T.SphereGeometry(0.05, 8, 6), 0, 0.39, 0.37, 1.1, 0.8, 0.9);            // muzzle
    add(new T.ConeGeometry(0.045, 0.09, 6), -0.06, 0.53, 0.26, 1, 1, 0.6, 0, 0, 0.25);
    add(new T.ConeGeometry(0.045, 0.09, 6), 0.06, 0.53, 0.26, 1, 1, 0.6, 0, 0, -0.25);
    const tail = new T.TorusGeometry(0.2, 0.035, 6, 14, Math.PI * 1.1); add(tail, 0.03, 0.04, -0.02, 1, 1, 1.3, Math.PI / 2, 0, 0.2);
    const fur = w._fur || (w._fur = w.tex(128, (g, S) => { g.fillStyle = '#d8d0c8'; g.fillRect(0, 0, S, S); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(40,30,24,0.55)'; const y = i * S / 14 + Math.random() * 3; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= S; x += 8) g.lineTo(x, y + Math.sin(x * 0.1 + i) * 3); g.lineTo(S, y + 4); g.lineTo(0, y + 4); g.fill(); } for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,250,240' : '30,24,20'},0.25)`; g.fillRect(Math.random() * S, Math.random() * S, 1, 3); } }, [2, 2]));
    const body = new T.Mesh(SCAPE.merge(parts), new T.MeshStandardMaterial({ color: col, map: fur, roughness: 0.95 }));
    body.castShadow = true;
    const eyes = new T.Mesh(SCAPE.merge([new T.SphereGeometry(0.02, 6, 4).translate(-0.04, 0.44, 0.375), new T.SphereGeometry(0.02, 6, 4).translate(0.04, 0.44, 0.375)]), eyeMat);
    const g = new T.Group(); g.add(body, eyes); g.scale.setScalar(1.25); g.userData.dynamic = true; w.scene.add(g);
    return g;
  }

  ENGINE.register(WORLD.stage({
    key: ID,
    arabic: 'أَزِقّة المَدِينة',
    title: 'The Lanes of Old Madinah',
    era: 'Madinah · around 1900 · the old quarters by night',
    hint: 'Arrows or WASD steer the lantern · light every lamp · glowing doorways refill your oil · V changes the view',
    hintTouch: 'Swipe or use the arrows to steer · light every lamp · glowing doorways refill your oil',
    sound: { reverb: 0.55 },
    story: `<p>For centuries the Prophet’s Mosque stood at the heart of a dense old city: narrow lanes shaded by houses of three and four storeys, with projecting wooden windows called <i>roshan</i> that let the breeze in and kept the family out of view.</p>
            <p>Most of these quarters were cleared in the great expansions of the twentieth century. Walk them once more as a lantern by night, and light every lamp of the lanes.</p>`,

    film(env, w) {
      const self = this, run = this.filmRun, door = this.filmDoor, cat = this.filmCat, cf = this.filmCatFrom;
      const P = (c, y) => [X(c[0]), y, Z(c[1])];
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [50, 42],
          path: [[[70, 95, 175], [0, 12, -150]], [[30, 70, 130], [0, 8, -150]]],
          start: () => SND.swell(env.bus, { f0: 120, f1: 340, dur: 6.5, gain: 0.03 }) },
        { dur: 6.5, fade: 'dip', line: 'Madinah, around 1900. Lanes of tall houses wind toward the Prophet’s Mosque.', ar: 'المدينة نحو سنة ١٩٠٠. أزقّةٌ بين بيوتٍ عالية تلتفّ نحو المسجد النبوي.',
          path: [[P(run[0], 2.6), P(run[1], 2.4)], [P(run[1], 2.6), P(run[2], 2.4)]], ease: 'linear' },
        { dur: 6, fade: 'cut', line: 'Projecting wooden windows, the roshan, let in the breeze and keep the house private.', ar: 'والرواشين، نوافذُ خشبيةٌ بارزة، تُدخل النسيم وتحفظ سترَ البيت.',
          path: [[P(run[0], 6.2), P(run[2], 4.6)], [P(run[1], 7.4), P(run[2], 4.4)]], ease: 'glide',
          start: () => { self.facing = run; } },
        { dur: 6, fade: 'dip', line: 'A door stands open; light and a little oil wait inside.', ar: 'بابٌ مفتوح، ونورٌ وقليلٌ من الزيت ينتظر في الداخل.',
          path: [[[X(door.c[0]) - door.d[0] * 2.4, 1.9, Z(door.c[1]) - door.d[1] * 2.4], [X(door.c[0]) + door.d[0] * 3, 1.5, Z(door.c[1]) + door.d[1] * 3]], [[X(door.c[0]) - door.d[0] * 0.8, 1.6, Z(door.c[1]) - door.d[1] * 0.8], [X(door.c[0]) + door.d[0] * 3, 1.3, Z(door.c[1]) + door.d[1] * 3]]],
          start: () => { self.filmDoorOpen = 0; SND.knock(env.bus, { f: 160, gain: 0.08, click: 900 }); }, during: (w2, k) => { self.filmDoorOpen = U.smooth(0.1, 0.6, k); } },
        { dur: 5.5, fade: 'cut', line: 'A cat of the quarter settles in the middle of the lane.', ar: 'وقطٌّ من قطط الحيّ يجلس في وسط الزقاق.',
          path: [[[X(cat[0]) + cf[0] * 5, 0.9, Z(cat[1]) + cf[1] * 5], [X(cat[0]), 0.4, Z(cat[1])]], [[X(cat[0]) + cf[0] * 1.8, 0.55, Z(cat[1]) + cf[1] * 1.8], [X(cat[0]), 0.45, Z(cat[1])]]], ease: 'glide',
          start: () => { self.purrBoost = 1; }, during: (w2, k) => { self.purrBoost = Math.sin(k * Math.PI); } },
        { dur: 6.5, fade: 'dip', line: 'Ahead rises the Green Dome, painted green since 1837.', ar: 'وفي الأمام تعلو القبةُ الخضراء، المطليّةُ بالأخضر منذ سنة ١٨٣٧.',
          path: [[[0, 14, Z(2)], [0, 22, SQUARE_Z - 40]], [[0, 40, Z(10)], [0, 18, SQUARE_Z - 40]]], ease: 'glide',
          start: () => SND.glow(env.bus, 196, { gain: 0.05, dur: 6 }) },
        { dur: 6, fade: 'dip', line: 'Light every lamp of the lanes before your oil runs out.', ar: 'أشعِل كلَّ مصابيح الأزقّة قبل أن ينفد زيتُك.',
          path: [[[X(START[0]) + 10, 30, Z(START[1]) + 26], [X(START[0]), 0, Z(START[1])]]] },
      ];
    },
    filmOpts: { end() { const s = ENGINE.cur; s.filmDoorOpen = 1; s.purrBoost = 0; s.startPlay && s.startPlay(); } },

    enter(env) {
      const self = this; this.env = env;
      this.buildMaze();
      const H = (x, z) => {
        const d = Math.hypot(x, z * 0.9);
        let y = Math.pow(Math.max(0, d - 380), 1.15) * 0.35 * (0.6 + 0.8 * (SCAPE.fbm(x * 0.004, z * 0.004, 3) * 0.5 + 0.5));
        y += 160 * Math.exp(-((x + 80) ** 2 + (z + 1150) ** 2) / (2 * 220 * 220));   // Uhud, far to the north
        y += 50 * Math.exp(-((x + 520) ** 2 + (z + 120) ** 2) / (2 * 90 * 90));      // Sal', to the west
        y += SCAPE.fbm(x * 0.02, z * 0.02, 3) * 1.4 * U.smooth(120, 200, d);
        return y;
      };
      const w = this.w = WORLD.create(env, { start: { x: X(START[0]), z: Z(START[1]) + 9.5, yaw: 0, pitch: -1.38 }, exposure: 1.0, far: 2200, fov: 46, fog: { color: 0x10162a, density: 0.0021 } });
      const S = w.scene; w.eye = 50;   // the film hands over to the high lantern view
      const ter = SCAPE.terrain(w, { size: 1900, seg: 280, height: H, rock: [0.82, 0.93], rockHeight: [30, 70], colors: { low: '#a89880', high: '#988870', rock: '#5a5048', dark: '#3a3430' },
        tex: 'gravel', rockTex: 'lava', photo: { ground: 'dry_ground_rocks', rock: 'dark_rock', normal: 1 }, rep: 0.3, rockRep: 0.05 });
      w.ground = ter.ground;
      w.sky({ top: '#050814', mid: '#182240', bot: '#0a0c16', sunDir: [0.3, 0.8, -0.5], sun: '#9aa8d8', sunSize: 0.0008, stars: 1 });
      const moon = new T.DirectionalLight(0xa8b8ff, 0.32); moon.position.set(20, 60, -30); S.add(moon);
      S.add(new T.HemisphereLight(0x5868a8, 0x3a2a20, PHOTO.enabled ? 0.12 : 0.55));
      w.followShadow(moon, 40, 2048);
      PHOTO.sky(w, 'qwantani_night_puresky', { sun: moon, intensity: 0.55, rotation: 0, haze: '#1a2038', horizon: 0.35, ground: '#3a3028', bounce: 0.35, gain: 1.2 }).then(r => {
        if (r && r.sunDir && w._shadow) w._shadow.off.copy(r.sunDir).multiplyScalar(40 * 2.5); // PHOTO.sky leaves the shadow offset at unit length
      });
      SCAPE.horizon(w, { haze: '#141a30', layers: [{ r: 900, h: 70, color: '#1a1a26', seed: 9, flat: 3 }, { r: 1300, h: 110, color: '#22243a', seed: 17 }, { r: 1800, h: 140, color: '#2c3048', seed: 29 }] });

      const M = this.M = {
        plaster: [toned(w, 'patterned_clay_plaster', '#e8e2d6', { triplanar: 0.3, fallback: KIT.plaster(w, [1, 1], '#e6dccb') }), toned(w, 'patterned_clay_plaster', '#d8cdbb', { triplanar: 0.3, fallback: KIT.plaster(w, [1, 1], '#d8cdb8') }),
                  toned(w, 'patterned_clay_plaster', '#e2d4c0', { triplanar: 0.32, fallback: KIT.plaster(w, [1, 1], '#e2d4c0') }), PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.4, color: '#c8c0b4', fallback: KIT.mudBrick(w, [1, 1]) })],
        base: PHOTO.mat(w, 'dark_rock', { triplanar: 0.5, color: '#e0d8d0', fallback: KIT.basalt(w, [1, 1]) }),
        wood: PHOTO.mat(w, 'old_planks_02', { rep: [1, 1.5], color: '#c09870', fallback: KIT.wood(w, [1, 1], '#5a3a22') }),
        door: PHOTO.mat(w, 'old_planks_02', { rep: [0.8, 1.2], color: '#b08868', fallback: KIT.wood(w, [1, 1], '#4a3020') }),
        beam: PHOTO.mat(w, 'medieval_wood', { rep: [0.4, 1], color: '#a88a6a', fallback: KIT.wood(w, [1, 1], '#6a4a30') }),
        lattice: new T.MeshStandardMaterial({ map: KIT.lattice(w, [2, 3]), alphaTest: 0.45, side: T.DoubleSide, color: 0x9a7048, roughness: 0.8 }),
        glowWin: new T.MeshBasicMaterial({ color: 0xffb060 }), darkWin: new T.MeshStandardMaterial({ color: 0x120e0c, roughness: 1 }),
        doorGlow: new T.MeshBasicMaterial({ color: 0xffc078 }),
        roof: PHOTO.mat(w, 'mud_cracked_dry_03', { triplanar: 0.3, color: '#7a6858', fallback: KIT.sand(w, [1, 1]) }),
      };
      if (!PHOTO.enabled) M.base.map = KIT.basalt(w, [1, 1]);

      /* ---------------- the city: houses on every wall cell, facades on the lanes ---------------- */
      const statics = new T.Group(); S.add(statics);
      const G = this.G, r = U.seeded(1908);
      const heightAt = (i, j) => { const n = SCAPE.fbm(Math.floor(i / 2) * 0.55 + 3, Math.floor(j / 2) * 0.55, 2); return n > 0.12 ? 10.6 : n > -0.12 ? 8 : 5.6; };
      this.heights = [];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        if (G[j][i] !== 1) continue;
        const h = heightAt(i, j) + (r() < 0.15 ? 2.6 : 0); this.heights[j * N + i] = h;
        const mat = M.plaster[(Math.floor(i / 3) * 7 + Math.floor(j / 3) * 3) % M.plaster.length];
        box(statics, mat, CS + 0.02, h, CS + 0.02, X(i), h / 2, Z(j));
        box(statics, M.roof, CS - 0.2, 0.08, CS - 0.2, X(i), h + 0.04, Z(j), 0, false);
        box(statics, M.base, CS + 0.08, 0.9, CS + 0.08, X(i), 0.45, Z(j));
        // facades that face a lane
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || G[nj][ni] === 1) continue;
          const fx = X(i) + di * CS / 2, fz = Z(j) + dj * CS / 2, ry = Math.atan2(di, dj), tx = -dj, tz = di;   // tangent along the facade
          // parapet lip along the roof edge
          box(statics, mat, di ? 0.3 : CS, 0.5, dj ? 0.3 : CS, fx - di * 0.15, h + 0.25, fz - dj * 0.15, 0);
          const roll = r();
          if (roll < 0.42 && h > 6) {
            // a roshan: a projecting wooden window box with a lattice front, a hood and a corbel
            const off = (r() - 0.5) * 1.6, rx = fx + tx * off + di * 0.32, rz = fz + tz * off + dj * 0.32, y = 4.6 + (h > 9 ? (r() < 0.5 ? 2.7 : 0) : 0);
            box(statics, M.wood, di ? 0.62 : 1.9, 2.5, dj ? 0.62 : 1.9, rx, y, rz);
            box(statics, M.beam, di ? 0.8 : 2.1, 0.18, dj ? 0.8 : 2.1, rx + di * 0.05, y + 1.34, rz + dj * 0.05);
            box(statics, M.beam, di ? 0.5 : 1.2, 0.35, dj ? 0.5 : 1.2, rx - di * 0.05, y - 1.4, rz - dj * 0.05);
            const lt = new T.Mesh(new T.PlaneGeometry(1.6, 2.1), M.lattice); lt.position.set(rx + di * 0.32, y, rz + dj * 0.32); lt.rotation.y = ry; statics.add(lt);
            const gl = new T.Mesh(new T.PlaneGeometry(1.5, 2.0), r() < 0.55 ? M.glowWin : M.darkWin); gl.position.set(rx + di * 0.27, y, rz + dj * 0.27); gl.rotation.y = ry; statics.add(gl);
          } else if (roll < 0.7) {
            const off = (r() - 0.5) * 2.4, y = h > 6 ? 4.4 : 3.2;
            const gl = new T.Mesh(new T.PlaneGeometry(0.7, 1.0), r() < 0.5 ? M.glowWin : M.darkWin); gl.position.set(fx + tx * off + di * 0.02, y, fz + tz * off + dj * 0.02); gl.rotation.y = ry; statics.add(gl);
            box(statics, M.beam, di ? 0.12 : 0.9, 0.12, dj ? 0.12 : 0.9, fx + tx * off + di * 0.06, y + 0.58, fz + tz * off + dj * 0.06);
          }
          if (r() < 0.3) { const off = (r() - 0.5) * 2.8; box(statics, M.door, di ? 0.1 : 1.1, 2.1, dj ? 0.1 : 1.1, fx + tx * off + di * 0.05, 1.05, fz + tz * off + dj * 0.05); box(statics, M.beam, di ? 0.22 : 1.6, 0.2, dj ? 0.22 : 1.6, fx + tx * off + di * 0.1, 2.2, fz + tz * off + dj * 0.1); }
        }
      }
      // beyond the maze: more of the city, palm gardens and the old city wall
      const city = SCAPE.scatter(w, { kind: 'house', n: 900, area: { x: 0, z: -20, r: 300 }, scale: [7, 13], seed: 21, density: (x, z) => { const ax = Math.abs(x), az = Math.abs(z + 0); return (ax > HALF * CS + 6 || az > HALF * CS + 6) && !(Math.abs(x) < 46 && z < Z(0) - 4 && z > SQUARE_Z - 70) ? 1 : 0; } });
      city.meshes.forEach(m => { m.material = toned(w, 'patterned_clay_plaster', '#d8d0c4', { triplanar: 0.25, fallback: m.material.map }); });
      const palms = SCAPE.scatter(w, { kind: 'palm', n: 420, area: { x: 0, z: 0, r: 640 }, scale: [8, 13], seed: 10, density: (x, z) => { const d = Math.hypot(x, z); return d > 310 && d < 600 ? 1 : 0; } });
      void palms;
      const wallR = 300, wallM = PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.4, color: '#a8a096', fallback: KIT.mudBrick(w, [1, 1]) });
      for (let k = 0; k < 64; k++) {
        const a0 = k / 64 * Math.PI * 2, a1 = (k + 1) / 64 * Math.PI * 2, x0 = Math.cos(a0) * wallR, z0 = Math.sin(a0) * wallR, x1 = Math.cos(a1) * wallR, z1 = Math.sin(a1) * wallR;
        box(statics, wallM, Math.hypot(x1 - x0, z1 - z0) + 0.5, 9, 2.2, (x0 + x1) / 2, w.ground((x0 + x1) / 2, (z0 + z1) / 2) + 3.5, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0));
        if (k % 4 === 0) { const t = new T.Mesh(new T.CylinderGeometry(3.2, 3.6, 13, 12), wallM); t.position.set(x0, w.ground(x0, z0) + 5.5, z0); statics.add(t); }
      }

      /* ---------------- the square and the Prophet's Mosque ---------------- */
      const mq = new T.Group(); statics.add(mq);
      const sq = new T.Mesh(new T.PlaneGeometry(92, 70), PHOTO.mat(w, 'marble_01', { rep: [18, 14], color: '#8a8478', fallback: KIT.plaster(w, [6, 6], '#a8a090') }));
      sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, SQUARE_Z - 10); sq.receiveShadow = true; mq.add(sq);
      // the mosque's long arcaded wall, its gate, the Green Dome and minarets
      const mz = SQUARE_Z - 46, mW = toned(w, 'patterned_clay_plaster', '#ddd2c0', { triplanar: 0.35, fallback: KIT.plaster(w, [1, 1], '#ddd2c0') });
      box(mq, mW, 150, 13, 3, 0, 6.5, mz);
      for (let k = -9; k <= 9; k++) { if (Math.abs(k) < 1) continue; const a = new T.Mesh(new T.PlaneGeometry(4.2, 6.5), M.glowWin); a.position.set(k * 7.5, 4.2, mz + 1.52); mq.add(a); box(mq, mW, 1.2, 9, 0.6, k * 7.5 + 3.75, 4.5, mz + 1.6); }
      box(mq, mW, 14, 17, 4, 0, 8.5, mz + 1.2); const gate = new T.Mesh(new T.PlaneGeometry(6, 9.5), M.doorGlow); gate.position.set(0, 4.75, mz + 3.25); mq.add(gate); this.gateGlow = gate;
      const dome = KIT.greenDome(w, 1.3); dome.position.set(-14, 13, mz - 22); dome.userData.dynamic = true; S.add(dome);
      const drumBase = new T.Mesh(new T.BoxGeometry(24, 13, 24), mW); drumBase.position.set(-14, 6.5, mz - 22); mq.add(drumBase);
      [[-60, mz - 4], [60, mz - 4], [-40, mz - 60], [30, mz - 40]].forEach(([x, z], k) => { const m = KIT.minaret(w, 46 + k * 3, true); m.position.set(x, 0, z); m.userData.dynamic = true; S.add(m); });
      this.domeGlow = KIT.glow(w, 0x9affc8, 40, 0.0); this.domeGlow.position.set(-14, 26, mz - 22); S.add(this.domeGlow);
      this.lamps.forEach(l => { const [di, dj] = l.side; box(statics, M.beam, di ? 0.7 : 0.1, 0.1, dj ? 0.7 : 0.1, l.p.x + di * 0.3, 3.95, l.p.z + dj * 0.3); });
      this.doors.forEach((d, k) => {
        const [di, dj] = d.side, fx = X(d.c[0]) + di * CS / 2, fz = Z(d.c[1]) + dj * CS / 2;
        d.p = new T.Vector3(fx - di * 0.3, 1.2, fz - dj * 0.3);
        const glow = new T.Mesh(new T.PlaneGeometry(1.3, 2.3), M.doorGlow); glow.position.set(fx - di * 0.04, 1.15, fz - dj * 0.04); glow.rotation.y = Math.atan2(-di, -dj); statics.add(glow);
        box(statics, M.beam, di ? 0.25 : 1.8, 0.22, dj ? 0.25 : 1.8, fx - di * 0.1, 2.4, fz - dj * 0.1);
        const leaf = new T.Mesh(new T.BoxGeometry(0.62, 2.2, 0.08), M.door); leaf.geometry.translate(0.31, 0, 0);
        leaf.position.set(fx - di * 0.06 + dj * 0.65, 1.1, fz - dj * 0.06 - di * 0.65); leaf.rotation.y = Math.atan2(-di, -dj) + Math.PI * 0.62;
        if (k === 0) { leaf.userData.dynamic = true; S.add(leaf); } else statics.add(leaf);
        d.leaf = leaf;
      });
      statics.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; } });
      w.bake(statics);

      /* ---------------- lamps, doorways, gates ---------------- */
      // every lamp hangs on a bracket on a wall beside its lane cell; one points cloud shows them all
      SCAPE.scatter(w, { kind: 'model', model: 'vintage_oil_lamp', points: this.lamps.map(l => [l.p.x, l.p.z, 1.6]), ground: () => 2.9, sink: 0, seed: 3, vary: 0.05, fallback: 'pebble', fallbackScale: 0.2 });
      const nl = this.lamps.length + this.doors.length, lp = new Float32Array(nl * 3), lc = new Float32Array(nl * 3);
      const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(lp, 3)); lg.setAttribute('color', new T.BufferAttribute(lc, 3));
      this.glowPts = new T.Points(lg, new T.PointsMaterial({ map: KIT.glowTex(w), size: 5, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
      this.glowPts.frustumCulled = false; S.add(this.glowPts);
      this.lamps.forEach((l, k) => lp.set([l.p.x, l.p.y, l.p.z], k * 3));
      // doorways where oil is shared: an open door, light spilling out
      this.doors.forEach((d, k) => { const [di, dj] = d.side; lp.set([d.p.x - di * 0.8, 1.4, d.p.z - dj * 0.8], (this.lamps.length + k) * 3); });
      // the closed gates between the quarters (wooden doors across the lane)
      this.gates = GATES.map((pair, gi) => pair.map(([i, j]) => {
        const g = new T.Group(); g.position.set(X(i), 0, Z(j)); g.userData.dynamic = true; S.add(g);
        const vertical = G[j - 1] && G[j - 1][i] !== 1;   // a gate on a north–south lane spans east–west
        const l1 = new T.Mesh(new T.BoxGeometry(CS / 2 - 0.1, 3.4, 0.16), M.door); l1.geometry.translate((CS / 2 - 0.1) / 2, 1.7, 0); l1.position.x = -CS / 2 + 0.05;
        const l2 = new T.Mesh(new T.BoxGeometry(CS / 2 - 0.1, 3.4, 0.16), M.door); l2.geometry.translate(-(CS / 2 - 0.1) / 2, 1.7, 0); l2.position.x = CS / 2 - 0.05;
        const arch = new T.Mesh(new T.BoxGeometry(CS + 0.4, 1.2, 0.8), M.plaster[1]); arch.position.y = 4.3;
        g.add(l1, l2, arch); if (!vertical) g.rotation.y = Math.PI / 2;
        return { g, l1, l2, open: 0, i, j, gi };
      }));

      /* ---------------- the lantern you steer ---------------- */
      this.lantern = new T.Group(); this.lantern.userData.dynamic = true; S.add(this.lantern);
      PHOTO.place(w, 'vintage_oil_lamp', { pos: [0, 0, 0], s: 2.2, cast: false }).then(g => { if (!this.lantern) return; w.scene.remove(g); g.position.set(0, -0.35, 0); this.lantern.add(g); });
      this.lHalo = KIT.glow(w, 0xffb060, 7, 0.32); this.lCore = KIT.glow(w, 0xfff0c8, 1.2, 1); this.lantern.add(this.lHalo, this.lCore);
      this.lLight = new T.PointLight(0xffb468, 2.6, 18, 2); this.lLight.position.y = 0.4; this.lantern.add(this.lLight);
      this.lampLights = [0, 1, 2, 3].map(() => { const L = new T.PointLight(0xffb060, 0, 14, 2); S.add(L); return L; });

      /* ---------------- the cats ---------------- */
      const eyeMat = new T.MeshBasicMaterial({ color: 0x9cffb0 });
      const furs = [0xb07a48, 0x6a6460, 0x2a2624, 0xd8c8b0, 0x9a7050, 0x8a8478, 0xc89a68, 0x403a36];
      this.cats.forEach((c, k) => { c.m = catMesh(w, furs[k % furs.length], eyeMat); c.vx = X(c.c[0]); c.vz = Z(c.c[1]); c.face = r() * 6.28; c.wait = 2 + r() * 5; c.m.visible = c.region === 0; });

      /* ---------------- life and sound ---------------- */
      SCAPE.motes(w, { n: 80, area: [-100, 1, -100, 100, 12, 100], color: '#ffe0b0', size: 0.14, additive: true });
      SCAPE.birds(w, { n: 8, x: -10, z: -140, y: 60, r: 50, size: 0.6, speed: 0.06, color: 0x101018 });

      /* ---------------- discoveries ---------------- */
      this.discs = [];
      const Dd = (k, title, text, ar) => { const c = this.discCells[k]; if (!c) return; const it = w.discover({ pos: [X(c[0]), 1.6, Z(c[1])], title, text, ar, r: 2.8 }); this.discs.push(it); };
      Dd(0, 'The roshan', 'The projecting wooden windows of the Hijaz, the roshan, were made of lattice so that air and light could pass while the household stayed out of view. They were made in Jeddah, Makkah and Madinah.', 'الرواشين');
      Dd(1, '“Among those who go round among you”', 'Of cats the Prophet ﷺ said: “They are not impure; they are among those who go round among you.” (Sunan Abi Dawud 75; Jami‘ al-Tirmidhi 92)', 'إنها من الطوّافين عليكم');
      Dd(2, 'The father of the kitten', 'Abu Hurayrah said he was given his name, “father of the kitten”, because he kept a small cat with him as a boy, playing with it by day. (Jami‘ al-Tirmidhi 3840, hasan)', 'أبو هريرة');
      Dd(3, 'The first lamps', 'Tradition says that Tamim al-Dari was the first to light lamps in the Prophet’s Mosque. (Sunan Ibn Majah 760; a weak report)', 'تميم الداري والسُّرُج');
      Dd(4, 'The Green Dome', 'The dome over the Prophet’s grave was rebuilt by the Ottoman sultan Mahmud II and first painted green in 1837. (Wikipedia, “Green Dome”)', 'القبة الخضراء');
      Dd(5, 'Light from the railway', 'In 1908 the Hejaz Railway reached Madinah, and around that time the Prophet’s Mosque was lit by electricity, among the first places in Arabia. (The Times, 1908; Wikipedia, “Al-Masjid an-Nabawi”)', 'سكة حديد الحجاز');
      Dd(6, 'The quarters that were lost', 'Most of these old quarters around the mosque, with their roshan windows, were cleared in the expansions of the twentieth century.', 'الأحياء القديمة');

      /* ---------------- UI: minimap and oil gauge ---------------- */
      this.buildUI(w);
      w.onPointer = (e, p, ph) => self.state === 'play' ? self.swipe(e, ph) : false;
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 360, q: 0.6, gain: 0.025 });
      this.purr = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 140, q: 1, gain: 0 });
      if (this.purr.gain) SND.lfo(b, this.purr.gain.gain, 23, 0.02);
      this.flameN = SND.noise(b, { color: 'brown', type: 'highpass', freq: 1600, q: 0.4, gain: 0.004 });
      this.clocks = { cricket: 1, voice: 4, owl: 12, step: 0 };
      this.post = w.post({ bloom: 0.6, threshold: 0.72, vignette: 0.45, grain: 0.04, sat: 1.0, contrast: 1.06, lift: [0.0, 0.01, 0.03], gain: [1.05, 0.98, 0.92] });
      this.state = 'film'; this.region = 0; this.oil = 100; this.view = 'top';
      this.pl = { i: START[0], j: START[1], x: X(START[0]), z: Z(START[1]), dir: [0, 0], want: [0, -1] };
      this.placeLantern(0);
      this.updGlows();
    },

    /* ======================= the maze ======================= */
    buildMaze() {
      const r = U.seeded(1900), G = [];
      for (let j = 0; j < N; j++) G.push(new Array(N).fill(1));
      const inReg = (j, R) => j >= R.j0 && j <= R.j1;
      REG.forEach(R => {
        // carve a perfect maze over the odd cells of this quarter
        const st = [[1 + 2 * Math.floor(r() * 15), R.j0 + 2 * Math.floor(r() * ((R.j1 - R.j0) / 2 + 1))]];
        G[st[0][1]][st[0][0]] = 0;
        while (st.length) {
          const [i, j] = st[st.length - 1];
          const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([a, b]) => [i + a, j + b, i + a / 2, j + b / 2]).filter(([a, b]) => a > 0 && a < N - 1 && inReg(b, R) && G[b][a] === 1);
          if (!nb.length) { st.pop(); continue; }
          const [a, b, wa, wb] = nb[(r() * nb.length) | 0]; G[wb][wa] = 0; G[b][a] = 0; st.push([a, b]);
        }
        // knock through extra walls: many loops, as in a real town (and in Pac-Man)
        for (let j = R.j0; j <= R.j1; j++) for (let i = 1; i < N - 1; i++) {
          if (G[j][i] !== 1) continue;
          const hz = i % 2 === 0 && j % 2 === 1 && G[j][i - 1] === 0 && G[j][i + 1] === 0, vt = i % 2 === 1 && j % 2 === 0 && G[j - 1] && G[j - 1][i] === 0 && G[j + 1] && G[j + 1][i] === 0;
          if ((hz || vt) && r() < 0.3) G[j][i] = 0;
        }
        // a small square in each quarter
        const ci = 5 + 2 * Math.floor(r() * 10), cj = R.j0 + 2 + 2 * Math.floor(r() * Math.max(1, (R.j1 - R.j0 - 4) / 2));
        for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) if (j >= R.j0 && j <= R.j1) G[j][i] = 0;
      });
      GATES.forEach(pair => pair.forEach(([i, j]) => { G[j][i] = 2; }));   // 2 = a gate (closed until its quarter opens)
      this.G = G;
      const lane = (i, j) => i >= 0 && j >= 0 && i < N && j < N && G[j][i] === 0;
      const deg = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => lane(i + a, j + b) || (G[j + b] && G[j + b][i + a] === 2)).length;
      const wallSide = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => G[j + b] && G[j + b][i + a] === 1);
      this.lamps = []; this.doors = []; this.cats = []; this.discCells = [];
      const taken = new Set([START.join(',')]);
      const far = (c, list, d) => list.every(q => Math.abs(q[0] - c[0]) + Math.abs(q[1] - c[1]) >= d);
      REG.forEach((R, ri) => {
        const cells = []; for (let j = R.j0; j <= R.j1; j++) for (let i = 1; i < N - 1; i++) if (lane(i, j)) cells.push([i, j]);
        // doors at dead ends, spread apart
        const ends = cells.filter(([i, j]) => deg(i, j) === 1 && !taken.has(i + ',' + j)).sort(() => r() - 0.5);
        const dl = [];
        for (const c of ends) if (dl.length < R.doors && far(c, dl, 8)) { dl.push(c); taken.add(c.join(',')); }
        for (const c of cells.sort(() => r() - 0.5)) if (dl.length < R.doors && far(c, dl, 8) && !taken.has(c.join(',')) && wallSide(c[0], c[1]).length) { dl.push(c); taken.add(c.join(',')); }
        dl.forEach(c => this.doors.push({ c, side: wallSide(c[0], c[1])[0], region: ri }));
        // discoveries in other dead ends
        for (const c of ends) if (!taken.has(c.join(',')) && this.discCells.length < (ri + 1) * 2 + (ri === 2 ? 1 : 0) && far(c, this.discCells, 5)) { this.discCells.push(c); taken.add(c.join(',')); }
        for (const c of cells.slice().sort(() => r() - 0.5)) if (!taken.has(c.join(',')) && this.discCells.length < (ri + 1) * 2 + (ri === 2 ? 1 : 0) && far(c, this.discCells, 5) && deg(c[0], c[1]) <= 2) { this.discCells.push(c); taken.add(c.join(',')); }
        // lamps: intersections first, then turns, spread out
        const score = ([i, j]) => deg(i, j) * 10 + r() * 5;
        const cand = cells.filter(c => !taken.has(c.join(',')) && wallSide(c[0], c[1]).length).sort((a, b) => score(b) - score(a));
        const ll = [];
        for (const sp of [4, 3, 2]) for (const c of cand) if (ll.length < R.lamps && !ll.includes(c) && far(c, ll, sp)) ll.push(c);
        ll.forEach(c => { taken.add(c.join(',')); const sides = wallSide(c[0], c[1]), sd = sides[(r() * sides.length) | 0]; this.lamps.push({ c, side: sd, region: ri, lit: false, p: new T.Vector3(X(c[0]) + sd[0] * (CS / 2 - 0.55), 3.4, Z(c[1]) + sd[1] * (CS / 2 - 0.55)) }); });
        // cats: on ordinary lane cells away from the entrance
        const cc = cells.filter(c => !taken.has(c.join(',')) && Math.abs(c[0] - START[0]) + Math.abs(c[1] - START[1]) > 6).sort(() => r() - 0.5);
        const cl = [];
        for (const c of cc) if (cl.length < R.cats && far(c, cl, 6)) cl.push(c);
        cl.forEach(c => this.cats.push({ c: c.slice(), region: ri, still: ri === 0 }));
      });
      // material for the film: a straight run of lane from the start, a doorway and the first cat
      let best = null;
      for (let j = REG[0].j0; j <= REG[0].j1; j++) for (let i = 1; i < N - 1; i++) for (const [a, b] of [[1, 0], [0, -1]]) {
        let n = 0; while (lane(i + a * n, j + b * n) && j + b * n >= REG[0].j0) n++;
        if (n >= 3 && (!best || n > best.n)) best = { i, j, a, b, n };
      }
      best = best || { i: START[0], j: START[1], a: 0, b: -1, n: 2 };
      const at = k => [best.i + best.a * k, best.j + best.b * k];
      this.filmRun = [at(0), at(Math.floor((best.n - 1) / 2)), at(best.n - 1)];
      const d0 = this.doors[0]; this.filmDoor = { c: d0.c, d: d0.side };
      const c0 = this.cats[0].c, nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([a, b]) => lane(c0[0] + a, c0[1] + b)) || [0, 1];
      this.filmCat = c0; this.filmCatFrom = nb;
    },
    open(i, j) {
      if (j < 0) return this.region === 2 && this.lamps.every(l => l.lit) && i >= 13 && i <= 19 && j >= -6;
      if (i < 0 || i >= N || j >= N) return false;
      const g = this.G[j][i];
      if (g === 1) return false;
      if (g === 2) { const gt = this.gates.flat().find(q => q.i === i && q.j === j); return gt && gt.open > 0.6; }
      return true;
    },
    catAt(i, j) { return this.cats.find(c => c.region <= this.region && c.c[0] === i && c.c[1] === j); },

    startPlay() {
      const w = this.w, self = this;
      this.state = 'play'; this.camP = w.camera.position.clone();
      w.mode = dt => self.play(dt);
      this.ui.style.display = 'block';
      const R = REG[0], n = this.lamps.filter(l => l.region === 0).length;
      w.activity(R.name, n, 'Steer through the lanes; pass beneath each lamp to light it');
      w.goal(null);
    },
    play(dt) {
      const w = this.w, env = this.env, k = w.keys, P = this.pl;
      dt = Math.min(dt, 0.05);
      // steering: the wanted direction is remembered until the lantern can turn into it
      if (this.view === 'top' && this.state === 'play') {
        if (k.has('w') || k.has('ArrowUp')) P.want = [0, -1]; else if (k.has('s') || k.has('ArrowDown')) P.want = [0, 1];
        else if (k.has('a') || k.has('ArrowLeft')) P.want = [-1, 0]; else if (k.has('d') || k.has('ArrowRight')) P.want = [1, 0];
      }
      if (this.btnDir) P.want = this.btnDir;
      const R = REG[this.region];
      let speed = this.state === 'guided' ? 4 : 5.6;
      if (this.state === 'play' || this.state === 'guided') {
        if (this.state === 'guided') { this.guideStep(); }
        const cx = X(P.i), cz = Z(P.j), atC = Math.abs(P.x - cx) < 0.05 && Math.abs(P.z - cz) < 0.05;
        // reverse at once; turn at a cell centre
        if (P.want[0] === -P.dir[0] && P.want[1] === -P.dir[1] && (P.dir[0] || P.dir[1])) P.dir = P.want.slice();
        if (atC) {
          P.x = cx; P.z = cz;
          if ((P.want[0] !== P.dir[0] || P.want[1] !== P.dir[1]) && this.passable(P.i + P.want[0], P.j + P.want[1])) P.dir = P.want.slice();
          if (!this.passable(P.i + P.dir[0], P.j + P.dir[1])) {
            const c = this.catAt(P.i + P.dir[0], P.j + P.dir[1]);
            if (c && (P.dir[0] || P.dir[1])) { c.purr = 2.4; c.look = 1; if (!this.toldCat) { this.toldCat = true; w.say('A cat in the lane', 'It will not move just yet. Go round by another lane.', { ms: 5000 }); } SND.sing(env.bus, 330, { vowel: 'u', dur: 0.3, gain: 0.01 }); }
            if (P.dir[0] || P.dir[1]) SND.knock(env.bus, { f: 220, gain: 0.03, click: 2400 });
            P.dir = [0, 0];
          }
        }
        // move toward the next cell centre
        if (P.dir[0] || P.dir[1]) {
          let step = speed * dt;
          while (step > 0) {
            const tx = X(P.i + P.dir[0]), tz = Z(P.j + P.dir[1]);
            const dx = P.dir[0] ? (tx - P.x) * P.dir[0] : 0, dz = P.dir[1] ? (tz - P.z) * P.dir[1] : 0;
            const d = P.dir[0] ? dx : dz;
            // the lantern is between centres: are we past the midpoint into the next cell?
            if (d <= step) {
              P.x = tx; P.z = tz; P.i += P.dir[0]; P.j += P.dir[1]; step -= d;
              this.enterCell(P.i, P.j);
              if ((P.want[0] !== P.dir[0] || P.want[1] !== P.dir[1]) && this.passable(P.i + P.want[0], P.j + P.want[1]) && !(P.want[0] === -P.dir[0] && P.want[1] === -P.dir[1])) P.dir = P.want.slice();
              if (!this.passable(P.i + P.dir[0], P.j + P.dir[1])) { step = 0; break; }
              if (this.state === 'guided') { this.guideStep(); }
            } else { P.x += P.dir[0] * step; P.z += P.dir[1] * step; step = 0; }
          }
        }
        // oil burns faster while moving
        const moving = !!(P.dir[0] || P.dir[1]);
        if (this.state === 'play') {
          this.oil = Math.max(0, this.oil - dt * (moving ? R.drain : 0.35));
          if (this.oil <= 0) this.startGuide();
        }
        // a doorway refills the lamp
        const door = this.doors.find(d => d.region <= this.region && d.c[0] === P.i && d.c[1] === P.j && Math.hypot(P.x - X(P.i), P.z - Z(P.j)) < 2.5);
        if (door && this.oil < 100) {
          this.oil = Math.min(100, this.oil + dt * 45); door.pulse = 1;
          this.clocks.step -= dt; if (this.clocks.step < 0) { this.clocks.step = 0.18; SND.drop(env.bus, { f: 500 + this.oil * 6, gain: 0.03 }); }
          if (this.state === 'guided' && this.oil >= 70) { this.state = 'play'; w.say('Oil again', 'The door was open, and the lamp is filled. On you go.', { ms: 4000 }); }
          if (this.oil >= 100) SND.sing(env.bus, 523.25, { vowel: 'a', dur: 0.8, gain: 0.02 });
        }
      }
      if (this.state === 'square') this.squareTick(dt);
      this.placeLantern(dt);
      this.camTick(dt);
    },
    passable(i, j) { return this.open(i, j) && !this.catAt(i, j) && this.regionOk(j); },
    regionOk(j) { return j >= REG[this.region].j0 - 1 || j < 0 || this.region >= 2; },
    enterCell(i, j) {
      const w = this.w, env = this.env;
      // lamps in this cell light as the lantern passes
      for (const l of this.lamps) if (!l.lit && l.c[0] === i && l.c[1] === j && l.region <= this.region) this.lightLamp(l);
      for (const it of this.discs) if (!it.done && Math.hypot(it.pos.x - X(i), it.pos.z - Z(j)) < 1) { it.done = true; it.onUse(w, it); }
      if (j < 0 && this.region === 2 && !this.inSquare) this.enterSquare();
      if (Math.random() < 0.6) SND.step(env.bus, { gain: 0.012, f: U.rnd(800, 1200) });
    },
    lightLamp(l) {
      const w = this.w, env = this.env;
      l.lit = true; l.flare = 1; this.oil = Math.max(0, this.oil - 2);
      const mine = this.lamps.filter(q => q.region === this.region), n = mine.filter(q => q.lit).length;
      const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
      SND.sing(env.bus, scale[n % 8] * (this.region === 1 ? 0.75 : this.region === 2 ? 1.122 : 1), { vowel: 'a', dur: 1.2, gain: 0.03, voices: 2, attack: 0.05 });
      SND.bell(env.bus, scale[(n + 2) % 8] * 2, { gain: 0.012, glass: true });
      w.progress(n);
      this.updGlows();
      if (n === mine.length) this.openNext();
    },
    openNext() {
      const w = this.w, env = this.env, ri = this.region;
      SND.glow(env.bus, [130.81, 146.83, 98][ri], { gain: 0.06, dur: 8 }); SND.sing(env.bus, [261.63, 293.66, 196][ri], { vowel: 'a', dur: 4, gain: 0.05, voices: 5, attack: 0.4, delay: 0.3 });
      this.gates[ri].forEach(g => { g.opening = true; });
      if (ri < 2) {
        this.region = ri + 1;
        this.cats.forEach(c => { if (c.region === this.region) c.m.visible = true; });
        const R = REG[this.region], n = this.lamps.filter(l => l.region === this.region).length;
        setTimeout(() => {
          if (!this.w) return;
          w.activity(R.name, n, ri === 0 ? 'The gates to the market lanes are open · more cats, and oil burns faster' : 'The last quarter · few doorways, so plan your oil');
          w.say(ri === 0 ? 'The south quarter is lit' : 'The market lanes are lit', ri === 0 ? 'Two gates swing open to the north. In the market lanes the cats wander from lane to lane.' : 'The gates of the last quarter open. Beyond it lies the square before the Prophet’s Mosque.', { ms: 7000 });
          const gt = this.gates[ri][0]; w.goal([X(gt.i), 2, Z(gt.j)]); this.goalT = 8;
        }, 1200);
      } else {
        w.step('Every lamp is lit · go out through the north gate to the square');
        w.goal([0, 2, SQUARE_Z]); this.goalT = 1e9;
        this.oil = 100;
      }
    },
    enterSquare() {
      const w = this.w, env = this.env;
      this.inSquare = true; this.state = 'square'; this.sqT = 0; this.camP0 = w.camera.position.clone();
      w.goal(null); this.ui.style.display = 'none';
      SND.glow(env.bus, 98, { gain: 0.07, dur: 12 }); SND.sing(env.bus, 196, { vowel: 'a', dur: 7, gain: 0.05, voices: 6, attack: 1.2 });
      SND.sing(env.bus, 293.66, { vowel: 'a', dur: 6, gain: 0.04, voices: 4, attack: 1.5, delay: 1.5 });
    },
    squareTick(dt) {
      const w = this.w, P = this.pl; this.sqT += dt;
      // the lantern drifts into the square; the camera rises to show every lit lane behind it
      P.z = U.damp(P.z, SQUARE_Z - 8, 0.6, dt); P.x = U.damp(P.x, 0, 0.6, dt);
      this.domeGlow.material.opacity = U.smooth(1, 6, this.sqT) * 0.35;
      this.gateGlow.material.color.setRGB(1, 0.8 + 0.1 * Math.sin(this.sqT * 2), 0.5);
      if (this.sqT > 2 && !this.saidSq) { this.saidSq = true; w.say('The square', 'Every lamp of the lanes is lit, and the lane opens onto the square before the Prophet’s Mosque, where the Green Dome stands.', { ms: 9000 }); }
      if (this.sqT > 10 && !this.finished) { this.finished = true; w.finish('The lamps of the lanes are lit'); }
    },
    startGuide() {
      const w = this.w, env = this.env;
      this.state = 'guided';
      // the nearest open doorway by the lanes
      const P = this.pl, prev = new Map(), q = [[P.i, P.j]]; prev.set(P.i + ',' + P.j, null); let goal = null;
      while (q.length && !goal) {
        const [i, j] = q.shift();
        if (this.doors.some(d => d.region <= this.region && d.c[0] === i && d.c[1] === j)) { goal = [i, j]; break; }
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nj = j + b, kk = ni + ',' + nj; if (prev.has(kk) || !this.open(ni, nj) || !this.regionOk(nj)) continue; prev.set(kk, [i, j]); q.push([ni, nj]); }
      }
      const path = []; let c = goal; while (c) { path.unshift(c); c = prev.get(c[0] + ',' + c[1]); }
      this.guide = path.slice(1);
      SND.swell(env.bus, { f0: 400, f1: 150, dur: 1.5, gain: 0.035 }); SND.sing(env.bus, 146.83, { vowel: 'o', dur: 2, gain: 0.035 });
      w.say('The oil is spent', 'The flame shrinks to an ember, and the lantern is carried gently back to the nearest open door. The lamps you lit stay lit.', { ms: 6500 });
    },
    guideStep() {
      const P = this.pl; if (!this.guide || !this.guide.length) { P.want = [0, 0]; return; }
      while (this.guide.length && this.guide[0][0] === P.i && this.guide[0][1] === P.j) this.guide.shift();
      if (!this.guide.length) return;
      const [i, j] = this.guide[0]; P.want = [Math.sign(i - P.i), Math.sign(j - P.j)];
      if (this.catAt(i, j)) { const c = this.catAt(i, j); c.wait = 0; }
      if (!(P.dir[0] || P.dir[1])) P.dir = P.want.slice();
    },
    placeLantern(dt) {
      const P = this.pl, t = this.w ? this.w.time : 0, o = this.oil / 100;
      this.lantern.position.set(P.x, 1.5 + Math.sin(t * 2.2) * 0.07, P.z);
      this.lantern.rotation.z = (P.dir[0] || 0) * -0.12; this.lantern.rotation.x = (P.dir[1] || 0) * 0.12;
      const fl = 1 + Math.sin(t * 21) * 0.05 + (o < 0.25 ? Math.sin(t * 9) * 0.15 : 0);
      this.lLight.intensity = (0.5 + 1.6 * Math.sqrt(o)) * fl; this.lLight.distance = 7 + 9 * o;
      this.lHalo.scale.setScalar((1.6 + 2.6 * o) * fl); this.lHalo.material.opacity = (this.view === 'lane' ? 0.08 : 0.16) + 0.12 * o;
      this.lCore.scale.setScalar((0.5 + 0.8 * o) * fl);
    },
    camTick(dt) {
      const w = this.w, P = this.pl;
      let want;
      if (this.state === 'square') {
        const k = U.ease(U.clamp(this.sqT / 9));
        want = new T.Vector3(U.lerp(P.x, 30, k), U.lerp(36, 70, k), U.lerp(P.z + 7.6, Z(6), k));
        this.camP.lerp(want, 1 - Math.exp(-dt * 2));
        w.camera.position.copy(this.camP); w.camera.lookAt(U.lerp(P.x, -10, k), 0, U.lerp(P.z, SQUARE_Z - 30, k));
      } else if (this.view === 'top') {
        want = new T.Vector3(P.x, 50, P.z + 9.5);
        this.camP.lerp(want, 1 - Math.exp(-dt * 5));
        w.camera.position.copy(this.camP); w.camera.lookAt(this.camP.x, 0, this.camP.z - 9.5);
      } else {
        const d = (this.pl.dir[0] || this.pl.dir[1]) ? this.pl.dir : (this.lastDir || [0, -1]); this.lastDir = d;
        this.yawC = this.yawC == null ? Math.atan2(-d[0], -d[1]) : this.yawC;
        let target = Math.atan2(-d[0], -d[1]), diff = target - this.yawC; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); this.yawC += diff * (1 - Math.exp(-dt * 4));
        want = new T.Vector3(P.x + Math.sin(this.yawC) * 6.5, 6.2, P.z + Math.cos(this.yawC) * 6.5);
        this.camP.lerp(want, 1 - Math.exp(-dt * 5));
        w.camera.position.copy(this.camP); w.camera.lookAt(P.x - Math.sin(this.yawC) * 4, 1.2, P.z - Math.cos(this.yawC) * 4);
      }
      if (w._shadow) { const L = w._shadow.light, px = Math.round(P.x / 3) * 3, pz = Math.round(P.z / 3) * 3; L.target.position.set(px, 0, pz); L.position.set(px + w._shadow.off.x, w._shadow.off.y, pz + w._shadow.off.z); }
      w.pos.set(P.x, 0, P.z);
    },
    updGlows() {
      const c = this.glowPts.geometry.attributes.color;
      this.lamps.forEach((l, k) => {
        const open = l.region <= this.region;
        if (l.lit) c.setXYZ(k, 1.0 * (1 + (l.flare || 0)), 0.62, 0.26);
        else c.setXYZ(k, open ? 0.16 : 0.05, open ? 0.2 : 0.06, open ? 0.3 : 0.08);
      });
      this.doors.forEach((d, k) => { const on = d.region <= this.region; const p = on ? 0.5 + (d.pulse || 0) * 0.5 : 0.08; c.setXYZ(this.lamps.length + k, p, p * 0.7, p * 0.35); });
      c.needsUpdate = true;
    },

    /* ---------------- UI ---------------- */
    buildUI(w) {
      const self = this, ui = document.createElement('div'); ui.className = 'lanes-ui';
      ui.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
      const map = document.createElement('canvas'); map.width = map.height = 198; map.className = 'lanes-map';
      map.style.cssText = 'position:absolute;right:16px;bottom:96px;width:150px;height:150px;border-radius:10px;border:1px solid rgba(246,220,154,.4);background:rgba(6,9,20,.55);';
      const oil = document.createElement('div'); oil.className = 'lanes-oil';
      oil.style.cssText = 'position:absolute;right:16px;bottom:256px;width:150px;color:#f2e2c0;font:600 10px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;';
      oil.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>Lamp oil</span><span class="lanes-oilpct"></span></div><div style="height:10px;border-radius:6px;border:1px solid rgba(246,220,154,.5);background:rgba(10,12,22,.5);overflow:hidden"><i class="lanes-oilbar" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#b8742a,#ffd27a);border-radius:6px"></i></div>';
      ui.appendChild(map); ui.appendChild(oil);
      const touch = matchMedia('(pointer: coarse)').matches;
      const mk = (txt, css, d, label) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.className = 'lanes-btn';
        b.style.cssText = 'position:absolute;pointer-events:auto;width:54px;height:54px;border-radius:14px;border:1px solid rgba(246,220,154,.5);background:rgba(10,12,22,.42);color:#f6e6c0;font:600 20px/1 system-ui,sans-serif;touch-action:none;' + css + (touch || !d ? '' : 'display:none;');
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); SND.init(); if (d) { self.btnDir = d; self.pl.want = d; } else self.toggleView(); });
        const up = e => { e && e.stopPropagation(); if (d) self.btnDir = null; };
        b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
        ui.appendChild(b); return b;
      };
      mk('▲', 'left:76px;bottom:222px;', [0, -1], 'North'); mk('▼', 'left:76px;bottom:110px;', [0, 1], 'South');
      mk('◀', 'left:18px;bottom:166px;', [-1, 0], 'West'); mk('▶', 'left:134px;bottom:166px;', [1, 0], 'East');
      mk('👁', 'right:16px;bottom:296px;width:44px;height:44px;font-size:16px;border-radius:50%;', null, 'Change the view');
      w.ui.layer.appendChild(ui); this.ui = ui; this.mapC = map; this.oilBar = oil.querySelector('.lanes-oilbar'); this.oilPct = oil.querySelector('.lanes-oilpct');
      // the base map, drawn once
      const base = document.createElement('canvas'); base.width = base.height = N * 6; const g = base.getContext('2d');
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = this.G[j][i]; g.fillStyle = v === 1 ? '#2a2620' : v === 2 ? '#7a5a38' : '#8a8070'; g.fillRect(i * 6, j * 6, 6, 6); }
      this.mapBase = base;
    },
    drawMap() {
      const c = this.mapC, g = c.getContext('2d'), s = 6;
      g.clearRect(0, 0, c.width, c.height);
      g.drawImage(this.mapBase, 0, 0);
      // quarters not yet open lie in shadow
      REG.forEach((R, ri) => { if (ri > this.region) { g.fillStyle = 'rgba(6,9,20,.7)'; g.fillRect(0, (R.j0 - 1) * s, c.width, (R.j1 - R.j0 + 3) * s); } });
      this.gates.flat().forEach(gt => { g.fillStyle = gt.open > 0.6 ? '#8a8070' : '#c08040'; g.fillRect(gt.i * s, gt.j * s, s, s); });
      this.doors.forEach(d => { if (d.region > this.region) return; g.fillStyle = '#9ad8ff'; g.fillRect(d.c[0] * s + 1, d.c[1] * s + 1, s - 2, s - 2); });
      this.lamps.forEach(l => { if (l.region > this.region) return; g.fillStyle = l.lit ? '#ffcf70' : '#d8dce8'; g.beginPath(); g.arc(l.c[0] * s + 3, l.c[1] * s + 3, l.lit ? 2.4 : 1.6, 0, 6.28); g.fill(); });
      this.cats.forEach(cat => { if (cat.region > this.region) return; g.fillStyle = '#e88a4a'; g.fillRect(cat.vx / CS * s + HALF * s + 1.5, cat.vz / CS * s + HALF * s + 1.5, 3, 3); });
      const px = this.pl.x / CS * s + HALF * s + 3, pz = this.pl.z / CS * s + HALF * s + 3;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px, pz, 3, 0, 6.28); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(px, pz, 5 + Math.sin(this.w.time * 4) * 1, 0, 6.28); g.stroke();
    },
    toggleView() { this.view = this.view === 'top' ? 'lane' : 'top'; this.yawC = null; SND.swell(this.env.bus, { f0: 300, f1: 500, dur: 0.5, gain: 0.02 }); },
    swipe(e, ph) {
      if (ph === 'down') { this.sw = { x: e.clientX, y: e.clientY }; return true; }
      if (ph === 'up' && this.sw) {
        let dx = e.clientX - this.sw.x, dy = e.clientY - this.sw.y; this.sw = null;
        if (Math.hypot(dx, dy) < 24) return true;
        let d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
        if (this.view === 'lane') { // swipes are relative to the lantern's heading
          const f = this.lastDir || [0, -1], rgt = [-f[1], f[0]];
          d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? rgt : [-rgt[0], -rgt[1]]) : (dy < 0 ? f : [-f[0], -f[1]]);
        }
        this.pl.want = d;
      }
      return true;
    },
    onKey(env, e) {
      if (!this.w || this.w.filmS) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'v' || k === 'c' || k === 'Tab') { e.preventDefault && e.preventDefault(); this.toggleView(); }
      if (this.view === 'lane' && this.state === 'play') {
        const f = this.lastDir || [0, -1], rgt = [-f[1], f[0]];
        const m = { w: f, ArrowUp: f, s: [-f[0], -f[1]], ArrowDown: [-f[0], -f[1]], a: [-rgt[0], -rgt[1]], ArrowLeft: [-rgt[0], -rgt[1]], d: rgt, ArrowRight: rgt }[k];
        if (m && !e.repeat) { this.pl.want = m; this.laneKey = true; }
      }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      // in the lane view the arrow keys turn relative to the heading, so the held-key steering is set in onKey instead
      w.update(dt);
      const t = w.time;
      if (this.state === 'film') this.placeLantern(dt);
      // the film's open door
      if (this.filmDoorOpen != null && this.doors[0]) { const d = this.doors[0]; d.leaf.rotation.y = Math.atan2(-d.side[0], -d.side[1]) + Math.PI * (0.05 + 0.57 * this.filmDoorOpen); }
      // gates swing open
      this.gates.flat().forEach(g => { if (g.opening && g.open < 1) { g.open = Math.min(1, g.open + dt * 0.5); g.l1.rotation.y = -g.open * 1.7; g.l2.rotation.y = g.open * 1.7; if (g.open > 0.6 && !g.creaked) { g.creaked = true; SND.knock(env.bus, { f: 140, gain: 0.08, click: 700 }); } } });
      // the cats: sit, purr, now and then pad on to a neighbouring lane
      for (const c of this.cats) {
        if (!c.m.visible) continue;
        const tx = X(c.c[0]), tz = Z(c.c[1]);
        c.vx = U.damp(c.vx, tx, 2.5, dt); c.vz = U.damp(c.vz, tz, 2.5, dt);
        c.m.position.set(c.vx, 0, c.vz);
        const moving = Math.hypot(tx - c.vx, tz - c.vz) > 0.2;
        c.m.rotation.y = U.damp(c.m.rotation.y, c.face, 4, dt);
        c.m.children[0].scale.y = 1 + Math.sin(t * 2 + c.c[0]) * 0.02; c.m.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.04 : 0;
        if (this.state === 'film' || c.still || this.state === 'square') continue;
        c.wait -= dt;
        if (c.wait < 0 && !moving) {
          c.wait = 5 + Math.random() * 5;
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [c.c[0] + a, c.c[1] + b]).filter(([i, j]) => this.G[j] && this.G[j][i] === 0 && j >= REG[c.region].j0 && j <= REG[c.region].j1 && !this.catAt(i, j) && !(i === this.pl.i && j === this.pl.j) && !this.doors.some(d => d.c[0] === i && d.c[1] === j));
          if (opts.length) { const n = opts[(Math.random() * opts.length) | 0]; c.face = Math.atan2(n[0] - c.c[0], n[1] - c.c[1]); c.c = n; }
        }
      }
      // purring rises near a cat
      let near = 99; for (const c of this.cats) if (c.m.visible) near = Math.min(near, Math.hypot(c.vx - this.pl.x, c.vz - this.pl.z));
      this.purr.set('gain', U.clamp(1 - near / 8) * 0.05 + (this.purrBoost || 0) * 0.05, 0.3);
      // lamps flare as they light; doors pulse; the nearest lamps cast real light
      let dirty = false;
      this.lamps.forEach(l => { if (l.flare > 0) { l.flare = Math.max(0, l.flare - dt * 1.2); dirty = true; } });
      this.doors.forEach(d => { if (d.pulse > 0) { d.pulse = Math.max(0, d.pulse - dt * 1.5); dirty = true; } });
      if (dirty || Math.floor(t * 2) !== this.lastGlowT) { this.lastGlowT = Math.floor(t * 2); this.updGlows(); }
      this.glowPts.material.size = this.view === 'top' && this.state !== 'film' ? 7 : 4.5;
      this.lightT = (this.lightT || 0) - dt;
      if (this.lightT < 0) {
        this.lightT = 0.3;
        const lit = this.lamps.filter(l => l.lit).sort((a, b) => Math.hypot(a.p.x - this.pl.x, a.p.z - this.pl.z) - Math.hypot(b.p.x - this.pl.x, b.p.z - this.pl.z));
        this.lampLights.forEach((L, i) => { const l = lit[i]; if (l) { L.position.set(l.p.x, l.p.y + 0.3, l.p.z); L.intensity = 1.6; } else L.intensity = 0; });
      }
      // UI
      if (this.ui && this.ui.style.display !== 'none') {
        this.mapT = (this.mapT || 0) - dt; if (this.mapT < 0) { this.mapT = 0.1; this.drawMap(); }
        this.oilBar.style.width = `${this.oil.toFixed(1)}%`; this.oilPct.textContent = `${Math.round(this.oil)}%`;
        this.oilBar.style.background = this.oil < 25 ? 'linear-gradient(90deg,#8a3a1a,#d87a3a)' : 'linear-gradient(90deg,#b8742a,#ffd27a)';
      }
      if (this.goalT) { this.goalT -= dt; if (this.goalT < 0) { this.goalT = 0; w.goal(null); } }
      // the night: crickets, a distant owl, murmurs behind the doors
      const C = this.clocks;
      C.cricket -= dt; if (C.cricket < 0) { C.cricket = 0.5 + Math.random() * 2; SND.cricket && SND.cricket(env.bus, { gain: 0.01, pan: U.rnd(-0.9, 0.9) }); }
      C.owl -= dt; if (C.owl < 0) { C.owl = 14 + Math.random() * 14; SND.coo && SND.coo(env.bus, { gain: 0.012, pan: U.rnd(-1, 1) }); }
      C.voice -= dt; if (C.voice < 0) { C.voice = 3 + Math.random() * 5; SND.sing(env.bus, U.rnd(120, 190), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.3, 0.8), gain: 0.008, pan: U.rnd(-0.8, 0.8), breath: 0.4, attack: 0.06 }); }
      this.flameN.set('gain', 0.002 + 0.006 * this.oil / 100, 0.2);
    },
    onLeave() { this.ui = null; this.lantern = null; this.state = 'film'; this.finished = false; this.inSquare = false; this.saidSq = false; },
  }));
})();
