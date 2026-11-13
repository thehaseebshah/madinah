/* Makkah — The Farewell Sermon (Hajjat al-Wada'), 10 AH / 632 CE.
   Genre: call and response (Simon, Patapon). The plain of 'Arafat in the late afternoon: the valley
   bottom of 'Uranah and the hair tent at Namirah in the west, a city of tents across the plain, the
   granite hill (Ilal) and its rocks in the east, mountains all round. No person is shown; the
   pilgrims are present as tents, lamps, kneeling camels and murmuring voices.
   The words travel across the plain from relay post to relay post. At each post a voice sings the
   phrase as a pattern on four lamps; you sing it back (← ↓ ↑ → / 1 2 3 4 / click / tap) to pass it
   on, and the tents along the way light and answer. Three parts: listen and answer; keep the pulse;
   the plain answers (phrases grow, then "O God, bear witness" three times at sunset).
   Feeling: a trust handed on. Colour script: amber haze and sand; ivory light for the words. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- layout (metres; north is -z, east is +x) ---------------- */
  const VX = z => -175 + Math.sin(z * 0.012) * 10;          // the valley bottom, Batn 'Uranah
  const SRC = { x: VX(30), z: 30 };                           // where the words begin
  const NAMIRAH = { x: -207, z: -38 };                        // the tent of hair
  const HILL = { x: 162, z: -42 };                            // Ilal, today called Jabal ar-Rahmah
  const POSTS = [[-140, 34], [-108, 44], [-76, 32], [-40, 18], [-6, 30], [28, 14], [62, 22], [94, 6], [120, -6]].map(([x, z]) => ({ x, z }));
  const PARTS = [
    { from: 0, to: 2, title: 'Part 1 of 3 · Listen, then answer', step: 'Listen to the phrase on the four lamps, then sing it back' },
    { from: 3, to: 5, title: 'Part 2 of 3 · Keep the pulse', step: 'Answer in the bar after the call, on the footsteps' },
    { from: 6, to: 8, title: 'Part 3 of 3 · The plain answers', step: 'The phrases grow: each one adds a note to the last' },
  ];
  const NOTES = [220, 246.94, 293.66, 329.63];
  const PADC = ['#ffb347', '#ff8f6b', '#fff3d6', '#a9d4ff'];
  const GLYPH = ['←', '↓', '↑', '→'];
  const KEYMAP = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, '1': 0, '2': 1, '3': 2, '4': 3, z: 0, x: 1, c: 2, v: 3 };
  const SM = '(Sahih Muslim 1218)';
  // the sermon at 'Arafah (Sahih Muslim 1218, from Jabir), phrase by phrase, as the relay carried it
  const WORDS = [
    { en: '“Your blood and your property are sacred to one another,”', ar: 'إِنَّ دِمَاءَكُمْ وَأَمْوَالَكُمْ حَرَامٌ عَلَيْكُمْ' },
    { en: '“as sacred as this day of yours, in this month of yours,”', ar: 'كَحُرْمَةِ يَوْمِكُمْ هَذَا فِي شَهْرِكُمْ هَذَا' },
    { en: '“in this land of yours.”', ar: 'فِي بَلَدِكُمْ هَذَا' },
    { en: '“Everything of the Days of Ignorance is under my feet, abolished.”', ar: 'أَلَا كُلُّ شَيْءٍ مِنْ أَمْرِ الْجَاهِلِيَّةِ تَحْتَ قَدَمَيَّ مَوْضُوعٌ' },
    { en: '“Fear God concerning women.”', ar: 'فَاتَّقُوا اللَّهَ فِي النِّسَاءِ' },
    { en: '“I have left among you that after which you will not go astray,”', ar: 'وَقَدْ تَرَكْتُ فِيكُمْ مَا لَنْ تَضِلُّوا بَعْدَهُ' },
    { en: '“if you hold fast to it: the Book of God.”', ar: 'إِنِ اعْتَصَمْتُمْ بِهِ، كِتَابَ اللَّهِ' },
    { en: '“You will be asked about me; what will you say?”', ar: 'وَأَنْتُمْ تُسْأَلُونَ عَنِّي، فَمَا أَنْتُمْ قَائِلُونَ؟',
      reply: '“We bear witness that you have conveyed, fulfilled and given counsel.”', replyAr: 'نَشْهَدُ أَنَّكَ قَدْ بَلَّغْتَ وَأَدَّيْتَ وَنَصَحْتَ' },
    { en: '“O God, bear witness.”', ar: 'اللَّهُمَّ اشْهَدْ' },
  ];
  // phrases: pads and the beat each note falls on (the answer comes in the bar after the call)
  const PHR = [
    { p: [0, 2, 1], b: [0, 1, 2] },
    { p: [3, 1, 2], b: [0, 1, 2] },
    { p: [0, 3, 2, 1], b: [0, 1, 2, 3] },
    { p: [2, 0, 1, 3], b: [0, 1, 2, 3] },
    { p: [1, 3, 0, 2, 2], b: [0, 1, 2, 3, 3.5] },
    { p: [3, 2, 0, 1, 0], b: [0, 0.5, 1, 2, 3] },
    { p: [0, 2, 3, 1, 2], b: [0, 1, 2, 3, 4] },
    { p: [0, 2, 3, 1, 2, 0], b: [0, 1, 2, 3, 4, 5] },
    { p: [2, 1, 0], b: [0, 1, 2], times: 3 },
  ];
  const BEAT = 60 / 92;

  /* ---------------- ground ---------------- */
  function H(x, z) {
    let y = SCAPE.fbm(x * 0.006 + 3, z * 0.006, 3) * 2.4 + SCAPE.fbm(x * 0.04, z * 0.04, 2) * 0.4 + SCAPE.fbm(x * 0.21, z * 0.21, 2) * 0.06;
    const dv = x - VX(z); y -= 2.8 * Math.exp(-dv * dv / (2 * 9 * 9));
    if (x < VX(z)) y += U.smooth(0, 40, VX(z) - x) * 3;   // the west bank rises a little toward Namirah
    const dh = Math.hypot(x - HILL.x, (z - HILL.z) * 1.15);
    y += 50 * Math.exp(-dh * dh / (2 * 24 * 24)) * (0.85 + 0.3 * SCAPE.fbm(x * 0.07, z * 0.07, 2)) + 9 * Math.exp(-dh * dh / (2 * 55 * 55));
    // granite knolls toward the north edge
    const dk = Math.hypot(x - 60, z - 175); y += 16 * Math.exp(-dk * dk / (2 * 22 * 22)) * (0.7 + 0.5 * SCAPE.ridge(x * 0.05, z * 0.05, 3));
    const d = Math.hypot(x * 0.95, z), m = U.smooth(360, 640, d);
    if (m > 0) y += m * (24 + 150 * SCAPE.ridge(x * 0.0045 + 5, z * 0.0045, 5)) + m * SCAPE.fbm(x * 0.03, z * 0.03, 3) * 14;
    return y;
  }
  const segD = (px, pz, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, t = U.clamp(((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz)); return { d: Math.hypot(px - a.x - dx * t, pz - a.z - dz * t), t }; };
  const ROUTE = [SRC, ...POSTS, HILL];
  const routeD = (x, z) => { let m = 1e9; for (let i = 0; i < ROUTE.length - 1; i++) m = Math.min(m, segD(x, z, ROUTE[i], ROUTE[i + 1]).d); return m; };
  const dirOf = i => { const a = POSTS[i], b = POSTS[i + 1] || HILL; const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); return { x: dx / l, z: dz / l }; };
  const camOf = i => { const p = POSTS[i], d = dirOf(i); return { x: p.x - d.x * 9.5, z: p.z - d.z * 9.5 }; };

  /* ---------------- small geometry helpers ---------------- */
  function ridgeTentGeo() {
    const sh = new T.Shape(); sh.moveTo(-1.35, 0); sh.lineTo(-1.25, 0.08); sh.lineTo(0, 1.75); sh.lineTo(1.25, 0.08); sh.lineTo(1.35, 0); sh.lineTo(-1.35, 0);
    const g = new T.ExtrudeGeometry(sh, { depth: 3.2, bevelEnabled: false }); g.translate(0, 0, -1.6);
    const pole = new T.CylinderGeometry(0.035, 0.04, 2.0, 5); pole.translate(0, 0.95, 1.62);
    return SCAPE.merge([g, pole]);
  }
  function hairTentGeo() {
    // the low, wide black tent of woven goat hair: a roof on three rows of poles, a back wall, an open front
    const roof = new T.PlaneGeometry(6.4, 4.2, 8, 4); roof.rotateX(-Math.PI / 2);
    const p = roof.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, 1.55 + 0.32 * Math.pow(Math.abs(Math.cos(x / 3.2 * Math.PI * 1.5)), 0.6) - Math.abs(z) * 0.18); }
    roof.computeVertexNormals();
    const back = new T.PlaneGeometry(6.4, 1.2, 4, 1); back.translate(0, 0.6, -2.1);
    const side1 = new T.PlaneGeometry(4.2, 1.2); side1.rotateY(Math.PI / 2); side1.translate(-3.2, 0.6, 0);
    const side2 = side1.clone(); side2.translate(6.4, 0, 0);
    [[roof, 3.2, 2.1], [back, 3.2, 0.6], [side1, 2.1, 0.6], [side2, 2.1, 0.6]].forEach(([g, a, b]) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * a, uv.getY(i) * b); });
    return SCAPE.merge([roof, back, side1, side2]);
  }
  function awningGeo() {
    const c = new T.PlaneGeometry(3.6, 3.6, 4, 4); c.rotateX(-Math.PI / 2);
    const p = c.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, 2.35 - 0.18 * (1 - Math.abs(p.getX(i)) / 1.8) * (1 - Math.abs(p.getZ(i)) / 1.8));
    c.computeVertexNormals(); return c;
  }
  function awningPoles() { return SCAPE.merge([[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]].map(([x, z]) => new T.CylinderGeometry(0.04, 0.05, 2.4, 5).translate(x, 1.2, z))); }
  function camelGeo() {
    // a camel kneeling at rest: body, hump, folded legs, a long neck and the head held low
    const parts = [];
    const ell = (rx, ry, rz, x, y, z, rot) => { const g = new T.SphereGeometry(1, 8, 6); g.scale(rx, ry, rz); if (rot) g.rotateZ(rot); g.translate(x, y, z); parts.push(g); };
    ell(1.12, 0.4, 0.4, 0, 0.58, 0);
    ell(0.5, 0.4, 0.33, -0.12, 0.9, 0);
    ell(0.5, 0.15, 0.44, 0.55, 0.14, 0); ell(0.55, 0.16, 0.44, -0.62, 0.15, 0);
    ell(0.22, 0.2, 0.3, 0.9, 0.42, 0);
    const neck = new T.CylinderGeometry(0.09, 0.17, 1.05, 8); neck.rotateZ(-0.5); neck.translate(1.22, 1.08, 0); parts.push(neck);
    ell(0.3, 0.12, 0.11, 1.62, 1.56, 0, -0.18);
    ell(0.05, 0.07, 0.04, 1.44, 1.68, 0.07); ell(0.05, 0.07, 0.04, 1.44, 1.68, -0.07);
    const tail = new T.CylinderGeometry(0.03, 0.02, 0.5, 4); tail.rotateZ(0.3); tail.translate(-1.02, 0.5, 0); parts.push(tail);
    return SCAPE.merge(parts);
  }
  function instanced(w, geo, mat, items, o) {
    o = o || {};
    const im = new T.InstancedMesh(geo, mat, items.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), s = new T.Vector3(), up = new T.Vector3(0, 1, 0), c = new T.Color();
    items.forEach((it, i) => {
      m4.compose(v.set(it.x, (it.y != null ? it.y : w.ground(it.x, it.z)) - (o.sink || 0), it.z), q.setFromAxisAngle(up, it.ry || 0), s.set(it.s * (it.sx || 1), it.s * (it.sy || 1), it.s * (it.sz || 1)));
      im.setMatrixAt(i, m4);
      if (it.col) im.setColorAt(i, c.set(it.col));
    });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = o.cast !== false; im.receiveShadow = true; im.frustumCulled = false; im.userData.dynamic = true;
    w.scene.add(im); return im;
  }
  // woven cloth: narrow loom strips sewn together; the black tents of goat hair carry pale stripes
  function clothMat(w, kind) {
    const map = w.tex(256, (g, s) => {
      g.fillStyle = kind === 'hair' ? '#3e322c' : '#e4d8c2'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 40; i++) { const x = Math.random() * s, y = Math.random() * s, r = 20 + Math.random() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); const c = kind === 'hair' ? '20,14,12' : U.pick(['150,120,90', '255,250,235']); gr.addColorStop(0, `rgba(${c},0.18)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
      for (let y = 0; y < s; y += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`; g.fillRect(0, y, s, 1); }
      for (let x = 0; x < s; x += 3) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; g.fillRect(x, 0, 1, s); }
      if (kind === 'hair') { g.fillStyle = 'rgba(150,126,100,0.55)'; [40, 46, 168, 174].forEach(x => g.fillRect(x, 0, 3, s)); g.fillStyle = 'rgba(10,8,6,0.5)'; [0, 128].forEach(x => g.fillRect(x, 0, 2, s)); }
      else { g.fillStyle = 'rgba(80,60,40,0.22)'; [0, 128].forEach(y => g.fillRect(0, y, s, 2)); }
    }, [1, 1]);
    const m = new T.MeshStandardMaterial({ map, roughness: 1, metalness: 0, side: T.DoubleSide });
    if (PHOTO.enabled) { const n = PHOTO.texture(w, 'rough_linen', 'nor'); n.ready.then(() => { m.normalMap = n; m.normalScale.set(0.8, -0.8); m.needsUpdate = true; }).catch(() => {}); }
    return m;
  }
  // lamps as points that bloom: per-point size, alpha and colour
  const LV = 'attribute float aSize; attribute float aAlpha; attribute vec3 aCol; varying float vA; varying vec3 vC; uniform float uScale; void main(){ vA = aAlpha; vC = aCol; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }';
  const LF = 'uniform sampler2D tMap; varying float vA; varying vec3 vC; void main(){ vec4 t = texture2D(tMap, gl_PointCoord); float a = t.a * vA; if (a < 0.003) discard; gl_FragColor = vec4(vC, a); }';
  function lampPoints(w, n) {
    const geo = new T.BufferGeometry(), P = new Float32Array(n * 3), S = new Float32Array(n), A = new Float32Array(n), C = new Float32Array(n * 3);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aSize', new T.BufferAttribute(S, 1)); geo.setAttribute('aAlpha', new T.BufferAttribute(A, 1)); geo.setAttribute('aCol', new T.BufferAttribute(C, 3));
    const mat = new T.ShaderMaterial({ vertexShader: LV, fragmentShader: LF, transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { tMap: { value: KIT.glowTex(w) }, uScale: { value: w.env.h * 0.9 } } });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true; pts.renderOrder = 3; w.scene.add(pts);
    return { pts, P, S, A, C, geo };
  }

  ENGINE.register(WORLD.stage({
    key: 'arafat',
    arabic: 'خُطْبَةُ الوَدَاع',
    title: 'The Farewell Sermon',
    era: '‘Arafat · 9 Dhu al-Hijjah, 10 AH · 632 CE · the Day of ‘Arafah',
    hint: 'Listen · then sing the phrase back: ← ↓ ↑ → or 1 2 3 4 or click the lamps · WASD to walk between parts',
    hintTouch: 'Listen · then tap the four lamps to sing the phrase back · left thumb to walk between parts',
    sound: { reverb: 0.4 },
    story: `<p>In 10 AH the Prophet ﷺ made his only pilgrimage, the Farewell Pilgrimage. On the Day of ‘Arafah, when the sun had passed its height, he came from his tent at Namirah to the valley bottom and addressed the people (Sahih Muslim 1218, from Jabir).</p>
            <p>Ibn Ishaq reports that a man with a carrying voice, Rabi‘ah ibn Umayyah ibn Khalaf, called out his words to the people: “Say: O people, the Messenger of God says…”</p>
            <p>The low granite hill at the plain’s centre was anciently called Ilal; the name Jabal ar-Rahmah, the Mount of Mercy, is later usage.</p>
            <p class="q"><span class="ar">الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ</span>“This day I have perfected your religion for you.” (Qur’an 5:3)</p>`,

    enter(env) {
      const self = this;
      const c0 = camOf(0), d0 = dirOf(0);
      const w = this.w = WORLD.create(env, {
        start: { x: c0.x, z: c0.z, yaw: Math.atan2(-d0.x, -d0.z), pitch: -0.08 }, exposure: 0.8, far: 2600, speed: 3.4, run: 7.2,
        fog: { color: 0xd9be98, density: 0.0008 }, bounds: [-235, -205, 222, 205], ground: H,
        surface: (x, z) => (Math.hypot(x - HILL.x, z - HILL.z) < 70 ? 'gravel' : 'sand'),
      });
      const S = w.scene, Q = w.quality, r = U.seeded(632);
      this.queue = []; this.dipV = 0; this.dipGoal = 0;
      this.part = -1; this.relay = -1; this.state = 'idle'; this.chorus = 0.15; this.dusk = 0; this.duskT = 0; this.finished = false;

      /* ---------- sky and light ---------- */
      const SUNROT = Math.PI - 0.629;                      // the photographed sun turned to the west
      w.sky({ top: '#5f86b8', mid: '#efcf9e', bot: '#d9be98', sunDir: [-0.94, 0.33, 0], sun: '#ffe2b0', sunSize: 0.0016, clouds: 0.25, haze: 0.45 });
      this.sun = new T.DirectionalLight(0xffe2b8, 1.85); this.sun.position.set(-94, 33, 0); S.add(this.sun);
      this.hemi = new T.HemisphereLight(0xc8d8f0, 0x9a7a5a, PHOTO.enabled ? 0.06 : 0.6); S.add(this.hemi);
      w.followShadow(this.sun, 70, 2048);
      this.skyOpts = { sun: this.sun, intensity: 0.72, rotation: SUNROT, haze: '#d9be98', horizon: 0.5, ground: '#c8a87c', bounce: 0.5 };
      PHOTO.sky(w, 'qwantani_late_afternoon_puresky', this.skyOpts);

      /* ---------- terrain and the far mountains ---------- */
      const ter = SCAPE.terrain(w, { size: 1500, seg: 300, height: H, rock: [0.8, 0.93], rockHeight: [9, 24], colors: { low: '#c9a87e', high: '#b8966e', rock: '#5a4840', dark: '#33281f' },
        tex: 'gravel', rockTex: 'granite', photo: { ground: 'gravelly_sand', rock: 'rock_face_03', normal: 1 }, rep: 0.2, rockRep: 0.05 });
      w.ground = ter.ground;
      SCAPE.horizon(w, { haze: '#dcc4a2', layers: [{ r: 950, h: 120, color: '#8c7464', seed: 3 }, { r: 1400, h: 170, color: '#a48e80', seed: 7 }, { r: 2000, h: 200, color: '#c0b0a4', seed: 11 }] });

      /* ---------- scanned rocks, shrubs, grass ---------- */
      const nearRoute = (x, z, d) => routeD(x, z) < d;
      const onHill = (x, z) => Math.hypot(x - HILL.x, (z - HILL.z) * 1.15);
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 150, area: { x: HILL.x, z: HILL.z, r: 70 }, density: (x, z) => U.smooth(68, 15, onHill(x, z)), scale: [1.5, 4.2], collide: 0.4, seed: 21 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', fallback: 'boulder', n: 60, area: { x: HILL.x - 10, z: HILL.z + 10, r: 80 }, density: (x, z) => U.smooth(80, 30, onHill(x, z)), scale: [0.8, 2.2], collide: 0.4, seed: 22 });
      SCAPE.scatter(w, { kind: 'boulder', n: 260, area: { x: 0, z: 0, r: 700 }, density: (x, z) => U.smooth(330, 420, Math.hypot(x * 0.95, z)) + U.smooth(50, 20, onHill(x, z)), scale: [2, 9], seed: 23 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', variant: 0, fallback: 'rock', n: 280, area: [-235, -205, 222, 205], scale: [0.6, 1.6], avoid: (x, z) => nearRoute(x, z, 2), seed: 24 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', variant: 1, fallback: 'pebble', n: 1100, area: [-235, -205, 222, 205], scale: [0.7, 1.5], seed: 25 });
      SCAPE.scatter(w, { kind: 'rock', n: 520, area: { x: 0, z: 0, r: 360 }, scale: [0.25, 1.1], seed: 26 });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', variant: 0, fallback: 'shrub', n: 170, area: [-235, -205, 222, 205], scale: [0.7, 1.4], avoid: (x, z) => nearRoute(x, z, 3), density: (x, z) => 0.35 + 0.65 * U.smooth(-0.1, 0.4, SCAPE.fbm(x * 0.02, z * 0.02, 2)), seed: 27 });
      SCAPE.scatter(w, { kind: 'grass', n: 1500, area: [-235, -205, 222, 205], scale: [0.35, 0.8], color: '#e6d6b0', density: (x, z) => (Math.abs(x - VX(z)) < 22 ? 1 : 0.25 + 0.75 * U.smooth(0, 0.35, SCAPE.fbm(x * 0.03 + 4, z * 0.03, 2))), avoid: (x, z) => nearRoute(x, z, 1.5), seed: 28, castShadow: false });
      SCAPE.scatter(w, { kind: 'thorn', n: 160, area: [-235, -205, 222, 205], scale: [0.6, 1.3], avoid: (x, z) => nearRoute(x, z, 4), seed: 29 });
      SCAPE.scatter(w, { kind: 'acacia', n: 44, area: [-235, -205, 222, 205], scale: [0.9, 1.5], collide: true, density: (x, z) => (z > 110 || Math.abs(x - VX(z)) < 30 ? 1 : 0.12), avoid: (x, z) => nearRoute(x, z, 9) || onHill(x, z) < 50 || Math.hypot(x - NAMIRAH.x, z - NAMIRAH.z) < 45, seed: 30 });
      SCAPE.scatter(w, { kind: 'acacia', n: 70, area: [-500, -450, 500, 450], scale: [1, 1.6], density: (x, z) => U.smooth(240, 260, Math.hypot(x, z)) * (1 - U.smooth(360, 420, Math.hypot(x * 0.95, z))), seed: 31, castShadow: false });

      /* ---------- the tent city ---------- */
      const linen = clothMat(w, 'wool'), hairCloth = clothMat(w, 'hair');
      const wood = PHOTO.mat(w, 'medieval_wood', { rep: [0.5, 2], fallback: KIT.wood(w, [1, 2], '#6a4a30') });
      const keep = (x, z, pad) => {
        if (Math.abs(x - VX(z)) < 16 + pad || onHill(x, z) < 60 + pad) return false;
        if (Math.hypot(x - NAMIRAH.x, z - NAMIRAH.z) < 26 + pad) return false;
        if (routeD(x, z) < 8 + pad) return false;
        for (const p of POSTS) if (Math.hypot(x - p.x, z - p.z) < 13 + pad) return false;
        return true;
      };
      this.discPts = [];
      const tents = [], hair = [], awn = [], camels = [];
      const cloth = ['#f4ecdc', '#e2d0b0', '#c8aa80', '#a8845c', '#8a6a4c', '#d8c4a0', '#6e5442', '#ece0c8'];
      const N = Math.round(1700 * Math.max(0.6, Q));
      for (let k = 0; tents.length + hair.length + awn.length < N && k < 40000; k++) {
        const x = U.lerp(-215, 205, r()), z = U.lerp(-190, 190, r());
        const edge = 1 - U.smooth(170, 215, Math.hypot(x * 0.95, z * 1.05));
        if (r() > edge * (0.35 + 0.65 * U.smooth(-0.35, 0.15, SCAPE.fbm(x * 0.018 + 7, z * 0.018, 3)))) continue;
        if (!keep(x, z, 0) || this.discPts.some(p => Math.hypot(x - p[0], z - p[1]) < 5)) continue;
        // tents in a camp face one way; camps are rows
        const camp = Math.floor(SCAPE.fbm(x * 0.01, z * 0.01, 2) * 6), ry = camp * 0.5 + (r() - 0.5) * 0.25;
        const kind = r();
        if (kind < 0.16) { hair.push({ x, z, ry, s: 0.9 + r() * 0.35, col: U.pick(['#ffffff', '#e0d8d0', '#c8beb4']) }); if (r() < 0.25 && routeD(x, z) > 18) camels.push({ x: x + Math.cos(ry) * 5, z: z + Math.sin(ry) * 5 + 3, ry: r() * 6.28, s: 0.95 + r() * 0.15, col: U.pick(['#ffffff', '#f0dcc0', '#e0c8a8', '#d4b896']) }); }
        else if (kind < 0.36) awn.push({ x, z, ry, s: 0.85 + r() * 0.35, col: U.pick(cloth) });
        else tents.push({ x, z, ry, s: 0.85 + r() * 0.4, sy: 0.9 + r() * 0.25, col: U.pick(cloth) });
      }
      // camels kneeling by the valley and by the hill too
      for (let i = 0; i < 26; i++) { const z = U.lerp(-150, 150, r()), x = VX(z) + (r() < 0.5 ? -1 : 1) * (19 + r() * 8); if (keep(x, z, -10) && routeD(x, z) > 18) camels.push({ x, z, ry: r() * 6.28, s: 0.95 + r() * 0.15, col: U.pick(['#ffffff', '#f0dcc0', '#e0c8a8']) }); }
      instanced(w, ridgeTentGeo(), linen, tents, { sink: 0.04 });
      instanced(w, hairTentGeo(), hairCloth, hair, { sink: 0.02 });
      instanced(w, awningGeo(), linen, awn);
      instanced(w, awningPoles(), wood, awn);
      const hide = PHOTO.mat(w, 'clay_plaster', { rep: [1, 1], color: 0xffffff, fallback: SCAPE.tex.mud(w) });
      instanced(w, camelGeo(), hide, camels, { sink: 0.04 });
      [...tents, ...hair, ...awn].forEach(t => { if (Math.abs(t.x) < 230 && Math.abs(t.z) < 205) w.addCircle(t.x, t.z, 1.6 * t.s); });
      camels.forEach(c => w.addCircle(c.x, c.z, 1.1));

      // a lamp at every tent's door; a few burn already, the rest wait for the words
      const lampsAt = [...tents.map(t => [t, 1.75, 0.45]), ...hair.map(t => [t, 2.3, 0.6]), ...awn.map(t => [t, 0, 1.6])];
      this.lamps = lampPoints(w, lampsAt.length);
      this.lampInfo = lampsAt.map(([t, off, h], i) => {
        const x = t.x + Math.sin(t.ry) * off, z = t.z + Math.cos(t.ry) * off;
        this.lamps.P.set([x, H(x, z) + h + 0.25, z], i * 3);
        this.lamps.S[i] = 0.9 + r() * 0.5;
        const c = new T.Color(U.pick(['#ffb866', '#ffc47a', '#ffd394', '#ffa860']));
        this.lamps.C.set([c.r, c.g, c.b], i * 3);
        const base = r() < 0.12 ? 0.5 + r() * 0.4 : 0;
        return { x, z, base, litAt: 1e9, a: base };
      });
      this.lamps.geo.attributes.position.needsUpdate = true; this.lamps.geo.attributes.aSize.needsUpdate = true; this.lamps.geo.attributes.aCol.needsUpdate = true;

      /* ---------- Namirah: the tent of hair on the west bank ---------- */
      const nam = new T.Group(); nam.position.set(NAMIRAH.x, H(NAMIRAH.x, NAMIRAH.z), NAMIRAH.z); nam.rotation.y = Math.PI / 2 + 0.1; S.add(nam);
      const big = new T.Mesh(hairTentGeo(), hairCloth); big.scale.set(1.9, 1.6, 1.8); big.castShadow = true; big.receiveShadow = true; nam.add(big);
      for (let i = -2; i <= 2; i++) { const p = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 2.9, 6), wood); p.position.set(i * 2.8, 1.45, 0); nam.add(p); }
      const rugM = clothMat(w, 'wool'); rugM.color.set(0x9a5a40); const rug = new T.Mesh(new T.PlaneGeometry(9, 5).rotateX(-Math.PI / 2), rugM); rug.position.y = 0.06; rug.receiveShadow = true; nam.add(rug);
      w.addBox(NAMIRAH.x - 4.5, NAMIRAH.z - 6.2, NAMIRAH.x + 4.5, NAMIRAH.z + 6.2);
      this.namGlow = KIT.glow(w, 0xffc070, 3, 0.5); this.namGlow.position.set(NAMIRAH.x + 2.2, nam.position.y + 1.6, NAMIRAH.z); S.add(this.namGlow);
      [['jug_01', 3.6, 2.4, 1.4], ['wicker_basket_01', 3.2, -2.8, 1.2], ['ceramic_vase_01', 4.4, -1.4, 1.5], ['brass_pot_01', 2.6, 0.8, 1.3]].forEach(([id, dx, dz, s]) => PHOTO.place(w, id, { pos: [NAMIRAH.x + dx, undefined, NAMIRAH.z + dz], s, ry: r() * 6 }));

      /* ---------- hearths and life ---------- */
      const hearths = [[-120, -40], [-30, -90], [40, 80], [-80, 120], [100, 70], [-150, -120]].filter(([x, z]) => keep(x, z, -9));
      hearths.forEach(([x, z]) => PHOTO.place(w, 'stone_fire_pit', { pos: [x, undefined, z], s: 1.2 }));
      SCAPE.smoke(w, { sources: hearths.map(([x, z]) => [x, H(x, z) + 0.4, z]), height: 18, size: 3.4, opacity: 0.16, wind: [0.5, 0.2] });
      this.dust = SCAPE.motes(w, { n: 140, area: [-170, 0.5, -30, 140, 9, 70], color: '#ffe0b0', size: 0.35, opacity: 0.35 });
      SCAPE.birds(w, { n: 11, x: 0, z: 20, y: 70, r: 120, speed: 0.08 });

      /* ---------- the source in the valley bottom ---------- */
      const rockMat = PHOTO.mat(w, 'rock_face_03', { triplanar: 0.8, fallback: SCAPE.tex.granite(w) });
      const srcY = H(SRC.x, SRC.z);
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_05', fallback: 'boulder', points: [0, 1, 2, 3, 4, 5, 6].map(i => [SRC.x + Math.cos(i / 7 * 6.28) * 2.8, SRC.z + Math.sin(i / 7 * 6.28) * 2.8, 0.5 + r() * 0.35]), seed: 35, sink: 0.1 });
      this.srcGlow = KIT.glow(w, 0xfff4dc, 6, 0.85); this.srcGlow.position.set(SRC.x, srcY + 2.2, SRC.z); S.add(this.srcGlow);

      /* ---------- the relay posts: a cairn, a staff with a pennant, a lamp ---------- */
      const pennant = clothMat(w, 'wool'); pennant.color.set(0xf8f0e0);
      this.posts = POSTS.map((p, i) => {
        const y = H(p.x, p.z);
        const staff = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 4.4, 6), wood); staff.position.set(p.x, y + 2.2, p.z); staff.castShadow = true; S.add(staff);
        const pg = new T.PlaneGeometry(1.3, 0.55, 6, 1); pg.translate(0.68, 0, 0);
        const pp = pg.attributes.position; for (let k = 0; k < pp.count; k++) pp.setZ(k, Math.sin(pp.getX(k) * 2.6) * 0.12);
        const pen = new T.Mesh(pg, pennant); pen.position.set(p.x, y + 3.9, p.z); pen.rotation.y = r() * 6; pen.castShadow = true; S.add(pen);
        w.addCircle(p.x, p.z, 1.1);
        const g = KIT.glow(w, 0xffc070, 1.2, 0.35); g.position.set(p.x, y + 4.55, p.z); S.add(g);
        return { ...p, y, glow: g, lit: 0 };
      });

      // a cairn of scanned stones at the foot of every staff
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_05', fallback: 'boulder', points: POSTS.flatMap((p, i) => [[p.x + 0.5, p.z + 0.2, 0.55], [p.x - 0.45, p.z + 0.35, 0.45], [p.x + 0.05, p.z - 0.5, 0.5]]), seed: 33, sink: 0.08 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', variant: 1, fallback: 'rock', points: POSTS.map(p => [p.x + 0.9, p.z - 0.9, 1.2]), seed: 34 });

      /* ---------- the four voices: lamps on stones before the post ---------- */
      this.row = new T.Group(); this.row.userData.dynamic = true; S.add(this.row);
      this.pads = [0, 1, 2, 3].map(i => {
        const g = new T.Group(); this.row.add(g);
        const st = new T.Mesh(new T.CylinderGeometry(0.34, 0.42, 0.5, 9), rockMat); st.position.y = 0.2; st.castShadow = true; st.receiveShadow = true; g.add(st);
        PHOTO.model(w, 'brass_diya_lantern').then(({ parts, size }) => { const k = 0.42 / Math.max(size.x, size.z, 0.05); parts.forEach(pt => { const m = new T.Mesh(pt.geo, pt.mat); m.scale.setScalar(k); m.position.y = 0.45; m.castShadow = true; g.add(m); }); }).catch(() => {
          const m = new T.Mesh(new T.SphereGeometry(0.2, 12, 8, 0, 6.3, 0, 1.6), KIT.std({ color: 0xb08840, metalness: 0.8, roughness: 0.35 })); m.position.y = 0.45; g.add(m);
        });
        const halo = KIT.glow(w, new T.Color(PADC[i]), 1.4, 0.4); halo.position.y = 0.85; g.add(halo);
        const core = KIT.glow(w, 0xffffff, 0.35, 0.6); core.position.y = 0.72; g.add(core);
        const ring = new T.Mesh(new T.RingGeometry(0.55, 0.7, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: new T.Color(PADC[i]), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
        ring.position.y = 0.03; g.add(ring);
        return { g, halo, core, ring, flare: 0, dim: 0 };
      });
      this.padLight = new T.PointLight(0xffd8a0, 0, 9, 1.8); this.row.add(this.padLight);
      this.row.visible = false;

      /* ---------- the voice that brings the words, and the ribbon it leaves ---------- */
      this.orb = KIT.glow(w, 0xfff4dc, 1.1, 0); this.orb.renderOrder = 5; S.add(this.orb);
      this.orbCore = KIT.glow(w, 0xffffff, 0.35, 0); this.orbCore.renderOrder = 6; S.add(this.orbCore);
      this.orbLight = new T.PointLight(0xfff0d8, 0, 22, 1.6); S.add(this.orbLight);
      this.ribN = 70; this.rib = lampPoints(w, this.ribN);
      for (let i = 0; i < this.ribN; i++) { this.rib.S[i] = 0.22; this.rib.C.set([1, 0.95, 0.85], i * 3); }
      this.rib.geo.attributes.aSize.needsUpdate = this.rib.geo.attributes.aCol.needsUpdate = true;

      /* ---------- the post-processing finish ---------- */
      this.post = w.post({ bloom: 0.55, threshold: 0.7, rays: { strength: 0.32, dir: [-0.94, 0.33, 0] }, vignette: 0.38, grain: 0.03, sat: 1.04, contrast: 1.05, lift: [0.015, 0.01, 0], gain: [1.03, 1.0, 0.95] });

      w.bake();

      /* ---------- discoveries ---------- */
      const D = (x, z, h, o) => w.discover(Object.assign({ pos: [x, H(x, z) + (h || 1.4), z] }, o));
      D(NAMIRAH.x + 6, NAMIRAH.z + 2, 1.5, { title: 'The tent at Namirah', label: 'Look at the tent of hair', text: 'A tent of hair was pitched for him at Namirah. When the sun had passed its height he had his camel al-Qaswa’ saddled, came down to the valley bottom and addressed the people. (Sahih Muslim 1218)', ar: 'وَأَمَرَ بِقُبَّةٍ مِنْ شَعَرٍ تُضْرَبُ لَهُ بِنَمِرَةَ' });
      D(SRC.x + 3, SRC.z - 3, 1.4, { title: 'The valley bottom', label: 'Stand in the valley bottom', text: 'Jabir places the sermon here, in the bottom of the valley (Batn al-Wadi, the valley of ‘Uranah) at the edge of the plain, near where the mosque of Namirah stands today. (Sahih Muslim 1218)' });
      D(-112, 72, 1.4, { title: 'A carrying voice', label: 'Listen to the voices', text: 'Ibn Ishaq reports that a man with a carrying voice, Rabi‘ah ibn Umayyah ibn Khalaf, called out the words to the people. He was told: <span class="q">“Say: O people, the Messenger of God says…”</span> and he repeated them. (Ibn Ishaq, Sirah)' });
      D(-12, -70, 1.5, { title: 'The Hajj is ‘Arafah', label: 'Read the stone', text: 'People from Najd came to him at ‘Arafat and asked about the Hajj. He had a caller proclaim: <span class="q">“The Hajj is ‘Arafah.”</span> (Jami‘ al-Tirmidhi 889)', ar: 'الْحَجُّ عَرَفَةُ' });
      D(HILL.x - 26, HILL.z + 12, 1.4, { title: 'The hill of Ilal', label: 'Look up the hill', text: 'The low granite hill at the centre of the plain was anciently called Ilal. Its name today, Jabal ar-Rahmah, the Mount of Mercy, is later usage; the hadith call it simply the mountain, and the rocks at its foot. (al-Biladi; IslamQA 34154)' });
      D(136, 4, 1.3, { title: 'The rocks at its foot', label: 'Touch the rocks', text: 'After the sermon he rode to the rocks at the foot of the hill and stood there, until the sun set and the yellow light had somewhat gone. (Sahih Muslim 1218)' });
      D(40, 150, 1.5, { title: 'All of ‘Arafah', label: 'Look across the plain', text: 'He said: <span class="q">“I stood here, and the whole of ‘Arafah is a place of standing.”</span> Wherever a pilgrim stands on this plain, the standing counts. (Sahih Muslim 1218)', ar: 'وَوَقَفْتُ هَاهُنَا وَعَرَفَةُ كُلُّهَا مَوْقِفٌ' });
      // a marker stone for the Najd discovery, a reed and two water skins at the valley
      PHOTO.place(w, 'sand_rocks_small_01', { pos: [-12, undefined, -73], s: 0.8 });
      PHOTO.place(w, 'dead_tree_trunk', { pos: [VX(-60) + 12, undefined, -60], s: 1.3, ry: 1 });
      PHOTO.place(w, 'namaqualand_cliff_01', { pos: [60, undefined, 186], s: 1.4, ry: 2.2 });

      /* ---------- the four touch / mouse buttons ---------- */
      const bar = this.bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;inset:0;opacity:0;transition:opacity .4s;pointer-events:none;';
      const touchy = matchMedia('(pointer: coarse)').matches, bs = touchy ? 58 : 40;
      this.btns = [0, 1, 2, 3].map(i => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'arafat-pad';
        b.setAttribute('aria-label', `Voice ${i + 1}`);
        b.innerHTML = `<span style="font-size:${touchy ? 1.2 : 0.95}rem;line-height:1">${GLYPH[i]}</span><span style="font-size:.56rem;opacity:.75;letter-spacing:.1em">${i + 1}</span>`;
        b.style.cssText = `position:absolute;left:0;top:0;margin:${-bs / 2}px 0 0 ${-bs / 2}px;width:${bs}px;height:${bs}px;border-radius:50%;border:1px solid ${PADC[i]};background:radial-gradient(circle at 50% 40%, ${PADC[i]}55, rgba(6,9,20,.55));color:#fff4dc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-family:var(--f-display),serif;pointer-events:auto;touch-action:none;transition:box-shadow .2s;box-shadow:0 0 0 rgba(0,0,0,0);cursor:pointer;`;
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SND.init(); self.press(i); });
        bar.appendChild(b); return b;
      });
      w.ui.layer.appendChild(bar);
      // the words of light: the phrase being carried, Arabic over English
      const cap = this.cap = document.createElement('div');
      cap.style.cssText = 'position:absolute;left:calc(env(safe-area-inset-left,0px) + 4vw);top:calc(env(safe-area-inset-top,0px) + 82px);width:min(520px,58vw);text-align:left;opacity:0;transition:opacity .6s;pointer-events:none;';
      cap.innerHTML = '<p class="ac-ar" lang="ar" dir="rtl" style="margin:0;font-family:var(--f-naskh),serif;font-size:clamp(1.3rem,2.8vw,1.9rem);color:#fff6e0;text-shadow:0 0 18px rgba(255,210,140,.75),0 1px 3px rgba(0,0,0,.8);text-align:left"></p><p class="ac-en" style="margin:.3em 0 0;font-family:var(--f-body),serif;font-style:italic;font-size:clamp(.95rem,1.8vw,1.15rem);color:#f6efe2;text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 14px rgba(0,0,0,.5)"></p><p class="ac-src" style="margin:.35em 0 0;font-family:var(--f-display),serif;letter-spacing:.2em;text-transform:uppercase;font-size:.62rem;color:#e8d2a0;text-shadow:0 1px 3px rgba(0,0,0,.9)"></p><p class="ac-cue" style="margin:.6em 0 0;font-family:var(--f-display),serif;letter-spacing:.24em;text-transform:uppercase;font-size:.7rem;color:#fff4dc;text-shadow:0 1px 4px rgba(0,0,0,.9)"></p>';
      w.ui.layer.appendChild(cap);
      this.fadeEl = w.ui.layer.querySelector('.w-fade');

      /* ---------- input for the relay ---------- */
      w.onPointer = (e, p, phase) => {
        if (!w.mode) return false;
        if (phase === 'down') {
          const v = new T.Vector3(); let best = -1, bd = 80;
          this.pads.forEach((pd, i) => { pd.g.getWorldPosition(v); v.y += 0.6; v.project(w.camera); const sx = (v.x * 0.5 + 0.5) * env.w, sy = (-v.y * 0.5 + 0.5) * env.h, d = Math.hypot(sx - e.clientX, sy - e.clientY); if (d < bd) { bd = d; best = i; } });
          if (best >= 0) this.press(best);
        }
        return true;
      };
      // the shadow camera follows whatever the camera is looking at when the walker is not in charge
      const fv = new T.Vector3();
      w.tick(() => {
        if (!(w.filmS || w.mode) || !w._shadow) return;
        w.camera.getWorldDirection(fv); const x = w.camera.position.x + fv.x * 25, z = w.camera.position.z + fv.z * 25, L = w._shadow.light;
        L.target.position.set(Math.round(x / 2) * 2, 0, Math.round(z / 2) * 2); L.position.copy(L.target.position).add(w._shadow.off);
      });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.6, gain: 0.035 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.07, 0.014);
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 300, q: 1.4, gain: 0.018 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.25, 50);
      this.choir = SND.drone(b, 110, { vowel: 'a', gain: 0 });
      this.choir2 = SND.drone(b, 164.81, { vowel: 'o', gain: 0 });
      this.murmurClock = 2;

      w.activity('Pass the words on', POSTS.length, 'Listen to the phrase, then sing it back');
      this.setRelayPost(0);
    },

    film(env, w) {
      const P = POSTS, y = (x, z) => H(x, z);
      return [
        { dur: 7, fade: 'dip', title: true, fov: [48, 40], ease: 'glide',
          path: [[[230, 46, 120], [-120, 14, 10]], [[200, 40, 96], [-130, 12, 20]], [[170, 34, 80], [-140, 10, 26]]] },
        { dur: 6.5, fade: 'dip', line: 'A tent of hair was pitched for him at Namirah.', ar: 'وَأَمَرَ بِقُبَّةٍ مِنْ شَعَرٍ تُضْرَبُ لَهُ بِنَمِرَةَ', lineAt: 0.8,
          path: [[[NAMIRAH.x + 22, y(NAMIRAH.x + 22, NAMIRAH.z + 16) + 2.4, NAMIRAH.z + 16], [NAMIRAH.x, y(NAMIRAH.x, NAMIRAH.z) + 1.6, NAMIRAH.z]], [[NAMIRAH.x + 14, y(NAMIRAH.x + 14, NAMIRAH.z + 6) + 1.9, NAMIRAH.z + 6], [NAMIRAH.x - 1, y(NAMIRAH.x, NAMIRAH.z) + 1.4, NAMIRAH.z]]],
          fov: [44, 38], during: (w, k) => { this.namGlow.material.opacity = 0.4 + 0.5 * k; } },
        { dur: 6.5, fade: 'cut', line: 'When the sun had passed its height, he came to the valley bottom.', ar: 'حَتَّى إِذَا زَاغَتِ الشَّمْسُ أَتَى بَطْنَ الْوَادِي فَخَطَبَ النَّاسَ', lineAt: 0.6,
          path: [[[VX(-30) + 2, y(VX(-30), -30) + 1.4, -30], [SRC.x, y(SRC.x, SRC.z) + 2.5, SRC.z]], [[VX(8) + 1, y(VX(8), 8) + 1.7, 8], [SRC.x, y(SRC.x, SRC.z) + 2.6, SRC.z]]],
          start: () => { this.srcGlow.scale.setScalar(3); }, during: (w, k) => { this.srcGlow.scale.setScalar(3 + k * 6); this.srcGlow.material.opacity = 0.5 + 0.45 * k; } },
        { dur: 6.5, fade: 'dip', lines: [[0.5, 'Ibn Ishaq reports that a man with a carrying voice called out his words:', 'وكان الذي يصرخ في الناس بقول رسول الله ﷺ ربيعة بن أمية بن خلف'], [3.4, '“Say: O people, the Messenger of God says…” (Ibn Ishaq)', 'قُلْ: يَا أَيُّهَا النَّاسُ، إِنَّ رَسُولَ اللَّهِ يَقُولُ']],
          path: [[[-150, 26, -110], [-60, 0, 10]], [[-70, 30, -130], [10, 0, 10]]], fov: [50, 46] },
        { dur: 7, fade: 'cut', lines: [[0.5, 'Phrase by phrase, the words travel out across the plain.', 'جملةً بعد جملة، تعبر الكلماتُ السهل']],
          path: [[[-160, 10, 70], [-120, 2, 36]], [[-110, 12, 80], [-60, 2, 30]], [[-60, 14, 76], [0, 2, 24]]],
          start: () => { this.orb.material.opacity = 0.9; this.orbCore.material.opacity = 0.9; },
          during: (w, k) => {
            const pts = [SRC, ...P.slice(0, 5)], f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i, a = pts[i], bb = pts[i + 1];
            const x = U.lerp(a.x, bb.x, u), z = U.lerp(a.z, bb.z, u), hop = Math.sin(u * Math.PI) * 6;
            this.orb.position.set(x, y(x, z) + 4.5 + hop, z); this.orbCore.position.copy(this.orb.position);
            this.posts.forEach((p, j) => { if (j < i + (u > 0.9 ? 1 : 0)) p.glow.material.opacity = 0.9; });
          } },
        { dur: 6.5, fade: 'dip', line: 'Listen to each phrase, sing it back, and pass it on.', ar: 'أَصْغِ إِلَى كُلِّ جُمْلَةٍ، وَرَدِّدْهَا، وَبَلِّغْهَا', lineAt: 0.6,
          path: [[[P[0].x - 30, y(P[0].x, P[0].z) + 16, P[0].z + 18], [P[0].x, y(P[0].x, P[0].z) + 1, P[0].z]], [[P[0].x - 20, y(P[0].x, P[0].z) + 7, P[0].z + 4], [P[0].x, y(P[0].x, P[0].z) + 1, P[0].z]]],
          start: () => { this.orb.material.opacity = 0; this.orbCore.material.opacity = 0; } },
      ];
    },
    filmOpts: {
      end(w) {
        const st = ENGINE.cur; if (!st || !st.posts) return;
        st.posts.forEach(p => { p.glow.material.opacity = 0.35; });
        st.srcGlow.scale.setScalar(6); st.srcGlow.material.opacity = 0.85; st.namGlow.material.opacity = 0.5;
        st.orb.material.opacity = 0; st.orbCore.material.opacity = 0;
        st.startPart(0);
      },
    },

    /* ---------------- the game ---------------- */
    setRelayPost(i) {
      const p = this.posts[i], d = dirOf(i), sx = -d.z, sz = d.x;
      this.row.position.set(p.x - d.x * 3.6, 0, p.z - d.z * 3.6);
      this.pads.forEach((pd, k) => { const o = (k - 1.5) * 1.4, x = this.row.position.x + sx * o, z = this.row.position.z + sz * o; pd.g.position.set(sx * o, H(x, z), sz * o); });
      this.padLight.position.set(0, H(this.row.position.x, this.row.position.z) + 1.6, 0);
    },
    startPart(n) {
      const w = this.w, P = PARTS[n];
      this.part = n;
      w.activity(P.title, POSTS.length, P.step); w.progress(P.from);
      if (n === 2) this.toSunset();
      this.beginRelay(P.from, false);
    },
    beginRelay(i, glide) {
      const w = this.w;
      this.relay = i; this.misses = 0; this.lenient = false; this.rep = 0;
      this.setRelayPost(i);
      this.row.visible = true; this.bar.style.opacity = 1;
      w.goal(null);
      const c = camOf(i), d = dirOf(i), p = POSTS[i];
      this.camTo = { p: new T.Vector3(c.x, H(c.x, c.z) + 4.8, c.z), l: new T.Vector3(p.x + d.x * 1.5, H(p.x, p.z) + 0.7, p.z + d.z * 1.5) };
      this.camFrom = { p: w.camera.position.clone(), l: w.camera.position.clone().add(w.camera.getWorldDirection(new T.Vector3()).multiplyScalar(18)) };
      if (!this.mode) this.mode = (dt) => this.relayCam(dt);
      w.mode = this.mode;
      w.pos.set(c.x, 0, c.z); w.yaw = Math.atan2(-d.x, -d.z); w.pitch = -0.1;
      this.glideT = 0; this.glideDur = glide ? 4.2 : 1.2;
      this.state = 'glide';
      // the voice arrives from where the words were last
      const from = i === 0 ? SRC : POSTS[i - 1];
      this.orbFrom = new T.Vector3(from.x, H(from.x, from.z) + 4.6, from.z);
      this.orbTo = new T.Vector3(p.x, H(p.x, p.z) + 4.9, p.z);
      this.showCap(WORDS[i].ar, WORDS[i].en, SM, '');
      this.cap.style.opacity = 0;
    },
    relayCam(dt) {
      const w = this.w, cam = w.camera;
      let pp, ll;
      if (this.state === 'glide') {
        const k = U.ease(U.clamp(this.glideT / this.glideDur));
        pp = this.camFrom.p.clone().lerp(this.camTo.p, k); pp.y += Math.sin(k * Math.PI) * (this.glideDur > 2 ? 5 : 0.5);
        ll = this.camFrom.l.clone().lerp(this.camTo.l, k);
      } else if (this.state === 'finale') {
        const k = U.ease(U.clamp(this.finT / 10));
        pp = this.camTo.p.clone().lerp(this.finCam.p, k); ll = this.camTo.l.clone().lerp(this.finCam.l, k);
      } else {
        pp = this.camTo.p.clone(); ll = this.camTo.l.clone();
        // a breath of movement, and a nod on every footstep
        pp.x += Math.sin(w.time * 0.31) * 0.12; pp.y += Math.sin(w.time * 0.43) * 0.06 - (this.nod || 0) * 0.05;
      }
      this.nod = U.damp(this.nod || 0, 0, 10, dt);
      cam.position.copy(pp); cam.lookAt(ll);
    },
    showCap(ar, en, src, cue) {
      const q = s => this.cap.querySelector(s);
      if (ar != null) q('.ac-ar').textContent = ar; if (en != null) q('.ac-en').textContent = en;
      if (src != null) q('.ac-src').textContent = src; if (cue != null) q('.ac-cue').textContent = cue;
      this.cap.style.opacity = 1;
    },
    phrase() {
      const ph = PHR[this.relay];
      if (this.relay === 7 && !this.lenient) return ph;
      return ph;
    },
    startCall() {
      const ph = this.phrase();
      this.state = 'call'; this.callT = -2 * BEAT; this.callIdx = 0; this.nextStep = -2;
      this.timed = this.part > 0 && !this.lenient;
      this.beatLen = this.lenient ? BEAT * 1.25 : BEAT;
      this.answerAt = Math.ceil((ph.b[ph.b.length - 1] + 1) / 4) * 4;  // the bar after the call
      this.got = 0;
      this.showCap(null, null, null, this.rep ? 'Listen again' : 'Listen');
    },
    press(i) {
      const w = this.w, env = ENGINE.env;
      if (!w || !w.mode || this.state === 'glide' || this.state === 'finale' || this.state === 'still' || this.finished) return;
      const pd = this.pads[i], btn = this.btns[i];
      btn._k = 0.86;
      pd.flare = 1; this.padLight.color.set(PADC[i]); this.padLight.intensity = 2.6; this.nod = 1;
      if (this.state !== 'answer') {
        // humming along while the voice still sings: heard, not counted
        SND.sing(env.bus, NOTES[i], { vowel: 'u', dur: 0.5, gain: 0.025, attack: 0.03, hold: 0.3 });
        pd.flare = 0.5; return;
      }
      const ph = this.phrase(), want = ph.p[this.got];
      SND.sing(env.bus, NOTES[i], { vowel: 'o', dur: this.beatLen * 0.95, gain: 0.07, voices: 2, attack: 0.02, hold: 0.4 });
      if (i !== want) {
        // the phrase slips: the lamp gutters, the voice will sing it again
        pd.flare = 0; pd.dim = 1; this.misses++;
        SND.sing(env.bus, NOTES[i] * 0.94, { vowel: 'u', dur: 0.9, gain: 0.03, delay: 0.12, attack: 0.05 });
        SND.swell(env.bus, { f0: 900, f1: 260, dur: 0.9, gain: 0.025 });
        this.chorus = Math.max(0.1, this.chorus - 0.12);
        this.showCap(null, null, null, 'The words slip · listen again');
        if (this.misses >= 2 && this.part > 0) this.lenient = true;
        this.state = 'wait'; this.waitT = 1.3; this.rep++;
        this.ribTarget = 0;
        return;
      }
      // judged against the pulse in parts 2 and 3
      let onBeat = true;
      if (this.timed) {
        const exp = (this.answerAt + ph.b[this.got]) * this.beatLen;
        onBeat = Math.abs(this.callT - exp) < 0.2;
      }
      this.got++;
      this.chorus = U.clamp(this.chorus + (onBeat ? 0.09 : 0.02), 0, 1);
      if (onBeat && this.timed) { pd.ring.material.opacity = 1; SND.sing(env.bus, NOTES[i], { vowel: 'a', dur: 0.8, gain: 0.02 + 0.03 * this.chorus, voices: 3, delay: 0.09, pan: (Math.random() - 0.5) * 0.8 }); }
      this.ribTarget = this.got / ph.p.length * 0.3;
      if (this.got >= ph.p.length) this.answered();
    },
    answered() {
      const w = this.w, env = ENGINE.env, ph = this.phrase();
      this.rep = 0;
      if (ph.times && ++this.times < ph.times) {
        // "O God, bear witness" — three times, and the plain answers each time
        this.echo(ph, 0.6);
        this.showCap(null, null, null, ['', 'Again', 'A third time'][this.times]);
        this.state = 'wait'; this.waitT = ph.p.length * BEAT + 1.8; this.ribTarget = this.times / 3 * 0.3;
        return;
      }
      this.state = 'pass'; this.passT = 0;
      this.echo(ph, 0.6);
      const W = WORDS[this.relay];
      if (W.reply) this.showCap(W.replyAr, W.reply, 'The people answer · ' + SM, '');
      else this.showCap(null, null, null, 'Passed on');
      SND.glow(env.bus, [146.83, 164.81, 196, 220, 246.94, 196, 220, 246.94, 293.66][this.relay], { gain: 0.05, dur: 6 });
      // the tents between this post and the next take up the words
      const a = POSTS[this.relay], b = POSTS[this.relay + 1] || HILL;
      this.lampInfo.forEach(L => { const s = segD(L.x, L.z, a, b); if (s.d < 34 && L.litAt > 1e8) L.litAt = w.time + 0.4 + s.t * 2.4 + s.d * 0.03; });
      this.layRibbon(a, b);
    },
    echo(ph, delay) {
      const env = ENGINE.env, beat = this.beatLen || BEAT;
      ph.p.forEach((pad, k) => {
        SND.sing(env.bus, NOTES[pad], { vowel: 'a', dur: beat * 1.1, gain: 0.025 + 0.035 * this.chorus, voices: 4, detune: 12, spread: 1.6, delay: delay + ph.b[k] * beat });
        this.later(delay + ph.b[k] * beat, () => SND.step(env.bus, { gain: 0.035, f: 600 }));
      });
    },
    layRibbon(a, b) {
      const n = this.ribN; this.ribA = a; this.ribB = b;
      for (let i = 0; i < n; i++) { const k = i / (n - 1), x = U.lerp(a.x, b.x, k), z = U.lerp(a.z, b.z, k); this.rib.P.set([x, H(x, z) + 0.35, z], i * 3); }
      this.rib.geo.attributes.position.needsUpdate = true;
    },
    later(dt, fn) { this.queue.push([this.w.time + dt, fn]); },
    dip(color, hold, fn) {
      // a short dip through colour (the fade layer is free once the film is over)
      this.fadeEl.style.background = color; this.dipGoal = 1;
      this.later(0.55, () => { fn && fn(); this.later(hold || 0.2, () => { this.dipGoal = 0; }); });
    },
    toSunset() {
      // a dip through the warm haze, and the sky turns toward sunset
      const w = this.w;
      this.dip('#f3d6a8', 0.4, () => {
        PHOTO.sky(w, 'qwantani_sunset_puresky', Object.assign({}, this.skyOpts, { intensity: 0.6, haze: '#e0a878' }));
        if (!PHOTO.enabled) this.sun.position.set(-99, 11, 0);
        if (this.post && this.post.rays) this.post.rays.dir = [-0.99, 0.11, 0];
        this.duskTarget = 1; this.dusk = 0.6;
      });
    },
    relayStep(dt) {
      const w = this.w, env = ENGINE.env;
      if (this.state === 'glide') {
        this.glideT += dt;
        const k = U.clamp(this.glideT / this.glideDur);
        if (this.orbFrom) { const v = this.orbFrom.clone().lerp(this.orbTo, U.ease(k)); v.y += Math.sin(k * Math.PI) * 4; this.orb.position.copy(v); }
        this.orbVis = 1;
        if (this.glideT >= this.glideDur) { this.layRibbon(POSTS[this.relay], POSTS[this.relay + 1] || HILL); this.ribHead = 0; this.ribTarget = 0; this.times = 0; this.startCall(); this.posts[this.relay].lit = 1; SND.bell(env.bus, 587.33, { gain: 0.03, glass: true }); }
        return;
      }
      if (this.state === 'call' || this.state === 'answer') {
        const ph = this.phrase(), beat = this.beatLen, t0 = this.callT;
        this.callT += dt;
        const bNow = Math.floor(this.callT / beat);
        // the pulse: footsteps of the plain on every beat (in part 1 only on the call)
        if (bNow > this.nextStep - 1 && bNow !== this.lastBeat) {
          this.lastBeat = bNow;
          if (this.part > 0 || this.state === 'call') SND.step(env.bus, { gain: bNow % 4 === 0 ? 0.07 : 0.04, f: bNow % 4 === 0 ? 520 : 700 });
          this.beatPulse = 1;
        }
        if (this.state === 'call') {
          while (this.callIdx < ph.p.length && this.callT >= ph.b[this.callIdx] * beat) {
            const pad = ph.p[this.callIdx], pd = this.pads[pad];
            pd.flare = 1.2; this.padLight.color.set(PADC[pad]); this.padLight.intensity = 2.2;
            SND.sing(env.bus, NOTES[pad], { vowel: 'a', dur: beat * 0.95, gain: 0.08, attack: 0.03, hold: 0.45, vib: 0.008 });
            this.orbPulse = 1;
            this.callIdx++;
          }
          if (this.callIdx >= ph.p.length && this.callT >= ph.b[ph.b.length - 1] * beat + beat * 0.6) {
            this.state = 'answer';
            this.showCap(null, null, null, this.timed ? 'Your turn · on the footsteps' : 'Your turn');
            if (!this.timed) this.callT = this.answerAt * beat; // untimed: no clock to follow
          }
        } else if (this.timed) {
          // too long without an answer: the voice sings it again
          const last = (this.answerAt + ph.b[ph.b.length - 1] + 3) * beat;
          if (this.callT > last) { this.state = 'wait'; this.waitT = 0.4; this.rep++; this.got = 0; this.showCap(null, null, null, 'Listen again'); }
        } else if (this.callT > (this.answerAt + 14) * beat && this.got === 0) { this.state = 'wait'; this.waitT = 0.3; this.rep++; }
        return;
      }
      if (this.state === 'wait') {
        this.waitT -= dt; if (this.waitT <= 0) this.startCall();
        return;
      }
      if (this.state === 'pass') {
        this.passT += dt;
        this.ribTarget = U.clamp(0.3 + this.passT / 2.6 * 0.75, 0, 1.05);
        const a = this.ribA, b = this.ribB, k = U.clamp(this.passT / 2.6);
        const x = U.lerp(a.x, b.x, U.ease(k)), z = U.lerp(a.z, b.z, U.ease(k));
        this.orb.position.set(x, H(x, z) + 4.6 + Math.sin(k * Math.PI) * 3, z);
        if (this.passT > 3.6) {
          const n = this.relay + 1;
          w.progress(n);
          if (n >= POSTS.length) return this.startFinale();
          this.posts[this.relay].lit = 1;
          if (n <= PARTS[this.part].to) this.beginRelay(n, true);
          else this.endPart();
        }
      }
    },
    endPart() {
      // the part is done: walk on to the next post, and look around on the way
      const w = this.w, n = this.relay + 1, c = camOf(this.relay), d = dirOf(this.relay);
      w.mode = null; this.state = 'walk'; this.row.visible = false; this.bar.style.opacity = 0;
      const pp = POSTS[this.relay]; w.pos.set(pp.x - d.z * 3 + d.x * 2, 0, pp.z + d.x * 3 + d.z * 2); w.yaw = Math.atan2(-d.x, -d.z); w.pitch = -0.05;
      w.goal([POSTS[n].x, H(POSTS[n].x, POSTS[n].z) + 2, POSTS[n].z]);
      this.showCap('', '', '', ''); this.cap.style.opacity = 0;
      w.step(`Walk on to the next post, where the words wait · ${this.part === 0 ? 'the plain is yours to explore' : 'the sun is lowering'}`);
      this.orb.position.set(POSTS[n].x, H(POSTS[n].x, POSTS[n].z) + 4.9, POSTS[n].z);
      SND.glow(ENGINE.env.bus, 196, { gain: 0.05, dur: 5 });
    },
    startFinale() {
      const w = this.w, env = ENGINE.env;
      this.state = 'finale'; this.finT = 0; this.row.visible = false; this.bar.style.opacity = 0; this.cap.style.opacity = 0;
      // every lamp on the plain, in a wave from the hill outward
      this.lampInfo.forEach(L => { if (L.litAt > 1e8) L.litAt = w.time + 1 + Math.hypot(L.x - HILL.x, L.z - HILL.z) / 55; });
      this.finCam = { p: new T.Vector3(150, H(150, -10) + 24, -6), l: new T.Vector3(-60, 0, 20) };
      this.wind.set('gain', 0.008, 1); this.crowd.set('gain', 0.004, 1);
      SND.glow(env.bus, 146.83, { gain: 0.08, dur: 14, vowel: 'a' });
      SND.glow(env.bus, 220, { gain: 0.05, dur: 13, vowel: 'o', delay: 1.4 });
    },
    finaleStep(dt) {
      const w = this.w, env = ENGINE.env, t0 = this.finT; this.finT += dt;
      const cross = s => t0 < s && this.finT >= s;
      this.orb.position.lerp(new T.Vector3(HILL.x, H(HILL.x, HILL.z) + 14, HILL.z), 1 - Math.exp(-dt * 0.6));
      if (cross(3)) {
        SND.bell(env.bus, 587.33, { gain: 0.04, glass: true }); SND.bell(env.bus, 783.99, { gain: 0.03, delay: 0.5, glass: true });
        w.say('This Day', 'On that day, the Day of ‘Arafah, a Friday, while he was standing at ‘Arafat, this verse was revealed: <span class="q">“This day I have perfected your religion for you, completed My favour upon you, and chosen Islam as your religion.”</span> (Qur’an 5:3; Sahih al-Bukhari 45)', { ar: 'الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي وَرَضِيتُ لَكُمُ الْإِسْلَامَ دِينًا', ms: 18000 });
        this.wind.set('gain', 0.03, 4); this.crowd.set('gain', 0.012, 4);
      }
      if (cross(11)) {
        this.finished = true; w.finish('The words are passed on, to those who were absent');
        this.dip('#000', 0.3, () => {
          const c = camOf(8), d = dirOf(8);
          w.mode = null; this.state = 'still';
          w.pos.set(c.x, 0, c.z); w.yaw = Math.atan2(-d.x, -d.z) + Math.PI; w.pitch = -0.02;
          w.step('Stay as long as you like; the plain is lit');
        });
      }
    },

    onKey(env, e) {
      if (e.repeat || !this.w || !this.w.mode) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k in KEYMAP) this.press(KEYMAP[k]);
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      if (this.queue.length) { const due = this.queue.filter(q => w.time >= q[0]); this.queue = this.queue.filter(q => w.time < q[0]); due.forEach(q => q[1]()); }
      if (!w.filmS) { this.dipV = U.damp(this.dipV, this.dipGoal, 9, dt); this.fadeEl.style.opacity = this.dipV < 0.004 ? 0 : this.dipV.toFixed(3); }
      if (w.mode && (this.state === 'finale')) this.finaleStep(dt);
      else if (w.mode) this.relayStep(dt);
      w.update(dt);
      const t = w.time;
      // walking between parts: the next post starts the call when you reach it
      if (this.state === 'walk' && !w.mode && !w.filmS) {
        const n = this.relay + 1, p = POSTS[n];
        if (Math.hypot(w.pos.x - p.x, w.pos.z - p.z) < 9) { this.startPart(this.part + 1); }
      }
      // dusk: the light lowers through part 3
      this.dusk = U.damp(this.dusk, this.duskTarget || 0, 0.5, dt);
      const dk = this.dusk;
      this.sun.intensity = U.lerp(1.85, 1.15, dk); this.sun.color.setRGB(1, U.lerp(0.886, 0.7, dk), U.lerp(0.72, 0.45, dk));
      if (w.scene.fog) w.scene.fog.color.setRGB(U.lerp(0.85, 0.83, dk), U.lerp(0.745, 0.6, dk), U.lerp(0.6, 0.46, dk));
      if (this.post) this.post.set({ lift: [0.015 + dk * 0.01, 0.01, dk * 0.02], gain: [1.03 + dk * 0.04, 1.0 - dk * 0.03, 0.95 - dk * 0.06] });

      // the pads and the voice
      const ph = this.relay >= 0 ? PHR[this.relay] : null;
      this.beatPulse = U.damp(this.beatPulse || 0, 0, 8, dt); this.orbPulse = U.damp(this.orbPulse || 0, 0, 5, dt);
      this.pads.forEach((pd, i) => {
        pd.flare = U.damp(pd.flare, 0, 5, dt); pd.dim = U.damp(pd.dim, 0, 1.6, dt);
        const ready = this.state === 'answer' ? 0.25 : 0;
        const k = Math.max(0, 0.32 + ready + pd.flare * 1.1 + this.beatPulse * 0.08 - pd.dim * 0.3);
        pd.halo.material.opacity = Math.min(1, k); pd.halo.scale.setScalar(1.1 + pd.flare * 2.2 + ready);
        pd.core.material.opacity = Math.min(1, 0.4 + pd.flare - pd.dim * 0.35);
        pd.ring.material.opacity = U.damp(pd.ring.material.opacity, 0, 3, dt); pd.ring.scale.setScalar(1 + (1 - pd.ring.material.opacity) * 1.5);
        const s = this.btns[i].style; s.boxShadow = pd.flare > 0.05 ? `0 0 ${18 + pd.flare * 30}px ${PADC[i]}` : (ready ? `0 0 10px ${PADC[i]}88` : '0 0 0 rgba(0,0,0,0)');
      });
      this.padLight.intensity = U.damp(this.padLight.intensity, 0.4 * (this.row.visible ? 1 : 0), 4, dt);
      if (this.row.visible) {
        const v = this._v || (this._v = new T.Vector3()), narrow = env.w < 720;
        this.pads.forEach((pd, i) => { pd.g.getWorldPosition(v); v.y += 0.05; v.project(w.camera); const b = this.btns[i]; b._k = U.damp(b._k || 1, 1, 14, dt);
          b.style.transform = `translate(${((v.x * 0.5 + 0.5) * env.w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * env.h + 34).toFixed(1)}px) scale(${b._k.toFixed(3)})`; });
        this.cap.style.top = narrow ? 'calc(env(safe-area-inset-top,0px) + 200px)' : 'calc(env(safe-area-inset-top,0px) + 82px)';
        this.cap.style.width = narrow ? '88vw' : 'min(520px,58vw)';
      }
      const ov = w.mode || this.state === 'walk' ? 1 : 0;
      this.orb.material.opacity = U.damp(this.orb.material.opacity, ov * (0.75 + this.orbPulse * 0.25), 3, dt);
      this.orb.scale.setScalar(1.0 + this.orbPulse * 1.1 + Math.sin(t * 2.3) * 0.08);
      this.orbCore.material.opacity = this.orb.material.opacity; this.orbCore.position.copy(this.orb.position);
      this.orbLight.position.copy(this.orb.position); this.orbLight.intensity = this.orb.material.opacity * (1.2 + this.orbPulse);
      this.posts.forEach((p, i) => { const want = p.lit ? 0.95 : 0.35; p.glow.material.opacity = U.damp(p.glow.material.opacity, want, 2, dt); p.glow.scale.setScalar(p.lit ? 2.4 + Math.sin(t * 3 + i) * 0.15 : 1.2); if (p.lit) p.glow.material.color.setHex(0xfff0d0); });
      this.srcGlow.scale.setScalar(6 + Math.sin(t * 1.7) * 0.4);

      // the ribbon of words on the ground
      this.ribHead = U.damp(this.ribHead || 0, this.ribTarget || 0, 4, dt);
      if (this.ribA) {
        for (let i = 0; i < this.ribN; i++) {
          const k = i / (this.ribN - 1), on = k < this.ribHead ? 1 : 0;
          this.rib.A[i] = on * (0.4 + 0.3 * Math.sin(t * 4 - i * 0.6)) * (this.state === 'walk' || this.state === 'still' ? 0.5 : 1);
          this.rib.S[i] = 0.22 + 0.08 * Math.sin(t * 3 + i);
        }
        this.rib.geo.attributes.aAlpha.needsUpdate = this.rib.geo.attributes.aSize.needsUpdate = true;
      }

      // the tents' lamps: those that have heard burn brightly, brighter as the sun goes
      const A = this.lamps.A, glowK = 0.3 + 0.9 * dk;
      for (let i = 0; i < this.lampInfo.length; i++) {
        const L = this.lampInfo[i];
        const tgt = (t > L.litAt ? 1 : L.base) * glowK * (0.75 + 0.25 * this.chorus) * (0.9 + 0.1 * Math.sin(t * 7 + i));
        L.a += (tgt - L.a) * Math.min(1, dt * 2.5); A[i] = L.a;
      }
      this.lamps.geo.attributes.aAlpha.needsUpdate = true;
      const lit = this.lampInfo.reduce((n, L) => n + (t > L.litAt ? 1 : 0), 0) / this.lampInfo.length;
      this.choir.setGain(0.002 + 0.02 * lit * (0.5 + 0.5 * this.chorus), 0.8); this.choir2.setGain(0.001 + 0.012 * lit * this.chorus, 0.8);

      // murmurs from the tents
      this.murmurClock -= dt;
      if (this.murmurClock < 0 && this.state !== 'finale') {
        this.murmurClock = 0.8 + Math.random() * 1.8;
        const src = { x: w.camera.position.x + U.rnd(-60, 60), z: w.camera.position.z + U.rnd(-60, 60) }, sp = w.spatial(src, 30);
        SND.sing(env.bus, U.rnd(120, 190), { vowel: U.pick(['a', 'o', 'u', 'm']), dur: U.rnd(0.6, 1.6), gain: 0.006 + sp.gain * 0.02, pan: sp.pan, voices: 2, breath: 0.25, attack: 0.15, hold: 0.35, vib: 0.004 });
      }
    },
    onLeave() { },
  }));
})();
