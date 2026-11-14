/* Makkah — The Night Journey (al-Isra' wal-Mi'raj), about 620 CE. A rail flyer (after Star Fox,
   Rez and Sky). No image can show this journey and none is attempted: there is no mount, no angel,
   no prophet and no figure of any kind. You are a small light. Part 1 flies the night road from
   beside the Ka'bah over the mountains of Makkah, a canyon, an oasis and a caravan camp to the hills
   of al-Aqsa; Parts 2 and 3 rise through seven heavens of geometric light, each with its own palette
   and pattern, passing through rings that sing as you gather them and through the opening of each
   heaven's gate. The names of the prophets met in each heaven (Sahih al-Bukhari 3887) appear only as
   words in light. Above the seventh stands the Lote Tree of light, and the gift of prayer. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const COL = { x: 0, z: 17 };                 // the column of light beside the House
  const AQ = { x: 0, z: -2600 };               // the sanctuary of al-Aqsa
  const R_H = 58, HH = 92;                     // heavens: helix radius and height of each heaven
  const TURN = 1.25;                           // turns of the helix per heaven
  const HEAVENS = [
    { ar: 'آدَم', pb: 'عَلَيْهِ السَّلَام', en: 'Adam', n: 'The first heaven', hue: '#7a9cff', top: '#0a1440', mid: '#24408a', bot: '#060a20', pts: 6, root: 146.83, pat: 'line' },
    { ar: 'يَحْيَى وَعِيسَى', pb: 'عَلَيْهِمَا السَّلَام', en: 'Yahya and ‘Isa', n: 'The second heaven', hue: '#48dce4', top: '#03282e', mid: '#0e6670', bot: '#021216', pts: 8, root: 164.81, pat: 'side' },
    { ar: 'يُوسُف', pb: 'عَلَيْهِ السَّلَام', en: 'Yusuf', n: 'The third heaven', hue: '#64e08e', top: '#04261a', mid: '#13694a', bot: '#03140c', pts: 10, root: 185.0, pat: 'wave' },
    { ar: 'إِدْرِيس', pb: 'عَلَيْهِ السَّلَام', en: 'Idris', n: 'The fourth heaven', hue: '#f4ca5c', top: '#2a1a04', mid: '#7a5414', bot: '#140c02', pts: 12, root: 196.0, pat: 'orbit', move: true },
    { ar: 'هَارُون', pb: 'عَلَيْهِ السَّلَام', en: 'Harun', n: 'The fifth heaven', hue: '#f4867e', top: '#2c0a0c', mid: '#7a2a30', bot: '#140406', pts: 9, root: 220.0, pat: 'zig', move: true },
    { ar: 'مُوسَى', pb: 'عَلَيْهِ السَّلَام', en: 'Musa', n: 'The sixth heaven', hue: '#b088f8', top: '#160a30', mid: '#462a86', bot: '#0a0618', pts: 10, root: 246.94, pat: 'spiral', move: true },
    { ar: 'إِبْرَاهِيم', pb: 'عَلَيْهِ السَّلَام', en: 'Ibrahim', n: 'The seventh heaven', hue: '#ffeec8', top: '#2a2418', mid: '#8a7a5a', bot: '#141008', pts: 16, root: 293.66, pat: 'wide', move: true },
  ];
  const SCALE = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2];

  /* ---------------- the land: Makkah, the desert road, the hills of al-Aqsa ---------------- */
  const canyonX = z => 34 * Math.sin((z + 700) / 130);
  function height(x, z) {
    let y = 0;
    // Makkah: a sandy valley ringed by granite mountains
    const dm = Math.hypot(x, z * 0.85);
    const ring = Math.max(0, dm - 120);
    let mk = Math.pow(ring, 1.15) * 0.5 * (0.6 + 0.8 * (SCAPE.fbm(x * 0.006 + 3, z * 0.006, 3) * 0.5 + 0.5));
    if (mk > 70) mk = 70 + (mk - 70) * 0.25;
    mk += SCAPE.ridge(x * 0.012, z * 0.012, 4) * 30 * U.smooth(110, 200, dm);
    y = mk * (1 - U.smooth(-420, -560, z));
    // the desert: long swells and dunes, ridges either side of the road
    const desert = U.smooth(-380, -560, z) * (1 - U.smooth(-2150, -2300, z));
    if (desert > 0) {
      let d = 6 + SCAPE.fbm(x * 0.004, z * 0.004, 3) * 14 + Math.abs(Math.sin(x * 0.02 + z * 0.006 + SCAPE.fbm(x * 0.01, z * 0.01, 2) * 2)) * 5;
      d += SCAPE.ridge(x * 0.006 + 7, z * 0.006, 4) * 90 * U.smooth(150, 420, Math.abs(x));
      // the canyon pass: two walls of mesa either side of a winding floor
      const ck = U.smooth(-640, -720, z) * (1 - U.smooth(-1060, -1140, z));
      if (ck > 0) { const off = Math.abs(x - canyonX(z)); d += ck * (52 * U.smooth(26, 44, off) + SCAPE.ridge(x * 0.03, z * 0.03, 3) * 14 * U.smooth(30, 60, off)); }
      // the oasis hollow
      const dO = Math.hypot(x + 30, z + 1360); d -= 5 * (1 - U.smooth(20, 90, dO));
      y = U.lerp(y, d, desert);
    }
    // the hills of al-Aqsa: rounded limestone hills, the sanctuary on a broad flat summit
    const hk = U.smooth(-2100, -2300, z);
    if (hk > 0) {
      let h = 18 + SCAPE.fbm(x * 0.006, z * 0.006, 4) * 30 + SCAPE.ridge(x * 0.01, z * 0.01, 3) * 20;
      const dA = Math.hypot((x - AQ.x) * 0.8, z - AQ.z);
      h = U.lerp(46, h, U.smooth(70, 150, dA));
      h += Math.round(SCAPE.fbm(x * 0.02, z * 0.02, 2) * 2) * 0.6 * U.smooth(80, 160, dA); // terraces
      y = U.lerp(y, h, hk);
    }
    return y + SCAPE.fbm(x * 0.08, z * 0.08, 2) * 0.4;
  }

  /* ---------------- textures of light ---------------- */
  function starPath(g, x, y, r, inner, n, rot) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, rr = i % 2 ? r * inner : r; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath();
  }
  // a disc of geometric light; hole: radius (0..1) of a central opening; holeOff: its offset (0..1)
  function patternTex(n, hole, holeOff) {
    const S = 1024, c = S / 2, R = c - 6, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    const wash = g.createRadialGradient(c, c, 0, c, c, R);
    wash.addColorStop(0, 'rgba(255,255,255,0.04)'); wash.addColorStop(0.8, 'rgba(255,255,255,0.08)'); wash.addColorStop(0.97, 'rgba(255,255,255,0.18)'); wash.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = wash; g.beginPath(); g.arc(c, c, R, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineCap = 'round'; g.lineJoin = 'round';
    const m = n * 2; g.lineWidth = 3;
    for (const k of [3, 5]) { if (k >= n) continue; g.beginPath(); for (let i = 0; i <= m; i++) { const a = (i * k * Math.PI * 2) / m; const x = c + Math.cos(a) * R * 0.94, y = c + Math.sin(a) * R * 0.94; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    [[0.2, 1, 0.5], [0.36, 1, 0.55], [0.53, 2, 0.6], [0.7, 2, 0.62], [0.86, 3, 0.66]].forEach(([rr, mul, inner], b) => {
      const count = n * mul, sr = R * (0.075 - b * 0.004);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * 6.283 + (b % 2) * Math.PI / count, x = c + Math.cos(a) * R * rr, y = c + Math.sin(a) * R * rr;
        g.lineWidth = 2.6; starPath(g, x, y, sr, inner, 8, a); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fill();
      }
      g.lineWidth = 1.6; g.beginPath(); g.arc(c, c, R * (rr + 0.09), 0, 6.283); g.stroke();
    });
    g.lineWidth = 5; g.beginPath(); g.arc(c, c, R * 0.985, 0, 6.283); g.stroke();
    if (hole) {
      const hx = c + (holeOff || 0) * R, hr = hole * R;
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(hx, c, hr * 1.12, 0, 6.283); g.fill(); g.globalCompositeOperation = 'source-over';
      g.strokeStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.arc(hx, c, hr * 1.16, 0, 6.283); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.arc(hx, c, hr * 1.34, 0, 6.283); g.stroke();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; starPath(g, hx + Math.cos(a) * hr * 1.5, c + Math.sin(a) * hr * 1.5, hr * 0.09, 0.45, 8, a); g.fillStyle = '#fff'; g.fill(); }
    } else { g.lineWidth = 3; starPath(g, c, c, R * 0.12, 0.45, n, 0); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fill(); }
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    return t;
  }
  function lightText(ar, pb, en, sub) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 400;
    const g = c.getContext('2d'); g.textAlign = 'center';
    if (sub) { g.font = '30px Marcellus, Georgia, serif'; g.fillStyle = 'rgba(236,226,206,0.85)'; g.shadowColor = 'rgba(255,230,180,0.6)'; g.shadowBlur = 8; g.fillText(sub.toUpperCase().split('').join(' '), 512, 52); }
    g.direction = 'rtl'; g.shadowColor = 'rgba(255,222,150,0.95)'; g.shadowBlur = 34; g.fillStyle = '#fffaea';
    g.font = '120px Amiri, "Geeza Pro", serif'; g.fillText(ar, 512, 180); g.shadowBlur = 14; g.fillText(ar, 512, 180);
    if (pb) { g.font = '40px Amiri, "Geeza Pro", serif'; g.fillStyle = 'rgba(255,240,210,0.85)'; g.fillText(pb, 512, 268); }
    g.direction = 'ltr'; g.shadowBlur = 8; g.font = 'italic 52px Spectral, Georgia, serif'; g.fillStyle = 'rgba(248,240,224,0.95)'; g.fillText(en, 512, 340);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    sp.scale.set(26, 10.2, 1); sp.renderOrder = 5;
    return sp;
  }
  const DOME_V = 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }';
  const DOME_F = `uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot; uniform vec3 uHue; uniform float uTime; uniform float uN; uniform float uK;
    varying vec3 vDir;
    float h(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    void main(){ vec3 d = normalize(vDir); float y = d.y;
      vec3 col = y > 0. ? mix(uMid, uTop, pow(clamp(y, 0., 1.), 0.6)) : mix(uMid, uBot, clamp(-y * 2.5, 0., 1.));
      float a = atan(d.z, d.x), lat = asin(clamp(y, -1., 1.));
      float l1 = abs(sin(a * uN * 0.5 + uTime * 0.03)), l2 = abs(sin(lat * uN * 0.75 - uTime * 0.02)), l3 = abs(sin((a + lat) * uN * 0.5)), l4 = abs(sin((a - lat) * uN * 0.5));
      float pat = smoothstep(0.985, 1., 1. - min(min(l1, l2), min(l3, l4)) * 0.0) * 0.;
      pat += smoothstep(0.035, 0.0, l3) + smoothstep(0.035, 0.0, l4);
      pat += smoothstep(0.02, 0.0, l2) * 0.6;
      col += uHue * pat * 0.10 * uK * (0.6 + 0.4 * smoothstep(-0.2, 0.6, y));
      vec3 c = floor(d * 300.); float s = h(c);
      col += vec3(1.) * smoothstep(0.9975, 1., s) * (0.6 + 0.4 * sin(uTime * (1. + s * 3.) + s * 40.)) * uK;
      col += uHue * exp(-abs(y) * 10.) * 0.12 * uK;
      gl_FragColor = vec4(col, 1.); }`;

  ENGINE.register(WORLD.stage({
    key: 'isra',
    arabic: 'الإِسْرَاءُ وَالمِعْرَاج',
    title: 'The Night Journey',
    era: 'Makkah to al-Aqsa · about 620 CE · al-Isra’ wal-Mi‘raj, in light alone',
    hint: 'Steer the light with WASD, the arrow keys or the mouse · fly through the rings · Space to surge, Shift to slow · steer into the glowing lamps to discover',
    hintTouch: 'Drag to steer the light · fly through the rings · SURGE and SLOW buttons',
    sound: { reverb: 0.9 },
    story: `<p>About a year before the Hijrah (scholars differ on the exact date), he was taken by night from the Sacred Mosque in Makkah to al-Masjid al-Aqsa, and from there raised through the seven heavens (Sahih al-Bukhari 3887).</p>
            <p class="q"><span class="ar">سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى</span>“Glory be to Him who took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa.” (Qur’an 17:1)</p>
            <p>No image can show this journey. Here there is no figure of any kind: you are a small light, and the names appear only as words in light.</p>`,

    enter(env) {
      const self = this;
      try { document.fonts && document.fonts.load('128px Amiri'); } catch (_) {}
      const w = this.w = WORLD.create(env, { start: { x: COL.x, z: COL.z + 6, yaw: 0, pitch: 0.1 }, exposure: 0.95, far: 3200, fov: 66, fog: { color: 0x0b1222, density: 0.0007 } });
      const S = w.scene;
      this.touch = matchMedia('(pointer: coarse)').matches;

      /* ---------- terrain and sky ---------- */
      const ter = SCAPE.terrain(w, { size: 3600, seg: 320, cx: 0, cz: -1300, height, rock: [0.62, 0.86], colors: { low: '#8e7e6a', high: '#84745e', rock: '#7e7064', dark: '#4e4440' }, photo: { ground: 'dense_sand', rock: 'rock_boulder_dry', normal: 1 }, rep: 0.12, rockRep: 0.03 });
      const ground = w.ground = ter.ground; this.ground = ground;
      const moonDir = new T.Vector3(0.35, 0.5, -0.8).normalize(); this.moonDir = moonDir;
      w.sky({ top: '#04070f', mid: '#16203a', bot: '#070a12', sunDir: moonDir.toArray(), sun: '#8a98c0', sunSize: 0.0004, stars: 1.4, haze: 0.2 });
      const moon = new T.DirectionalLight(0xb4c4ff, 0.45); moon.position.copy(moonDir).multiplyScalar(100); S.add(moon); this.moon = moon;
      S.add(new T.HemisphereLight(0x5068a0, 0x1a1612, PHOTO.enabled ? 0.1 : 0.5));
      this.photoSky = null;
      PHOTO.sky(w, 'qwantani_night_puresky', { sun: moon, intensity: 0.06, gain: 0.55, haze: '#141c30', horizon: 0.5, rotation: 1.0, ground: '#3a3430', bounce: 0.35 }).then(o => { moon.position.copy(moonDir).multiplyScalar(100); this.photoSky = o; });
      SCAPE.horizon(w, { cx: 0, cz: -1300, haze: '#121a2c', layers: [{ r: 2000, h: 140, color: '#1a1e2a' }, { r: 2500, h: 180, color: '#222a3c' }, { r: 2900, h: 200, color: '#2a3248' }] });
      // the moon, a thin crescent
      const cresT = w.tex(256, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(220,230,255,0.22)'); gr.addColorStop(1, 'rgba(220,230,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
        g.fillStyle = '#f4f0e4'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.16, 0, 6.283); g.fill();
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(s / 2 - s * 0.065, s / 2 - s * 0.035, s * 0.15, 0, 6.283); g.fill();
      });
      cresT.wrapS = cresT.wrapT = T.ClampToEdgeWrapping;
      this.cres = new T.Sprite(new T.SpriteMaterial({ map: cresT, transparent: true, depthWrite: false, fog: false })); this.cres.scale.set(130, 130, 1); S.add(this.cres);

      /* ---------- materials ---------- */
      const granite = SCAPE.tex.granite(w);
      const plaster = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.25, fallback: SCAPE.tex.mud(w), color: 0xfff4e4 });
      const limestone = PHOTO.mat(w, 'plastered_stone_wall', { triplanar: 0.2, fallback: granite, color: 0xe8e0d0 });
      const wallM = PHOTO.mat(w, 'old_stone_wall', { rep: [1, 1], fallback: granite, color: 0xd8ccb8 });
      const kStone = PHOTO.mat(w, 'old_stone_wall', { rep: [1, 1], fallback: granite, color: 0x6a645e });
      const beamM = PHOTO.mat(w, 'medieval_wood', { rep: [3, 0.3], fallback: KIT.wood(w), color: 0x8a7058 });
      const linen = PHOTO.mat(w, 'rough_linen', { rep: [2, 2], fallback: KIT.plaster(w, [2, 2], '#d8c8a8'), color: 0xcdb898, side: T.DoubleSide });
      const darkLinen = PHOTO.mat(w, 'rough_linen', { rep: [2, 2], fallback: KIT.plaster(w, [2, 2], '#6a5040'), color: 0x5a4434, side: T.DoubleSide });

      /* ---------- Makkah: the House, the courtyard lamps, the city ---------- */
      {
        const W = 11, D = 12.5, H = 9;
        const kb = new T.Mesh(new T.BoxGeometry(W, H, D), kStone); kb.position.set(0, ground(0, 0) + H / 2 - 0.2, 0); S.add(kb);
        // the courses of timber between the courses of stone
        for (let i = 1; i < 6; i++) { const b = new T.Mesh(new T.BoxGeometry(W + 0.08, 0.22, D + 0.08), beamM); b.position.set(0, ground(0, 0) + i * 1.55, 0); S.add(b); }
        w.addBox(-W / 2, -D / 2, W / 2, D / 2);
        const lampPos = [];
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * 6.283 + 0.3, x = Math.cos(a) * 22, z = Math.sin(a) * 22 * 1.05, y = ground(x, z);
          const post = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 2.6, 6), beamM); post.position.set(x, y + 1.3, z); S.add(post);
          PHOTO.place(w, 'brass_diya_lantern', { pos: [x, y + 2.6, z], s: 2.4 });
          const gl = KIT.glow(w, 0xffb060, 1.5, 0.85); gl.position.set(x, y + 2.85, z); S.add(gl); lampPos.push([x, y + 2.85, z]);
        }
        const l1 = new T.PointLight(0xffa860, 1.2, 30, 1.8); l1.position.set(-10, 4, 16); S.add(l1);
        const l2 = new T.PointLight(0xffa860, 1.0, 30, 1.8); l2.position.set(12, 4, -14); S.add(l2);
        const hs = SCAPE.scatter(w, { kind: 'house', n: 700, area: { x: 0, z: 0, r: 200 }, scale: [8, 14], seed: 61, collide: false, avoid: (x, z) => Math.hypot(x, z) < 34, density: (x, z) => 1 - U.smooth(90, 190, Math.hypot(x, z)) * 0.8 });
        hs.meshes.forEach(m => { m.material = plaster; });
        SCAPE.scatter(w, { kind: 'palm', n: 40, area: { x: 0, z: 0, r: 170 }, scale: [8, 12], seed: 62, avoid: (x, z) => Math.hypot(x, z) < 34 });
        const fires = []; const r3 = U.seeded(7);
        for (let i = 0; i < 260; i++) { const a = r3() * 6.283, dd = 36 + Math.pow(r3(), 0.9) * 160; const x = Math.cos(a) * dd, z = Math.sin(a) * dd; fires.push(x, ground(x, z) + 1.2 + r3() * 5, z); }
        hs.list.forEach((h, i) => { if (i % 3) return; const d = Math.max(h.sx || h.s, h.sz || h.s) * 0.52; fires.push(h.x + Math.sin(h.ry) * d, (h.y || 0) + 1.4 + (i % 2) * 1.6, h.z + Math.cos(h.ry) * d); });
        const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.BufferAttribute(new Float32Array(fires), 3));
        const fp = new T.Points(fg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffa858, size: 3.2, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.85 }));
        fp.frustumCulled = false; S.add(fp);
        SCAPE.smoke(w, { sources: [[60, ground(60, 40) + 5, 40], [-70, ground(-70, -30) + 5, -30], [30, ground(30, -90) + 5, -90]], color: '#3a3a44', height: 30, size: 10, opacity: 0.22 });
        SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 260, area: { x: 0, z: 0, r: 40 }, scale: [1, 2], seed: 63, avoid: (x, z) => Math.abs(x) < 7 && Math.abs(z) < 8 });
      }
      // the column of light beside the House
      const colTex = w.tex(64, (g, s) => { const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      colTex.wrapS = colTex.wrapT = T.ClampToEdgeWrapping;
      const colMat = new T.MeshBasicMaterial({ map: colTex, color: 0xffcf78, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false, fog: false });
      this.column = new T.Mesh(new T.CylinderGeometry(1.4, 1.8, 300, 24, 1, true), colMat); this.column.position.set(COL.x, ground(COL.x, COL.z) + 150, COL.z); this.column.userData.dynamic = true; S.add(this.column);
      this.colGlow = KIT.glow(w, 0xffcf78, 6, 0.7); this.colGlow.position.set(COL.x, ground(COL.x, COL.z) + 0.8, COL.z); S.add(this.colGlow);

      /* ---------- the desert road: canyon, oasis, caravan camp ---------- */
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 220, area: [-160, -1150, 160, -600], scale: [2, 6], seed: 71, density: (x, z) => U.smooth(18, 34, Math.abs(x - canyonX(z))) });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_cliff_01', fallback: 'boulder', fallbackScale: 5, n: 40, area: [-120, -1120, 120, -660], scale: [2.5, 4.5], seed: 72, density: (x, z) => U.smooth(28, 40, Math.abs(x - canyonX(z))) });
      SCAPE.scatter(w, { kind: 'boulder', n: 500, area: [-500, -2200, 500, -350], scale: [3, 12], seed: 73, avoid: (x, z) => Math.abs(x - (z < -640 && z > -1120 ? canyonX(z) : 0)) < 22 });
      SCAPE.scatter(w, { kind: 'rock', n: 900, area: [-300, -2200, 300, -350], scale: [0.8, 3], seed: 74 });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 300, area: [-260, -2200, 260, -350], scale: [1.2, 2.5], seed: 75 });
      SCAPE.scatter(w, { kind: 'thorn', n: 300, area: [-300, -2200, 300, -350], scale: [1, 2], seed: 76 });
      SCAPE.scatter(w, { kind: 'acacia', n: 90, area: [-260, -2100, 260, -400], scale: [1, 1.6], seed: 77, avoid: (x, z) => Math.hypot(x + 30, z + 1360) < 40 });
      SCAPE.scatter(w, { kind: 'palm', n: 90, area: { x: -30, z: -1360, r: 85 }, scale: [7, 12], seed: 78, avoid: (x, z) => Math.hypot(x + 30, z + 1360) < 16 });
      SCAPE.scatter(w, { kind: 'grass', n: 600, area: { x: -30, z: -1360, r: 90 }, scale: [0.6, 1.2], seed: 79 });
      // the oasis pool
      const pool = new T.Mesh(new T.CircleGeometry(16, 40), new T.MeshStandardMaterial({ color: 0x0a1424, roughness: 0.05, metalness: 0.0 })); pool.rotation.x = -Math.PI / 2; pool.position.set(-30, ground(-30, -1360) + 0.6, -1360); S.add(pool);
      // tents of the caravan camp and its fires
      const tent = (x, z, ry, dark) => {
        const y = ground(x, z), g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry;
        const geo = new T.CylinderGeometry(0.01, 3.6, 2.4, 4, 1, true); geo.rotateY(Math.PI / 4); geo.scale(1.4, 1, 0.9); geo.translate(0, 1.2, 0);
        const m = new T.Mesh(geo, dark ? darkLinen : linen); g.add(m);
        for (const sx of [-2.6, 2.6]) { const p = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.6, 5), beamM); p.position.set(sx, 1.2, 0); g.add(p); }
        S.add(g);
      };
      const camp = { x: 24, z: -1800 }, cr = U.seeded(81), campFires = [];
      for (let i = 0; i < 16; i++) { const a = cr() * 6.283, d = 10 + cr() * 40; tent(camp.x + Math.cos(a) * d, camp.z + Math.sin(a) * d, cr() * 3, i % 3 === 0); }
      for (let i = 0; i < 6; i++) { const a = cr() * 6.283, d = 6 + cr() * 30, x = camp.x + Math.cos(a) * d, z = camp.z + Math.sin(a) * d; PHOTO.place(w, 'stone_fire_pit', { pos: [x, undefined, z], s: 1.2 }); const gl = KIT.glow(w, 0xff9040, 4, 0.9); gl.position.set(x, ground(x, z) + 0.8, z); S.add(gl); campFires.push([x, ground(x, z) + 1, z]); }
      const cl = new T.PointLight(0xff9a50, 2.2, 70, 1.6); cl.position.set(camp.x, ground(camp.x, camp.z) + 4, camp.z); S.add(cl);
      SCAPE.smoke(w, { sources: campFires.slice(0, 3), color: '#4a4448', height: 20, size: 5, opacity: 0.2 });
      const oasisL = new T.PointLight(0xffb060, 1.6, 60, 1.6); oasisL.position.set(-30, ground(-30, -1360) + 5, -1340); S.add(oasisL);
      for (let i = 0; i < 5; i++) { const a = i * 1.25, x = -30 + Math.cos(a) * 20, z = -1360 + Math.sin(a) * 20; const gl = KIT.glow(w, 0xffb060, 2.5, 0.8); gl.position.set(x, ground(x, z) + 1.5, z); S.add(gl); }

      /* ---------- the hills of al-Aqsa: the sanctuary platform, walls, a town of stone, olive groves ---------- */
      const PY = ground(AQ.x, AQ.z); this.PY = PY;
      {
        const wallH = 9, hw = 70, hd = 52;
        [[0, -hd, hw * 2, 2.4], [0, hd, hw * 2, 2.4], [-hw, 0, 2.4, hd * 2], [hw, 0, 2.4, hd * 2]].forEach(([dx, dz, sx, sz]) => {
          const m = new T.Mesh(new T.BoxGeometry(sx, wallH, sz), wallM); m.position.set(AQ.x + dx, PY - wallH / 2 + 1.2, AQ.z + dz); S.add(m);
        });
        const paveM = PHOTO.mat(w, 'marble_01', { rep: [24, 18], fallback: granite, color: 0xb8b0a4 });
        const pave = new T.Mesh(new T.PlaneGeometry(hw * 2, hd * 2), paveM); pave.rotation.x = -Math.PI / 2; pave.position.set(AQ.x, PY + 0.25, AQ.z); S.add(pave);
        const hs2 = SCAPE.scatter(w, { kind: 'house', n: 380, area: { x: AQ.x, z: AQ.z + 60, r: 260 }, scale: [6, 10], seed: 91, avoid: (x, z) => Math.abs(x - AQ.x) < 80 && Math.abs(z - AQ.z) < 62 });
        hs2.meshes.forEach(m => { m.material = limestone; });
        SCAPE.scatter(w, { kind: 'acacia', n: 220, area: { x: AQ.x, z: AQ.z - 40, r: 420 }, scale: [0.7, 1.0], seed: 92, color: '#9aa878', avoid: (x, z) => Math.abs(x - AQ.x) < 80 && Math.abs(z - AQ.z) < 62 });
        const lamps = []; const r4 = U.seeded(93);
        for (let i = 0; i < 160; i++) { const a = r4() * 6.283, d = 85 + Math.pow(r4(), 0.8) * 200, x = AQ.x + Math.cos(a) * d, z = AQ.z + 60 + Math.sin(a) * d; lamps.push(x, ground(x, z) + 1 + r4() * 4, z); }
        const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(lamps), 3));
        const lp = new T.Points(lg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffb060, size: 3.6, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 }));
        lp.frustumCulled = false; S.add(lp);
        this.aqCol = new T.Mesh(new T.CylinderGeometry(2.2, 2.8, 1200, 24, 1, true), colMat.clone()); this.aqCol.material.opacity = 0; this.aqCol.position.set(AQ.x, PY + 600, AQ.z); this.aqCol.userData.dynamic = true; S.add(this.aqCol);
        this.aqGlow = KIT.glow(w, 0xffcf78, 16, 0.0); this.aqGlow.position.set(AQ.x, PY + 2, AQ.z); S.add(this.aqGlow);
      }

      /* ---------- the rails ---------- */
      const at = (x, alt, z) => new T.Vector3(x, Math.max(ground(x, z), 0) + alt, z);
      const earthPts = [
        // a low arc round the side of the House, then up and away to the north
        new T.Vector3(COL.x - 2, ground(COL.x, COL.z) + 2.4, COL.z + 6), new T.Vector3(COL.x + 13, ground(14, 8) + 5, 6), new T.Vector3(19, ground(19, -10) + 12, -12), new T.Vector3(14, 34, -48),
        new T.Vector3(10, 75, -150), new T.Vector3(-20, 105, -330), new T.Vector3(-40, 80, -500), at(-20, 30, -620),
      ];
      for (let z = -700; z >= -1100; z -= 50) earthPts.push(at(canyonX(z), 18, z));
      earthPts.push(at(-10, 26, -1220), at(-30, 22, -1360), at(-5, 30, -1500), at(20, 26, -1660), at(24, 24, -1800), at(0, 40, -1960), at(-20, 50, -2120), at(-10, 60, -2280), at(0, 48, -2420), at(0, 36, -2520), new T.Vector3(AQ.x + 12, PY + 14, AQ.z + 30));
      // up round the column of light at al-Aqsa into the helix of the heavens
      const helixStart = PY + 30;
      const hp = (ang, y) => new T.Vector3(AQ.x + Math.cos(ang) * R_H, y, AQ.z + Math.sin(ang) * R_H);
      earthPts.push(hp(Math.PI / 2 - 0.5, PY + 22), hp(Math.PI / 2 - 0.9, helixStart));
      this.earth = new T.CatmullRomCurve3(earthPts, false, 'centripetal');
      // the heavens: one helix, a gate every TURN turns
      this.Y0 = helixStart + HH * 0.7; const a0 = Math.PI / 2 - 0.9;
      const hpts = []; const Ntot = 7 * TURN + 0.7 / TURN * TURN;
      const yAt = ang => helixStart + (ang - a0) / (Math.PI * 2 * TURN) * HH;
      const angEnd = a0 + Math.PI * 2 * (TURN * 7 + 0.7 + 0.35);
      for (let ang = a0; ang <= angEnd + 1e-6; ang += Math.PI / 14) hpts.push(hp(ang, yAt(ang)));
      this.heavenRail = new T.CatmullRomCurve3(hpts, false, 'centripetal');
      this.gateAng = k => a0 + Math.PI * 2 * (0.7 + TURN * k);   // gate k opens heaven k+1 (k = 0..7)
      this.yAt = yAt; this.hp = hp; this.a0 = a0;
      this.Le = this.earth.getLength(); this.Lh = this.heavenRail.getLength();
      // arc length of each gate along the heaven rail
      const lens = this.heavenRail.getLengths(4000);
      this.gateS = [];
      for (let k = 0; k <= 7; k++) { const target = this.gateAng(k) - a0, frac = target / (angEnd - a0); this.gateS.push(lens[Math.round(frac * 4000)] * this.Lh / lens[4000]); }

      /* ---------- rings, discoveries and gates ---------- */
      const ringGeo = new T.TorusGeometry(3.2, 0.22, 10, 40);
      this.rings = [];
      const mkRing = (rail, s, ox, oy, hue, k, move) => {
        const m = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: new T.Color(hue), transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
        m.userData.dynamic = true; m.visible = false; S.add(m);
        const gl = KIT.glow(w, new T.Color(hue), 9, 0.35); gl.material.fog = false; gl.visible = false; S.add(gl);
        const R = { rail, s, ox, oy, ox0: ox, oy0: oy, m, gl, hue, k, move, hit: false, miss: false, burst: 0 };
        this.rings.push(R); return R;
      };
      // Part 1: rings weave along the night road
      const er = U.seeded(17);
      for (let s = 260, i = 0; s < this.Le - 120; s += 105 + er() * 30, i++) {
        const pat = i % 6, ox = [0, 4, -4, 5, -5, 0][pat] + (er() - 0.5) * 2, oy = [0, 2, -1, -2, 2, 3][pat] * (i > 10 ? 1.3 : 0.8);
        mkRing('earth', s, ox, oy, '#ffd88a', -1, false);
      }
      // Parts 2 and 3: eight rings in each heaven, each heaven its own pattern
      HEAVENS.forEach((h, k) => {
        const s0 = this.gateS[k], s1 = this.gateS[k + 1];
        for (let j = 0; j < 8; j++) {
          const s = U.lerp(s0, s1, (j + 1.2) / 9.4);
          let ox = 0, oy = 0;
          if (h.pat === 'side') ox = j % 2 ? 5 : -5;
          else if (h.pat === 'wave') { ox = Math.sin(j * 0.9) * 4; oy = Math.cos(j * 0.9) * 3.5; }
          else if (h.pat === 'orbit') { ox = 4.5; oy = 0; }
          else if (h.pat === 'zig') { ox = j % 2 ? 6 : -6; oy = j % 3 - 1; }
          else if (h.pat === 'spiral') { ox = Math.cos(j) * (2 + j * 0.5); oy = Math.sin(j) * (1.5 + j * 0.4); }
          else if (h.pat === 'wide') { ox = (j % 2 ? 1 : -1) * 6.5; oy = j % 2 ? 3 : -3; }
          mkRing('heaven', s, ox, oy, h.hue, k, h.move ? (j % 2 ? 1 : -1) : 0);
        }
      });
      // the gates: a disc of light standing across the rail with an opening
      this.gates = [];
      for (let k = 0; k <= 7; k++) {
        const hue = k < 7 ? HEAVENS[k].hue : '#fff4dc';
        const moveHole = k >= 4 && k <= 7;
        const tex = patternTex(k < 7 ? HEAVENS[k].pts : 12, 0.2, moveHole ? 0.22 : 0);
        const disc = new T.Mesh(new T.CircleGeometry(24, 72), new T.MeshBasicMaterial({ map: tex, color: new T.Color(hue), transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
        const s = this.gateS[k], P = this.heavenRail.getPointAt(Math.min(1, s / this.Lh)), Tn = this.heavenRail.getTangentAt(Math.min(1, s / this.Lh));
        disc.position.copy(P); disc.lookAt(P.clone().add(Tn)); disc.userData.dynamic = true; disc.renderOrder = 2; disc.visible = false; S.add(disc);
        const halo = KIT.glow(w, new T.Color(hue), 12, 0); halo.material.fog = false; halo.visible = false; S.add(halo);
        this.gates.push({ k, disc, halo, s, P, Tn, move: moveHole, ang: 0, passed: false, hue });
      }

      /* ---------- the heavens: a sphere of patterned light for each, a floor of pattern, motes, ornaments ---------- */
      this.domes = HEAVENS.map((h, k) => {
        const yc = this.yAt(this.gateAng(k)) + HH * 0.5;
        const mat = new T.ShaderMaterial({ vertexShader: DOME_V, fragmentShader: DOME_F, side: T.BackSide, depthWrite: false, fog: false,
          uniforms: { uTop: { value: new T.Color(h.top) }, uMid: { value: new T.Color(h.mid) }, uBot: { value: new T.Color(h.bot) }, uHue: { value: new T.Color(h.hue) }, uTime: { value: 0 }, uN: { value: h.pts }, uK: { value: 1 } } });
        const dome = new T.Mesh(new T.SphereGeometry(900, 48, 24), mat); dome.position.set(AQ.x, yc, AQ.z); dome.visible = false; dome.renderOrder = -9; dome.frustumCulled = false; dome.userData.dynamic = true; S.add(dome);
        const floor = new T.Mesh(new T.CircleGeometry(150, 96).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: patternTex(h.pts, 0, 0), color: new T.Color(h.hue), transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
        floor.position.set(AQ.x, yc - HH * 0.75, AQ.z); floor.visible = false; floor.userData.dynamic = true; S.add(floor);
        // floating eight-pointed stars, turning slowly
        const shape = new T.Shape(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 0.55 : 1; i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        const sg = new T.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false }); sg.center();
        const N = 46, orn = new T.InstancedMesh(sg, new T.MeshBasicMaterial({ color: new T.Color(h.hue), transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, fog: false }), N);
        const rr = U.seeded(300 + k), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3();
        const ornL = [];
        for (let i = 0; i < N; i++) { const a = rr() * 6.283, d = R_H + 25 + rr() * 160, y = yc + (rr() - 0.5) * HH * 1.6, s = 2 + rr() * 7; ornL.push({ a, d, y, s, sp: (rr() - 0.5) * 0.4, ph: rr() * 6 }); }
        orn.frustumCulled = false; orn.visible = false; orn.userData.dynamic = true; S.add(orn);
        const motes = SCAPE.motes(w, { n: 140, area: [AQ.x - 120, yc - HH * 0.6, AQ.z - 120, AQ.x + 120, yc + HH * 0.6, AQ.z + 120], color: h.hue, size: 1.4, opacity: 0.7, blink: true, seed: 40 + k });
        motes.pts.visible = false;
        const name = lightText(h.ar, h.pb, h.en, h.n); name.visible = false; S.add(name);
        return { dome, floor, orn, ornL, motes, yc, name, nameT: -1, upd: () => { for (let i = 0; i < N; i++) { const o = ornL[i]; const a = o.a + w.time * o.sp * 0.1; p.set(AQ.x + Math.cos(a) * o.d, o.y + Math.sin(w.time * 0.3 + o.ph) * 2, AQ.z + Math.sin(a) * o.d); e.set(w.time * o.sp + o.ph, w.time * o.sp * 0.7, 0); q.setFromEuler(e); sc.setScalar(o.s); m4.compose(p, q, sc); orn.setMatrixAt(i, m4); } orn.instanceMatrix.needsUpdate = true; } };
      });

      /* ---------- the Lote Tree of light above the seventh heaven ---------- */
      {
        const top = this.yAt(this.gateAng(7));
        this.TREE = { x: AQ.x, y: top + 40, z: AQ.z };
        const TB = this.TREE.y, TX = this.TREE.x, TZ = this.TREE.z;
        const pts = [], cols = [], r = U.seeded(5314);
        const push = (x, y, z, c) => { pts.push(x, y, z); cols.push(c[0], c[1], c[2]); };
        const trunkC = [1, 0.74, 0.38], leafA = [0.62, 0.9, 0.6], leafB = [1, 0.86, 0.5];
        for (let i = 0; i < 1400; i++) { const t = r(), a = r() * 6.283, rad = 4 * (1 - t * 0.5); push(TX + Math.cos(a) * rad + Math.sin(t * 3) * 1.4, TB + t * 30, TZ + Math.sin(a) * rad, trunkC); }
        const limbs = [];
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * 6.283 + r() * 0.4, out = 26 + r() * 26, up = 22 + r() * 24, sx = TX, sy = TB + 26 + r() * 6, sz = TZ;
          const ex = sx + Math.cos(a) * out, ey = sy + up, ez = sz + Math.sin(a) * out * 0.85; limbs.push([ex, ey, ez]);
          for (let i = 0; i < 280; i++) { const t = r(), bend = Math.sin(t * Math.PI) * 4, rad = 1.6 * (1 - t * 0.6), b = r() * 6.283; push(U.lerp(sx, ex, t) + Math.cos(b) * rad, U.lerp(sy, ey, Math.pow(t, 0.7)) + bend + Math.sin(b) * rad, U.lerp(sz, ez, t) + Math.cos(b * 1.3) * rad, trunkC); }
        }
        // leaves of light, broad as the hadith describes
        for (let i = 0; i < 7000; i++) { const L = limbs[i % limbs.length], a = r() * 6.283, u = r() * 2 - 1, rr = Math.cbrt(r()) * (16 + r() * 7); push(L[0] + Math.sqrt(1 - u * u) * Math.cos(a) * rr * 1.3, L[1] + u * rr * 0.55, L[2] + Math.sqrt(1 - u * u) * Math.sin(a) * rr * 1.3, r() < 0.5 ? leafA : leafB); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
        this.tree = new T.Points(geo, new T.PointsMaterial({ map: KIT.glowTex(w), vertexColors: true, size: 1.5, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        this.tree.frustumCulled = false; this.tree.visible = false; S.add(this.tree);
        // four rivers from its root: two that shine, two hidden
        this.rivers = [0, 1, 2, 3].map(i => {
          const a = i * Math.PI / 2 + 0.4, vis = i % 2 === 0, n = 260, P = new Float32Array(n * 3);
          const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3));
          const m = new T.Points(g, new T.PointsMaterial({ map: KIT.glowTex(w), color: vis ? 0xbfe8ff : 0xffe8c0, size: vis ? 1.6 : 0.8, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
          m.frustumCulled = false; m.visible = false; S.add(m); return { a, vis, n, P, g, m };
        });
        this.treeGlow = KIT.glow(w, 0xfff4d8, 170, 0); this.treeGlow.position.set(TX, TB + 40, TZ); this.treeGlow.material.fog = false; S.add(this.treeGlow);
        const fpg = new T.BufferGeometry(); fpg.setAttribute('position', new T.BufferAttribute(new Float32Array(150), 3));
        this.fifty = new T.Points(fpg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffcf78, size: 2.6, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        this.fifty.frustumCulled = false; S.add(this.fifty);
        this.five = [0, 1, 2, 3, 4].map(() => { const g = KIT.glow(w, 0xffc860, 4, 0); g.material.fog = false; S.add(g); return g; });
        this.fiftyPh = Array.from({ length: 50 }, (_, i) => ({ a: (i / 50) * 6.283, r: 11 + (i % 5) * 1.1, y: (i % 7) * 0.6, g: i % 5 }));
        this.finalDome = new T.Mesh(new T.SphereGeometry(900, 48, 24), new T.ShaderMaterial({ vertexShader: DOME_V, fragmentShader: DOME_F, side: T.BackSide, depthWrite: false, fog: false,
          uniforms: { uTop: { value: new T.Color('#3a3220') }, uMid: { value: new T.Color('#b8a478') }, uBot: { value: new T.Color('#2a2418') }, uHue: { value: new T.Color('#fff4dc') }, uTime: { value: 0 }, uN: { value: 16 }, uK: { value: 0.6 } } }));
        this.finalDome.position.set(TX, TB + 40, TZ); this.finalDome.visible = false; this.finalDome.renderOrder = -9; this.finalDome.frustumCulled = false; S.add(this.finalDome);
      }

      /* ---------- the light you steer ---------- */
      this.orb = KIT.glow(w, 0xfff0c8, 1.5, 0.75); this.orb.material.fog = false; S.add(this.orb);
      this.orbCore = KIT.glow(w, 0xffffff, 0.45, 0.9); this.orbCore.material.fog = false; S.add(this.orbCore);
      this.orbLight = new T.PointLight(0xffe6b0, 1.0, 20, 1.8); S.add(this.orbLight);
      const trailN = 70; this.trail = { n: trailN, P: new Float32Array(trailN * 3), i: 0 };
      const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.BufferAttribute(this.trail.P, 3));
      this.trailPts = new T.Points(tg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffd890, size: 0.7, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      this.trailPts.frustumCulled = false; S.add(this.trailPts);
      this.bursts = KIT.dust(w, 120, [0, 0, 0, 1, 1, 1], 0xffffff, 0.5); this.bursts.material.opacity = 0; this.bursts.material.fog = false; S.add(this.bursts);
      this.burstV = new Float32Array(120 * 3); this.burstT = 0;

      /* ---------- discoveries: lamps of light to the side of the rail ---------- */
      this.discs = [];
      const discAt = (rail, s, ox, oy, title, text, ar) => {
        const C = rail === 'earth' ? this.earth : this.heavenRail, L = rail === 'earth' ? this.Le : this.Lh;
        const P = C.getPointAt(s / L), Tn = C.getTangentAt(s / L), R = new T.Vector3().crossVectors(Tn, new T.Vector3(0, 1, 0)).normalize(), Up = new T.Vector3().crossVectors(R, Tn);
        const pos = P.clone().addScaledVector(R, ox).addScaledVector(Up, oy);
        const it = w.discover({ pos: pos.toArray(), title, text, ar, r: 0.01, size: 3.2, color: 0xfff6d8 });
        this.discs.push({ it, pos, rail, s });
      };
      discAt('earth', 330, -6, 2, 'About a Year Before the Hijrah', 'Scholars differ on the date of the Night Journey; a common view places it about a year before the Hijrah, while he was still in Makkah. (Ibn Sa‘d; Ibn Hajar, Fath al-Bari)', 'قَبْلَ الْهِجْرَةِ بِنَحْوِ سَنَة');
      discAt('earth', 1500, 6, -2, 'By Night', '“Glory be to Him who took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa, whose surroundings We have blessed, to show him some of Our signs.” (Qur’an 17:1)', 'لِنُرِيَهُ مِنْ آيَاتِنَا');
      discAt('earth', this.Le - 520, -6, 3, 'Jerusalem Shown', 'When Quraysh would not believe him, he stood in al-Hijr, and Jerusalem was displayed before him, and he described it to them while looking at it. (Sahih al-Bukhari 3886)', 'فَجَلَا اللَّهُ لِي بَيْتَ الْمَقْدِسِ');
      discAt('heaven', U.lerp(this.gateS[0], this.gateS[1], 0.55), 0, 5.5, 'Seven Heavens', 'In each heaven he met a prophet: Adam in the first; Yahya and ‘Isa in the second; Yusuf in the third; Idris in the fourth; Harun in the fifth; Musa in the sixth; and Ibrahim in the seventh. (Sahih al-Bukhari 3887)', 'السَّمَاوَاتُ السَّبْع');
      discAt('heaven', U.lerp(this.gateS[3], this.gateS[4], 0.5), -6.5, -4, 'The Sight Did Not Swerve', '“The sight did not swerve, nor did it go beyond. He certainly saw some of the greatest signs of his Lord.” (Qur’an 53:17–18)', 'مَا زَاغَ الْبَصَرُ وَمَا طَغَى');
      discAt('heaven', U.lerp(this.gateS[6], this.gateS[7], 0.5), 6.5, 4, 'Four Rivers', 'At the Lote Tree four rivers flowed from its root, two hidden and two visible; the visible two were the Nile and the Euphrates. Its fruits were like the jars of Hajar, its leaves like the ears of elephants. (Sahih al-Bukhari 3207)', 'أَرْبَعَةُ أَنْهَار');

      /* ---------- finish ---------- */
      w.followShadow(moon, 80, 2048);
      w.receiveAll();
      [this.column, this.aqCol].forEach(m => { m.castShadow = false; m.receiveShadow = false; });
      S.traverse(m => { if (m.isMesh && !m.isInstancedMesh && !Array.isArray(m.material) && m.geometry.groups.length > 1) m.geometry.clearGroups(); });
      this.baked = w.bake();
      this.post = w.post({ bloom: 0.85, threshold: 0.58, rays: { strength: 0.18, dir: moonDir.toArray(), density: 0.8 }, vignette: 0.45, grain: 0.035, sat: 1.0, contrast: 1.05, lift: [0.012, 0.02, 0.045], gain: [0.98, 1.0, 1.06] });
      // the earth is left behind once the heavens open
      const keep = new Set([this.orb, this.orbCore, this.orbLight, this.trailPts, this.bursts, this.tree, this.treeGlow, this.fifty, this.finalDome, ...this.five, ...this.rivers.map(r => r.m), ...this.rings.map(r => r.m), ...this.rings.map(r => r.gl), ...this.gates.map(g => g.disc), ...this.gates.map(g => g.halo), ...this.domes.flatMap(d => [d.dome, d.floor, d.orn, d.motes.pts, d.name]), ...this.discs.map(d => d.it)]);
      this.earthObjs = S.children.filter(o => !keep.has(o) && !o.isLight && o.renderOrder !== -10 && o !== w.skyMesh && (o.isMesh || o.isSprite || o.isPoints || o.isGroup || o.isInstancedMesh));
      this.discMotes = w.scene.children.filter(o => o.isSprite && this.discs.some(d => d.pos.distanceTo(o.position) < 0.01));

      /* ---------- touch buttons ---------- */
      if (this.touch) {
        const mk = (label, right, fn) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'isra-btn'; b.textContent = label;
          Object.assign(b.style, { position: 'absolute', right: right + 'px', bottom: 'calc(22px + env(safe-area-inset-bottom, 0px))', width: '78px', height: '78px', borderRadius: '50%', border: '1.5px solid rgba(246,220,154,.7)', background: 'rgba(20,24,40,.45)', color: '#f6dc9a', font: '600 12px/1 sans-serif', letterSpacing: '.1em', pointerEvents: 'auto', zIndex: 5 });
          b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); fn(true); });
          b.addEventListener('pointerup', e => { e.stopPropagation(); fn(false); });
          b.addEventListener('pointercancel', () => fn(false));
          w.ui.layer.appendChild(b); return b;
        };
        mk('SURGE', 22, v => { self.tSurge = v; }); mk('SLOW', 112, v => { self.tSlow = v; });
      }
      // touch: dragging anywhere steers
      w.onPointer = (e, p, phase) => {
        if (e.pointerType === 'touch' && phase === 'down') { self.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; return true; }
        if (phase === 'up' && self.drag && e.pointerId === self.drag.id) self.drag = null;
        return false;
      };
      this._move = (e) => { if (self.drag && e.pointerId === self.drag.id) { self.dragV = [(e.clientX - self.drag.x) * 0.06, -(e.clientY - self.drag.y) * 0.06]; self.drag.x = e.clientX; self.drag.y = e.clientY; } };
      window.addEventListener('pointermove', this._move);

      /* ---------- the flight state ---------- */
      Object.assign(this, { rail: 'earth', s: 0, v: 30, ox: 0, oy: 0, vx: 0, vy: 0, heaven: -1, hits: 0, chain: 0, phase: 'fly', finT: 0, part: 0, gathered: 0, lastYaw: w.yaw, lastPitch: w.pitch, slip: 0, dragV: null });
      this.inHeaven = new Array(7).fill(0);
      w.activity('Part 1 of 3 · The night journey', 8, 'Fly through the rings of light toward al-Aqsa');
      w.mode = (dt) => this.fly(env, dt);
      // start the camera where the film hands over
      this.frame(0); const c0 = this.camAt(0, 0, 0);
      w.pos.set(c0.pos.x, 0, c0.pos.z); w.y = c0.pos.y - w.eye;
      const dir = c0.look.clone().sub(c0.pos).normalize(); w.yaw = Math.atan2(-dir.x, -dir.z); w.pitch = Math.asin(dir.y);
      this.lastYaw = w.yaw; this.lastPitch = w.pitch;

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 0.6, gain: 0.04 });
      this.rush = SND.noise(b, { color: 'white', type: 'highpass', freq: 1600, q: 0.5, gain: 0 });
      this.drone = SND.drone(b, 73.42, { vowel: 'u', gain: 0.0 });
      this.cricketClock = 1;
    },

    /* ---------------- the film ---------------- */
    film(env, w) {
      const self = this, G = this.ground, PY = this.PY;
      const at = (x, dy, z) => [x, Math.max(0, G(x, z)) + dy, z];
      const c0 = this.camAt(0, 0, 0);
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [44, 38], path: [[at(160, 120, 200), [0, 6, 0]], [at(90, 70, 150), [0, 6, 0]], [at(30, 34, 110), [0, 8, 0]]],
          start: () => { SND.glow(env.bus, 110, { gain: 0.04, dur: 9 }); self.column.material.opacity = 0; } },
        { dur: 6, fade: 'dip', line: 'Makkah, about a year before the Hijrah. The courtyard sleeps.', ar: 'مكة، قبل الهجرة بنحو عام. الصحنُ ساكن.', ease: 'inout', fov: [50, 44],
          path: [[at(-26, 1.6, 30), [0, 4, 0]], [at(-16, 1.4, 26), [0, 5, 0]]] },
        { dur: 6.5, fade: 'cut', line: '“Glory be to Him who took His servant by night…” (Qur’an 17:1)', ar: 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا', ease: 'inout', fov: [40, 56],
          path: [[at(COL.x + 9, 1.4, COL.z + 12), [COL.x, 2, COL.z]], [at(COL.x + 5, 2.5, COL.z + 8), [COL.x, 40, COL.z]]],
          during: (w, k) => { self.column.material.opacity = U.smooth(0.1, 0.6, k) * 0.16; self.colGlow.material.opacity = 0.3 + U.smooth(0.1, 0.6, k) * 0.6; if (k > 0.1 && !self._c) { self._c = true; SND.glow(env.bus, 146.83, { gain: 0.06, dur: 8, vowel: 'o' }); SND.swell(env.bus, { f0: 200, f1: 1200, dur: 4, gain: 0.06 }); } } },
        { dur: 7, fade: 'dip', line: '…from al-Masjid al-Haram to al-Masjid al-Aqsa.', ar: 'مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى', ease: 'glide', fov: [50, 46],
          path: [[at(60, 30, -760), [canyonX(-900), 10, -900]], [at(canyonX(-850) + 10, 20, -850), [canyonX(-1000), 12, -1000]], [at(canyonX(-950), 16, -950), [-30, 5, -1360]]],
          start: () => { self.column.material.opacity = 0.16; SND.swell(env.bus, { f0: 300, f1: 900, dur: 6, gain: 0.07 }); } },
        { dur: 6.5, fade: 'dip', line: 'From there he was raised through the seven heavens.', ar: 'ومن هناك عُرِج به إلى السماوات السبع.', ease: 'inout', fov: [46, 58],
          path: [[[AQ.x + 160, PY + 50, AQ.z + 170], [AQ.x, PY + 10, AQ.z]], [[AQ.x + 90, PY + 30, AQ.z + 100], [AQ.x, PY + 160, AQ.z]]],
          during: (w, k) => { self.aqCol.material.opacity = U.smooth(0.2, 0.7, k) * 0.2; self.aqGlow.material.opacity = U.smooth(0.2, 0.7, k) * 0.7; } },
        { dur: 5.5, fade: 'white', line: 'No image can show this journey. Here there is only light.', ar: 'لا تستطيع صورةٌ أن تُظهِر هذه الرحلة. هنا نورٌ فحسب.', ease: 'glide', fov: [60, 50],
          path: [[[AQ.x + 20, PY + 60, AQ.z + 20], [AQ.x, this.Y0 + 60, AQ.z]], [[AQ.x + 8, PY + 120, AQ.z + 8], [AQ.x, this.Y0 + 260, AQ.z]]],
          start: () => { self.showHeaven(0, true); SND.glow(env.bus, 146.83, { gain: 0.06, dur: 7 }); },
          during: (w, k) => { self.gates[0].disc.visible = true; self.gates[0].disc.material.opacity = 0.7; self.domes[0].floor.material.opacity = 0.5; } },
        { dur: 6, fade: 'dip', line: 'You are a small light. Fly through the rings, and follow.', ar: 'أنتَ نورٌ صغير. اعبُر الحلقات، واتبَع.', ease: 'inout', fov: [52, 66],
          path: [[at(COL.x + 14, 4, COL.z + 18), [COL.x, 3, COL.z]], [c0.pos.toArray(), c0.look.toArray()]],
          start: () => { self.showHeaven(-1); self.gates[0].disc.visible = false; self.column.material.opacity = 0.16; self.aqCol.material.opacity = 0; } },
      ];
    },
    filmOpts: {
      end(w) {
        const s = ENGINE.cur; if (!s || !s.rings) return;
        s.showHeaven(-1); s.column.material.opacity = 0.16; s.colGlow.material.opacity = 0.9; s.aqCol.material.opacity = 0; s.aqGlow.material.opacity = 0;
        s.rail = 'earth'; s.s = 0; s.ox = s.oy = 0;
        const c0 = s.camAt(0, 0, 0); w.pos.set(c0.pos.x, 0, c0.pos.z); w.y = c0.pos.y - w.eye;
        const dir = c0.look.clone().sub(c0.pos).normalize(); w.yaw = Math.atan2(-dir.x, -dir.z); w.pitch = Math.asin(dir.y);
        s.lastYaw = w.yaw; s.lastPitch = w.pitch;
        s.drone.setGain(0.012); s.wind.set('gain', 0.05, 1);
      },
    },

    /* ---------------- the flight ---------------- */
    curve() { return this.rail === 'earth' ? this.earth : this.heavenRail; },
    len() { return this.rail === 'earth' ? this.Le : this.Lh; },
    frame(s, out) {
      const C = this.curve(), L = this.len(), u = U.clamp(s / L, 0, 1);
      out = out || this._fr || (this._fr = { P: new T.Vector3(), Tn: new T.Vector3(), R: new T.Vector3(), Up: new T.Vector3() });
      C.getPointAt(u, out.P); C.getTangentAt(u, out.Tn);
      out.R.crossVectors(out.Tn, new T.Vector3(0, 1, 0)).normalize(); out.Up.crossVectors(out.R, out.Tn).normalize();
      return out;
    },
    camAt(s, ox, oy) {
      const F = this.frame(s);
      const orb = F.P.clone().addScaledVector(F.R, ox).addScaledVector(F.Up, oy);
      const pos = F.P.clone().addScaledVector(F.R, ox * 0.65).addScaledVector(F.Up, oy * 0.65 + 1.5).addScaledVector(F.Tn, -7.5);
      const look = F.P.clone().addScaledVector(F.Tn, 20).addScaledVector(F.R, ox * 0.9).addScaledVector(F.Up, oy * 0.9);
      return { orb, pos, look, F };
    },
    showHeaven(k, force) {
      this.domes.forEach((d, i) => { const on = i === k; d.dome.visible = on; d.floor.visible = k >= 0 && (on || i === k + 1); d.orn.visible = on; d.motes.pts.visible = on; });
      const sky = k >= 0 || force;
      const skies = this.w.scene.children.filter(o => o.renderOrder === -10);
      skies.forEach(o => { o.visible = !sky && (o === this.w.skyMesh); });
      this.earthObjs.forEach(o => { o.visible = !(k >= 0); });
      this.cres.visible = k < 0;
      if (this.w.scene.fog) this.w.scene.fog.density = k >= 0 ? 0.0 : 0.0007;
    },
    fly(env, dt) {
      const w = this.w, c = w.camera; dt = Math.min(dt, 0.05);
      // steering
      const k = w.keys; let ix = 0, iy = 0;
      if (k.has('a') || k.has('ArrowLeft')) ix -= 1; if (k.has('d') || k.has('ArrowRight')) ix += 1;
      if (k.has('w') || k.has('ArrowUp')) iy += 1; if (k.has('s') || k.has('ArrowDown')) iy -= 1;
      if (w.joy) { ix += w.joy.dx; iy -= w.joy.dy; }
      // mouse (locked or dragged) moves w.yaw/pitch: read the change as steering
      let dyaw = w.yaw - this.lastYaw, dp = w.pitch - this.lastPitch; this.lastYaw = w.yaw; this.lastPitch = w.pitch;
      let mxv = -dyaw * 34, myv = dp * 34;
      if (this.dragV) { mxv += this.dragV[0]; myv += this.dragV[1]; this.dragV = null; }
      const fin = this.phase !== 'fly';
      if (!fin) {
        this.vx = U.damp(this.vx, ix * 13, 8, dt); this.vy = U.damp(this.vy, iy * 11, 8, dt);
        this.ox = U.clamp(this.ox + this.vx * dt + mxv, -8.5, 8.5); this.oy = U.clamp(this.oy + this.vy * dt + myv, -6, 6);
        if (!ix && !mxv) this.ox = U.damp(this.ox, 0, 0.35, dt); if (!iy && !myv) this.oy = U.damp(this.oy, 0, 0.35, dt);
      }
      // speed: Space surges, Shift slows; a ring gives a lift
      const surge = k.has(' ') || this.tSurge, slow = k.has('Shift') || this.tSlow;
      const base = this.rail === 'earth' ? 34 : 30 + Math.max(0, this.heaven) * 1.5;
      this.boost = Math.max(0, (this.boost || 0) - dt * 6);
      const tv = fin ? 11 : base * (surge ? 1.4 : slow ? 0.6 : 1) + this.boost;
      this.v = U.damp(this.v, tv, 2.5, dt);
      const s0 = this.s; this.s += this.v * dt;
      // the rail runs on into the next
      if (this.rail === 'earth' && this.s >= this.Le) { this.rail = 'heaven'; this.s = this.s - this.Le; this.arriveAqsa(env); }
      // gates and heavens
      if (this.rail === 'heaven') this.gatesStep(env, s0, dt);
      if (this.rail === 'heaven' && this.s >= this.Lh - 1) { this.s = this.Lh - 1; }
      const A = this.camAt(this.s, this.ox, this.oy);
      // rings
      this.rings.forEach(R => {
        const vis = R.rail === this.rail && (R.k === -1 ? this.rail === 'earth' : R.k === this.heaven) && R.s > this.s - 20 && R.s < this.s + 420;
        R.m.visible = vis; R.gl.visible = vis;
        if (!vis && !R.burst) return;
        if (R.move) { const a = w.time * 0.9 * R.move; R.ox = R.ox0 * Math.cos(a) - R.oy0 * Math.sin(a); R.oy = U.clamp(R.ox0 * Math.sin(a) + R.oy0 * Math.cos(a), -5.5, 5.5); }
        const F = this.frame(R.s, this._rf || (this._rf = { P: new T.Vector3(), Tn: new T.Vector3(), R: new T.Vector3(), Up: new T.Vector3() }));
        R.m.position.copy(F.P).addScaledVector(F.R, R.ox).addScaledVector(F.Up, R.oy); R.m.lookAt(R.m.position.clone().add(F.Tn));
        R.gl.position.copy(R.m.position);
        if (R.burst > 0) { R.burst = Math.max(0, R.burst - dt * 1.4); R.m.scale.setScalar(1 + (1 - R.burst) * 1.8); R.m.material.opacity = R.burst * 0.9; R.gl.material.opacity = R.burst * 0.6; }
        else if (!R.hit && !R.miss) { const pulse = 0.85 + 0.15 * Math.sin(w.time * 4 + R.s); R.m.scale.setScalar(pulse); R.m.material.opacity = 0.9; R.gl.material.opacity = 0.3; }
        if (!R.hit && !R.miss && s0 < R.s && this.s >= R.s) {
          const d = Math.hypot(this.ox - R.ox, this.oy - R.oy);
          if (d < 3.4) this.ringHit(env, R, A.orb); else this.ringMiss(env, R);
        }
      });
      // discoveries: steer into the lamp
      this.discs.forEach(D => {
        if (D.it.done || D.rail !== this.rail) return;
        if (A.orb.distanceTo(D.pos) < 4.2) { D.it.done = true; D.it.onUse(w, D.it); SND.swell(env.bus, { f0: 600, f1: 2400, dur: 1.2, gain: 0.04 }); }
      });
      // camera, with a bank into the turn
      c.position.copy(A.pos); c.up.set(0, 1, 0); c.lookAt(A.look);
      this.roll = U.damp(this.roll || 0, -this.vx * 0.022 - mxv * 0.4, 5, dt); c.rotateZ(this.roll);
      const fov = 66 + U.clamp((this.v - 30) / 16) * 12; if (Math.abs(c.fov - fov) > 0.05) { c.fov = fov; c.updateProjectionMatrix(); }
      w.pos.set(c.position.x, 0, c.position.z); w.y = c.position.y - w.eye;
      // the light itself and its trail
      this.orb.position.copy(A.orb); this.orbCore.position.copy(A.orb); this.orbLight.position.copy(A.orb);
      const pulse = 1 + 0.08 * Math.sin(w.time * 7); this.orb.scale.setScalar(1.5 * pulse * (1 + this.boost * 0.04)); this.orbCore.scale.setScalar(0.45 * pulse);
      const tr = this.trail; tr.i = (tr.i + 1) % tr.n; tr.P.set([A.orb.x + (Math.random() - 0.5) * 0.2, A.orb.y + (Math.random() - 0.5) * 0.2, A.orb.z + (Math.random() - 0.5) * 0.2], tr.i * 3); this.trailPts.geometry.attributes.position.needsUpdate = true;
      // bursts of light when a ring is gathered
      if (this.burstT > 0) {
        this.burstT -= dt; const a = this.bursts.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) a.setXYZ(i, a.getX(i) + this.burstV[i * 3] * dt, a.getY(i) + this.burstV[i * 3 + 1] * dt, a.getZ(i) + this.burstV[i * 3 + 2] * dt);
        a.needsUpdate = true; this.bursts.material.opacity = Math.max(0, this.burstT) * 0.9;
      }
      // the shadow camera and the moon follow
      if (w._shadow) { const L = w._shadow.light; L.target.position.copy(A.F.P); L.position.copy(A.F.P).addScaledVector(this.moonDir, 200); }
      this.cres.position.copy(c.position).addScaledVector(this.moonDir, 1900);
      // heavens animate
      if (this.heaven >= 0 && this.heaven < 7) { const D = this.domes[this.heaven]; D.dome.material.uniforms.uTime.value = w.time; D.upd(); D.floor.rotation.y += dt * 0.02; }
      this.domes.forEach(D => { if (D.nameT >= 0) { D.nameT += dt; D.name.visible = true; D.name.material.opacity = U.smooth(0, 1.2, D.nameT) * (1 - U.smooth(7, 10, D.nameT)); if (D.nameT > 10) { D.nameT = -1; D.name.visible = false; } } });
      this.gates.forEach(G => { if (!G.disc.visible) return; G.disc.rotation.z = G.move ? w.time * 0.5 * (G.k % 2 ? 1 : -1) : G.disc.rotation.z + dt * 0.05; });
      // sound by speed
      this.rush.set('gain', U.clamp((this.v - 20) / 30) * 0.05, 0.2); this.wind.set('freq', 300 + this.v * 8, 0.3);
      if (this.phase === 'final') this.finale(env, dt);
    },
    ringHit(env, R, orbPos) {
      const w = this.w; R.hit = true; R.burst = 1; this.boost = 8; this.chain++; this.gathered++;
      if (R.k >= 0) this.inHeaven[R.k]++;
      const h = R.k >= 0 ? HEAVENS[R.k] : null, root = h ? h.root : 196;
      const deg = (this.chain - 1) % 8, oct = Math.floor((this.chain - 1) / 8);
      SND.sing(env.bus, root * SCALE[deg] * (oct ? 2 : 1), { vowel: 'a', dur: 1.6, gain: 0.05, voices: 2, attack: 0.03 });
      SND.swell(env.bus, { f0: 800, f1: 2600, dur: 0.6, gain: 0.025, color: 'white' });
      // a burst of motes out from the ring
      const a = this.bursts.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) { a.setXYZ(i, orbPos.x, orbPos.y, orbPos.z); const th = Math.random() * 6.283, ph = Math.acos(Math.random() * 2 - 1), sp = 4 + Math.random() * 8; this.burstV.set([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp], i * 3); }
      a.needsUpdate = true; this.burstT = 1.1; this.bursts.material.color.set(R.hue);
      this.stepText();
    },
    ringMiss(env, R) {
      R.miss = true; this.chain = 0; R.m.material.opacity = 0.2; R.gl.material.opacity = 0.05;
      SND.sing(env.bus, 98, { vowel: 'm', dur: 0.9, gain: 0.02 });
    },
    stepText() {
      const w = this.w;
      if (this.rail === 'earth') w.step(`Fly through the rings toward al-Aqsa · light gathered ${this.gathered}`);
      else if (this.heaven >= 0 && this.heaven < 7) { const need = this.heaven < 3 ? 4 : 5; w.step(`${HEAVENS[this.heaven].n} · rings ${this.inHeaven[this.heaven]} / 8 · the gate opens at ${need}`); }
    },
    arriveAqsa(env) {
      const w = this.w;
      w.progress(1); this.aqCol.material.opacity = 0.2; this.aqGlow.material.opacity = 0.7;
      SND.glow(env.bus, 146.83, { gain: 0.06, dur: 8 }); SND.bell(env.bus, 587.33, { gain: 0.05, delay: 0.3 });
      w.activity('Part 2 of 3 · The first heavens', 8, 'Rise round the column of light to the first gate'); w.progress(1);
      this.drone.set(73.42 * 1.5, 2); this.drone.setGain(0.015);
    },
    gatesStep(env, s0, dt) {
      const w = this.w;
      this.gates.forEach(G => {
        const near = this.s > G.s - 500 && this.s < G.s + 40;
        G.disc.visible = near; G.halo.visible = near;
        if (near) { G.disc.material.opacity = U.damp(G.disc.material.opacity, G.k === 0 || this.gateOpen(G.k) ? 0.8 : 0.35, 3, dt); G.halo.position.copy(G.P); G.halo.material.opacity = G.k === 0 || this.gateOpen(G.k) ? 0.35 : 0.08; }
        if (!G.passed && s0 < G.s && this.s >= G.s) {
          // the opening: centred, or (higher up) turning about the centre
          let hx = 0, hy = 0;
          if (G.move) { const a = G.disc.rotation.z; hx = Math.cos(a) * 5.3; hy = Math.sin(a) * 5.3; }
          const inHole = Math.hypot(this.ox - hx, this.oy - hy) < 5.6 || (!G.move);
          if (G.k > 0 && (!this.gateOpen(G.k) || !inHole)) return this.slipBack(env, G, !this.gateOpen(G.k));
          G.passed = true; this.enterHeaven(env, G.k);
        }
      });
    },
    gateOpen(k) { if (k === 0) return true; const need = k - 1 < 3 ? 4 : 5; return this.inHeaven[k - 1] >= need; },
    slipBack(env, G, needLight) {
      const w = this.w, k = G.k;
      // gently back to the start of this heaven: its rings return
      this.s = this.gates[k - 1].s + 8; this.v = 18; this.chain = 0;
      this.rings.forEach(R => { if (R.k === k - 1 && !R.hit) { R.miss = false; } });
      this.slip++;
      SND.sing(env.bus, 110, { vowel: 'u', dur: 2, gain: 0.03, glide: 1.3 }); SND.swell(env.bus, { f0: 1200, f1: 300, dur: 1.6, gain: 0.04 });
      if (this.post) { this.post.set({ fade: 0.7, fadeColor: HEAVENS[k - 1].mid }); setTimeout(() => this.post && this.post.set({ fade: 0 }), 500); }
      w.say(needLight ? 'Circle once more' : 'The opening turned away', needLight ? `This gate opens for more light: gather ${k - 1 < 3 ? 4 : 5} of the rings in this heaven.` : 'Watch the opening as it turns, and steer into it as you arrive.', { ms: 4500 });
      this.stepText();
    },
    enterHeaven(env, k) {
      const w = this.w;
      SND.glow(env.bus, k < 7 ? HEAVENS[k].root : 293.66, { gain: 0.07, dur: 9, vowel: 'a' });
      SND.bell(env.bus, (k < 7 ? HEAVENS[k].root : 293.66) * 1.5, { gain: 0.05, delay: 0.25 });
      SND.swell(env.bus, { f0: 400, f1: 2400, dur: 2.4, gain: 0.05 });
      if (this.post) { this.post.set({ fade: 0.85, fadeColor: '#fff6e4' }); setTimeout(() => this.post && this.post.set({ fade: 0 }), 260); }
      this.chain = 0;
      if (k === 7) { this.heaven = 7; this.showHeaven(-2); this.phase = 'final'; this.finT = 0; return; }
      this.heaven = k; this.showHeaven(k);
      const D = this.domes[k]; D.nameT = 0;
      const F = this.frame(this.s + 60); D.name.position.copy(F.P).addScaledVector(F.Up, 7);
      this.drone.set(HEAVENS[k].root / 2, 2); this.drone.setGain(0.012 + k * 0.002);
      if (k === 3) w.activity('Part 3 of 3 · The higher heavens', 8, ''); else if (k === 0) w.activity('Part 2 of 3 · The first heavens', 8, '');
      w.progress(k + 1); this.stepText();
      if (k === 3) w.say('The rings begin to turn', 'From here the rings circle, and each gate’s opening turns about its centre. Steer into it as you arrive.', { ms: 6000 });
      if (k === 0) w.goal(null);
    },
    finale(env, dt) {
      const w = this.w, T0 = this.finT, T1 = (this.finT += dt), cross = s => T0 < s && T1 >= s;
      const TR = this.TREE;
      if (cross(0.01)) {
        this.finalDome.visible = true; this.tree.visible = true; this.rivers.forEach(r => { r.m.visible = true; });
        this.domes.forEach(d => { d.floor.visible = false; });
        this.drone.set(146.83 / 2, 3); this.drone.setGain(0.02);
        w.progress(8, 'Sidrat al-Muntaha');
      }
      // the camera leaves the rail and rises slowly toward the tree
      const k = U.smooth(0, 14, T1), c = w.camera, ang = 0.4 + T1 * 0.02;
      const from = this._finFrom || (this._finFrom = c.position.clone());
      const to = new T.Vector3(TR.x + Math.cos(ang) * 120, TR.y + 30, TR.z + Math.sin(ang) * 120);
      c.position.lerpVectors(from, to, k); c.lookAt(TR.x, TR.y + 30 + (1 - k) * 20, TR.z);
      this.orb.position.copy(c.position).addScaledVector(new T.Vector3(TR.x, TR.y + 30, TR.z).sub(c.position).normalize(), 8);
      this.orbCore.position.copy(this.orb.position); this.orbLight.position.copy(this.orb.position);
      const tk = U.smooth(1, 8, T1);
      this.tree.material.opacity = tk * 0.9; this.treeGlow.material.opacity = tk * 0.35;
      this.finalDome.material.uniforms.uTime.value = w.time; this.finalDome.material.uniforms.uK.value = 0.3 + tk * 0.5;
      this.rivers.forEach((r, i) => {
        r.m.material.opacity = tk * (r.vis ? 0.85 : 0.25);
        for (let j = 0; j < r.n; j++) { const u = ((j / r.n) + w.time * 0.05 * (r.vis ? 1 : 0.6)) % 1, d = 6 + u * 160, y = TR.y + 2 - u * 70 + Math.sin(u * 12 + i) * 2; r.P.set([TR.x + Math.cos(r.a + Math.sin(u * 4) * 0.2) * d, y, TR.z + Math.sin(r.a + Math.sin(u * 4) * 0.2) * d], j * 3); }
        r.g.attributes.position.needsUpdate = true;
      });
      if (cross(2)) { SND.glow(env.bus, 98, { gain: 0.08, dur: 14, vowel: 'o' }); SND.glow(env.bus, 146.83, { gain: 0.05, dur: 12, delay: 1.5 }); }
      if (cross(4)) w.say('Sidrat al-Muntaha', '<span class="q">“At the Lote Tree of the Utmost Boundary, near it is the Garden of Refuge, when there covered the Lote Tree that which covered it.”</span> (Qur’an 53:14–16)', { ar: 'عِندَ سِدْرَةِ الْمُنتَهَى', ms: 13000 });
      // fifty lights, which gather into five
      const fk = U.smooth(18, 22, T1), gk = U.smooth(26, 34, T1), fa = this.fifty.geometry.attributes.position;
      this.fiftyPh.forEach((p, i) => {
        const a = p.a + w.time * 0.15, gx = TR.x + Math.cos((p.g / 5) * 6.283 + w.time * 0.1) * 7, gz = TR.z + Math.sin((p.g / 5) * 6.283 + w.time * 0.1) * 7;
        fa.setXYZ(i, U.lerp(TR.x + Math.cos(a) * p.r * 2, gx, gk), U.lerp(TR.y + 18 + p.y, TR.y + 22, gk), U.lerp(TR.z + Math.sin(a) * p.r * 2, gz, gk));
      });
      fa.needsUpdate = true; this.fifty.material.opacity = fk * (1 - gk) * 0.95;
      this.five.forEach((g, i) => { g.position.set(TR.x + Math.cos((i / 5) * 6.283 + w.time * 0.1) * 7, TR.y + 22, TR.z + Math.sin((i / 5) * 6.283 + w.time * 0.1) * 7); g.material.opacity = gk * 0.95; g.scale.setScalar(4 + gk * 3); });
      if (cross(18)) w.say('Fifty, and Five', 'Fifty prayers were enjoined, and at Musa’s urging they were lightened until they were five. <span class="q">“They are five, and they are fifty.”</span> (Sahih al-Bukhari 3887, 349)', { ar: 'هِيَ خَمْسٌ وَهِيَ خَمْسُونَ', ms: 15000 });
      if (cross(26)) [146.83, 185, 220, 293.66, 369.99].forEach((f, i) => SND.sing(env.bus, f, { vowel: 'a', dur: 7, gain: 0.04, delay: i * 0.6, voices: 2 }));
      if (cross(33)) w.finish(this.gathered >= 60 ? 'The Night Journey · every ring of light' : 'The Night Journey');
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      if (w.filmS) {
        this.cres.position.copy(w.camera.position).addScaledVector(this.moonDir, 1900);
        if (w._shadow) { const L = w._shadow.light, c = w.camera.position; L.target.position.set(c.x, Math.max(0, this.ground(c.x, c.z)), c.z); L.position.copy(L.target.position).addScaledVector(this.moonDir, 200); }
        if (this.domes[0].dome.visible) { this.domes[0].dome.material.uniforms.uTime.value = w.time; this.domes[0].upd(); }
      }
      if (this.rail === 'earth' && !w.filmS) {
        this.cricketClock -= dt;
        if (this.cricketClock < 0) { this.cricketClock = 0.6 + Math.random() * 1.6; if (this.s < 200) SND.cricket(env.bus, { gain: 0.004 }); else if (Math.abs(w.pos.z + 1800) < 160) SND.sing(env.bus, U.pick([110, 123.47, 98]), { vowel: 'm', dur: 2.5, gain: 0.01, voices: 3 }); else if (Math.abs(w.pos.z + 1360) < 120) SND.drop(env.bus, { gain: 0.03 }); }
      }
    },
    onLeave() { if (this._move) window.removeEventListener('pointermove', this._move); this._move = null; },
  }));
})();
