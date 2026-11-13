/* Makkah — The Cave of Hira, 610 CE. A first-person parkour climb (after Mirror's Edge, with
   Celeste's lantern checkpoints) up the ridge of Jabal an-Nur by night: run, jump, pull yourself
   up ledges, light the lanterns that hold your place, gather provisions on the side ledges, and
   reach the cleft near the summit where the first five verses of Surat al-'Alaq are written in
   light over the valley. No person is shown: you are a light climbing the mountain. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- the route: shelves (lantern checkpoints) joined by sections of ledges ---------------- */
  const NODES = [
    { x: 0, z: 205, y: 3, r: 30 },     // 0 the wadi at the foot
    { x: 8, z: 124, y: 8, r: 8 },      // 1
    { x: -6, z: 68, y: 12, r: 9 },     // 2
    { x: 4, z: 14, y: 30, r: 8 },      // 3
    { x: -4, z: -40, y: 38.5, r: 9 },  // 4
    { x: 10, z: -94, y: 47, r: 8 },    // 5
    { x: 0, z: -146, y: 55, r: 12 },   // 6 the summit shelf
  ];
  const CAVE = { x: -1.5, z: -159 };
  // per section: platform count, radius, step heights (scaled to fit), kind
  const SECTIONS = [
    { n: 8, r: [1.8, 2.3], dy: [0.6, 0.6, 0.7, 0.6, 0.7, 0.6, 0.6, 0.6, 0.6], zig: 2.2, name: 'Part 1 of 3 · The foot of the mountain', step: 'Jump from stone to stone — light the lantern ahead' },
    { n: 6, r: [1.6, 1.8], dy: [0.5, 0.4, 0.6, 0.5, 0.6, 0.6, 0.8], zig: 2.6, name: 'Part 1 of 3 · The foot of the mountain', step: 'Wider gaps: hold Shift to run before you jump', side: 3 },
    { n: 9, r: [1.45, 1.6], dy: [1.65, 1.6, 1.7, 1.6, 1.7, 1.6, 1.7, 1.65, 1.6, 1.65], zig: 1.6, name: 'Part 2 of 3 · The boulder slope', step: 'Jump at a high ledge and keep pressing forward to pull yourself up' },
    { n: 7, r: [1.4, 1.6], dy: [0.4, 1.6, 0.3, 1.7, 0.4, 1.8, 0.3, 1.5], zig: 2.8, name: 'Part 2 of 3 · The boulder slope', step: 'Run, jump and climb', side: 4 },
    { n: 8, r: [1.35, 1.5], dy: [0.5, 1.5, 0.5, 1.5, 0.5, 1.5, 0.5, 1.5, 0.5], zig: 2.0, crumble: true, name: 'Part 3 of 3 · The cliff path', step: 'Loose stones slip away — do not linger on them' },
    { n: 6, box: true, len: 3.6, wid: 1.4, dy: [0.6, 1.5, 0.6, 1.5, 0.6, 1.5, 1.2], zig: 1.4, gust: true, name: 'Part 3 of 3 · The cliff path', step: 'The wind gusts from the east — lean into it', side: 3 },
  ];
  const VERSES = [
    ['اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', 'Read, in the name of your Lord who created,'],
    ['خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ', 'created man from a clinging clot.'],
    ['اقْرَأْ وَرَبُّكَ الْأَكْرَمُ', 'Read, and your Lord is the Most Generous,'],
    ['الَّذِي عَلَّمَ بِالْقَلَمِ', 'who taught by the pen,'],
    ['عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ', 'taught man what he did not know.'],
  ];
  const CITY = { x: -520, z: 760 };
  const LANE = { x: -455, z: 655, a: Math.atan2(205 - 655, 0 + 455) };  // the lane runs from the city toward the mountain

  /* ---------------- geometry of the route ---------------- */
  const segs = [];
  for (let i = 0; i < NODES.length - 1; i++) { const a = NODES[i], b = NODES[i + 1]; segs.push({ a, b, dx: b.x - a.x, dz: b.z - a.z, len: Math.hypot(b.x - a.x, b.z - a.z) }); }
  segs.push({ a: NODES[6], b: { x: CAVE.x, z: CAVE.z - 2, y: 55, r: 4 }, dx: CAVE.x - NODES[6].x, dz: CAVE.z - 2 - NODES[6].z, len: Math.hypot(CAVE.x - NODES[6].x, CAVE.z - 2 - NODES[6].z) });
  // nearest point on the route: distance, route height there, section index
  function nearest(x, z) {
    let best = 1e9, by = 0, bi = 0, bt = 0;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      let t = ((x - s.a.x) * s.dx + (z - s.a.z) * s.dz) / (s.len * s.len); t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = s.a.x + s.dx * t, pz = s.a.z + s.dz * t, d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; by = s.a.y + (s.b.y - s.a.y) * t; bi = i; bt = t; }
    }
    return { d: best, y: by, i: bi, t: bt };
  }
  function massif(x, z) {
    const d = Math.hypot(x + 60, (z + 235) * 0.9);
    let y = 98 * Math.exp(-Math.pow(d / 175, 1.5));
    y *= 0.8 + 0.4 * (SCAPE.ridge(x * 0.012 + 3, z * 0.012, 4));
    // the other mountains of Makkah, all round
    const P = [[-330, -120, 120, 150], [260, -330, 150, 190], [330, 140, 95, 120], [-960, 300, 170, 260], [-240, 1180, 140, 260], [-1050, 1000, 130, 230], [180, 760, 110, 170], [-760, -320, 150, 230], [620, -60, 130, 200], [-80, -620, 160, 240]];
    for (const [px, pz, h, wd] of P) { const dd = Math.hypot(x - px, z - pz); if (dd < wd * 3) y += h * Math.exp(-Math.pow(dd / wd, 1.4)) * (0.7 + 0.6 * SCAPE.ridge(x * 0.008 + px * 0.01, z * 0.008, 4)); }
    // the valley of the city is a broad sandy floor
    const dc = Math.hypot((x - CITY.x) * 0.8, z - CITY.z);
    y *= 0.15 + 0.85 * U.smooth(180, 420, dc);
    y += SCAPE.fbm(x * 0.02, z * 0.02, 3) * 2.5 + SCAPE.fbm(x * 0.09, z * 0.09, 2) * 0.5;
    return y;
  }
  function height(x, z) {
    const m = massif(x, z);
    // the wadi south of the foot is a broad gravel floor
    const dw = Math.hypot(x * 0.8, z - 230);
    let outer = dw < 190 ? U.lerp(Math.min(m, 6) * 0.5 + 2 + SCAPE.fbm(x * 0.04, z * 0.04, 2) * 1.2, m, U.smooth(50, 180, dw)) : m;
    if (Math.abs(x) > 150 || z > 300 || z < -270) return outer;
    const nr = nearest(x, z);
    let ws = 0, ny = nr.y;
    for (const n of NODES) { const dn = Math.hypot(x - n.x, z - n.z); const k = 1 - U.smooth(n.r - 0.5, n.r + 4.5, dn); if (k > ws) { ws = k; ny = n.y; } }
    const cdn = Math.hypot(x - CAVE.x, z - CAVE.z); const kc = 1 - U.smooth(3, 7, cdn); if (kc > ws) { ws = kc; ny = 55.6; }
    const flat = ny + SCAPE.fbm(x * 0.15, z * 0.15, 2) * 0.35;
    const deep = nr.y - 15 + SCAPE.fbm(x * 0.08, z * 0.08, 2) * 3;
    const inner = U.lerp(deep, flat, ws);
    // a ridge spine: shoulders of broken rock along the route, falling away to the mountain's flanks
    const shoulder = nr.y - 4 + SCAPE.ridge(x * 0.05, z * 0.05, 3) * 6;
    const k1 = U.smooth(8.5, 13, nr.d) * (1 - ws), k2 = U.smooth(14, 50, nr.d);
    let y = U.lerp(inner, shoulder, k1);
    y = U.lerp(y, Math.min(outer, shoulder + 4) * 0.6 + outer * 0.4, k2);
    // at the foot the route comes down to the wadi floor
    const footK = U.smooth(150, 185, z);
    if (footK > 0 && nr.i === 0) y = U.lerp(y, U.lerp(flat, outer, U.smooth(30, 60, Math.hypot(x, z - 205))), footK);
    // the summit: the peak rises behind the cave
    const dp = Math.hypot(x + 18, z + 205);
    y = Math.max(y, 97 * Math.exp(-Math.pow(dp / 45, 1.6)) * U.smooth(4, 12, cdn) + SCAPE.ridge(x * 0.06, z * 0.06, 3) * 6 * U.smooth(10, 30, cdn) * U.smooth(60, 0, dp));
    return y;
  }

  /* ---------------- platforms ---------------- */
  function buildPlatforms() {
    const P = [], r = U.seeded(610);
    SECTIONS.forEach((S, si) => {
      const A = NODES[si], B = NODES[si + 1];
      const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, px = -uz, pz = ux;
      const start = A.r - 1.2, end = L - B.r + 1.2, avail = end - start;
      const sizes = [];
      for (let i = 0; i < S.n; i++) sizes.push(S.box ? S.len / 2 : U.lerp(S.r[0], S.r[1], r()));
      const gap = (avail - sizes.reduce((a, b) => a + b * 2, 0)) / (S.n + 1);
      const total = S.dy.reduce((a, b) => a + b, 0), kH = (B.y - A.y) / total;
      let along = start + gap, y = A.y;
      for (let i = 0; i < S.n; i++) {
        const s = sizes[i]; along += s;
        y += S.dy[i] * kH;
        const lat = (i % 2 ? 1 : -1) * S.zig * (0.6 + 0.4 * r());
        const x = A.x + ux * along + px * lat, z = A.z + uz * along + pz * lat;
        if (S.box) {
          const rot = Math.atan2(uz, ux) + (r() - 0.5) * 0.25;
          P.push({ t: 'b', x, z, hx: S.len / 2, hz: S.wid / 2, rot, c: Math.cos(rot), s: Math.sin(rot), top: y, sec: si, on: true });
        } else P.push({ t: 'c', x, z, r: s, top: y, sec: si, on: true, crumble: S.crumble && i % 2 === 1 });
        along += s + gap;
      }
      // a side ledge holding provisions, off the main line
      if (S.side) {
        const k = 0.5, along2 = start + avail * k, lat = (si % 2 ? -1 : 1) * 5.2;
        const pr = P.filter(p => p.sec === si), mid = pr[Math.floor(pr.length / 2)];
        P.push({ t: 'c', x: A.x + ux * along2 + px * lat, z: A.z + uz * along2 + pz * lat, r: 1.3, top: mid.top + 0.9, sec: si, on: true, side: true });
      }
    });
    P.forEach((p, i) => { p.i = i; p.y0 = p.top; });
    return P;
  }

  const inside = (p, x, z, m) => {
    if (p.t === 'c') return Math.hypot(x - p.x, z - p.z) < p.r + (m || 0);
    const lx = (x - p.x) * p.c + (z - p.z) * p.s, lz = -(x - p.x) * p.s + (z - p.z) * p.c;
    return Math.abs(lx) < p.hx + (m || 0) && Math.abs(lz) < p.hz + (m || 0);
  };

  ENGINE.register(WORLD.stage({
    key: 'hira',
    arabic: 'غَارُ حِرَاء',
    title: 'The Cave of Hira',
    era: 'Jabal an-Nur · Ramadan, about 610 CE · the first revelation',
    hint: 'WASD run · Shift sprint · Space jump · jump at a ledge and hold W to climb · E look closer',
    hintTouch: 'Left thumb to run (push far to sprint) · right thumb to look · JUMP button · tap E when it appears',
    sound: { reverb: 0.8 },
    story: `<p>Revelation began with true dreams that came like the break of dawn. Then seclusion was made dear to him: he would go to the Cave of Hira, near the top of Jabal an-Nur north-east of the Ka‘bah, and worship there for many nights, taking provisions with him and returning to Khadijah for more (Sahih al-Bukhari 3). He was about forty (Sahih al-Bukhari 3851). In the month of Ramadan the Qur’an was sent down (Qur’an 2:185).</p>
            <p class="q"><span class="ar">اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</span>“Read, in the name of your Lord who created.” (Qur’an 96:1)</p>`,

    enter(env) {
      const self = this;
      const nearT = SCAPE.terrain; // alias
      const w = this.w = WORLD.create(env, {
        start: { x: 0, z: 214, yaw: 0, pitch: 0.06 }, exposure: 0.95, far: 2600, eye: 1.62,
        fog: { color: 0x0b1222, density: 0.00085 },
      });
      const S = w.scene;
      this.plats = buildPlatforms();

      /* ---------- terrain: a fine mesh over the mountain, a coarse one to the horizon ---------- */
      const NEAR = { cx: 0, cz: 20, size: 600 };
      const inNear = (x, z) => Math.abs(x - NEAR.cx) < NEAR.size / 2 - 1 && Math.abs(z - NEAR.cz) < NEAR.size / 2 - 1;
      const terr = { photo: { ground: 'dry_ground_rocks', rock: 'rock_boulder_dry', normal: 1.2 }, rock: [0.6, 0.85], colors: { low: '#9a8a78', high: '#8c7c6c', rock: '#7a6e66', dark: '#4e4440' }, tex: 'gravel', rockTex: 'granite' };
      const near = nearT(w, Object.assign({ size: NEAR.size, seg: 300, cx: NEAR.cx, cz: NEAR.cz, height, rep: 0.22, rockRep: 0.07 }, terr));
      const farH = (x, z) => {
        const dx = Math.max(0, Math.abs(x - NEAR.cx) - NEAR.size / 2), dz = Math.max(0, Math.abs(z - NEAR.cz) - NEAR.size / 2);
        const inX = NEAR.size / 2 - Math.abs(x - NEAR.cx), inZ = NEAR.size / 2 - Math.abs(z - NEAR.cz);
        return height(x, z) - 40 * U.smooth(0, 24, Math.min(inX, inZ));
      };
      const far = nearT(w, Object.assign({ size: 3200, seg: 210, cx: -300, cz: 300, height: farH, rep: 0.16, rockRep: 0.03 }, terr, { photo: { ground: 'dense_sand', rock: 'rock_boulder_dry', normal: 1 } }));
      const ground = (x, z) => inNear(x, z) ? near.ground(x, z) : far.ground(x, z);
      w.ground = ground;
      this.ground = ground;

      /* ---------- sky and light: a real starry sky, moonlight from the north-west ---------- */
      const moonDir = new T.Vector3(-0.42, 0.5, -0.75).normalize();
      w.sky({ top: '#04070f', mid: '#16203a', bot: '#070a12', sunDir: moonDir.toArray(), sun: '#8a98c0', sunSize: 0.0004, stars: 1.4, haze: 0.2 });
      const moon = new T.DirectionalLight(0xb4c4ff, 0.45); moon.position.copy(moonDir).multiplyScalar(100); S.add(moon);
      S.add(new T.HemisphereLight(0x5068a0, 0x1a1612, PHOTO.enabled ? 0.12 : 0.5));
      this.moon = moon; this.moonDir = moonDir;
      PHOTO.sky(w, 'qwantani_night_puresky', { sun: moon, intensity: 0.06, gain: 0.55, haze: '#141c30', horizon: 0.55, rotation: 2.2, ground: '#3a3430', bounce: 0.35 }).then(() => {
        moon.position.copy(moonDir).multiplyScalar(100); // the photographed sky's brightest point is a town glow: keep our moon
      });
      // the moon: a thin crescent low in the north-west
      const cresT = w.tex(256, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(220,230,255,0.22)'); gr.addColorStop(1, 'rgba(220,230,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
        g.fillStyle = '#f4f0e4'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.16, 0, 6.283); g.fill();
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(s / 2 + s * 0.065, s / 2 - s * 0.035, s * 0.15, 0, 6.283); g.fill();
      });
      cresT.wrapS = cresT.wrapT = T.ClampToEdgeWrapping;
      const cres = new T.Sprite(new T.SpriteMaterial({ map: cresT, transparent: true, depthWrite: false, fog: false })); cres.scale.set(120, 120, 1); cres.renderOrder = -4;
      S.add(cres); this.cres = cres;
      SCAPE.horizon(w, { cx: -200, cz: 200, haze: '#121a2c', layers: [{ r: 1500, h: 120, color: '#1a1e2a', toneMapped: true }, { r: 1900, h: 160, color: '#20283a' }, { r: 2300, h: 190, color: '#28324a' }] });

      /* ---------- materials ---------- */
      const granite = SCAPE.tex.granite(w);
      const rockM = PHOTO.mat(w, 'rock_boulder_dry', { rep: [1, 1], fallback: granite, color: 0xc0b4a8, normal: 1.4 });
      const rockM2 = PHOTO.mat(w, 'dry_riverbed_rock', { rep: [1, 1], fallback: granite, color: 0xb0a498, normal: 1.4 });

      /* ---------- the ledges: granite spires standing out of the notches in the ridge ---------- */
      const geos = [], crumbleGeos = [];
      const rr = U.seeded(77);
      const spire = (p) => {
        const h = p.top - (ground(p.x, p.z) - 3) + 1;
        const g = new T.CylinderGeometry(p.r, p.r * 1.35, h, 9, 5);
        g.translate(0, -h / 2, 0);
        const pos = g.attributes.position, uv = g.attributes.uv;
        const ox = rr() * 50;
        for (let k = 0; k < pos.count; k++) {
          const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
          const a = Math.atan2(z, x), rad = Math.hypot(x, z);
          if (y < -0.05 && rad > 0.01) { const n = 1 + SCAPE.fbm(a * 1.3 + ox, y * 0.25, 3) * 0.35 + Math.max(0, -y - 2) * 0.01; pos.setX(k, x * n); pos.setZ(k, z * n); }
          else if (rad > 0.01) { const n = 1 + SCAPE.fbm(a * 1.3 + ox, 0, 2) * 0.1; pos.setX(k, x * n); pos.setZ(k, z * n); pos.setY(k, y + SCAPE.fbm(x * 2 + ox, z * 2, 2) * 0.05); }
        }
        // UVs in metres so the scanned rock keeps its scale
        for (let k = 0; k < uv.count; k++) { const y = pos.getY(k); if (Math.abs(y) < 0.2 && Math.hypot(pos.getX(k), pos.getZ(k)) < p.r * 1.2 && k >= (9 + 1) * 6) uv.setXY(k, pos.getX(k) / 3, pos.getZ(k) / 3); else uv.setXY(k, uv.getX(k) * p.r * 2.2, y / 3); }
        g.computeVertexNormals();
        return g;
      };
      const ledge = (p) => {
        const h = Math.max(4, p.top - (ground(p.x, p.z) - 3));
        const g = new T.BoxGeometry(p.hx * 2, h, p.hz * 2, 4, 6, 2); g.translate(0, -h / 2, 0);
        const pos = g.attributes.position, ox = rr() * 40;
        for (let k = 0; k < pos.count; k++) { const y = pos.getY(k); if (y < -0.1) { const n = SCAPE.fbm(pos.getX(k) * 0.6 + ox, y * 0.3, 2) * 0.4 - y * 0.03; pos.setZ(k, pos.getZ(k) * (1 + n)); pos.setX(k, pos.getX(k) * (1 + n * 0.3)); } }
        const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * p.hx * 0.7, uv.getY(k) * h / 3);
        g.computeVertexNormals(); g.rotateY(-p.rot);
        return g;
      };
      this.crumbles = [];
      this.plats.forEach(p => {
        if (p.crumble) {
          // a loose cap stone on a broken stump
          const stub = Object.assign({}, p, { top: p.top - 1.3, r: p.r * 0.75 });
          const gs = spire(stub); gs.translate(p.x, stub.top, p.z); geos.push(gs);
          const cg = new T.CylinderGeometry(p.r, p.r * 0.8, 1.2, 9, 1); cg.translate(0, -0.6, 0);
          const cp = cg.attributes.position; for (let k = 0; k < cp.count; k++) { const a = Math.atan2(cp.getZ(k), cp.getX(k)); const n = 1 + SCAPE.fbm(a * 2 + p.i, 0, 2) * 0.15; cp.setX(k, cp.getX(k) * n); cp.setZ(k, cp.getZ(k) * n); }
          cg.computeVertexNormals();
          const m = new T.Mesh(cg, rockM2); m.position.set(p.x, p.top, p.z); m.castShadow = m.receiveShadow = true; m.userData.dynamic = true; S.add(m);
          p.mesh = m; p.t0 = 0; p.state = 'rest'; this.crumbles.push(p);
          return;
        }
        const g = p.t === 'c' ? spire(p) : ledge(p);
        g.translate(p.x, p.top, p.z); geos.push(g);
      });
      const plM = new T.Mesh(SCAPE.merge(geos), rockM); plM.castShadow = plM.receiveShadow = true; plM.userData.dynamic = true; S.add(plM);

      /* ---------- the cave: two great slabs leaning together under a cap stone ---------- */
      const cy = 55.6;
      const slab = (sx, sy, sz, x, y, z, rx, ry, rz, mat) => {
        const g = new T.BoxGeometry(sx, sy, sz, 4, 4, 4); const pp = g.attributes.position;
        for (let k = 0; k < pp.count; k++) { const n = SCAPE.fbm(pp.getX(k) * 0.7 + x, pp.getY(k) * 0.7 + pp.getZ(k) * 0.5, 3) * 0.35; pp.setXYZ(k, pp.getX(k) * (1 + n * 0.3), pp.getY(k) * (1 + n * 0.15), pp.getZ(k) * (1 + n * 0.3)); }
        const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * Math.max(sx, sz) / 3, uv.getY(k) * sy / 3);
        g.computeVertexNormals();
        const m = new T.Mesh(g, mat || rockM2); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = m.receiveShadow = true; S.add(m); return m;
      };
      slab(5, 7.5, 3.2, CAVE.x - 2.7, cy + 2.6, CAVE.z - 0.5, 0.08, 0.25, -0.3);
      slab(4.6, 7, 3.4, CAVE.x + 2.6, cy + 2.4, CAVE.z - 1.0, -0.06, -0.3, 0.32);
      slab(7, 3, 5.5, CAVE.x, cy + 6.2, CAVE.z - 2.2, 0.15, 0.1, 0.05);
      slab(8, 6, 4, CAVE.x - 0.3, cy + 2.5, CAVE.z - 5.5, 0, 0.1, 0);
      w.addCircle(CAVE.x - 2.9, CAVE.z - 0.5, 2.1); w.addCircle(CAVE.x + 2.9, CAVE.z - 1, 2.1);
      this.caveLight = new T.PointLight(0xfff0d0, 0, 24, 1.6); this.caveLight.position.set(CAVE.x, cy + 1.4, CAVE.z - 2.2); S.add(this.caveLight);
      this.caveGlow = KIT.glow(w, 0xfff2d8, 7, 0.0); this.caveGlow.position.copy(this.caveLight.position); S.add(this.caveGlow);

      /* ---------- the city of Makkah far below: houses, lamps and hearths ---------- */
      const plaster = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.25, fallback: SCAPE.tex.mud(w), color: 0xe6d6c0 });
      const brick = PHOTO.mat(w, 'clay_block_wall', { rep: [1, 1], fallback: KIT.mudBrick(w, [1, 1]), color: 0xd8c4a8 });
      const planks = PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], fallback: KIT.wood(w), color: 0xb89a7a });
      const beamM = PHOTO.mat(w, 'medieval_wood', { rep: [0.3, 1], fallback: KIT.wood(w), color: 0xa08868 });
      const stoneM = PHOTO.mat(w, 'old_stone_wall', { rep: [1, 1], fallback: granite, color: 0xc0b0a0 });
      const hs = SCAPE.scatter(w, { kind: 'house', n: 520, area: { x: CITY.x, z: CITY.z, r: 240 }, scale: [6, 10], seed: 41, density: (x, z) => 1 - U.smooth(60, 240, Math.hypot(x - CITY.x, z - CITY.z)) * 0.7, avoid: (x, z) => Math.hypot(x - CITY.x, z - CITY.z) < 26 || Math.hypot(x - LANE.x, z - LANE.z) < 45 });
      hs.meshes.forEach(m => { m.material = plaster; });
      // a proper lane at the edge of the city, where the film begins
      const r2 = U.seeded(57);
      const ca = Math.cos(LANE.a), sa = Math.sin(LANE.a);
      const laneP = (u, v) => [LANE.x + ca * u - sa * v, LANE.z + sa * u + ca * v];
      this.door = null;
      const house = (u, v, wd, dp, ht, side, withDoor) => {
        const [x, z] = laneP(u, v); const gy = ground(x, z) - 0.3;
        const g = new T.Group(); g.position.set(x, gy, z); g.rotation.y = -LANE.a + (side > 0 ? Math.PI : 0);
        const body = new T.Mesh(new T.BoxGeometry(wd, ht, dp), r2() < 0.5 ? plaster : brick); body.position.y = ht / 2; g.add(body);
        // parapet with an uneven top
        for (let i = 0; i < 4; i++) { const pw = wd / 4; const p = new T.Mesh(new T.BoxGeometry(pw, 0.5 + r2() * 0.35, 0.3), plaster); p.position.set(-wd / 2 + pw * (i + 0.5), ht + 0.25, dp / 2 - 0.15); g.add(p); }
        // roof beams poking out of the wall
        for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.9, 6), beamM); b.rotation.x = Math.PI / 2; b.position.set(-wd / 2 + 0.6 + i * (wd - 1.2) / 4, ht - 0.45, dp / 2 + 0.25); g.add(b); }
        // a small window
        const win = new T.Mesh(new T.BoxGeometry(0.6, 0.5, 0.1), new T.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 })); win.position.set(wd * 0.25, ht * 0.62, dp / 2 + 0.02); g.add(win);
        const step = new T.Mesh(new T.BoxGeometry(1.6, 0.3, 0.7), stoneM); step.position.set(-wd * 0.18, 0.15, dp / 2 + 0.35); g.add(step);
        const frame = new T.Mesh(new T.BoxGeometry(1.4, 2.25, 0.12), beamM); frame.position.set(-wd * 0.18, 1.12, dp / 2 + 0.01); g.add(frame);
        const dark = new T.Mesh(new T.BoxGeometry(1.1, 2.0, 0.1), new T.MeshStandardMaterial({ color: 0x1a120c, roughness: 1 })); dark.position.set(-wd * 0.18, 1.0, dp / 2 + 0.04); g.add(dark);
        const hinge = new T.Group(); hinge.position.set(-wd * 0.18 - 0.55, 0, dp / 2 + 0.09); hinge.userData.dynamic = true; g.add(hinge);
        const door = new T.Mesh(new T.BoxGeometry(1.1, 2.0, 0.08), planks); door.position.set(0.55, 1.0, 0); hinge.add(door);
        if (withDoor) this.door = { hinge, g, x, z, gy, wd, dp, u: u - wd * 0.18 * (side > 0 ? -1 : 1), v: v + (side > 0 ? -1 : 1) * dp / 2 };
        S.add(g);
        w.addBox(x - wd / 2, z - wd / 2, x + wd / 2, z + wd / 2);
        return g;
      };
      for (let i = 0; i < 6; i++) { house(-30 + i * 11, -7.5, 9 + r2() * 2, 7, 3.8 + r2() * 1.8, -1, i === 4); house(-30 + i * 11 + 4, 7.5, 9 + r2() * 2, 7, 3.5 + r2() * 2.2, 1, false); }
      // the lamp by the door and the provisions waiting on the step
      const d = this.door; d.g.updateMatrixWorld(true);
      const local = (lx, ly, lz) => new T.Vector3(lx, ly, lz).applyMatrix4(d.g.matrixWorld);
      this.laneLampPos = local(-d.wd * 0.18 + 1.0, 2.3, d.dp / 2 + 0.35);
      this.laneLight = new T.PointLight(0xffb060, 0, 10, 2); this.laneLight.position.copy(this.laneLampPos); S.add(this.laneLight);
      this.laneGlow = KIT.glow(w, 0xffc070, 1.4, 0); this.laneGlow.position.copy(this.laneLampPos); S.add(this.laneGlow);
      const lampAt = local(-d.wd * 0.18 + 1.0, 2.05, d.dp / 2 + 0.3);
      PHOTO.place(w, 'brass_diya_lantern', { pos: [lampAt.x, lampAt.y, lampAt.z], s: 2.2 });
      const bAt = local(-d.wd * 0.18 + 0.5, 0.3, d.dp / 2 + 0.45), jAt = local(-d.wd * 0.18 - 0.35, 0.3, d.dp / 2 + 0.5);
      PHOTO.place(w, 'wicker_basket_01', { pos: [bAt.x, bAt.y, bAt.z], s: 1.0, ry: 0.4 });
      PHOTO.place(w, 'jug_01', { pos: [jAt.x, jAt.y, jAt.z], s: 1.1 });
      this.provAt = bAt; this.laneP = laneP;
      // hearths and lamps across the city: one cloud of warm points
      const fires = []; const r3 = U.seeded(9);
      for (let i = 0; i < 320; i++) { const a = r3() * 6.283, dd = Math.pow(r3(), 0.8) * 230; const x = CITY.x + Math.cos(a) * dd, z = CITY.z + Math.sin(a) * dd; fires.push([x, ground(x, z) + 1.5 + r3() * 4, z, 3 + r3() * 5]); }
      const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.BufferAttribute(new Float32Array(fires.flatMap(f => f.slice(0, 3))), 3));
      const firePts = new T.Points(fg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffa858, size: 4.5, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, opacity: 0.85 }));
      firePts.frustumCulled = false; S.add(firePts);
      SCAPE.smoke(w, { sources: [[CITY.x + 30, ground(CITY.x + 30, CITY.z) + 6, CITY.z - 20], [CITY.x - 60, ground(CITY.x - 60, CITY.z + 40) + 6, CITY.z + 40], [CITY.x + 90, ground(CITY.x + 90, CITY.z + 90) + 6, CITY.z + 90]], color: '#3a3a44', height: 40, size: 14, opacity: 0.25 });
      const kGlow = KIT.glow(w, 0xffe2b0, 30, 0.5); kGlow.position.set(CITY.x, ground(CITY.x, CITY.z) + 8, CITY.z); kGlow.material.fog = false; S.add(kGlow);
      SCAPE.scatter(w, { kind: 'palm', n: 60, area: { x: CITY.x, z: CITY.z, r: 260 }, scale: [8, 12], seed: 12, avoid: (x, z) => Math.hypot(x - LANE.x, z - LANE.z) < 30 });

      /* ---------- the mountain's texture: scanned boulders, rocks, shrubs; acacias in the wadi ---------- */
      const offRoute = (x, z) => { const n = nearest(x, z); return n.d < 7.5 && z < 175; };
      const nearSide = { x: 0, z: 30, r: 250 };
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 160, area: nearSide, scale: [1.2, 3.2], seed: 21, avoid: (x, z) => offRoute(x, z) || Math.hypot(x, z - 214) < 10, density: (x, z) => U.smooth(4, 14, nearest(x, z).d) });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', fallback: 'boulder', n: 110, area: nearSide, scale: [1, 2.6], seed: 22, avoid: offRoute });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_cliff_01', fallback: 'boulder', fallbackScale: 4, n: 34, area: [-120, -200, 120, 120], scale: [1.4, 2.6], seed: 23, avoid: (x, z) => nearest(x, z).d < 16 || Math.hypot(x - CAVE.x, z - CAVE.z) < 12 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 360, area: nearSide, scale: [0.8, 2.2], seed: 24, avoid: (x, z) => nearest(x, z).d < 2.5 && z < 175 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 420, area: { x: 0, z: 40, r: 200 }, scale: [1, 2], seed: 25, density: (x, z) => { const n = nearest(x, z); return n.d < 14 ? 1 : 0.2; } });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 120, area: nearSide, scale: [0.8, 1.6], seed: 26, avoid: offRoute });
      SCAPE.scatter(w, { kind: 'model', model: 'dry_branches_medium_01', fallback: 'thorn', n: 60, area: { x: 0, z: 200, r: 90 }, scale: [0.8, 1.4], seed: 27, avoid: (x, z) => Math.hypot(x, z - 214) < 6 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', fallback: 'grass', n: 260, area: { x: 0, z: 205, r: 70 }, scale: [0.8, 1.4], seed: 28 });
      SCAPE.scatter(w, { kind: 'boulder', n: 260, area: { x: -100, z: 100, r: 700 }, scale: [3, 9], seed: 31, avoid: (x, z) => Math.hypot(x - CITY.x, z - CITY.z) < 260 || (Math.abs(x) < 70 && z < 260 && z > -200) });
      SCAPE.scatter(w, { kind: 'rock', n: 700, area: { x: 0, z: 40, r: 300 }, scale: [0.4, 1.6], seed: 32, avoid: offRoute });
      SCAPE.scatter(w, { kind: 'pebble', n: 2200, area: { x: 0, z: 60, r: 220 }, scale: [0.06, 0.2], seed: 33 });
      SCAPE.scatter(w, { kind: 'grass', n: 1200, area: { x: 0, z: 210, r: 110 }, scale: [0.4, 0.9], seed: 34, density: (x, z) => SCAPE.fbm(x * 0.03, z * 0.03, 2) > -0.1 ? 1 : 0.2 });
      SCAPE.scatter(w, { kind: 'thorn', n: 220, area: { x: 0, z: 120, r: 280 }, scale: [0.6, 1.4], seed: 35, avoid: offRoute });
      SCAPE.scatter(w, { kind: 'acacia', n: 46, area: { x: 0, z: 260, r: 160 }, scale: [0.9, 1.5], seed: 36, avoid: (x, z) => Math.hypot(x, z - 205) < 24 || z < 175 });

      /* ---------- lanterns at every shelf (the checkpoints) ---------- */
      this.lanterns = NODES.map((n, i) => {
        const nx = i < NODES.length - 1 ? NODES[i + 1] : { x: CAVE.x, z: CAVE.z };
        const dx = nx.x - n.x, dz = nx.z - n.z, L = Math.hypot(dx, dz);
        const off = i === 0 ? Math.min(n.r - 6, 12) : n.r - 3.2;
        const x = n.x + dx / L * off + (dz / L) * 1.8, z = n.z + dz / L * off - (dx / L) * 1.8, y = ground(x, z);
        PHOTO.place(w, 'namaqualand_boulder_05', { pos: [x, y - 0.5, z], s: 0.6, ry: i });
        const lamp = new T.Group(); lamp.position.set(x, y + 0.45, z); S.add(lamp); lamp.userData.dynamic = true;
        PHOTO.model(w, 'brass_diya_lantern').then(({ parts }) => parts.forEach(p => { const m = new T.Mesh(p.geo, p.mat); m.scale.setScalar(2.4); lamp.add(m); })).catch(() => {
          const m = new T.Mesh(new T.CylinderGeometry(0.12, 0.08, 0.1, 10), KIT.std({ color: 0xa07838, metalness: 0.8, roughness: 0.35 })); lamp.add(m);
        });
        const glow = KIT.glow(w, 0xffc070, 1.2, 0.08); glow.position.set(x, y + 0.8, z); S.add(glow);
        const ember = KIT.glow(w, 0xff8040, 0.5, 0.5); ember.position.set(x, y + 0.72, z); S.add(ember);
        // where you reappear: on the shelf, facing the way on
        const rx = n.x + dx / L * (off - 2.2), rz = n.z + dz / L * (off - 2.2);
        return { i, x, z, y, glow, ember, lit: false, k: 0, spawn: { x: rx, z: rz, yaw: Math.atan2(-dx, -dz) } };
      });
      this.lampLight = new T.PointLight(0xffb868, 0, 11, 2); S.add(this.lampLight);
      this.nextLight = new T.PointLight(0xffb868, 0, 10, 1.8); S.add(this.nextLight);

      /* ---------- provisions on the side ledges ---------- */
      const PROV = [['jug_01', 'A jug of water', 1.3], ['wicker_basket_01', 'A basket of provisions', 1.1], ['wooden_bowl_01', 'A bowl of dates', 1.4]];
      this.provs = this.plats.filter(p => p.side).map((p, k) => {
        const [id, name, s] = PROV[k];
        const g = new T.Group(); g.position.set(p.x, p.top, p.z); g.userData.dynamic = true; S.add(g);
        PHOTO.model(w, id).then(({ parts }) => parts.forEach(pp => { const m = new T.Mesh(pp.geo, pp.mat); m.scale.setScalar(s); m.castShadow = true; g.add(m); })).catch(() => { g.add(new T.Mesh(new T.SphereGeometry(0.22, 12, 8), KIT.std({ color: 0x8a6440 }))); });
        if (id === 'wooden_bowl_01') for (let j = 0; j < 7; j++) { const dt = new T.Mesh(new T.SphereGeometry(0.035, 8, 6), KIT.std({ color: 0x4a2a14, roughness: 0.5 })); dt.scale.set(1, 1, 1.6); dt.position.set((j % 3 - 1) * 0.05, 0.07, (Math.floor(j / 3) - 1) * 0.05); g.add(dt); }
        const glow = KIT.glow(w, 0xffe0a0, 1.6, 0.5); glow.position.set(p.x, p.top + 0.5, p.z); S.add(glow);
        return { p, g, glow, name, got: false };
      });
      this.got = 0;

      /* ---------- "runner vision": the next stones catch a warm light ---------- */
      this.marks = [0, 1, 2].map(() => { const m = KIT.glow(w, 0xffd8a0, 1.8, 0); S.add(m); return m; });
      // dust that streams on the gusts
      this.dust = KIT.dust(w, 160, [-12, 0, -150, 22, 70, -90], 0xc8c0b0, 0.06); this.dust.material.opacity = 0; S.add(this.dust);
      SCAPE.motes(w, { n: 50, area: [-20, 2, 180, 20, 8, 240], color: '#cfd8ff', size: 0.18, opacity: 0.35 });

      /* ---------- the verses, written in light over the valley ---------- */
      this.verseSprites = VERSES.map(([ar, en]) => {
        const c = document.createElement('canvas'); c.width = 1400; c.height = 220;
        const g = c.getContext('2d'); g.textAlign = 'center'; g.direction = 'rtl';
        g.shadowColor = 'rgba(255,220,150,0.9)'; g.shadowBlur = 28; g.fillStyle = '#fff6dc'; g.font = '92px Amiri, "Geeza Pro", serif';
        g.fillText(ar, 700, 110); g.direction = 'ltr'; g.shadowBlur = 0; g.fillStyle = 'rgba(242,233,214,0.92)'; g.font = 'italic 40px Spectral, Georgia, serif'; g.fillText(en, 700, 190);
        const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
        const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
        sp.scale.set(60, 9.4, 1); sp.visible = false; S.add(sp); return sp;
      });

      /* ---------- discoveries ---------- */
      const disc = (x, z, title, text, ar, label) => w.discover({ pos: [x, ground(x, z) + 1.3, z], title, text, ar, label });
      disc(-16, 222, 'Jabal an-Nur', 'The Cave of Hira lies near the top of Jabal an-Nur, the Mountain of Light, some four to five kilometres north-east of the Sacred Mosque. Its summit stands about 642 metres above the sea.', 'جَبَلُ النُّور', 'Look up at the mountain');
      disc(17, 196, 'Like the Break of Dawn', 'Revelation began with true dreams: he saw no dream but that it came true like the break of dawn. Then seclusion was made dear to him. (Sahih al-Bukhari 3, from ‘A’ishah)', 'فَلَقُ الصُّبْح', 'Look at the eastern sky');
      disc(NODES[2].x - 5, NODES[2].z - 2, 'Many Nights', 'He would worship in the Cave of Hira for many nights before returning to his family, taking provisions with him, then come back to Khadijah to take provisions again. (Sahih al-Bukhari 3)', 'التَّحَنُّث', 'Look closer');
      disc(NODES[3].x + 4.5, NODES[3].z + 1, 'At Forty', 'Revelation came to him when he was forty years old. He then remained in Makkah for thirteen years. (Sahih al-Bukhari 3851, from Ibn ‘Abbas)', 'وَهُوَ ابْنُ أَرْبَعِينَ', 'Look closer');
      disc(NODES[5].x - 4, NODES[5].z + 2, 'The Month of Ramadan', '“The month of Ramadan, in which the Qur’an was sent down, a guidance for the people.” (Qur’an 2:185)', 'شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ', 'Look out over the valley');
      disc(NODES[6].x + 8, NODES[6].z + 3, 'The Night of Decree', '“Indeed, We sent it down in the Night of Decree. And what will make you know what the Night of Decree is? The Night of Decree is better than a thousand months.” (Qur’an 97:1–3)', 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ', 'Look up at the stars');

      /* ---------- light, shadow, finish ---------- */
      w.followShadow(moon, 40, 2048);
      this.shadowOff = moonDir.clone().multiplyScalar(100);
      w.receiveAll();
      this.baked = w.bake();
      this.post = w.post({ bloom: 0.75, threshold: 0.62, rays: { strength: 0.22, dir: moonDir.toArray(), density: 0.8 }, vignette: 0.5, grain: 0.04, sat: 0.95, contrast: 1.06, lift: [0.012, 0.02, 0.045], gain: [0.98, 1.0, 1.08] });

      /* ---------- touch: a jump button ---------- */
      if (matchMedia('(pointer: coarse)').matches) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'hira-jump'; b.textContent = 'JUMP';
        Object.assign(b.style, { position: 'absolute', right: '22px', bottom: 'calc(22px + env(safe-area-inset-bottom, 0px))', width: '86px', height: '86px', borderRadius: '50%', border: '1.5px solid rgba(246,220,154,.7)', background: 'rgba(20,24,40,.45)', color: '#f6dc9a', font: '600 13px/1 sans-serif', letterSpacing: '.12em', pointerEvents: 'auto', zIndex: 5 });
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); self.jumpQ = 0.14; self.holdJump = true; });
        b.addEventListener('pointerup', e => { e.stopPropagation(); self.holdJump = false; });
        w.ui.layer.appendChild(b); this.jumpBtn = b;
      }
      const veil = document.createElement('div');
      Object.assign(veil.style, { position: 'absolute', inset: 0, background: '#0a1020', opacity: 0, transition: 'opacity .35s ease', pointerEvents: 'none', zIndex: 3 });
      w.ui.layer.appendChild(veil); this.veil = veil;

      /* ---------- the climber ---------- */
      Object.assign(this, { vy: 0, air: false, coyote: 0, jumpQ: 0, mantle: null, cp: 0, sec: 0, phase: 'climb', revT: 0, land: 0, fovK: 0, gustT: 7, gust: 0, gustDir: 1, stepAcc: 0, respawnT: 0, prevSpace: false, part: -1, fell: 0 });
      this.vel = new T.Vector2();
      w.mode = (dt) => this.climb(env, dt);
      this.setPart(0);

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 320, q: 0.6, gain: 0.05 });
      this.rush = SND.noise(b, { color: 'white', type: 'highpass', freq: 1800, q: 0.5, gain: 0 });
      this.cityHum = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 260, gain: 0.0 });
      this.gustClock = 3; this.cricketClock = 1; this.murmur = 6;
    },

    /* ---------------- film: the city at night, a door, the provisions, the mountain, the cleft ---------------- */
    film(env, w) {
      const self = this, G = this.ground, d = this.door, LP = this.laneP;
      const at = (x, dy, z) => [x, G(x, z) + dy, z];
      const ln = (u, v, dy) => { const [x, z] = LP(u, v); return [x, G(x, z) + dy, z]; };
      const P = this.provAt;
      const lan0 = this.lanterns[0];
      const ridge = (i, t) => { const s = segs[i]; return [s.a.x + s.dx * t, s.a.y + (s.b.y - s.a.y) * t, s.a.z + s.dz * t]; };
      const r2 = ridge(2, 0.5), r4 = ridge(4, 0.5);
      const shots = [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [46, 40],
          path: [[at(CITY.x - 200, 150, CITY.z + 300), [CITY.x, 10, CITY.z]], [at(CITY.x - 40, 110, CITY.z + 110), [CITY.x + 120, 10, CITY.z - 150]], [at(CITY.x + 140, 95, CITY.z - 90), [0, 50, -100]]],
          start: () => { SND.glow(env.bus, 98, { gain: 0.04, dur: 9 }); self.cityHum.set('gain', 0.05, 1); } },
        { dur: 6.5, fade: 'dip', line: 'Makkah, around the year 610. Seclusion has been made dear to him.', ar: 'مكة، نحو سنة ٦١٠. حُبِّب إليه الخَلاء.', ease: 'inout', fov: [50, 44],
          path: [[ln(d.u - 24, 0.5, 1.7), ln(d.u, d.v, 1.6)], [ln(d.u - 12, 1.2, 1.65), ln(d.u, d.v, 1.5)], [ln(d.u - 5, 0.6, 1.6), ln(d.u, d.v, 1.3)]],
          start: () => { self.laneLight.intensity = 0; self.laneGlow.material.opacity = 0; },
          during: (w, k) => {
            const lit = U.smooth(0.25, 0.4, k); self.laneLight.intensity = lit * 1.4 * (0.9 + 0.1 * Math.sin(w.time * 13)); self.laneGlow.material.opacity = lit * 0.9;
            if (k > 0.25 && !self._litLane) { self._litLane = true; SND.bell(env.bus, 392, { gain: 0.04 }); SND.knock(env.bus, { f: 900, gain: 0.05, click: 3000 }); }
            d.hinge.rotation.y = -U.smooth(0.55, 0.9, k) * 1.4;
            if (k > 0.55 && !self._door) { self._door = true; SND.knock(env.bus, { f: 160, gain: 0.08, click: 700 }); SND.swell(env.bus, { f0: 300, f1: 120, dur: 1.4, gain: 0.04 }); }
          } },
        { dur: 5, fade: 'cut', line: 'He takes provisions, and goes out for many nights.', ar: 'يتزوّدُ لذلك، ويخرج لياليَ ذواتِ العدد.', ease: 'glide', fov: [38, 32],
          path: [[ln(d.u + 1.6, d.v + 2.6, 1.1), [P.x, P.y + 0.1, P.z]], [ln(d.u + 0.8, d.v + 1.7, 0.75), [P.x, P.y + 0.15, P.z]]],
          during: (w) => { self.laneLight.intensity = 1.4 * (0.9 + 0.1 * Math.sin(w.time * 13)); self.laneGlow.material.opacity = 0.9; d.hinge.rotation.y = -1.4; } },
        { dur: 6, fade: 'dip', line: 'To a cave near the top of Jabal an-Nur, north-east of the Ka‘bah.', ar: 'إلى غارٍ قرب قمة جبل النور، شمالَ شرقيّ الكعبة.', ease: 'glide', fov: [50, 42],
          path: [[at(40, 6, 300), [0, 30, 120]], [at(22, 4, 262), [0, 40, 60]], [at(9, 3.2, 236), [0, 45, -20]]],
          start: () => { self.cityHum.set('gain', 0.0, 1.5); SND.swell(env.bus, { f0: 200, f1: 700, dur: 4, gain: 0.07 }); } },
        { dur: 6.5, fade: 'cut', line: 'In the month of Ramadan, the Qur’an was sent down.', ar: 'شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ', ease: 'inout', fov: [44, 52],
          path: [[[r2[0] + 22, r2[1] + 4, r2[2] + 12], [r2[0], r2[1] + 2, r2[2] - 8]], [[r2[0] + 26, r2[1] + 18, r2[2] - 30], [r4[0], r4[1], r4[2]]], [[r4[0] + 24, r4[1] + 22, r4[2] - 20], [CAVE.x, 62, CAVE.z]]],
          start: () => SND.glow(env.bus, 110, { gain: 0.05, dur: 8, vowel: 'o' }) },
        { dur: 6, fade: 'dip', line: 'Tonight the lanterns on the path are unlit.', ar: 'الليلةَ مصابيحُ الطريق مطفأة.', ease: 'glide', fov: [40, 32],
          path: [[[CAVE.x + 12, 62, CAVE.z + 22], [CAVE.x, 57, CAVE.z - 1]], [[CAVE.x + 4, 58.2, CAVE.z + 11], [CAVE.x, 57, CAVE.z - 2]]],
          during: (w, k) => { const p = Math.sin(k * Math.PI); self.caveGlow.material.opacity = p * 0.35; self.caveLight.intensity = p * 0.8; },
          start: () => { self.wind.set('gain', 0.015, 1.2); } },
        { dur: 6, fade: 'dip', line: 'Climb by lantern light, and gather the provisions on the way.', ar: 'اصعَد على ضوء الفوانيس، واجمع الزادَ في الطريق.', ease: 'inout', fov: [50, 68],
          path: [[[lan0.x + 7, lan0.y + 2.4, lan0.z + 9], [lan0.x, lan0.y + 0.6, lan0.z]], [[lan0.x + 2.5, lan0.y + 1.8, lan0.z + 7], [lan0.x, lan0.y + 1, lan0.z - 6]]],
          start: () => { self.caveGlow.material.opacity = 0; self.caveLight.intensity = 0; self.wind.set('gain', 0.05, 1); },
          during: (w, k) => { if (k > 0.3 && !self.lanterns[0].lit) self.lightLantern(env, 0, true); } },
      ];
      // never let a camera key sink below the ground
      shots.forEach(s => s.path.forEach(k => { k[0][1] = Math.max(k[0][1], G(k[0][0], k[0][2]) + 0.6); }));
      return shots;
    },
    filmOpts: {
      end(w, skipped) {
        const s = ENGINE.cur; if (!s || !s.lanterns) return;
        s.laneLight.intensity = 0; s.laneGlow.material.opacity = 0; s.caveGlow.material.opacity = 0; s.caveLight.intensity = 0;
        if (!s.lanterns[0].lit) s.lightLantern(ENGINE.env, 0, true);
        const sp = s.lanterns[0].spawn;
        w.pos.set(0, 0, 214); w.yaw = 0; w.pitch = 0.04; w.y = s.ground(0, 214); s.vy = 0; s.air = false;
        s.cityHum.set('gain', 0, 1); s.wind.set('gain', 0.05, 1);
        w.goal(null);
      },
    },

    /* ---------------- game logic ---------------- */
    setPart(si) {
      const S = SECTIONS[Math.min(si, SECTIONS.length - 1)], w = this.w;
      const part = si < 2 ? 0 : si < 4 ? 1 : 2;
      if (part !== this.part) { this.part = part; w.activity(S.name, NODES.length, this.stepText(S.step)); w.progress(this.cp); }
      else w.step(this.stepText(S.step));
      this.curStep = S.step;
    },
    stepText(s) { return `${s} · provisions ${this.got || 0} / 3`; },
    lightLantern(env, i, quiet) {
      const L = this.lanterns[i]; if (L.lit) return;
      L.lit = true; this.cp = Math.max(this.cp, i);
      this.lampLight.position.set(L.x, L.y + 1.2, L.z);
      if (!quiet) {
        SND.bell(env.bus, [392, 440, 493.88, 523.25, 587.33, 659.25, 783.99][i], { gain: 0.06 });
        SND.glow(env.bus, [196, 220, 246.94, 261.63, 293.66, 329.63, 392][i], { gain: 0.035, dur: 5 });
        SND.swell(env.bus, { f0: 400, f1: 1600, dur: 1.2, gain: 0.03 });
      }
      if (i > 0) {
        this.w.progress(i);
        if (i < SECTIONS.length) this.setPart(i);
        else this.w.step('Go into the cleft of the cave \u00b7 provisions ' + this.got + ' / 3');
      }
    },
    respawn(env) {
      const w = this.w, L = this.lanterns[this.cp];
      this.respawnT = 0.75; this.veil.style.opacity = 1;
      SND.sing(env.bus, 196, { vowel: 'u', dur: 1.6, gain: 0.03, glide: 1.25 });
      SND.swell(env.bus, { f0: 900, f1: 200, dur: 1.0, gain: 0.04 });
      setTimeout(() => {
        if (!this.w) return;
        w.pos.set(L.spawn.x, 0, L.spawn.z); w.y = this.floor(L.spawn.x, L.spawn.z, 1e3).y; w.yaw = L.spawn.yaw; w.pitch = 0;
        this.vy = 0; this.vel.set(0, 0); this.mantle = null; this.air = false;
        this.crumbles.forEach(p => { p.state = 'rest'; p.on = true; p.top = p.y0; p.mesh.position.y = p.y0; p.mesh.rotation.set(0, 0, 0); });
        setTimeout(() => { if (this.veil) this.veil.style.opacity = 0; }, 120);
      }, 380);
      this.fell++;
      if (this.fell === 1) w.say('The lantern keeps your place', 'A missed step costs nothing here: you return to the last lantern you lit. Run harder (Shift) for long gaps, and jump at high ledges while pressing forward to climb them.', { ms: 7000 });
    },
    floor(x, z, feet) {
      let y = this.ground(x, z), on = null;
      for (const p of this.plats) if (p.on && p.top <= feet + 0.42 && p.top > y && inside(p, x, z, 0.08)) { y = p.top; on = p; }
      return { y, on };
    },

    climb(env, dt) {
      const w = this.w; dt = Math.min(dt, 0.05);
      if (this.phase === 'revelation') return this.revelation(env, dt);
      const k = w.keys;
      if (this.respawnT > 0) { this.respawnT -= dt; }
      // input
      let mx = 0, mz = 0;
      if (k.has('w') || k.has('ArrowUp')) mz += 1; if (k.has('s') || k.has('ArrowDown')) mz -= 1;
      if (k.has('a')) mx -= 1; if (k.has('d')) mx += 1;
      if (k.has('ArrowLeft')) w.yaw += dt * 1.9; if (k.has('ArrowRight')) w.yaw -= dt * 1.9;
      let jm = 1;
      if (w.joy) { mx += w.joy.dx; mz -= w.joy.dy; jm = Math.hypot(w.joy.dx, w.joy.dy); }
      const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
      const sprint = k.has('Shift') || (w.joy && jm > 0.92);
      const space = k.has(' ');
      if (space && !this.prevSpace) this.jumpQ = 0.14;
      this.prevSpace = space;
      this.jumpQ = Math.max(0, this.jumpQ - dt);
      const fx = -Math.sin(w.yaw), fz = -Math.cos(w.yaw), rx = -fz, rz = fx;
      const top = sprint ? 7.6 : 4.2;
      const wx = (fx * mz + rx * mx) * top, wz = (fz * mz + rz * mx) * top;
      const acc = this.air ? 2.6 : (ml > 0.05 ? 11 : 14);
      this.vel.x = U.damp(this.vel.x, wx, acc, dt); this.vel.y = U.damp(this.vel.y, wz, acc, dt);

      // gusts on the last stretch: anticipation, then a push toward the drop
      if (this.sec === 5 && this.cp >= 5) {
        this.gustT -= dt;
        if (this.gustT < 1.3 && !this.gustWarn) { this.gustWarn = true; SND.swell(env.bus, { f0: 300, f1: 2200, dur: 1.6, gain: 0.07, pan: 0.8 }); }
        if (this.gustT < 0) { this.gust = 1.6; this.gustT = 6 + Math.random() * 3; this.gustWarn = false; SND.noise && SND.swell(env.bus, { f0: 600, f1: 300, dur: 1.8, gain: 0.06, pan: 0.6 }); }
      }
      if (this.gust > 0) { this.gust -= dt; const g = Math.sin(Math.min(1, this.gust / 1.6) * Math.PI) * 2.6; this.vel.x += g * dt * 3.2; }
      this.dust.material.opacity = U.damp(this.dust.material.opacity, this.gust > 0 ? 0.55 : 0.0, 4, dt);
      KIT.driftDust(this.dust, dt, w.time, [this.gust > 0 ? 9 : 0.4, -0.2]);

      // the mantle: a pull up over a ledge edge
      if (this.mantle) {
        const m = this.mantle; m.t += dt / 0.36;
        const e = U.ease(Math.min(1, m.t));
        w.pos.x = U.lerp(m.x0, m.x1, U.smooth(0.45, 1, m.t)); w.pos.z = U.lerp(m.z0, m.z1, U.smooth(0.45, 1, m.t));
        w.y = U.lerp(m.y0, m.y1, U.smooth(0, 0.7, m.t));
        if (m.t >= 1) { this.mantle = null; this.air = false; this.vy = 0; this.land = 0.5; SND.step(env.bus, { gain: 0.12, f: 900 }); }
        this.cam(env, dt, e); return;
      }

      const ox = w.pos.x, oz = w.pos.z;
      let nx = ox + this.vel.x * dt, nz = oz + this.vel.y * dt;
      // walls: ledges higher than a step block you from the side
      const R = 0.32;
      for (const p of this.plats) {
        if (!p.on || p.top <= w.y + 0.42) continue;
        if (p.t === 'c') { const dx = nx - p.x, dz = nz - p.z, dd = Math.hypot(dx, dz), m = p.r + R; if (dd < m && dd > 1e-4) { nx = p.x + dx / dd * m; nz = p.z + dz / dd * m; } }
        else {
          const lx = (nx - p.x) * p.c + (nz - p.z) * p.s, lz = -(nx - p.x) * p.s + (nz - p.z) * p.c, ex = p.hx + R, ez = p.hz + R;
          if (Math.abs(lx) < ex && Math.abs(lz) < ez) { let qx = lx, qz = lz; if (ex - Math.abs(lx) < ez - Math.abs(lz)) qx = Math.sign(lx) * ex; else qz = Math.sign(lz) * ez; nx = p.x + qx * p.c - qz * p.s; nz = p.z + qx * p.s + qz * p.c; }
        }
      }
      for (const [cx, cz, cr] of w.circles) { const dx = nx - cx, dz = nz - cz, dd = Math.hypot(dx, dz), m = cr + R; if (dd < m && dd > 1e-5) { nx = cx + dx / dd * m; nz = cz + dz / dd * m; } }
      // the way: stay on the route, its shelves and the open wadi at the foot
      const ok = (x, z) => {
        if (z > 150 && Math.hypot(x, z - 214) < 42) return true;
        if (Math.hypot(x - CAVE.x, z - CAVE.z) < 4) return true;
        for (const n of NODES) if (Math.hypot(x - n.x, z - n.z) < n.r - 1) return true;
        return nearest(x, z).d < 6.8;
      };
      if (!ok(nx, nz)) { if (ok(nx, oz)) nz = oz; else if (ok(ox, nz)) nx = ox; else { nx = ox; nz = oz; } }
      // mantle check: pressing forward against a ledge you can reach
      if (mz > 0.3 && (this.air || this.jumpQ > 0)) {
        const px = w.pos.x + fx * 0.75, pz = w.pos.z + fz * 0.75;
        for (const p of this.plats) {
          if (!p.on) continue; const h = p.top - w.y;
          if (h > 0.4 && h < 2.15 && inside(p, px, pz, 0.15)) {
            // land a little way in from the edge
            let tx = w.pos.x + fx * 1.2, tz = w.pos.z + fz * 1.2;
            if (!inside(p, tx, tz, -0.1)) { tx = p.x + (w.pos.x - p.x) * 0.3; tz = p.z + (w.pos.z - p.z) * 0.3; }
            this.mantle = { t: 0, x0: w.pos.x, z0: w.pos.z, y0: w.y, x1: tx, z1: tz, y1: p.top };
            this.jumpQ = 0; this.vel.set(this.vel.x * 0.3, this.vel.y * 0.3);
            SND.step(env.bus, { gain: 0.12, f: 500 }); SND.knock(env.bus, { f: 120, gain: 0.04, click: 1800 });
            this.cam(env, dt, 0); return;
          }
        }
      }
      w.pos.x = nx; w.pos.z = nz;
      w.moving = Math.hypot(this.vel.x, this.vel.y);

      // vertical
      const F = this.floor(w.pos.x, w.pos.z, w.y);
      if (!this.air) {
        if (F.y < w.y - 0.45) { this.air = true; this.coyote = 0.12; }
        else w.y = U.damp(w.y, F.y, 22, dt);
      }
      if (this.jumpQ > 0 && (!this.air || this.coyote > 0)) {
        this.vy = 7.3; this.air = true; this.coyote = 0; this.jumpQ = 0;
        SND.step(env.bus, { gain: 0.09, f: 700 }); SND.swell(env.bus, { f0: 900, f1: 1800, dur: 0.35, gain: 0.02, color: 'white' });
      }
      if (this.air) {
        this.coyote -= dt;
        this.vy -= 22 * dt; w.y += this.vy * dt;
        if (w.y <= F.y && this.vy <= 0) {
          const hard = -this.vy; w.y = F.y; this.vy = 0; this.air = false;
          this.land = U.clamp(hard / 14, 0.15, 1);
          if (hard > 3) { SND.step(env.bus, { gain: 0.08 + this.land * 0.1, f: 500 }); SND.knock(env.bus, { f: 110, gain: 0.03 + this.land * 0.05, click: 1500 }); }
        }
      }
      // steep ground slides you back down (the ridge's broken edges)
      if (!this.air && !F.on) {
        const e = 0.6, gx = (this.ground(w.pos.x + e, w.pos.z) - this.ground(w.pos.x - e, w.pos.z)) / (2 * e), gz = (this.ground(w.pos.x, w.pos.z + e) - this.ground(w.pos.x, w.pos.z - e)) / (2 * e);
        const sl = Math.hypot(gx, gz);
        if (sl > 1.1) { this.vel.x -= gx / sl * 18 * dt; this.vel.y -= gz / sl * 18 * dt; }
      }
      // crumbling stones
      this.crumbles.forEach(p => {
        if (p.state === 'rest' && F.on === p && !this.air) { p.state = 'shake'; p.t0 = 0; SND.knock(env.bus, { f: 90, gain: 0.06, click: 900 }); SND.step(env.bus, { gain: 0.1, f: 1300 }); }
        if (p.state === 'shake') { p.t0 += dt; p.mesh.position.x = p.x + Math.sin(w.time * 60) * 0.03; p.mesh.position.y = p.y0 - p.t0 * 0.12; p.top = p.y0 - p.t0 * 0.12; if (p.t0 > 0.75) { p.state = 'fall'; p.t0 = 0; p.on = false; SND.thump(env.bus, { gain: 0.08, f: 40 }); SND.swell(env.bus, { f0: 400, f1: 120, dur: 1.4, gain: 0.05, color: 'brown' }); } }
        else if (p.state === 'fall') { p.t0 += dt; p.mesh.position.y = p.y0 - 0.1 - p.t0 * p.t0 * 9; p.mesh.rotation.z = p.t0 * 0.5; if (p.t0 > 3.2) { p.state = 'back'; p.t0 = 0; } }
        else if (p.state === 'back') { p.t0 += dt; p.mesh.position.set(p.x, p.y0 - 3 * (1 - U.easeOut(Math.min(1, p.t0 / 0.8))), p.z); p.mesh.rotation.z = 0; if (p.t0 > 0.8) { p.state = 'rest'; p.on = true; p.top = p.y0; } }
      });

      // where am I on the route?
      const nr = nearest(w.pos.x, w.pos.z);
      this.sec = Math.min(nr.i, 5);
      if (this.respawnT <= 0 && w.y < nr.y - 5.5) this.respawn(env);
      // lanterns light as you reach them
      this.lanterns.forEach((L, i) => {
        if (!L.lit && Math.hypot(w.pos.x - L.x, w.pos.z - L.z) < 4.2 && Math.abs(w.y - L.y) < 3) { for (let j = 1; j < i; j++) if (!this.lanterns[j].lit) this.lanterns[j].lit = true; this.lightLantern(env, i); }
        L.k = U.damp(L.k, L.lit ? 1 : 0, 3, dt);
        L.glow.material.opacity = 0.08 + L.k * (0.6 + 0.1 * Math.sin(w.time * 9 + i));
        L.glow.scale.setScalar(1.2 + L.k * 0.9);
        L.ember.material.opacity = 0.5 * (1 - L.k) + 0.3 * Math.sin(w.time * 2 + i) * (1 - L.k);
      });
      const lit = this.lanterns[this.cp];
      this.lampLight.intensity = U.damp(this.lampLight.intensity, 1.1 * (0.92 + 0.08 * Math.sin(w.time * 11)), 3, dt);
      const nextL = this.lanterns[this.cp + 1];
      if (nextL) { this.nextLight.position.set(nextL.x, nextL.y + 1.0, nextL.z); this.nextLight.intensity = 0.6 + 0.3 * Math.sin(w.time * 2.2); w.goal([nextL.x, nextL.y + 1.2, nextL.z]); }
      else { this.nextLight.intensity = 0; w.goal([CAVE.x, 57, CAVE.z]); }
      // provisions
      this.provs.forEach(pv => {
        if (pv.got) return;
        pv.g.rotation.y += dt * 0.6; pv.glow.material.opacity = 0.35 + 0.2 * Math.sin(w.time * 3);
        if (Math.hypot(w.pos.x - pv.p.x, w.pos.z - pv.p.z) < 1.5 && Math.abs(w.y - pv.p.top) < 1.2) {
          pv.got = true; this.got++; pv.g.visible = false; pv.glow.visible = false;
          SND.bell(env.bus, 659.25, { gain: 0.05, glass: true }); SND.bell(env.bus, 783.99, { gain: 0.04, glass: true, delay: 0.15 });
          w.say(pv.name, this.got < 3 ? `Provisions for the night: ${this.got} of 3.` : 'All the provisions are gathered. On to the cave.', { ms: 3800 });
          w.step(this.stepText(this.curStep));
        }
      });
      // runner vision: the next three stones
      const ahead = this.plats.filter(p => p.on && !p.side && (p.sec > this.sec || (p.sec === this.sec && this.alongOf(p) > this.alongOf({ x: w.pos.x, z: w.pos.z }) + 0.5)) && p.top > w.y - 3).slice(0, 3);
      this.marks.forEach((m, i) => { const p = ahead[i]; if (!p) { m.material.opacity = 0; return; } m.position.set(p.x, p.top + 0.25, p.z); m.material.opacity = (0.32 - i * 0.08) * (0.75 + 0.25 * Math.sin(w.time * 3 - i)); });
      // the cave
      if (Math.hypot(w.pos.x - CAVE.x, w.pos.z - CAVE.z) < 3.2 && this.phase === 'climb' && !this.done) this.startRevelation(env);
      this.cam(env, dt, 0);
      this.focusItems();
    },
    alongOf(p) { const n = nearest(p.x, p.z); return n.i * 1000 + n.t * 100; },
    focusItems() {
      const w = this.w, look = w.forward(); let best = null, bd = 1e9;
      for (const it of w.items) {
        if (it.done) continue;
        const dx = it.pos.x - w.pos.x, dz = it.pos.z - w.pos.z, dy = it.pos.y - (w.y + w.eye), d = Math.hypot(dx, dz); if (d > it.r) continue;
        const dl = Math.hypot(dx, dy, dz), facing = (dx * look.x + dy * look.y + dz * look.z) / dl;
        if (facing < (d < 1.4 ? 0.2 : 0.6)) continue;
        const sc = d - facing * 2; if (sc < bd) { bd = sc; best = it; }
      }
      w.focus = best;
      if (best) { w.ui.label.textContent = best.label; w.ui.prompt.classList.add('show'); w.ui.ebtn.classList.add('show'); }
      else { w.ui.prompt.classList.remove('show'); w.ui.ebtn.classList.remove('show'); }
    },
    cam(env, dt, mantleK) {
      const w = this.w, c = w.camera, sp = Math.hypot(this.vel.x, this.vel.y);
      if (!this.air && !this.mantle && sp > 0.5) {
        const before = this.stepAcc; this.stepAcc += sp * dt * 1.7;
        if (Math.floor(before / Math.PI) !== Math.floor(this.stepAcc / Math.PI)) { const onP = this.floor(w.pos.x, w.pos.z, w.y).on; if (onP) SND.knock(env.bus, { f: U.rnd(100, 130), gain: 0.05 + sp * 0.006, click: U.rnd(1800, 2600) }); else SND.step(env.bus, { gain: 0.07 + sp * 0.008, f: U.rnd(900, 1300) }); }
      }
      this.land = Math.max(0, this.land - dt * 3);
      const bobA = this.air ? 0 : U.clamp(sp / 7.6) * 0.06;
      const dip = -Math.sin(Math.min(1, this.land) * Math.PI) * 0.18 * (this.land > 0 ? 1 : 0) - (this.mantle ? Math.sin(mantleK * Math.PI) * 0.25 : 0);
      c.position.set(w.pos.x, w.y + w.eye + Math.abs(Math.sin(this.stepAcc)) * bobA - bobA * 0.5 + dip, w.pos.z);
      const lat = (this.vel.x * Math.cos(w.yaw) - this.vel.y * Math.sin(w.yaw));
      this.roll = U.damp(this.roll || 0, -lat * 0.006 + Math.sin(this.stepAcc) * bobA * 0.1, 6, dt);
      c.rotation.set(w.pitch - (this.mantle ? Math.sin(mantleK * Math.PI) * 0.12 : 0), w.yaw, this.roll);
      this.fovK = U.damp(this.fovK, U.clamp((sp - 4.2) / 3.4) + (this.air ? 0.15 : 0), 4, dt);
      const fov = 68 + this.fovK * 9; if (Math.abs(c.fov - fov) > 0.05) { c.fov = fov; c.updateProjectionMatrix(); }
      // the moon's shadow camera follows
      if (w._shadow) { const Lt = w._shadow.light, px = Math.round(w.pos.x / 2) * 2, pz = Math.round(w.pos.z / 2) * 2; Lt.target.position.set(px, w.y, pz); Lt.position.set(px + this.moonDir.x * 100, w.y + this.moonDir.y * 100, pz + this.moonDir.z * 100); }
      this.cres.position.copy(c.position).addScaledVector(this.moonDir, 1500);
      // sound follows altitude and speed
      const alt = U.clamp((w.y - 3) / 55);
      this.wind.set('gain', 0.04 + alt * 0.08, 0.5); this.wind.set('freq', 280 + alt * 200, 0.5);
      this.rush.set('gain', U.clamp((sp - 3) / 6) * 0.035 + (this.air ? 0.01 : 0), 0.15);
    },

    startRevelation(env) {
      const w = this.w;
      this.phase = 'revelation'; this.revT = 0; this.r0 = { yaw: w.yaw, pitch: w.pitch, x: w.pos.x, z: w.pos.z, y: w.y };
      w.goal(null); w.progress(NODES.length, this.got >= 3 ? 'Listen' : `Listen · provisions ${this.got} / 3`);
      this.marks.forEach(m => { m.material.opacity = 0; });
      // the verses appear out over the valley, toward the city
      const dx = CITY.x - CAVE.x, dz = CITY.z - CAVE.z, l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      this.outYaw = Math.atan2(-ux, -uz);
      this.verseSprites.forEach((sp, i) => { sp.visible = true; sp.position.set(CAVE.x + ux * 120, 74 - i * 9.6, CAVE.z + uz * 120); });
    },
    revelation(env, dt) {
      const w = this.w, c = w.camera;
      const T0 = this.revT, T1 = (this.revT += dt), cross = s => T0 < s && T1 >= s;
      // the camera settles in the mouth of the cave, looking out over the valley
      const k = U.smooth(0, 3, T1);
      const ex = CAVE.x + 0.2, ez = CAVE.z + 1.4;
      w.pos.x = U.lerp(this.r0.x, ex, k); w.pos.z = U.lerp(this.r0.z, ez, k); w.y = U.lerp(this.r0.y, this.ground(ex, ez), k);
      let dy = this.outYaw - this.r0.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      if (T1 < 46) { w.yaw = this.r0.yaw + dy * k; w.pitch = U.lerp(this.r0.pitch, 0.1, k); }
      c.position.set(w.pos.x, w.y + w.eye, w.pos.z); c.rotation.set(w.pitch, w.yaw, 0);
      if (c.fov !== 60) { c.fov = U.damp(c.fov, 60, 2, dt); c.updateProjectionMatrix(); }
      this.cres.position.copy(c.position).addScaledVector(this.moonDir, 1500);
      // silence first, then light
      this.wind.set('gain', 0.06 * (1 - U.smooth(0, 3, T1)) + 0.02 * U.smooth(44, 50, T1), 0.4); this.rush.set('gain', 0, 0.3);
      const glow = U.smooth(3, 7, T1) * (1 - 0.5 * U.smooth(40, 48, T1));
      this.caveLight.intensity = glow * 5; this.caveGlow.material.opacity = glow * 0.9;
      if (this.post) this.post.set({ bloom: 0.75 + glow * 0.5, lift: [0.012 + glow * 0.02, 0.02 + glow * 0.015, 0.045] });
      if (cross(3)) { SND.glow(env.bus, 98, { gain: 0.07, dur: 14, vowel: 'o' }); SND.glow(env.bus, 146.83, { gain: 0.04, dur: 12, delay: 1 }); }
      if (cross(3.5)) w.say('Read', 'The angel came to him and said, <span class="q">“Read.”</span> He answered, <span class="q">“I am not one who reads.”</span> The angel pressed him until he could bear no more, three times, and then said: <span class="q">“Read, in the name of your Lord who created…”</span> (Sahih al-Bukhari 3, from ‘A’ishah)', { ms: 15000 });
      this.verseSprites.forEach((sp, i) => {
        const at = 7 + i * 4;
        if (cross(at)) { SND.sing(env.bus, [146.83, 164.81, 174.61, 196, 220][i], { vowel: 'a', dur: 6, gain: 0.05, voices: 3 }); SND.bell(env.bus, [587.33, 659.25, 698.46, 783.99, 880][i], { gain: 0.03 }); }
        sp.material.opacity = U.smooth(at, at + 2.2, T1) * (1 - U.smooth(48, 56, T1) * 0.55);
      });
      if (cross(27)) w.say('Cover Me', 'He returned to Khadijah with his heart trembling, saying, <span class="q">“Cover me, cover me.”</span> She said: <span class="q">“Never. By God, God will never disgrace you. You keep the ties of kinship, you bear the burden of the weak, you give to those who have nothing, you honour your guest, and you help those struck by misfortune.”</span> (Sahih al-Bukhari 3)', { ar: 'كَلَّا وَاللَّهِ مَا يُخْزِيكَ اللَّهُ أَبَدًا', ms: 15000 });
      if (cross(42)) {
        w.say('Waraqah', 'Khadijah took him to her cousin Waraqah ibn Nawfal, an old man who knew the earlier scriptures. He said: <span class="q">“This is the keeper of secrets whom God sent down to Moses.”</span> (Sahih al-Bukhari 3)', { ms: 13000 });
        w.finish(this.got >= 3 ? 'The first revelation · all provisions gathered' : 'The first revelation');
      }
      if (T1 > 50) { this.phase = 'after'; w.mode = (d) => this.after(env, d); }
    },
    // after the revelation the summit is yours to stand on and look out from
    after(env, dt) {
      const w = this.w; this.phase = 'climb'; this.done = true;
      this.climb(env, dt); this.phase = 'after';
      if (Math.hypot(w.pos.x - CAVE.x, w.pos.z - CAVE.z) < 3.2) { /* stay */ }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      if (w.filmS) { if (w._shadow) { const Lt = w._shadow.light, c = w.camera.position; Lt.target.position.set(c.x, c.y - 20, c.z); Lt.position.set(c.x + this.moonDir.x * 100, c.y - 20 + this.moonDir.y * 100, c.z + this.moonDir.z * 100); } this.cres.position.copy(w.camera.position).addScaledVector(this.moonDir, 1500); }
      // night sounds: crickets in the wadi, gusts, a distant hum from the city
      this.cricketClock -= dt;
      if (this.cricketClock < 0 && w.y < 20) { this.cricketClock = 0.4 + Math.random() * 1.4; SND.cricket(env.bus, { gain: 0.004 * (1 - U.clamp(w.y / 20)) }); }
      this.gustClock -= dt;
      if (this.gustClock < 0) { this.gustClock = 5 + Math.random() * 6; SND.swell(env.bus, { f0: 200, f1: 700, dur: 3 + Math.random() * 2, gain: 0.04 + U.clamp(w.y / 60) * 0.05, pan: U.rnd(-1, 1) }); }
      if (this.phase === 'climb' && !w.filmS) { this.murmur -= dt; if (this.murmur < 0) { this.murmur = 9 + Math.random() * 8; if (w.pos.z > 150) SND.sing(env.bus, U.pick([110, 123.47, 98]), { vowel: 'm', dur: 3, gain: 0.008, voices: 3, pan: -0.6 }); } }
    },
    onLeave() { this.jumpBtn = null; this.veil = null; },
  }));
})();
