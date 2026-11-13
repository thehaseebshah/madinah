/* Station — A Garden of Paradise (ar-Rawdah). A brush-stroke game (Okami's celestial brush).
   Feeling: tenderness and stillness; a garden that answers the hand.
   The old heart of the Prophet's Mosque by night: white columns banded in gold and green, a green
   carpet between the minbar and the place of his house, painted domes and brass lamps. Hold the
   brush (Space) and the world stills into ink and parchment; draw, and the stroke acts:
   a circle blooms a garden of light, a line lights a row of lamps, a loop unties or opens.
   Six columns with old names, each with its story (al-Samhudi; Ibn Ishaq; Ibn Majah 1774), in
   three parts that ask for more of the brush; then one great circle over the green carpet, and the
   garden blooms: "Between my house and my minbar is a garden from the gardens of Paradise."
   Colour script: ivory and night blue; green and gold for the Rawdah and the brush's answers. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const BAY = 5, NX = 12, NZ = 8, CEIL = 8.6, SPRING = 4.6;
  const X0 = -NX * BAY / 2, Z0 = -NZ * BAY / 2;          // hall from x -30..30, z -20..20 (qibla wall at z = -20)
  const RAW = { x0: -12.5, x1: 12.5, z0: -17.5, z1: -2.5 };  // the green carpet of the Rawdah
  const NOTES = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25];
  // the six named columns (positions on the grid), and what the brush must do at each
  const COLS = [
    { id: 'mukhallaqah', x: -5, z: -15, name: 'al-Mukhallaqah', ar: 'الأسطوانة المخلَّقة', part: 0, need: ['circle'],
      text: 'The “perfumed” column, by the Prophet’s ﷺ place of prayer; tradition says it was scented with khaluq. Tradition also places here the palm trunk he stood by to preach, which cried when he moved to the new minbar, until he came down and held it. (al-Samhudi; the crying trunk: Sahih al-Bukhari 3584)' },
    { id: 'aishah', x: 0, z: -10, name: '‘A’ishah', ar: 'أسطوانة عائشة', part: 0, need: ['line'],
      text: 'Also called the column of the Muhajirun and of the lots: tradition reports ‘A’ishah saying that if people knew its worth, they would draw lots to pray beside it. (al-Samhudi, Wafa’ al-Wafa’)' },
    { id: 'tawbah', x: 5, z: -10, name: 'at-Tawbah', ar: 'أسطوانة التوبة', part: 1, need: ['loop'],
      text: 'The column of Repentance. Abu Lubabah tied himself to a pillar of the mosque until God accepted his repentance, and the Prophet ﷺ himself untied him on his way to the dawn prayer. (Ibn Ishaq)' },
    { id: 'sarir', x: 10, z: -10, name: 'as-Sarir', ar: 'أسطوانة السرير', part: 1, need: ['circle'],
      text: 'The column of the Bed: during his retreat (i‘tikaf) in the mosque, his bed was placed behind the column of Repentance. (Sunan Ibn Majah 1774)' },
    { id: 'mahras', x: 5, z: -5, name: 'al-Mahras', ar: 'أسطوانة المحرس', part: 2, need: ['line', 'circle'],
      text: 'The column of the Guard, also al-Haras: tradition says ‘Ali and others sat here to keep watch. (al-Samhudi)' },
    { id: 'wufud', x: 0, z: -5, name: 'al-Wufud', ar: 'أسطوانة الوفود', part: 2, need: ['loop', 'line'],
      text: 'The column of the Delegations: tradition says he received here the delegations who came to Madinah from across Arabia. (al-Samhudi)' },
  ];
  const PARTS = [
    { title: 'Part 1 of 3 · Circle and line', step: 'Stand by a glowing column, hold Space for the brush, and draw what its ink shadow shows' },
    { title: 'Part 2 of 3 · The loop', step: 'A loop unties what is bound. Now the brush shows no guide: read the column and draw' },
    { title: 'Part 3 of 3 · Two strokes', step: 'Each column asks two strokes. Watch your ink: it returns slowly' },
  ];

  function el(parent, css, html) { const d = document.createElement('div'); d.style.cssText = css; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; }

  /* stroke recognition: a line is straight; a circle turns all the way round and closes; a loop turns but stays open */
  function classify(pts) {
    if (pts.length < 6) return null;
    let len = 0, turn = 0, minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    // resample for a stable turning angle
    const rs = [pts[0]], step = len / 48; let acc = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc += d; if (acc >= step) { rs.push(pts[i]); acc = 0; } }
    for (let i = 2; i < rs.length; i++) {
      const a1 = Math.atan2(rs[i - 1][1] - rs[i - 2][1], rs[i - 1][0] - rs[i - 2][0]), a2 = Math.atan2(rs[i][1] - rs[i - 1][1], rs[i][0] - rs[i - 1][0]);
      turn += Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));
    }
    pts.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
    const ends = Math.hypot(pts[pts.length - 1][0] - pts[0][0], pts[pts.length - 1][1] - pts[0][1]), diag = Math.hypot(maxX - minX, maxY - minY);
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const info = { len, turn, ends, diag, cx, cy, r: pts.reduce((a, p) => a + Math.hypot(p[0] - cx, p[1] - cy), 0) / pts.length, box: [minX, minY, maxX, maxY], a: pts[0], b: pts[pts.length - 1] };
    if (len < 60) return null;
    if (ends / len > 0.86) return Object.assign(info, { kind: 'line' });
    const at = Math.abs(turn);
    if (at > Math.PI * 1.45 && ends < diag * 0.3 && at < Math.PI * 2.9) return Object.assign(info, { kind: 'circle' });
    if (at > Math.PI * 1.45) return Object.assign(info, { kind: 'loop' });
    return Object.assign(info, { kind: null });
  }

  const station = WORLD.stage({
    key: 'rawdah',
    arabic: 'الرَّوْضَة',
    title: 'A Garden of Paradise',
    era: 'Ar-Rawdah ash-Sharifah · today',
    hint: 'WASD walk · hold Space (or right-click) for the brush, then draw with the mouse · Space again to put it down',
    hintTouch: 'Left thumb to walk · tap Brush, then draw with your finger',
    sound: { reverb: 0.75 },
    story: `<p>Inside the Prophet’s Mosque, between the place where his house stood and his minbar, lies a small area marked by its green carpet and its white columns: ar-Rawdah, the Garden. “Between my house and my minbar is a garden from the gardens of Paradise.” (Sahih al-Bukhari 1196)</p>
            <p>Its columns carry old names, remembered through the centuries: the perfumed column, ‘A’ishah’s, Repentance, the Bed, the Guard, the Delegations. Most of their stories are tradition rather than sound hadith, and are told here as such.</p>
            <p>Take up the brush: the world stills into ink, and a circle blooms, a line lights the lamps, a loop unties.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: 0, z: 14, yaw: 0, pitch: 0.06 }, exposure: 0.95, far: 1500, fog: { color: 0x1a2030, density: 0.0016 }, bounds: [-29, -19, 29, 46] });
      const S = w.scene, R = U.seeded(1196);
      w.surface = (x, z) => (z > 20.5 ? 'marble' : 'sand');
      this.brush = false; this.ink = 3; this.inkT = 0; this.part = -1; this.stroke = null; this.done = false; this.effects = [];

      /* ---------- night sky, moon, lamps ---------- */
      w.sky({ top: '#0a1428', mid: '#2a3048', bot: '#141820', sunDir: [0.2, 0.9, -0.3], sun: '#c8d4ff', sunSize: 0.001, stars: 1, haze: 0.3 });
      const moon = new T.DirectionalLight(0xc8d4ff, 0.3); moon.position.set(10, 60, -20); S.add(moon);
      S.add(new T.HemisphereLight(0x6070a0, 0x3a2a20, PHOTO.enabled ? 0.12 : 0.35));
      w.followShadow(moon, 40, 2048);
      PHOTO.sky(w, 'qwantani_night_puresky', { sun: moon, intensity: 0.35, haze: '#1a2030', horizon: 0.5, ground: '#4a4038', bounce: 0.4 });
      this.post = w.post({ bloom: 0.75, threshold: 0.7, vignette: 0.42, grain: 0.03, lift: [0.0, 0.01, 0.03], gain: [1.05, 1.0, 0.94], sat: 1.05 });
      this.lights = [[-6, 6, -10], [6, 6, -10], [0, 6, -4], [-14, 6, 2], [14, 6, 2], [0, 6, 12]].map(p => { const L = new T.PointLight(0xffd29a, 1.2, 26, 2); L.position.set(...p); S.add(L); return L; });

      /* ---------- materials ---------- */
      const M = {
        marble: PHOTO.mat(w, 'marble_01', { triplanar: 0.4, color: 0xf6f2ea, rough: 0.45, fallback: KIT.plaster(w, [2, 2], '#f0ece4') }),
        floor: PHOTO.mat(w, 'marble_01', { rep: [20, 20], color: 0xf0ebe2, rough: 0.3, fallback: KIT.plaster(w, [20, 20], '#ece6dc') }),
        stone: PHOTO.mat(w, 'plastered_stone_wall', { triplanar: 0.3, color: 0xefe4d2, fallback: KIT.plaster(w, [2, 2], '#e8dcc8') }),
        brass: new T.MeshStandardMaterial({ color: 0xd8b060, metalness: 1, roughness: 0.25 }),
        green: new T.MeshStandardMaterial({ color: 0x1f6a46, metalness: 0.3, roughness: 0.4 }),
      };
      const carpet = (base, edge) => w.tex(512, (g, s) => {
        g.fillStyle = base; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); }
        for (let r = 0; r < 4; r++) { const y = r * s / 4; g.fillStyle = edge; g.fillRect(0, y, s, 4); for (let x = 0; x < s; x += 64) { g.save(); g.translate(x + 32, y + 64); g.strokeStyle = edge; g.lineWidth = 2; g.beginPath(); g.moveTo(-18, 50); g.lineTo(-18, -20); g.quadraticCurveTo(0, -48, 18, -20); g.lineTo(18, 50); g.stroke(); g.restore(); } }
      }, [8, 8]);
      M.gcarpet = new T.MeshStandardMaterial({ map: carpet('#1c5a3a', 'rgba(200,190,120,0.55)'), roughness: 0.95 });
      M.red = new T.MeshStandardMaterial({ map: carpet('#6e1418', 'rgba(210,170,100,0.45)'), roughness: 0.95 });
      // Ottoman painting for the small domes: rings of floral medallions on ivory, gilt ribs
      const domeT = w.tex(1024, (g, s) => {
        g.fillStyle = '#efe6d2'; g.fillRect(0, 0, s, s);
        [[0, 0.08, '#c8a050'], [0.3, 0.34, '#2e5e8a'], [0.6, 0.64, '#c8a050'], [0.9, 1, '#2a6a48']].forEach(([a, b, c]) => { g.fillStyle = c; g.fillRect(0, a * s, s, (b - a) * s); });
        for (let k = 0; k < 16; k++) { const x = (k + 0.5) / 16 * s; g.save(); g.translate(x, 0.47 * s); for (let p = 0; p < 6; p++) { g.rotate(Math.PI / 3); g.fillStyle = p % 2 ? '#b8443a' : '#2e5e8a'; g.beginPath(); g.ellipse(0, 18, 8, 18, 0, 0, 6.283); g.fill(); } g.fillStyle = '#c8a050'; g.beginPath(); g.arc(0, 0, 8, 0, 6.283); g.fill(); g.restore(); }
        for (let k = 0; k < 32; k++) { const x = (k + 0.5) / 32 * s; g.strokeStyle = '#2a6a48'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 0.66 * s); g.bezierCurveTo(x + 14, 0.72 * s, x - 14, 0.8 * s, x, 0.88 * s); g.stroke(); g.fillStyle = '#b8443a'; g.beginPath(); g.arc(x, 0.77 * s, 5, 0, 6.283); g.fill(); }
        for (let k = 0; k < 24; k++) { g.strokeStyle = 'rgba(200,160,80,0.8)'; g.lineWidth = 2; const x = k / 24 * s; g.beginPath(); g.moveTo(x, 0.08 * s); g.lineTo(x, 0.3 * s); g.stroke(); }
      });
      M.domeIn = new T.MeshStandardMaterial({ map: domeT, roughness: 0.6, side: T.BackSide });
      // the band painted on the Rawdah's columns: arabesque in green and gold
      const bandT = w.tex(512, (g, s) => {
        g.fillStyle = '#f2ecdf'; g.fillRect(0, 0, s, s);
        g.fillStyle = '#c8a050'; g.fillRect(0, 0, s, 20); g.fillRect(0, s - 20, s, 20);
        g.strokeStyle = '#2a7a4e'; g.lineWidth = 6;
        for (let k = 0; k < 4; k++) { g.beginPath(); const x0 = k * s / 4; g.moveTo(x0, s * 0.5); g.bezierCurveTo(x0 + 40, s * 0.15, x0 + 90, s * 0.15, x0 + s / 8, s * 0.5); g.bezierCurveTo(x0 + 170, s * 0.85, x0 + 210, s * 0.85, x0 + s / 4, s * 0.5); g.stroke();
          g.fillStyle = '#c8a050'; g.beginPath(); g.arc(x0 + s / 16, s * 0.3, 14, 0, 6.283); g.fill(); g.beginPath(); g.arc(x0 + 3 * s / 16, s * 0.7, 14, 0, 6.283); g.fill(); }
      }, [2, 1]);
      M.band = this.bandMat = new T.MeshStandardMaterial({ map: bandT, roughness: 0.4, metalness: 0.15, emissive: 0xffd890, emissiveMap: bandT, emissiveIntensity: 0 });

      /* ---------- ground outside: the courtyard and the city ---------- */
      SCAPE.terrain(w, { size: 1600, seg: 100, height: (x, z) => U.smooth(500, 800, Math.hypot(x, z)) * SCAPE.ridge(x * 0.003, z * 0.003, 4) * 110 - 0.03,
        colors: { low: '#e8e2d8', high: '#ded6ca', rock: '#5a4a40', dark: '#3a302a' }, photo: { ground: 'marble_01', rock: 'rock_face_03', normal: 0.4 }, rep: 0.22, rockRep: 0.03 });
      w.ground = () => 0;
      SCAPE.horizon(w, { haze: '#1a2030', layers: [{ r: 1000, h: 70, color: '#20242e', seed: 5 }, { r: 1300, h: 110, color: '#2a2e3a', seed: 6 }] });

      /* ---------- the hall: floor, carpets, columns, arches, painted domes ---------- */
      const fl = new T.Mesh(new T.PlaneGeometry(NX * BAY, NZ * BAY).rotateX(-Math.PI / 2), M.floor); fl.position.y = 0.01; fl.receiveShadow = true; S.add(fl);
      const rc = new T.Mesh(new T.PlaneGeometry(NX * BAY - 1, NZ * BAY - 1).rotateX(-Math.PI / 2), M.red); rc.position.y = 0.02; rc.receiveShadow = true; S.add(rc);
      const gc = new T.Mesh(new T.PlaneGeometry(RAW.x1 - RAW.x0, RAW.z1 - RAW.z0).rotateX(-Math.PI / 2), M.gcarpet); gc.position.set((RAW.x0 + RAW.x1) / 2, 0.03, (RAW.z0 + RAW.z1) / 2); gc.receiveShadow = true; S.add(gc);
      const m4 = new T.Matrix4(), q4 = new T.Quaternion(), one = new T.Vector3(1, 1, 1);
      const cols = []; for (let a = 1; a < NX; a++) for (let b = 1; b < NZ; b++) cols.push([X0 + a * BAY, Z0 + b * BAY]);
      const inRaw = ([x, z]) => x > RAW.x0 && x < RAW.x1 && z > RAW.z0 && z < RAW.z1;
      const baseG = new T.CylinderGeometry(0.62, 0.66, 0.5, 20); baseG.translate(0, 0.25, 0);
      const shaftG = new T.CylinderGeometry(0.42, 0.46, SPRING - 0.5 - 0.5, 20); shaftG.translate(0, 0.5 + (SPRING - 1) / 2, 0);
      const capG = new T.CylinderGeometry(0.66, 0.44, 0.5, 20); capG.translate(0, SPRING - 0.25, 0);
      const bandG = new T.CylinderGeometry(0.475, 0.475, 1.9, 24, 1, true); bandG.translate(0, 1.55, 0);
      [[baseG, M.marble], [shaftG, M.marble], [capG, M.brass]].forEach(([g, m]) => { const im = new T.InstancedMesh(g, m, cols.length); cols.forEach(([x, z], k) => { m4.makeTranslation(x, 0, z); im.setMatrixAt(k, m4); }); im.castShadow = im.receiveShadow = true; S.add(im); });
      const rawCols = cols.filter(inRaw);
      const bandI = new T.InstancedMesh(bandG, M.band, rawCols.length); rawCols.forEach(([x, z], k) => { m4.makeTranslation(x, 0, z); bandI.setMatrixAt(k, m4); }); S.add(bandI);
      cols.forEach(([x, z]) => w.addCircle(x, z, 0.62));
      // arches on every row of columns, with gilt bands
      const sh = new T.Shape(); sh.moveTo(-2.5, 0); sh.lineTo(-2.05, 0); sh.bezierCurveTo(-2.05, 1.7, -1.0, 2.7, 0, 3.1); sh.bezierCurveTo(1.0, 2.7, 2.05, 1.7, 2.05, 0); sh.lineTo(2.5, 0); sh.lineTo(2.5, CEIL - SPRING); sh.lineTo(-2.5, CEIL - SPRING); sh.lineTo(-2.5, 0);
      const archG = new T.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false, curveSegments: 10 }); archG.translate(0, SPRING, -0.3);
      const arches = [];
      for (let a = 0; a < NX; a++) for (let b = 0; b <= NZ; b++) arches.push([X0 + (a + 0.5) * BAY, Z0 + b * BAY, 0]);
      for (let a = 0; a <= NX; a++) for (let b = 0; b < NZ; b++) arches.push([X0 + a * BAY, Z0 + (b + 0.5) * BAY, Math.PI / 2]);
      const archI = new T.InstancedMesh(archG, M.stone, arches.length);
      arches.forEach((a, k) => archI.setMatrixAt(k, m4.compose(new T.Vector3(a[0], 0, a[1]), q4.setFromEuler(new T.Euler(0, a[2], 0)), one)));
      archI.castShadow = archI.receiveShadow = true; S.add(archI);
      // a small painted dome over every bay
      const dg = new T.SphereGeometry(2.6, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2); dg.scale(1, 0.75, 1); dg.translate(0, CEIL, 0);
      const pend = new T.PlaneGeometry(BAY, BAY).rotateX(Math.PI / 2); pend.translate(0, CEIL, 0);
      const ringT = w.tex(256, (g, s) => { g.clearRect(0, 0, s, s); g.fillStyle = '#efe6d2'; g.fillRect(0, 0, s, s); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.52 * (2.6 / 2.5), 0, 6.283); g.fill(); g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#c8a050'; g.lineWidth = 6; g.beginPath(); g.arc(s / 2, s / 2, s * 0.52 * (2.6 / 2.5) + 3, 0, 6.283); g.stroke(); });
      const bays = []; for (let a = 0; a < NX; a++) for (let b = 0; b < NZ; b++) bays.push([X0 + (a + 0.5) * BAY, Z0 + (b + 0.5) * BAY]);
      const domeI = new T.InstancedMesh(dg, M.domeIn, bays.length), pendI = new T.InstancedMesh(pend, new T.MeshStandardMaterial({ map: ringT, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.7 }), bays.length);
      bays.forEach(([x, z], k) => { m4.makeTranslation(x, 0, z); domeI.setMatrixAt(k, m4); pendI.setMatrixAt(k, m4); }); S.add(domeI); S.add(pendI);
      const roof = new T.Mesh(new T.BoxGeometry(NX * BAY + 1.2, 0.6, NZ * BAY + 1.2), M.stone); roof.position.y = CEIL + 2.3; roof.castShadow = true; S.add(roof);
      // walls: qibla wall south with tiles, the house's grille to the east, arcades open to the courtyard north
      const box = (a, b, c, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(a, b, c), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; S.add(o); return o; };
      const tileT = w.tex(256, (g, s) => { g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 64) for (let x = 0; x < s; x += 64) { g.save(); g.translate(x + 32, y + 32); g.fillStyle = '#2e5e8a'; U.star8(g, 0, 0, 26, 0.6); g.fill(); g.fillStyle = '#f4f0e8'; U.star8(g, 0, 0, 14, 0.6); g.fill(); g.fillStyle = '#b8443a'; g.beginPath(); g.arc(0, 0, 5, 0, 6.283); g.fill(); g.restore(); } }, [24, 3]);
      box(NX * BAY + 1, CEIL + 2.6, 0.8, M.stone, 0, (CEIL + 2.6) / 2, Z0 - 0.4);
      const tiles = new T.Mesh(new T.PlaneGeometry(NX * BAY, 3.2), new T.MeshStandardMaterial({ map: tileT, roughness: 0.25 })); tiles.position.set(0, 1.6 + 0.4, Z0 + 0.02); S.add(tiles);
      box(0.8, CEIL + 2.6, NZ * BAY, M.stone, X0 - 0.4, (CEIL + 2.6) / 2, 0); w.addBox(X0 - 0.8, Z0, X0, -Z0);
      // the grille of the noble chamber (the house), east: brass and green lattice, never opened here
      const latT = KIT.lattice(w, [10, 4]);
      const grilleM = new T.MeshStandardMaterial({ map: latT, alphaTest: 0.35, color: 0x3a8a5a, metalness: 0.7, roughness: 0.35, side: T.DoubleSide });
      box(0.6, CEIL + 2.6, NZ * BAY, M.stone, -X0 + 6, (CEIL + 2.6) / 2, 0);
      const gr = new T.Mesh(new T.PlaneGeometry(14, 4.4), grilleM); gr.rotation.y = -Math.PI / 2; gr.position.set(-X0 - 0.2, 2.4, -10); S.add(gr);
      const grFrame = box(0.3, 0.4, 14.4, M.brass, -X0 - 0.2, 4.7, -10); box(0.3, 0.3, 14.4, M.brass, -X0 - 0.2, 0.15, -10);
      const goldBand = box(0.2, 0.7, 14.4, M.green, -X0 - 0.15, 5.3, -10);
      box(6, CEIL + 2.6, 0.6, M.stone, -X0 + 3, (CEIL + 2.6) / 2, -18.5);
      w.addBox(-X0 - 0.6, Z0, -X0 + 6, -Z0);
      // the minbar: white marble steps under a green-and-gold spire, west of the Rawdah
      const mb = new T.Group(); mb.position.set(-13.2, 0, -16.6); S.add(mb);
      for (let k = 0; k < 9; k++) { const st = new T.Mesh(new T.BoxGeometry(1.2, 0.32, 0.5), M.marble); st.position.set(0, 0.16 + k * 0.32, 3.2 - k * 0.42); st.scale.y = 1 + k * 0.0; mb.add(st); const blk = new T.Mesh(new T.BoxGeometry(1.2, 0.16 + k * 0.32, 0.42), M.marble); blk.position.set(0, (0.16 + k * 0.32) / 2, 3.2 - k * 0.42); mb.add(blk); }
      [-0.65, 0.65].forEach(dx => { const side = new T.Mesh(new T.BoxGeometry(0.12, 3.4, 4.2), M.marble); side.position.set(dx, 1.7, 1.4); mb.add(side); });
      const kiosk = new T.Mesh(new T.BoxGeometry(1.3, 2.2, 1.3), M.marble); kiosk.position.set(0, 4.0, -0.4); mb.add(kiosk);
      const spire = new T.Mesh(new T.ConeGeometry(0.85, 3.0, 8), M.green); spire.position.set(0, 6.6, -0.4); mb.add(spire);
      const fin = new T.Mesh(new T.SphereGeometry(0.18, 10, 8), M.brass); fin.position.set(0, 8.2, -0.4); mb.add(fin);
      const gate = new T.Mesh(new T.BoxGeometry(1.25, 2.2, 0.1), new T.MeshStandardMaterial({ map: latT, alphaTest: 0.35, color: 0xc89a50, metalness: 0.8, roughness: 0.3, side: T.DoubleSide })); gate.position.set(0, 1.1, 3.5); mb.add(gate);
      w.addBox(-14, -17.5, -12.4, -12.8);
      // the Prophet's prayer niche: a marble mihrab with gilded hood, between minbar and grille
      const mh = new T.Group(); mh.position.set(-4.6, 0, -19.4); S.add(mh);
      mh.add(Object.assign(new T.Mesh(new T.BoxGeometry(2.6, 3.8, 0.6), M.marble), { position: new T.Vector3(0, 1.9, 0) }));
      const niche = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 2.6, 16, 1, true, 0, Math.PI), new T.MeshStandardMaterial({ color: 0xd8c08a, metalness: 0.6, roughness: 0.3, side: T.DoubleSide })); niche.position.set(0, 1.5, 0.3); niche.rotation.y = Math.PI / 2; mh.add(niche);
      mh.add(Object.assign(new T.Mesh(new T.BoxGeometry(2.8, 0.3, 0.7), M.brass), { position: new T.Vector3(0, 3.9, 0) }));

      // brass chandeliers between the domes, and wall lamps along the arcades
      const chG = (() => { const p = []; const ring = new T.TorusGeometry(0.8, 0.05, 6, 24); ring.rotateX(Math.PI / 2); p.push(ring); const ring2 = new T.TorusGeometry(0.5, 0.04, 6, 20); ring2.rotateX(Math.PI / 2); ring2.translate(0, 0.45, 0); p.push(ring2); const rod = new T.CylinderGeometry(0.025, 0.025, 2.6, 4); rod.translate(0, 1.6, 0); p.push(rod); const bowl = new T.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); bowl.translate(0, -0.05, 0); p.push(bowl); return SCAPE.merge(p); })();
      const chPos = bays.filter((_, k) => k % 2 === 0).map(([x, z]) => [x, CEIL - 3.4, z]);
      const chI = new T.InstancedMesh(chG, M.brass, chPos.length); chPos.forEach((p, k) => { m4.makeTranslation(...p); chI.setMatrixAt(k, m4); }); S.add(chI);
      const bulbs = []; chPos.forEach(([x, y, z]) => { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; bulbs.push([x + Math.cos(a) * 0.8, y + 0.12, z + Math.sin(a) * 0.8]); } });
      const bulbI = new T.InstancedMesh(new T.SphereGeometry(0.07, 6, 4), new T.MeshBasicMaterial({ color: 0xffe2b0 }), bulbs.length); bulbs.forEach((p, k) => { m4.makeTranslation(...p); bulbI.setMatrixAt(k, m4); }); S.add(bulbI);

      /* ---------- the courtyard north, the Green Dome over the house, minarets ---------- */
      const cy = new T.Mesh(new T.PlaneGeometry(64, 26).rotateX(-Math.PI / 2), M.floor); cy.position.set(0, 0.012, 33); cy.receiveShadow = true; S.add(cy);
      [-1, 1].forEach(s => box(4, CEIL + 2.6, 26, M.stone, s * 32, (CEIL + 2.6) / 2, 33));
      box(68, CEIL + 2.6, 2, M.stone, 0, (CEIL + 2.6) / 2, 47);
      const umb = (() => { const p = []; const pole = new T.CylinderGeometry(0.15, 0.2, 6, 8); pole.translate(0, 3, 0); p.push(pole); const fur = new T.CylinderGeometry(0.12, 0.7, 4, 10); fur.translate(0, 7.6, 0); p.push(fur); return SCAPE.merge(p); })();
      const ups = []; for (let a = -2; a <= 2; a++) for (let b = 0; b < 2; b++) ups.push([a * 11, 28 + b * 11]);
      const umI = new T.InstancedMesh(umb, M.marble, ups.length); ups.forEach(([x, z], k) => { m4.makeTranslation(x, 0, z); umI.setMatrixAt(k, m4); }); umI.castShadow = true; S.add(umI); ups.forEach(([x, z]) => w.addCircle(x, z, 0.3));
      const gd = KIT.greenDome(w, 0.62); gd.position.set(-X0 + 3, CEIL + 2.6, -8); S.add(gd);
      const minM = PHOTO.mat(w, 'marble_01', { triplanar: 0.2, color: 0xf2ece2, fallback: KIT.plaster(w, [2, 8], '#eee6d8') });
      [[-36, -26], [36, -26], [-36, 50], [36, 50]].forEach(([x, z]) => { const m = KIT.minaret(w, 70, true); m.position.set(x, 0, z); S.add(m); });
      // the city's lights beyond
      const cityT = w.tex(256, (g, s) => { g.fillStyle = '#1a1a22'; g.fillRect(0, 0, s, s); for (let y = 8; y < s; y += 16) for (let x = 6; x < s; x += 14) { g.fillStyle = Math.random() < 0.55 ? '#ffd8a0' : '#2a2a34'; g.fillRect(x, y, 8, 10); } }, [3, 6]);
      const city = SCAPE.scatter(w, { kind: 'house', n: 80, area: { x: 0, z: 0, r: 520 }, scale: [24, 46], seed: 8, avoid: (x, z) => Math.hypot(x, z) < 180 });
      city.meshes.forEach(m => { m.material = new T.MeshStandardMaterial({ map: cityT, emissive: 0xffffff, emissiveMap: cityT, emissiveIntensity: 0.5, roughness: 0.8 }); });
      SCAPE.motes(w, { n: 120, area: [-28, 0.4, -19, 28, 7, 20], color: '#fff0c8', size: 0.1, additive: true });
      SCAPE.birds(w, { n: 10, x: 0, z: 30, y: 26, r: 30, color: 0xe8e4dc, speed: 0.08 });

      /* ---------- the six columns: what the brush wakes in each ---------- */
      const flowerT = w.tex(128, (g, s) => { g.clearRect(0, 0, s, s); g.translate(s / 2, s / 2); for (let p = 0; p < 6; p++) { g.rotate(Math.PI / 3); const gr = g.createRadialGradient(0, 22, 0, 0, 22, 26); gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(1, 'rgba(255,210,140,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 22, 13, 26, 0, 0, 6.283); g.fill(); } g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(0, 0, 9, 0, 6.283); g.fill(); });
      flowerT.wrapS = flowerT.wrapT = T.ClampToEdgeWrapping;
      const flowerM = new T.SpriteMaterial({ map: flowerT, color: 0xfff0c8, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
      this.cols = COLS.map((c, k) => {
        const o = Object.assign({}, c, { k, doneN: 0, done: false, wake: 0 });
        o.glow = KIT.glow(w, 0xffe0a0, 3.2, 0); o.glow.position.set(c.x, 2.2, c.z); S.add(o.glow);
        o.flowers = []; for (let f = 0; f < 18; f++) { const sp = new T.Sprite(flowerM.clone()); const a = f / 18 * Math.PI * 2, h = 0.8 + (f % 6) * 0.42; sp.position.set(c.x + Math.cos(a) * 0.55, h, c.z + Math.sin(a) * 0.55); sp.scale.setScalar(0.001); S.add(sp); o.flowers.push(sp); }
        // a lamp row hung between this column and the next one along x
        const dir = c.x < 0 ? 1 : -1;
        o.lamps = []; for (let l = 0; l < 5; l++) { const g = new T.Group(); g.position.set(c.x + dir * (0.9 + l * 0.85), SPRING - 0.6 - Math.sin(l / 4 * Math.PI) * 0.35, c.z); const lm = new T.Mesh(new T.CylinderGeometry(0.12, 0.09, 0.32, 8), new T.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc870, emissiveIntensity: 0.02, transparent: true, opacity: 0.9 })); g.add(lm); const cap = new T.Mesh(new T.ConeGeometry(0.15, 0.18, 8), M.brass); cap.position.y = 0.24; g.add(cap); const ch = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.6, 3), M.brass); ch.position.y = 0.6; g.add(ch); const gl = KIT.glow(w, 0xffd090, 1.0, 0); g.add(gl); S.add(g); o.lamps.push({ g, lm, gl, on: 0 }); }
        // the knot of light bound round the column (untied by a loop), or the door it opens
        o.knot = new T.Mesh(new T.TorusKnotGeometry(0.62, 0.04, 120, 8, 2, 5), new T.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); o.knot.position.set(c.x, 1.6, c.z); o.knot.rotation.x = Math.PI / 2; S.add(o.knot);
        const plaque = new T.Mesh(new T.PlaneGeometry(0.62, 0.3), this.plaqueMat(w, c)); plaque.position.set(c.x, 2.75, c.z + 0.49); S.add(plaque);
        return o;
      });
      // the door of the delegations: the bronze door in the north arcade, closed till a loop opens it
      const doorT = w.tex(256, (g, s) => { g.fillStyle = '#7a5a2a'; g.fillRect(0, 0, s, s); g.strokeStyle = '#d8b060'; g.lineWidth = 6; g.strokeRect(10, 10, s - 20, s - 20); for (let y = 30; y < s; y += 40) for (let x = 30; x < s; x += 40) { g.fillStyle = '#e8c070'; g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.fill(); } g.save(); g.translate(s / 2, s / 2); g.strokeStyle = '#e8c070'; g.lineWidth = 4; U.star8(g, 0, 0, 50, 0.65); g.stroke(); g.restore(); });
      this.door = [-1, 1].map(s => { const piv = new T.Group(); piv.position.set(2.5 + s * 1.6, 0, 20); const leaf = new T.Mesh(new T.BoxGeometry(1.6, 3.8, 0.12), new T.MeshStandardMaterial({ map: doorT, metalness: 0.7, roughness: 0.35 })); leaf.position.set(-s * 0.8, 1.9, 0); leaf.castShadow = true; piv.add(leaf); piv.userData.s = s; S.add(piv); return piv; });
      this.doorBox = { x0: 0.9, x1: 4.1, z0: 19.7, z1: 20.3 }; w.addBox(0.9, 19.7, 4.1, 20.3);
      // the north arcade wall with its doors (the hall opens to the courtyard through arches)
      for (let a = 0; a < NX; a++) { const x = X0 + (a + 0.5) * BAY; if (a === 6 || a === 0 || a === 11) continue; const scr = new T.Mesh(new T.PlaneGeometry(4.1, 3.8), new T.MeshStandardMaterial({ map: latT, alphaTest: 0.35, color: 0xc89a50, metalness: 0.7, roughness: 0.35, side: T.DoubleSide })); scr.position.set(x, 1.9, 20); S.add(scr); w.addBox(x - 2.5, 19.7, x + 2.5, 20.3); }
      this.cols.forEach(o => { o.lamps.forEach(l => { l.g.userData.dynamic = true; }); });

      /* ---------- the brush: a parchment overlay and an ink canvas ---------- */
      const cv = env.canvas2d({ alpha: true }); this.cv = cv.canvas; this.cx = cv.ctx; this.cv.style.pointerEvents = 'none'; this.cv.style.opacity = 0; this.cv.style.transition = 'opacity .35s';
      this.paper = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = 'rgb(236,222,190)'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(120,90,50,${Math.random() * 0.08})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1); } return c; })();
      const L = w.ui.layer;
      this.pots = el(L, 'position:absolute;left:24px;top:64px;display:flex;gap:6px;align-items:center;padding:6px 10px;border-radius:4px 12px 4px 12px;background:rgba(6,9,20,.55);border:1px solid rgba(255,240,210,.18);color:#f4ead8;font:500 12px Marcellus,Georgia,serif;letter-spacing:.08em;opacity:0;transition:opacity .5s;pointer-events:none', '');
      this.brushBtn = el(L, 'position:absolute;right:28px;bottom:120px;width:78px;height:78px;border-radius:50%;background:rgba(20,16,10,.55);border:1px solid rgba(255,230,180,.55);color:#fff3dc;font:500 14px Marcellus,Georgia,serif;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;opacity:0;transition:opacity .5s', 'Brush');
      this.brushBtn.addEventListener('pointerdown', e => { e.stopPropagation(); this.toggleBrush(env); });
      this.guideEl = el(L, 'position:absolute;left:50%;top:18%;transform:translateX(-50%);color:#3a2a18;font:500 18px Marcellus,Georgia,serif;letter-spacing:.08em;text-shadow:0 0 12px rgba(255,240,210,.9);opacity:0;transition:opacity .3s;pointer-events:none;text-align:center', '');

      /* ---------- discoveries ---------- */
      [
        { pos: [0, 1.5, -2.2], title: 'A garden of Paradise', text: '“Between my house and my minbar is a garden from the gardens of Paradise.” (Sahih al-Bukhari 1196; Sahih Muslim 1390)', ar: 'ما بين بيتي ومنبري روضةٌ من رياض الجنة' },
        { pos: [-13.2, 1.5, -11.8], title: 'The minbar and the palm trunk', text: 'He ﷺ used to stand by a palm trunk to preach. When a minbar was made and he stood on it, the trunk cried out like a child, until he came down and held it; it had been weeping for the remembrance it used to hear. (Sahih al-Bukhari 3584)', ar: 'فصاحت النخلةُ صياحَ الصبي، ثم نزل النبي ﷺ فضمّه إليه' },
        { pos: [-20, 1.5, 17], title: 'A thousand prayers', text: '“One prayer in this mosque of mine is better than a thousand prayers in any other mosque, except al-Masjid al-Haram.” (Sahih al-Bukhari 1190)', ar: 'صلاةٌ في مسجدي هذا خيرٌ من ألف صلاةٍ فيما سواه إلا المسجد الحرام' },
        { pos: [22, 1.5, 30], title: 'The Green Dome', text: 'The first dome over the Prophet’s ﷺ grave was built of wood in 1279 under Sultan Qalawun. The present dome dates from 1818 and was first painted green in 1837.', ar: 'بُنيت أول قبة على القبر الشريف سنة ٦٧٨هـ، والقبة الحالية من سنة ١٨١٨م، وطُليت بالأخضر أول مرة سنة ١٨٣٧م' },
        { pos: [10, 1.5, -15], title: 'The green carpet', text: 'The Rawdah is marked out by its green carpet and by its distinctively decorated columns, so that it can be found among the rows.', ar: 'تتميّز الروضة بسجادها الأخضر وبأعمدتها المميّزة' },
        { pos: [-24, 1.5, -6], title: 'Mud brick and palm trunks', text: 'In the Prophet’s ﷺ lifetime the mosque was built of mud brick, roofed with palm leaves, on pillars of palm trunks. (Sahih al-Bukhari 446)', ar: 'كان المسجد على عهد رسول الله ﷺ مبنيًّا باللَّبِن، وسقفُه الجريد، وعُمُده خشبُ النخل' },
        { pos: [24, 1.5, 6], title: 'The Ottoman domes', text: 'The small painted domes of this oldest part of the mosque belong to its rebuilding under Sultan Abdulmejid I, begun in 1849 and lasting thirteen years.', ar: 'القباب الصغيرة المزخرفة من عمارة السلطان عبد المجيد الأول التي بدأت سنة ١٨٤٩' },
      ].forEach(d => w.discover(Object.assign(d, { size: 1.3 })));

      /* ---------- sound ---------- */
      const bus = env.bus;
      this.snd = { air: SND.noise(bus, { color: 'brown', type: 'lowpass', freq: 200, gain: 0.04 }) };
      this.murT = 3;
      // input: Space or right-click for the brush; while it is up, the pointer draws
      w.onPointer = (e, p, phase) => {
        if (w.cine) return false;
        if (phase === 'down' && e.button === 2 && !this.brush) { this.toggleBrush(env); return true; }
        if (!this.brush) return false;
        if (phase === 'down') { this.stroke = [[e.clientX, e.clientY, performance.now()]]; SND.step(env.bus, { gain: 0.05, f: 2600 }); }
        else if (phase === 'up' && this.stroke) this.endStroke(env);
        return true;
      };
      host().addEventListener('contextmenu', this._ctx = e => e.preventDefault());
      S.traverse(o => { if (o.isInstancedMesh) { o.userData.dynamic = true; o.frustumCulled = false; } });
      w.bake();
    },
    plaqueMat(w, c) {
      const t = w.tex(256, (g, s) => { g.fillStyle = '#1f5a3e'; g.fillRect(0, 0, s, s); g.strokeStyle = '#d8b060'; g.lineWidth = 8; g.strokeRect(6, 6, s - 12, s - 12); g.fillStyle = '#f0d890'; g.textAlign = 'center'; g.font = '52px Amiri, "Geeza Pro", serif'; g.direction = 'rtl'; g.fillText(c.ar.replace('الأسطوانة', 'أسطوانة').split(' ').slice(-1)[0], s / 2, s * 0.62); });
      t.repeat.set(1, 1); return new T.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.2, emissive: 0x302810, emissiveMap: t, emissiveIntensity: 0.6 });
    },

    /* ---------------- the film ---------------- */
    film(env, w) {
      const self = this, c0 = COLS[0], c1 = COLS[1];
      return [
        { dur: 7, fade: 'dip', title: true, fov: [52, 46], path: [[[-110, 60, 120], [20, 10, -6]], [[-70, 40, 80], [26, 12, -8]], [[-36, 24, 50], [28, 12, -8]]], start: () => SND.glow(env.bus, 196, { gain: 0.05, dur: 7 }) },
        { dur: 6.5, fade: 'dip', path: [[[0, 2.0, 42], [0, 2.4, 20]], [[0, 1.8, 28], [0, 2.2, 0]]],
          lines: [[0.4, 'In the old heart of the Prophet’s Mosque lies ar-Rawdah,', 'في قلب المسجد النبوي القديم تقع الروضة'], [3.4, 'between the place of his house and his minbar.', 'بين موضع بيته ومنبره ﷺ']] },
        { dur: 7, fade: 'dip', ease: 'inout', fov: [40, 50], path: [[[c0.x + 1.6, SPRING + 0.4, c0.z + 1.6], [c0.x, SPRING, c0.z]], [[c0.x + 2.4, 2.4, c0.z + 2.6], [c0.x, 1.4, c0.z]], [[c0.x + 4, 1.2, c0.z + 5], [c0.x - 2, 0.3, c0.z - 2]]],
          lines: [[0.4, '“Between my house and my minbar is a garden', '«ما بين بيتي ومنبري'], [3.4, 'from the gardens of Paradise.” (Sahih al-Bukhari 1196)', 'روضةٌ من رياض الجنة»']], start: () => SND.sing(env.bus, 220, { vowel: 'a', dur: 6, gain: 0.03 }) },
        { dur: 6.5, fade: 'cut', ease: 'linear', path: [[[-10, 1.6, -4], [6, 1.8, -8]], [[6, 1.6, -1], [10, 1.6, -9]]],
          line: 'Its columns carry old names, remembered through the centuries.', ar: 'ولأعمدتها أسماءٌ قديمة توارثتها القرون' },
        { dur: 7, fade: 'cut', path: [[[c1.x + 0.5, 1.7, c1.z + 6], [c1.x, 2.0, c1.z]], [[c1.x + 0.3, 1.7, c1.z + 5.2], [c1.x, 2.0, c1.z]]],
          lines: [[0.3, 'Take up the brush, and the world stills into ink.', 'خُذِ الفرشاة، فيسكن العالمُ حبرًا'], [3.8, 'Draw, and the light answers.', 'ارسم، فيجيبك النور']],
          start: () => { self.filmBrush = 0; },
          during: (w, k, dt) => {
            const on = k > 0.12 && k < 0.82; self.cv.style.opacity = on ? 1 : 0; w.canvas.style.filter = on ? 'sepia(0.7) saturate(0.6) contrast(1.05) brightness(1.05)' : '';
            if (on) { const t = U.clamp((k - 0.18) / 0.4); self.drawDemo(t); }
            if (k > 0.6 && !self._demoLit) { self._demoLit = 1; self.cols[1].lamps.forEach((l, i) => setTimeout(() => { l.on = 1; SND.sing(env.bus, NOTES[i], { vowel: 'a', dur: 1.2, gain: 0.03 }); }, i * 160)); }
          },
          skip: () => { self.cv.style.opacity = 0; w.canvas.style.filter = ''; } },
        { dur: 5.5, fade: 'dip', path: [[[0, 3, 4], [0, 1.6, 14]], [[0, 2.2, 10], [0, 1.7, 14]]], line: 'Six named columns wait in the dark.', ar: 'ستّة أعمدةٍ مسمّاة تنتظر في العتمة',
          start: () => { self.cv.style.opacity = 0; w.canvas.style.filter = ''; self.cols[1].lamps.forEach(l => { l.on = 0; }); self._demoLit = 0; } },
      ];
    },
    filmOpts: { end(w) { const st = ENGINE.cur; if (!st || !st.cols) return; st.cv.style.opacity = 0; w.canvas.style.filter = ''; st.cols.forEach(o => o.lamps.forEach(l => { l.on = 0; })); st.beginPart(0); } },
    drawDemo(t) {
      const g = this.cx, cv = this.cv, w = this.w; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      g.globalAlpha = 0.25; g.drawImage(this.paper, 0, 0, cv.width, cv.height); g.globalAlpha = 1;
      const ls = this.cols[1].lamps, a = ls[0].g.position.clone().project(w.camera), b = ls[4].g.position.clone().project(w.camera);
      const sx = v => (v.x * 0.5 + 0.5) * cv.width, sy = v => (-v.y * 0.5 + 0.5) * cv.height;
      this.inkLine(g, [[sx(a) - 40, sy(a) + 10], [U.lerp(sx(a) - 40, sx(b) + 40, t), U.lerp(sy(a) + 10, sy(b) - 10, t)]], 14 * (cv.width / 960));
    },
    inkLine(g, pts, wd, gold) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let pass = 0; pass < 2; pass++) {
        g.strokeStyle = gold ? (pass ? 'rgba(255,214,120,0.95)' : 'rgba(255,200,90,0.35)') : (pass ? 'rgba(20,14,10,0.92)' : 'rgba(20,14,10,0.25)');
        for (let i = 1; i < pts.length; i++) {
          const sp = pts[i][2] && pts[i - 1][2] ? Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / Math.max(1, pts[i][2] - pts[i - 1][2]) : 0.5;
          g.lineWidth = (pass ? 1 : 2.2) * wd * U.clamp(1.3 - sp * 0.35, 0.45, 1.3);
          g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
        }
      }
    },

    /* ---------------- the game ---------------- */
    beginPart(k) {
      const w = this.w; this.part = k;
      const mine = this.cols.filter(o => o.part === k);
      w.activity(PARTS[k].title, mine.reduce((a, o) => a + o.need.length, 0), PARTS[k].step);
      this.partN = 0; this.pots.style.opacity = 1; this.brushBtn.style.opacity = 1;
      const next = mine.find(o => !o.done); w.goal(next ? [next.x, 2, next.z] : null);
      if (k > 0) SND.glow(ENGINE.env.bus, 220 + k * 30, { gain: 0.05, dur: 5 });
    },
    nearCol() {
      const w = this.w; let best = null, bd = 9;
      this.cols.forEach(o => { if (o.part !== this.part || o.done) return; const d = Math.hypot(o.x - w.pos.x, o.z - w.pos.z); if (d < bd) { bd = d; best = o; } });
      return best;
    },
    toggleBrush(env) {
      const w = this.w; if (!w || w.cine || this.part < 0) return;
      this.brush = !this.brush; this.stroke = null;
      w.enabled = !this.brush;
      this.cv.style.opacity = this.brush ? 1 : 0;
      w.canvas.style.filter = this.brush ? 'sepia(0.7) saturate(0.6) contrast(1.05) brightness(1.05)' : '';
      if (this.brush) { try { document.exitPointerLock(); } catch (_) {} SND.swell(env.bus, { f0: 800, f1: 300, dur: 0.8, gain: 0.03 }); this.target = this.part === 3 ? 'garden' : this.nearCol(); this.redraw(); }
      else { SND.swell(env.bus, { f0: 300, f1: 700, dur: 0.6, gain: 0.02 }); this.guideEl.style.opacity = 0; }
    },
    // what the stroke should touch, in screen pixels
    screenOf(v) { const p = v.clone().project(this.w.camera); return [(p.x * 0.5 + 0.5) * this.env().w, (-p.y * 0.5 + 0.5) * this.env().h, p.z < 1]; },
    env() { return ENGINE.env; },
    redraw() {
      const g = this.cx, cv = this.cv, dpr = cv.width / ENGINE.env.w; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      g.globalAlpha = 0.28; g.drawImage(this.paper, 0, 0, cv.width, cv.height); g.globalAlpha = 1; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = this.target, need = t && t !== 'garden' ? t.need[t.doneN] : t === 'garden' ? 'circle' : null;
      let label = t ? (t === 'garden' ? 'The Rawdah · draw one great circle over the green carpet' : `${t.name} · ${t.ar}`) : 'No column near: walk to a glowing column';
      // ink shadows: a dotted guide in the first two parts' first strokes
      const guided = t && (this.part === 0 || (this.part === 1 && t.k === 2) || t === 'garden');
      if (t && need) {
        g.setLineDash([3, 10]); g.strokeStyle = 'rgba(60,40,20,0.55)'; g.lineWidth = 5; g.beginPath();
        if (need === 'circle') { const c = this.screenOf(t === 'garden' ? new T.Vector3(0, 0.1, -10) : new T.Vector3(t.x, 1.6, t.z)); const r = t === 'garden' ? 180 : 90; if (guided) g.arc(c[0], c[1], r, 0, 6.283); }
        if (need === 'line') { const a = this.screenOf(t.lamps[0].g.position), b = this.screenOf(t.lamps[4].g.position); if (guided) { g.moveTo(a[0] - 30, a[1]); g.lineTo(b[0] + 30, b[1]); } }
        if (need === 'loop') { const c = this.screenOf(new T.Vector3(t.x, 1.6, t.z)); if (guided) { g.moveTo(c[0] - 90, c[1] + 40); g.bezierCurveTo(c[0] + 80, c[1] + 60, c[0] + 60, c[1] - 80, c[0], c[1] - 60); g.bezierCurveTo(c[0] - 60, c[1] - 40, c[0] - 10, c[1] + 60, c[0] + 100, c[1] + 30); } }
        g.stroke(); g.setLineDash([]);
        label += `<br><span style="font-size:14px;opacity:.8">${guided ? 'follow the ink shadow' : need === 'circle' ? 'what would bloom here?' : need === 'line' ? 'what would light here?' : 'what is bound here?'}</span>`;
      }
      this.guideEl.innerHTML = label; this.guideEl.style.opacity = 1;
      if (this.stroke && this.stroke.length > 1) this.inkLine(g, this.stroke, 13);
    },
    move(env, p, e) {
      if (this.brush && this.stroke) { const s = this.stroke, l = s[s.length - 1]; if (Math.hypot(e.clientX - l[0], e.clientY - l[1]) > 3) { s.push([e.clientX, e.clientY, performance.now()]); this.redraw(); } return; }
      this.w && this.w.move(p, e);
    },
    endStroke(env) {
      const pts = this.stroke; this.stroke = null;
      if (this.ink < 1) { this.flashInk(); this.redraw(); return; }
      this.ink -= 1;
      const g = classify(pts), t = this.target;
      const need = t === 'garden' ? 'circle' : t && t.need[t.doneN];
      let ok = false;
      if (g && g.kind && t && g.kind === need) {
        if (need === 'circle') { const c = this.screenOf(t === 'garden' ? new T.Vector3(0, 0.1, -10) : new T.Vector3(t.x, 1.6, t.z)); ok = Math.hypot(c[0] - g.cx, c[1] - g.cy) < Math.max(g.r * 1.3, 60) && (t !== 'garden' || g.r > 90); }
        if (need === 'line') { const ds = t.lamps.map(l => { const s = this.screenOf(l.g.position); return this.distSeg(s, g.a, g.b); }); ok = ds.filter(d => d < 90).length >= 3; }
        if (need === 'loop') { const c = this.screenOf(new T.Vector3(t.x, 1.6, t.z)); const b = g.box, m = 60; ok = c[0] > b[0] - m && c[0] < b[2] + m && c[1] > b[1] - m && c[1] < b[3] + m; }
      }
      // the stroke turns gold and acts, or the ink dries away
      const g2 = this.cx, dpr = this.cv.width / ENGINE.env.w; this.redraw(); g2.setTransform(dpr, 0, 0, dpr, 0, 0); this.inkLine(g2, pts, 13, ok);
      if (ok) { SND.sing(env.bus, 587.33, { vowel: 'a', dur: 1.6, gain: 0.04 }); setTimeout(() => { if (!this.w) return; this.toggleBrush(env); this.act(env, t, need); }, 450); }
      else { SND.sing(env.bus, 196, { vowel: 'u', dur: 0.7, gain: 0.02 }); this.guideEl.innerHTML += `<br><span style="font-size:13px;opacity:.75">${!g || !g.kind ? 'the ink dries — try a cleaner stroke' : g.kind !== need ? `that was a ${g.kind}` : 'draw it over the column'}</span>`; setTimeout(() => this.brush && this.redraw(), 1400); }
    },
    distSeg(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; const t = U.clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); },
    flashInk() { this.pots.style.borderColor = 'rgba(255,120,90,.8)'; setTimeout(() => { if (this.pots) this.pots.style.borderColor = 'rgba(255,240,210,.18)'; }, 600); },
    act(env, t, kind) {
      const w = this.w;
      if (t === 'garden') { this.finale(env); return; }
      if (kind === 'circle') { t.bloom = 1; t.flowers.forEach((f, i) => setTimeout(() => SND.bell && i % 4 === 0 && SND.bell(env.bus, NOTES[(i / 4) | 0] * 2, { gain: 0.012 }), i * 60)); SND.glow(env.bus, 293.66, { gain: 0.05, dur: 4 }); }
      if (kind === 'line') t.lamps.forEach((l, i) => setTimeout(() => { l.on = 1; SND.sing(env.bus, NOTES[i], { vowel: 'a', dur: 1.2, gain: 0.03 }); }, i * 180));
      if (kind === 'loop') { t.untie = 1; if (t.id === 'wufud') this.doorOpen = 1; SND.glow(env.bus, 246.94, { gain: 0.05, dur: 4 }); SND.swell(env.bus, { f0: 300, f1: 900, dur: 1.5, gain: 0.03 }); }
      t.doneN++; this.partN++; w.progress(this.partN);
      if (t.doneN >= t.need.length) {
        t.done = true;
        setTimeout(() => { if (!this.w) return; w.say(t.name, t.text, { ar: t.ar, ms: 14000 }); }, 900);
        const left = this.cols.filter(o => o.part === this.part && !o.done);
        if (left.length) w.goal([left[0].x, 2, left[0].z]);
        else if (this.part < 2) setTimeout(() => this.w && this.beginPart(this.part + 1), 3500);
        else setTimeout(() => { if (!this.w) return; this.part = 3; w.activity('The garden', 1, 'Hold the brush over the green carpet and draw one great circle'); w.goal([0, 0.5, -10]); }, 4000);
      }
    },
    finale(env) {
      const w = this.w; this.done = true; this.gardenT = 0; w.goal(null);
      SND.glow(env.bus, 146.83, { gain: 0.08, dur: 12 }); SND.glow(env.bus, 220, { gain: 0.06, dur: 12, delay: 1 }); SND.glow(env.bus, 293.66, { gain: 0.05, dur: 12, delay: 2 });
      // a garden of light over the whole green carpet
      const f = this.cols[0].flowers[0].material, n = 260, r = U.seeded(54);
      this.garden = []; for (let i = 0; i < n; i++) { const sp = new T.Sprite(f.clone()); sp.position.set(U.lerp(RAW.x0 + 0.5, RAW.x1 - 0.5, r()), 0.12 + r() * 0.5, U.lerp(RAW.z0 + 0.5, RAW.z1 - 0.5, r())); sp.scale.setScalar(0.001); sp.userData.d = Math.hypot(sp.position.x, sp.position.z + 10) / 14; w.scene.add(sp); this.garden.push(sp); }
      setTimeout(() => { if (!this.w) return; w.say('A garden of Paradise', '“Between my house and my minbar is a garden from the gardens of Paradise.” (Sahih al-Bukhari 1196)', { ar: 'ما بين بيتي ومنبري روضةٌ من رياض الجنة', ms: 16000 }); w.finish('The garden answers the brush'); }, 3500);
    },
    onKey(env, e) {
      if (!this.w || this.w.cine) return;
      if (e.key === ' ') this.toggleBrush(env);
      if (e.key === 'Escape' && this.brush) this.toggleBrush(env);
    },
    onLeave() { try { host().removeEventListener('contextmenu', this._ctx); } catch (_) {} },

    update(env, dt) {
      const w = this.w; if (!w) return;
      if (!this.brush) w.update(dt);
      const t = w.time;
      // ink returns slowly
      if (this.part >= 0 && this.ink < 3) { this.inkT += dt; if (this.inkT > 3.5) { this.inkT = 0; this.ink++; SND.drop(env.bus, { f: 900, gain: 0.015 }); } }
      if (this.part >= 0) this.pots.innerHTML = 'INK ' + [0, 1, 2].map(i => `<span style="display:inline-block;width:14px;height:18px;border-radius:3px 3px 6px 6px;border:1px solid rgba(255,230,180,.6);background:${i < this.ink ? 'linear-gradient(#2a2018,#0a0806)' : 'transparent'}"></span>`).join(' ');
      if (w.filmS) { this.pots.style.opacity = 0; this.brushBtn.style.opacity = 0; }
      // the columns of this part glow until their strokes are done
      this.cols.forEach(o => {
        const active = o.part === this.part && !o.done;
        o.glow.material.opacity = U.damp(o.glow.material.opacity, active ? 0.35 + 0.1 * Math.sin(t * 2 + o.k) : 0, 3, dt);
        if (o.bloom) { o.bloomT = Math.min(1, (o.bloomT || 0) + dt / 1.6); o.flowers.forEach((f, i) => { const k = U.clamp(o.bloomT * 1.6 - i / 30); f.scale.setScalar(0.001 + k * (0.42 + 0.08 * Math.sin(t * 2 + i))); f.material.opacity = 0.85; f.material.rotation = t * 0.2 + i; }); }
        o.lamps.forEach(l => { l.lm.material.emissiveIntensity = U.damp(l.lm.material.emissiveIntensity, l.on ? 2.6 : 0.02, 5, dt); l.gl.material.opacity = U.damp(l.gl.material.opacity, l.on ? 0.8 : 0, 5, dt); });
        const need = o.need[o.doneN];
        const bound = o.need.includes('loop') && !o.untie;
        o.knot.material.opacity = U.damp(o.knot.material.opacity, bound ? (active ? 0.6 : 0.25) : 0, 3, dt);
        if (o.untie) { o.knot.position.y += dt * 1.6; o.knot.rotation.z += dt * 2; o.knot.scale.multiplyScalar(1 + dt * 0.6); }
        else o.knot.rotation.z = t * 0.3;
      });
      this.door.forEach(d => { d.rotation.y = U.damp(d.rotation.y, this.doorOpen ? d.userData.s * 1.5 : 0, 2, dt); });
      if (this.doorOpen && !this._doorFree) { this._doorFree = 1; const b = this.doorBox; w.boxes = w.boxes.filter(bb => !(bb[0] === b.x0 && bb[1] === b.z0)); }
      // the bands of the Rawdah's columns brighten as the garden wakes
      const woken = this.cols.filter(o => o.done).length;
      this.bandK = U.damp(this.bandK || 0, woken / 6 * 0.35 + (this.done ? 0.6 : 0), 2, dt);
      if (this.bandMat) this.bandMat.emissiveIntensity = this.bandK;
      if (this.done && this.garden) { this.gardenT += dt; this.garden.forEach((sp, i) => { const k = U.clamp(this.gardenT * 0.5 - sp.userData.d); sp.scale.setScalar(0.001 + k * (0.5 + 0.12 * Math.sin(t * 2 + i))); sp.material.rotation = t * 0.15 + i; }); }
      this.murT -= dt; if (this.murT < 0) { this.murT = U.rnd(5, 10); SND.sing(env.bus, U.pick([110, 123.47, 146.83]), { vowel: 'u', dur: 3.5, gain: 0.008, pan: U.rnd(-0.8, 0.8) }); }
      if (this.brush) this.guideEl.style.opacity = 1;
    },
  });
  function host() { return document.getElementById('host'); }
  ENGINE.register(station);
})();
