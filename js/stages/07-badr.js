/* Station — The Full Moon Rises (the welcome in Yathrib), 1 AH / 622 CE.
   Genre: rhythm highway (Guitar Hero / Beat Saber).
   A moonlit night. The road comes up from the black lava field (the harrah) where the people of
   Yathrib had watched for him every morning, runs through the walled palm gardens, and enters the
   lanes of the city to the open place where his she-camel knelt. The road is a note highway:
   small clay lamps lie in four lanes; as each reaches the line of light, strike its key in time with
   the sung welcome, and the lamp rises to a roof, a doorway or a palm and stays lit. Three parts:
   two lanes on the lava field, four through the gardens, four with held notes and chords in the
   lanes. At the end the whole city answers in voices and light, and the moon stands over it.
   No person is shown: the city is present in its lamps, opening doors and wordless voices.
   The song "Tala'a al-badru 'alayna" is a loved tradition with a weak report (al-Bayhaqi;
   al-Albani, al-Silsilah al-Da'ifah 598); the welcome itself is sahih (al-Bukhari 3906, 3925).
   The melody sung here is newly composed in its spirit, not a claim about the original tune.
   Colour script: night indigo with moon-gold kept for the moon, the lamps and the line. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- the road: from the harrah north through the gardens into the city ---------------- */
  const KEYS = [[-110, 640], [-60, 470], [-20, 320], [10, 180], [-10, 40], [20, -100], [30, -240], [0, -380], [10, -520], [40, -640], [60, -720]];
  const CURVE = new T.CatmullRomCurve3(KEYS.map(([x, z]) => new T.Vector3(x, 0, z)), false, 'centripetal');
  const LEN = CURVE.getLength();
  const at = (s, o) => {
    o = o || {}; const u = U.clamp(s / LEN, 0, 1), p = CURVE.getPointAt(u), t = CURVE.getTangentAt(u);
    const ex = s < 0 ? s : s > LEN ? s - LEN : 0;
    o.x = p.x + t.x * ex; o.z = p.z + t.z * ex; o.tx = t.x; o.tz = t.z; o.rx = -t.z; o.rz = t.x; return o;
  };
  const SAMP = []; for (let s = 0; s <= LEN; s += 4) { const p = at(s); SAMP.push([p.x, p.z, s]); }
  // distance from the road and the nearest arc length (coarse, then refined)
  // the road runs steadily north (z falls along it), so search outward from the sample nearest in z
  function roadInfo(x, z) {
    let lo = 0, hi = SAMP.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (SAMP[m][1] > z) lo = m; else hi = m; }
    let bd = 1e18, bs = 0;
    const test = i => { const q = SAMP[i], d = (q[0] - x) * (q[0] - x) + (q[1] - z) * (q[1] - z); if (d < bd) { bd = d; bs = q[2]; } return (q[1] - z) * (q[1] - z); };
    for (let i = lo; i >= 0; i--) if (test(i) > bd) break;
    for (let i = hi; i < SAMP.length; i++) if (test(i) > bd) break;
    return { d: Math.sqrt(bd), s: bs };
  }
  // stretches of the road (metres along it)
  const SPEED = 5, BPM = 84, BEAT = 60 / BPM, STRIKE = 6.5;
  const S_PALMS = 255, S_CITY = 505, S_PLACE = 900;

  /* ---------------- the land ---------------- */
  // zone weights by arc length along the road: harrah, gardens, city
  const zoneOf = s => ({ h: 1 - U.smooth(S_PALMS - 50, S_PALMS + 20, s), c: U.smooth(S_CITY - 30, S_CITY + 30, s) });
  const HCache = new Map();
  function H(x, z) {
    const R = roadInfo(x, z), Z = zoneOf(R.s), g = 1 - Z.h - Z.c * 0.0;
    let y = 0.4 + SCAPE.fbm(x * 0.01, z * 0.01, 3) * 1.5;
    // the lava field: broken black ground, flattened along the road
    y += Z.h * (SCAPE.ridge(x * 0.03, z * 0.03, 4) * 3.2 + SCAPE.fbm(x * 0.12, z * 0.12, 2) * 0.6) * U.smooth(5, 18, R.d);
    // far hills: Sal' to the north-west, the lava ridges east and west
    const dc = Math.hypot(x + 20, z + 40);
    y += U.smooth(650, 1300, dc) * (40 + SCAPE.ridge(x * 0.003, z * 0.003, 5) * 160);
    y += 90 * Math.exp(-((x + 520) * (x + 520) + (z + 820) * (z + 820)) / (2 * 160 * 160));
    // the road itself, smooth
    y = U.lerp(0.35 + SCAPE.fbm(x * 0.02, z * 0.02, 2) * 0.4, y, U.smooth(4.5, 12, R.d));
    return y;
  }

  /* ---------------- helpers ---------------- */
  const PV = `attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
    void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
  const PF = `uniform sampler2D tMap; uniform vec3 uColor; varying float vA;
    void main(){ vec4 t = texture2D(tMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA); if (gl_FragColor.a < 0.004) discard; }`;
  function sprites(w, n, color, additive) {
    const geo = new T.BufferGeometry(), P = new Float32Array(n * 3), S = new Float32Array(n), A = new Float32Array(n);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aSize', new T.BufferAttribute(S, 1)); geo.setAttribute('aAlpha', new T.BufferAttribute(A, 1));
    const mat = new T.ShaderMaterial({ vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending,
      uniforms: { tMap: { value: SCAPE.tex.soft(w) }, uColor: { value: new T.Color(color) }, uScale: { value: w.env.h * 0.9 } } });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true; w.scene.add(pts);
    return { pts, P, S, A, geo, n, mat, upd() { geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true; } };
  }
  function burstPool(w, n, color, additive) {
    const sp = sprites(w, n, color, additive), V = new Float32Array(n * 3), L = new Float32Array(n), L0 = new Float32Array(n), S0 = new Float32Array(n), A0 = new Float32Array(n);
    let k = 0;
    return {
      emit(x, y, z, vx, vy, vz, life, size, alpha) { const i = k++ % n; sp.P.set([x, y, z], i * 3); V.set([vx, vy, vz], i * 3); L[i] = L0[i] = life; S0[i] = size; A0[i] = alpha; },
      step(dt, drag, grav) {
        for (let i = 0; i < n; i++) {
          if (L[i] <= 0) { sp.A[i] = 0; continue; }
          L[i] -= dt; const t = 1 - Math.max(0, L[i]) / L0[i], f = 1 - drag * dt;
          V[i * 3] *= f; V[i * 3 + 1] = V[i * 3 + 1] * f - grav * dt; V[i * 3 + 2] *= f;
          sp.P[i * 3] += V[i * 3] * dt; sp.P[i * 3 + 1] += V[i * 3 + 1] * dt; sp.P[i * 3 + 2] += V[i * 3 + 2] * dt;
          sp.S[i] = S0[i] * (0.6 + t); sp.A[i] = A0[i] * Math.sin(Math.PI * Math.pow(t, 0.45));
        }
        sp.upd();
      },
    };
  }
  function cullable(w, res, list) {
    const fix = () => res.meshes.forEach(m => {
      if (!m.isInstancedMesh || !m.count) return;
      const m4 = new T.Matrix4(), p = new T.Vector3(), c = new T.Vector3(); let sMax = 0, r = 0;
      for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, m4); c.add(p.setFromMatrixPosition(m4)); }
      c.divideScalar(m.count);
      for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, m4); r = Math.max(r, p.setFromMatrixPosition(m4).distanceTo(c)); sMax = Math.max(sMax, m4.getMaxScaleOnAxis()); }
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      m.geometry = m.geometry.clone(); m.geometry.boundingSphere = new T.Sphere(c, r + (m.geometry.boundingSphere ? m.geometry.boundingSphere.radius : 2) * sMax + 2);
      m.frustumCulled = true; list.push(m);
    });
    if (res.ready) res.ready.then(fix); else fix();
  }

  /* ---------------- the song: four lines, sung, newly composed in the spirit of the welcome ---------------- */
  const D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392, A4 = 440, Bb4 = 466.16, C5 = 523.25;
  const RANK = new Map([[D4, 0], [E4, 1], [F4, 2], [G4, 3], [A4, 4], [Bb4, 5], [C5, 6]]);
  const LINES = [
    { ar: 'طَلَعَ الْبَدْرُ عَلَيْنَا', en: 'The full moon has risen over us', n: [[0, 0.5, D4], [0.5, 0.5, F4], [1, 1, G4], [2, 1, A4], [3, 1, A4], [4, 1, G4], [5, 1, F4], [6, 2, G4]] },
    { ar: 'مِنْ ثَنِيَّاتِ الْوَدَاعْ', en: 'from the hills of al-Wada‘', n: [[0, 1, A4], [1, 1, Bb4], [2, 1, A4], [3, 1, G4], [4, 1, F4], [5, 1, E4], [6, 2, D4]] },
    { ar: 'وَجَبَ الشُّكْرُ عَلَيْنَا', en: 'Gratitude is owed by us', n: [[0, 0.5, D4], [0.5, 0.5, F4], [1, 1, G4], [2, 1, A4], [3, 1, C5], [4, 1, Bb4], [5, 1, A4], [6, 2, G4]] },
    { ar: 'مَا دَعَا لِلهِ دَاعْ', en: 'for as long as anyone calls to God', n: [[0, 1, A4], [1, 1, G4], [2, 1, F4], [3, 1, G4], [4, 1, E4], [5, 1, F4], [6, 2, D4]] },
  ];
  const LANE_X = [-2.4, -0.8, 0.8, 2.4];
  // the chart: phase 1 two lanes on the beat, phase 2 four lanes, phase 3 four lanes with held notes and chords
  const CHART = (() => {
    const notes = [], song = [], lines = [];
    let beat = 4;
    const phases = [{ reps: 2, lanes: [1, 2] }, { reps: 2, lanes: [0, 1, 2, 3] }, { reps: 3, lanes: [0, 1, 2, 3], holds: true, chords: true }];
    const starts = [];
    phases.forEach((P, pi) => {
      starts.push(beat);
      for (let r = 0; r < P.reps; r++) LINES.forEach((L, li) => {
        lines.push({ t: beat * BEAT, li, pi });
        L.n.forEach(([b0, d, f], k) => {
          const t = (beat + b0) * BEAT; song.push({ t, f, d: d * BEAT });
          if (pi === 0 && b0 % 1) return;
          const lane = P.lanes[Math.min(P.lanes.length - 1, Math.floor(RANK.get(f) / 7 * P.lanes.length))];
          const hold = P.holds && d >= 2 ? d * BEAT * 0.8 : 0;
          notes.push({ t, lane, hold, f, pi });
          if (P.chords && k === 3 && r % 2 === 0) notes.push({ t, lane: (lane + 2) % 4, hold: 0, f: f * 1.25, pi });
        });
        beat += 8;
      });
      beat += 4;
    });
    return { notes: notes.sort((a, b) => a.t - b.t), song, lines, starts, end: beat * BEAT };
  })();
  // golden lamps: discoveries carried by the rhythm itself
  const GOLD = [
    [6, 1, 'Watching the Road', 'Every morning the people of Madinah went out to the harrah, the lava field, to wait for him, until the heat of midday drove them home. (Sahih al-Bukhari 3906)', 'كَانُوا يَغْدُونَ كُلَّ غَدَاةٍ إِلَى الْحَرَّةِ'],
    [22, 2, 'From a Fort’s Roof', 'A man on the roof of one of the forts saw them coming, dressed in white, and called out that the one they waited for had come. The Muslims went out to meet him on the harrah. (Sahih al-Bukhari 3906)', 'يَا مَعَاشِرَ الْعَرَبِ هَذَا جَدُّكُمُ الَّذِي تَنْتَظِرُونَ'],
    [38, 0, 'Ten Nights at Quba', 'He stayed some ten nights with Banu ‘Amr ibn ‘Awf at Quba and founded the mosque there, then rode on into the city. (Sahih al-Bukhari 3906)', 'بِضْعَ عَشْرَةَ لَيْلَةً'],
    [54, 3, 'Such Joy', 'Al-Bara’ said: <span class="q">“I never saw the people of Madinah rejoice at anything as they rejoiced at the Messenger of God”</span>; even the young girls were saying, “The Messenger of God has come.” (Sahih al-Bukhari 3925)', 'مَا رَأَيْتُ أَهْلَ الْمَدِينَةِ فَرِحُوا بِشَيْءٍ فَرَحَهُمْ بِرَسُولِ اللَّهِ'],
    [76, 1, 'Taybah', '<span class="q">“Allah named Madinah Tabah.”</span> They called it Yathrib; it is al-Madinah, the City. (Sahih Muslim 1385; Sahih al-Bukhari 1871)', 'إِنَّ اللَّهَ تَعَالَى سَمَّى الْمَدِينَةَ طَابَةَ'],
    [92, 2, 'Where the Camel Knelt', 'He rode on his she-camel, the people walking with him, until it knelt at the place of his mosque in Madinah. (Sahih al-Bukhari 3906)', 'حَتَّى بَرَكَتْ عِنْدَ مَسْجِدِ الرَّسُولِ'],
  ];
  // golden lamps sit on notes of their own, a little after the given note index of each part
  GOLD.forEach((g, k) => { const n = CHART.notes[Math.min(CHART.notes.length - 1, g[0] * 2 + k)]; n.gold = g; });

  function houseBuilder(w, M, rnd, parent) {
    return (x, z, ry, wd, dp, ht, kind, slots) => {
      const g = new T.Group(); g.position.set(x, H(x, z) - 0.2, z); g.rotation.y = ry; parent.add(g);
      const box = (a, b, c, mat, px, py, pz) => { const m = new T.Mesh(new T.BoxGeometry(a, b, c), mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
      const wm = [M.plaster, M.brick, M.mud, M.stone][kind % 4];
      box(wd, ht, dp, wm, 0, ht / 2, 0);
      const ph = 0.6, pt = 0.22;
      box(wd, ph, pt, wm, 0, ht + ph / 2, dp / 2 - pt / 2); box(wd, ph, pt, wm, 0, ht + ph / 2, -dp / 2 + pt / 2);
      box(pt, ph, dp, wm, wd / 2 - pt / 2, ht + ph / 2, 0); box(pt, ph, dp, wm, -wd / 2 + pt / 2, ht + ph / 2, 0);
      for (let bx = -wd / 2 + 0.6; bx < wd / 2 - 0.3; bx += 0.8 + rnd() * 0.3) { const b = new T.Mesh(new T.CylinderGeometry(0.075, 0.09, dp + 0.7, 6), M.wood); b.rotation.x = Math.PI / 2; b.position.set(bx, ht - 0.3, 0); b.castShadow = true; g.add(b); }
      const dx = (rnd() - 0.5) * (wd - 2.4);
      box(1.0, 1.95, 0.12, M.door, dx, 0.98 + 0.2, dp / 2 + 0.03); box(1.3, 0.14, 0.18, M.wood, dx, 2.3, dp / 2 + 0.06);
      for (let k = 0; k < 2; k++) box(0.45, 0.55, 0.06, M.dark, (k ? 1 : -1) * wd * 0.3, ht * 0.7, dp / 2 + 0.01);
      if (rnd() < 0.4) box(wd * 0.45, 2.2, dp * 0.4, wm, wd * 0.2, ht + 1.1, -dp * 0.2);
      g.updateMatrixWorld(true);
      if (slots) {
        [[-wd / 2 + 0.3, ht + ph + 0.15, dp / 2 - 0.1], [wd / 2 - 0.3, ht + ph + 0.15, dp / 2 - 0.1], [dx, 2.5, dp / 2 + 0.25], [0, ht + ph + 0.15, dp / 2 - 0.1]]
          .forEach(p => slots.push(new T.Vector3(...p).applyMatrix4(g.matrixWorld)));
      }
      return g;
    };
  }

  ENGINE.register(WORLD.stage({
    key: 'badr',
    arabic: 'طَلَعَ البَدْر',
    title: 'The Full Moon Rises',
    era: 'Arrival in Yathrib, 1 AH · 622 CE',
    hint: 'Strike the lamps as they reach the line: D F J K (or ← ↓ ↑ →) · hold the key for a long lamp',
    hintTouch: 'Tap the four pads as the lamps reach the line · hold for a long lamp',
    sound: { reverb: 0.55 },
    story: `<p>The people of Yathrib went out to the lava fields every morning to watch the southern road, until the midday heat drove them home (Sahih al-Bukhari 3906). When the Prophet ﷺ finally arrived, the city rejoiced as it had never rejoiced at anything (Sahih al-Bukhari 3925).</p>
            <p>The song of welcome, <i>Tala‘a al-Badru</i>, is loved and still sung, though its report is weak and some scholars place it at the return from Tabuk; the melody sung here is newly made. Yathrib became known as al-Madinah, the City, and the Prophet ﷺ said that God named it <i>Tabah</i> (Sahih Muslim 1385).</p>`,

    enter(env) {
      const w = this.w = WORLD.create(env, { start: { x: KEYS[0][0], z: KEYS[0][1], yaw: 0 }, exposure: 0.74, far: 3600, near: 0.15, fov: 62,
        fog: { color: 0x182038, density: 0.0016 } });
      const S = w.scene, Q = w.quality, rnd = U.seeded(622);
      w.renderer.setClearColor(0x0c1226);
      // ground heights are slow to compute near the road; cache them on a grid
      const hc = new Map(); const Hc = (x, z) => { const k = Math.round(x * 2) + ',' + Math.round(z * 2); let v = hc.get(k); if (v == null) { v = H(Math.round(x * 2) / 2, Math.round(z * 2) / 2); hc.set(k, v); } return v; };
      this.H = Hc;

      /* ---------- terrain, sky, moon ---------- */
      const ter = SCAPE.terrain(w, { size: 2600, seg: Q < 1 ? 300 : 380, cz: -40, height: H, rock: [0.78, 0.92],
        colors: { low: '#6a5e52', high: '#74685a', rock: '#3e3a38', dark: '#24201e' }, tex: 'gravel', rockTex: 'lava',
        photo: { ground: 'dry_ground_rocks', rock: 'dark_rock', normal: 1 }, rep: 0.22, rockRep: 0.06 });
      // the lava field reads black, the gardens and city earth brown
      { const p = ter.mesh.geometry.attributes.position, c = ter.mesh.geometry.attributes.color;
        for (let i = 0; i < p.count; i++) { const R = roadInfo(p.getX(i), p.getZ(i)), Z = zoneOf(R.s), k = U.lerp(1, 0.42, Z.h * U.smooth(4, 14, R.d) * U.smooth(400, 50, R.d)); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); } c.needsUpdate = true; }
      w.ground = ter.ground;
      this.moonL = new T.DirectionalLight(0xc0d0ff, 0.42); this.moonL.position.set(0, 60, -100); S.add(this.moonL);
      S.add(new T.HemisphereLight(0x5a6aa0, 0x1a1612, PHOTO.enabled ? 0.08 : 0.4));
      w.followShadow(this.moonL, 50, Q < 1 ? 1024 : 2048);
      // the moon ahead, a little east of the road's end
      const end = at(LEN), mdir = new T.Vector3(end.x - KEYS[0][0] + 260, 0, end.z - KEYS[0][1]).normalize(); this.mdir = mdir;
      if (PHOTO.enabled) {
        PHOTO.sky(w, 'qwantani_moonrise_puresky', { rotation: 0, intensity: 0.28, gain: 0.42, haze: '#141c34', horizon: 0.5, ground: '#2a2a34', bounce: 0.2 }).then(o => {
          if (!o || !o.sunDir || this.w !== w) return;
          // turn the photographed sky so that its moon rises over the end of the road
          const want = Math.atan2(mdir.z, mdir.x), have = Math.atan2(o.sunDir.z, o.sunDir.x);
          if (o.material) o.material.uniforms.uRot.value += want - have;
          this.moonDir = new T.Vector3(mdir.x * Math.cos(Math.asin(o.sunDir.y)), o.sunDir.y, mdir.z * Math.cos(Math.asin(o.sunDir.y))).normalize();
          this.skyRotated = want - have;
        });
      } else w.sky({ top: '#0a1230', mid: '#2a3a68', bot: '#141a30', sunDir: [mdir.x, 0.25, mdir.z], sun: '#fff4d8', sunSize: 0.0016, stars: 0.6, haze: 0.3 });
      this.moon = KIT.glow(w, 0xfff2d0, 60, 0.0); this.moon.material.fog = false; S.add(this.moon);
      SCAPE.horizon(w, { cz: -40, haze: '#1a2440', layers: [{ r: 1500, h: 70, color: '#20283c', seed: 5, fade: 0.88 }, { r: 2000, h: 110, color: '#1c2436', seed: 11, fade: 0.88 }, { r: 2700, h: 150, color: '#1a2032', seed: 17, fade: 0.9 }] });

      /* ---------- materials ---------- */
      const M = {
        plaster: PHOTO.mat(w, 'clay_plaster', { triplanar: 0.32, color: '#d8c8b0', fallback: KIT.plaster(w, [1, 1], '#cbbca4') }),
        brick: PHOTO.mat(w, 'clay_block_wall', { triplanar: 0.3, color: '#ccb898', fallback: KIT.mudBrick(w, [1, 1]) }),
        mud: PHOTO.mat(w, 'brown_mud_dry', { triplanar: 0.35, color: '#c8b090', fallback: SCAPE.tex.mud(w) }),
        stone: PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.3, color: '#b8aa98', fallback: SCAPE.tex.granite(w) }),
        wood: PHOTO.mat(w, 'medieval_wood', { triplanar: 0.9, color: '#a08870', fallback: KIT.wood(w, [1, 1]) }),
        door: PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], color: '#9a8068', fallback: KIT.wood(w, [1, 2], '#5a4030') }),
        dark: new T.MeshStandardMaterial({ color: 0x120e0a, roughness: 1 }),
        lit: new T.MeshBasicMaterial({ color: 0xffb860 }),
      };
      this.M = M;

      /* ---------- the city lanes, the garden walls, the fort ---------- */
      const town = new T.Group(); S.add(town);
      const house = houseBuilder(w, M, rnd, town);
      const slots = this.slots = [];
      const p = {};
      for (let s = S_CITY + 6; s < S_PLACE + 170; ) {
        const wd = 7 + rnd() * 3, sq = s > S_PLACE - 10 && s < S_PLACE + 50;
        [-1, 1].forEach(side => {
          if (rnd() < 0.12) return;
          at(s + wd / 2, p); const dp = 7 + rnd() * 3, off = (sq ? 22 : 6) + dp / 2;
          const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side, ry = Math.atan2(-p.rx * side, -p.rz * side);
          house(x, z, ry, wd - 0.3, dp, 4.8 + rnd() * 2.4, (rnd() * 4) | 0, slots);
        });
        s += wd;
      }
      // houses further back, two or three rows deep
      for (let i = 0; i < 90; i++) {
        const s = U.lerp(S_CITY - 40, S_PLACE + 200, rnd()), side = rnd() < 0.5 ? -1 : 1, off = 22 + rnd() * 70; at(s, p);
        const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side; house(x, z, Math.atan2(-p.rx * side, -p.rz * side) + (rnd() - 0.5) * 0.3, 7 + rnd() * 4, 7 + rnd() * 4, 4.5 + rnd() * 3, (rnd() * 4) | 0, null);
      }
      // garden walls of mud along the road through the palms
      for (let s = S_PALMS; s < S_CITY - 10; s += 7.2) {
        [-1, 1].forEach(side => {
          if (rnd() < 0.18) return; at(s, p);
          const x = p.x + p.rx * 6.2 * side, z = p.z + p.rz * 6.2 * side, wall = new T.Mesh(new T.BoxGeometry(7, 1.7 + rnd() * 0.3, 0.6), M.mud);
          wall.position.set(x, H(x, z) + 0.75, z); wall.rotation.y = Math.atan2(p.tx, p.tz) + Math.PI / 2; wall.castShadow = wall.receiveShadow = true; town.add(wall);
          if (rnd() < 0.5) slots.push(new T.Vector3(x, wall.position.y + 1.05, z));
        });
      }
      // a fort (utum) of stone by the edge of the lava field, with a lamp on its roof
      at(S_PALMS - 40, p); const fx = p.x + p.rx * 24, fz = p.z + p.rz * 24; this.fort = new T.Vector3(fx, H(fx, fz), fz);
      { const g = new T.Group(); g.position.copy(this.fort); town.add(g);
        const tower = new T.Mesh(new T.BoxGeometry(8, 13, 8), M.stone); tower.position.y = 6.5; tower.castShadow = tower.receiveShadow = true; g.add(tower);
        for (let k = 0; k < 4; k++) { const c = new T.Mesh(new T.BoxGeometry(1.4, 1.0, 1.4), M.stone); c.position.set(k % 2 ? 3.3 : -3.3, 13.5, k < 2 ? 3.3 : -3.3); g.add(c); }
        const dr = new T.Mesh(new T.BoxGeometry(1.1, 2.0, 0.15), M.door); dr.position.set(0, 1.0, 4.05); g.add(dr);
        for (let k = 0; k < 3; k++) { const wi = new T.Mesh(new T.BoxGeometry(0.4, 0.7, 0.1), M.dark); wi.position.set(-1.5 + k * 1.5, 9, 4.02); g.add(wi); } }
      this.fortLamp = KIT.glow(w, 0xffb060, 3, 0.9); this.fortLamp.position.set(fx, this.fort.y + 14.4, fz); S.add(this.fortLamp);
      // lamps of watchers on the lava field
      const waiting = []; for (let k = 0; k < 14; k++) { const s = 20 + k * 16, side = k % 2 ? 1 : -1; at(s, p); const off = 10 + rnd() * 30, x = p.x + p.rx * off * side, z = p.z + p.rz * off * side; waiting.push([x, H(x, z) + 0.6, z]); }
      this.waiting = sprites(w, waiting.length, '#ffb466', true); waiting.forEach((q, i) => { this.waiting.P.set(q, i * 3); this.waiting.S[i] = 1.4; this.waiting.A[i] = 0.8; }); this.waiting.upd();
      // the open place at the end of the road
      at(S_PLACE + 20, p); this.place = new T.Vector3(p.x, H(p.x, p.z), p.z);
      w.bake(town); S.add(town);

      /* ---------- scattered life ---------- */
      this.cullList = [];
      const notRoad = m => (x, z) => roadInfo(x, z).d < m;
      const zoneD = k => (x, z) => { const R = roadInfo(x, z), Z = zoneOf(R.s); return (Z.h * k[0] + (1 - Z.h - Z.c) * k[1] + Z.c * k[2]) * U.smooth(260, 60, R.d); };
      const tiles = []; for (let a = 0; a < 3; a++) for (let c = 0; c < 4; c++) tiles.push([-460 + a * 320, 760 - (c + 1) * 400, -460 + (a + 1) * 320, 760 - c * 400]);
      const sc = o => tiles.forEach((A, k) => cullable(w, SCAPE.scatter(w, Object.assign({}, o, { area: A, n: Math.max(1, Math.round(o.n / tiles.length)), seed: o.seed * 31 + k })), this.cullList));
      sc({ kind: 'boulder', n: 900, scale: [0.6, 3.2], seed: 1, tex: 'lava', color: '#6a6460', avoid: notRoad(6), density: zoneD([1, 0.05, 0]) });
      sc({ kind: 'rock', n: 1200, scale: [0.3, 1.1], seed: 2, tex: 'lava', color: '#6a6460', avoid: notRoad(4.8), density: zoneD([1, 0.2, 0.1]) });
      sc({ kind: 'model', model: 'namaqualand_boulder_05', fallback: 'boulder', n: 140, scale: [0.6, 1.6], seed: 3, color: '#4a4644', avoid: notRoad(7), density: zoneD([1, 0.1, 0]) });
      sc({ kind: 'model', model: 'namaqualand_stones_01', fallback: 'pebble', fallbackScale: 0.6, n: 1300, scale: [0.6, 1.4], seed: 4, castShadow: false, color: '#6a6460', avoid: notRoad(4.2), density: zoneD([1, 0.5, 0.3]) });
      sc({ kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 220, scale: [0.6, 1.3], seed: 5, avoid: notRoad(5), density: zoneD([0.4, 1, 0.3]) });
      sc({ kind: 'model', model: 'wild_rooibos_bush', fallback: 'shrub', n: 130, scale: [0.6, 1.2], seed: 6, avoid: notRoad(5), density: zoneD([0.6, 0.8, 0.2]) });
      sc({ kind: 'grass', n: 1800, scale: [0.4, 0.9], seed: 7, avoid: notRoad(4.4), density: zoneD([0.3, 1, 0.4]) });
      sc({ kind: 'thorn', n: 240, scale: [0.7, 1.3], seed: 8, avoid: notRoad(5), density: zoneD([1, 0.4, 0.1]) });
      sc({ kind: 'acacia', n: 80, scale: [0.9, 1.4], seed: 9, avoid: notRoad(10), density: zoneD([0.8, 0.3, 0]) });
      sc({ kind: 'palm', n: 520, scale: [7, 13], seed: 10, avoid: (x, z) => { const R = roadInfo(x, z); return R.d < 9 || (R.s > S_CITY - 10 && R.d < 110); }, density: zoneD([0.08, 1, 0.5]) });
      const far = SCAPE.scatter(w, { kind: 'house', n: 220, area: { x: at(S_PLACE).x, z: at(S_PLACE).z, r: 520 }, scale: [6, 10], seed: 11, avoid: (x, z) => { const R = roadInfo(x, z); return R.d < 100 || R.s < S_CITY - 60; } });
      far.meshes.forEach(m => { m.material = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.22, fallback: m.material.map, color: '#cbbca4' }); });
      SCAPE.motes(w, { n: 70, area: [-140, 0.5, -500, 140, 8, 300], color: '#ffe0a0', size: 0.2, additive: true, blink: true, opacity: 0.6 });
      SCAPE.smoke(w, [0, 1, 2].reduce((o, k) => { at(S_CITY + 80 + k * 120, p); o.sources.push([p.x + p.rx * 30, H(p.x, p.z) + 7, p.z + p.rz * 30]); return o; }, { sources: [], n: 14, height: 14, size: 3, opacity: 0.08, color: '#8890a8' }));

      /* ---------- the highway: lane lines, the line of light, the lamps ---------- */
      const laneGeo = (lanes, s0, s1) => {
        const P = [], I = []; let v = 0;
        lanes.forEach(l => {
          for (let s = s0; s <= s1; s += 2) { at(s, p); const x = LANE_X[l]; [-0.05, 0.05].forEach(dx => { const xx = p.x + p.rx * (x + dx), zz = p.z + p.rz * (x + dx); P.push(xx, Hc(xx, zz) + 0.03, zz); }); if (s > s0) I.push(v - 2, v, v - 1, v - 1, v, v + 1); v += 2; }
        });
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(I); return g;
      };
      const lm = new T.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      [[[1, 2], 0, S_PALMS - 10], [[0, 1, 2, 3], S_PALMS - 10, S_PLACE + 10]].forEach(([l, a, b]) => { const m = new T.Mesh(laneGeo(l, a, b), lm); m.userData.dynamic = true; S.add(m); });
      const barG = new T.PlaneGeometry(6.6, 0.22); barG.rotateX(-Math.PI / 2);
      this.bar = new T.Mesh(barG, new T.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false })); this.bar.userData.dynamic = true; S.add(this.bar);
      this.pads = sprites(w, 4, '#ffd890', true);
      this.lineL = new T.PointLight(0xffb060, 1.2, 14, 2); S.add(this.lineL);
      // the lamps: little clay lamps lying on the road
      const NN = CHART.notes.length;
      const lampG = new T.LatheGeometry([[0, 0], [0.16, 0.02], [0.2, 0.08], [0.17, 0.12], [0.06, 0.12], [0.05, 0.16], [0, 0.16]].map(([a, b]) => new T.Vector2(a, b)), 12);
      const clay = PHOTO.mat(w, 'brown_mud_dry', { rep: [1, 1], color: '#b07848', fallbackColor: '#8a5a38' });
      this.lampMesh = new T.InstancedMesh(lampG, clay, NN); this.lampMesh.userData.dynamic = true; this.lampMesh.frustumCulled = false; this.lampMesh.castShadow = true; this.lampMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); S.add(this.lampMesh);
      this.flames = sprites(w, NN, '#ffc070', true); this.goldFl = sprites(w, GOLD.length, '#ffe27a', true);
      this.trails = sprites(w, NN, '#ffd890', true);
      CHART.notes.forEach((n, i) => {
        n.s = n.t * SPEED + STRIKE; at(n.s, p); n.x = p.x + p.rx * LANE_X[n.lane]; n.z = p.z + p.rz * LANE_X[n.lane]; n.y = Hc(n.x, n.z) + 0.02; n.state = 0;
        if (n.hold) { const q = at(n.s + n.hold * SPEED); n.ex = q.x + q.rx * LANE_X[n.lane]; n.ez = q.z + q.rz * LANE_X[n.lane]; }
      });
      this.sparks = burstPool(w, 160, '#ffe2a0', true);
      // golden lamps register as discoveries
      this.goldList = [];
      CHART.notes.filter(n => n.gold).forEach(n => { const g = n.gold; n.it = w.discover({ pos: [n.x, n.y + 0.4, n.z], title: g[2], text: g[3], ar: g[4], size: 0.01, color: 0xffe27a }); n.gi = this.goldList.length; this.goldList.push(n); });
      this.slotUsed = 0;
      // windows and roofs that wake as the city hears the news (the film shows them coming on)
      const cl = slots.filter((q, i) => i % 5 === 2); this.cityL = sprites(w, cl.length, '#ffb466', true); this.cityK = 0;
      cl.forEach((q, i) => { this.cityL.P.set([q.x, q.y, q.z], i * 3); this.cityL.S[i] = 1.1; this.cityL.A[i] = 0; q.used = true; }); this.cityL.upd();

      /* ---------- state, hand-off, sound ---------- */
      this.G = { on: false, t: -1, i0: 0, sched: 0, held: [false, false, false, false], phase: -1, li: -1, done: 0, hit: 0 };
      const c0 = this.camAt(0);
      w.pos.set(c0.p.x, 0, c0.p.z); w.eye = c0.p.y - w.ground(c0.p.x, c0.p.z);
      const dl = c0.l.clone().sub(c0.p); w.yaw = Math.atan2(-dl.x, -dl.z); w.pitch = Math.asin(dl.y / dl.length());
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.6, gain: 0.03 });
      this.murmur = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 260, q: 1.4, gain: 0.0 });
      this.clk = { cr: 1, dove: 3 };
      this.post = w.post({ bloom: 0.9, threshold: 0.55, vignette: 0.42, grain: 0.03, sat: 0.95, contrast: 1.05, lift: [0.0, 0.01, 0.035], gain: [0.98, 0.98, 1.05], rays: { strength: 0.3, dir: [mdir.x, 0.25, mdir.z] } });
      w.tick(dt => this.world(env, dt));
      this.placeLamps();
    },

    camAt(t) {
      const s = t * SPEED, a = at(s), b = at(s + 24), Hc = this.H;
      return { p: new T.Vector3(a.x, Hc(a.x, a.z) + 2.3, a.z), l: new T.Vector3(b.x, Hc(b.x, b.z) + 0.2, b.z) };
    },

    film(env, w) {
      const self = this, Hc = this.H, P = (s, lat, h) => { const p = at(s); const x = p.x + p.rx * lat, z = p.z + p.rz * lat; return [x, Hc(x, z) + h, z]; };
      const F = this.fort, pl = this.place, md = this.mdir;
      return [
        { dur: 7, fade: 'dip', title: true, fov: [44, 38], path: [[P(-60, -30, 14), P(400, 0, 30)], [P(-30, -10, 8), P(500, 0, 40)]],
          start: () => { self.doorsK = 0; } },
        { dur: 7, fade: 'dip', fov: [46, 42], line: 'Every morning they went out to the lava field to watch for him (Sahih al-Bukhari 3906).', ar: 'كانوا يغدون كل غداة إلى الحرة ينتظرونه',
          path: [[P(60, 22, 3), P(140, -8, 1)], [P(90, 16, 2.4), P(170, -10, 1)]] },
        { dur: 6, fade: 'cut', fov: [40, 34], line: 'From a fort’s roof, a watcher saw them coming, dressed in white (Sahih al-Bukhari 3906).', ar: 'فبصر بهم رجلٌ على أُطُمٍ مبيَّضين',
          path: [[[F.x - 18, F.y + 3, F.z + 14], [F.x, F.y + 12, F.z]], [[F.x - 14, F.y + 18, F.z + 12], [F.x + md.x * 80, F.y + 14, F.z + md.z * 80]]] },
        { dur: 7, fade: 'dip', fov: [50, 46], line: 'The city rejoiced as it never rejoiced at anything (Sahih al-Bukhari 3925).', ar: 'ما رأيت أهل المدينة فرحوا بشيءٍ فرحهم برسول الله',
          path: [[P(S_CITY + 120, 0, 9), P(S_CITY + 200, 0, 3)], [P(S_CITY + 150, 0, 4), P(S_CITY + 230, 0, 3)]],
          during: (w, k) => { self.cityK = k; } },
        { dur: 7, fade: 'dip', fov: [48, 62], lines: [[0.4, 'Tradition says they sang: “The full moon has risen over us”', 'طَلَعَ الْبَدْرُ عَلَيْنَا'], [3.8, 'Strike each lamp as it reaches the line of light.', 'اضرب كل مصباح حين يبلغ خط النور']],
          path: [[P(-20, 4, 6), P(30, 0, 0.5)], [P(-6, 1, 3.4), P(20, 0, 0.3)]],
          start: () => { SND.sing(env.bus, D4, { vowel: 'a', dur: 3, gain: 0.03, voices: 3 }); } },
      ];
    },
    filmOpts: {
      end(w) { const self = ENGINE.cur && ENGINE.cur.w === w ? ENGINE.cur : null; if (self) self.start(); },
    },

    start() {
      const w = this.w, G = this.G; G.on = true; G.t = -1.5;
      w.mode = dt => this.play(dt);
      w.onPointer = (e, p, ph) => this.pointer(e, ph);
      w.activity('The Full Moon Rises', 3, '');
      this.setPhase(0);
      if (w.ui.layer.classList.contains('touch')) this.touchPads();
      w.say('A Loved Tradition', 'The song <i>Tala‘a al-badru ‘alayna</i> is loved and sung to this day, though its report is weak (al-Bayhaqi; al-Albani, al-Silsilah al-Da‘ifah 598). The welcome itself is sahih (Sahih al-Bukhari 3906, 3925). The melody sung here is newly made.', { ms: 9000 });
    },
    setPhase(i) {
      const G = this.G, w = this.w; G.phase = i;
      const T3 = ['Part 1 of 3 · The lava field', 'Part 2 of 3 · The gardens', 'Part 3 of 3 · The lanes of the city'];
      const ST = ['Two lanes. Strike F or J (← or →) as each lamp reaches the line.', 'Four lanes now: D F J K (or ← ↓ ↑ →).', 'Hold the key for a long lamp. Some lamps come two at once.'];
      this.phaseTitle = T3[i]; w.step(ST[i]); this.tally();
      if (i > 0) SND.glow(w.env.bus, [D4, G4 / 2, A4 / 2][i], { gain: 0.05, dur: 5 });
    },
    tally() {
      const G = this.G, w = this.w, n = CHART.notes.filter(x => x.pi === G.phase).length, h = CHART.notes.filter(x => x.pi === G.phase && x.state === 2).length;
      w.progress(G.phase + h / n);
      const el = w.ui.layer.querySelector('.wq-title'); if (el) el.textContent = `${this.phaseTitle}  ·  ${h} lamps lit`;
    },

    /* ---------- input ---------- */
    laneOfKey(k) { return { d: 0, f: 1, j: 2, k: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, a: 0, s: 1, l: 3 }[k]; },
    onKey(env, e) {
      const w = this.w; if (!w || !this.G || !this.G.on || w.filmS || e.repeat) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, l = this.laneOfKey(k);
      if (l == null) return;
      // in the first part, the two lanes also answer to the outer keys
      this.press(this.G.phase === 0 ? (l <= 1 ? 1 : 2) : l);
    },
    keyup(env, e) {
      this.w && this.w.keyup(e); if (!this.G || !this.G.on) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, l = this.laneOfKey(k); if (l == null) return;
      this.release(this.G.phase === 0 ? (l <= 1 ? 1 : 2) : l);
    },
    pointer(e, ph) {
      if (!this.G.on) return false;
      if (e.target && e.target.classList && e.target.classList.contains('badr-pad')) return true;
      const W = this.w.env.w, l = Math.max(0, Math.min(3, Math.floor(e.clientX / W * 4)));
      const lane = this.G.phase === 0 ? (l <= 1 ? 1 : 2) : l;
      if (ph === 'down') { this.ptrLane = lane; this.press(lane); } else if (ph === 'up' && this.ptrLane != null) { this.release(this.ptrLane); this.ptrLane = null; }
      return true;
    },
    touchPads() {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);display:flex;justify-content:center;gap:10px;pointer-events:auto;z-index:5';
      ['D', 'F', 'J', 'K'].forEach((t, l) => {
        const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'badr-pad'; bt.textContent = '◆'; bt.setAttribute('aria-label', 'lane ' + (l + 1));
        bt.style.cssText = 'width:20vw;max-width:96px;height:64px;border-radius:14px;border:1px solid rgba(246,220,154,.5);background:rgba(6,9,20,.4);color:#f6dc9a;font-size:18px;touch-action:none';
        const lane = () => this.G.phase === 0 ? (l <= 1 ? 1 : 2) : l;
        bt.addEventListener('pointerdown', ev => { ev.stopPropagation(); ev.preventDefault(); this.press(lane()); });
        bt.addEventListener('pointerup', ev => { ev.stopPropagation(); this.release(lane()); });
        wrap.appendChild(bt);
      });
      this.w.ui.layer.appendChild(wrap); this.padEl = wrap;
    },
    press(l) {
      const G = this.G, b = this.w.env.bus; G.held[l] = true; G.flash = G.flash || [0, 0, 0, 0]; G.flash[l] = 1;
      // the nearest waiting lamp in this lane within the window
      let best = null, bd = 0.24;
      for (let i = G.i0; i < CHART.notes.length; i++) { const n = CHART.notes[i]; if (n.t > G.t + 0.3) break; if (n.state || n.lane !== l) continue; const d = Math.abs(n.t - G.t); if (d < bd) { bd = d; best = n; } }
      if (!best) { SND.step(b, { gain: 0.025, f: 1400 }); return; }
      best.state = best.hold ? 1 : 2; best.ht = G.t; best.q = bd < 0.09 ? 1 : 0.7;
      this.lift(best);
    },
    release(l) {
      const G = this.G; G.held[l] = false;
      CHART.notes.forEach(n => { if (n.state === 1 && n.lane === l) { const left = n.t + n.hold - G.t; n.state = 2; if (left > 0.35) n.q *= 0.6; this.fly(n); } });
    },
    lift(n) {
      const G = this.G, b = this.w.env.bus;
      // the city answers: a sung harmony above the melody, louder for a truer stroke
      SND.sing(b, n.f * 1.5 > 700 ? n.f * 0.75 : n.f * 1.5, { vowel: 'o', dur: n.hold ? n.hold + 0.4 : 0.8, gain: 0.018 + 0.012 * n.q, attack: 0.02, voices: 2 });
      SND.step(b, { gain: 0.06, f: 1900 });
      for (let k = 0; k < 10; k++) this.sparks.emit(n.x, n.y + 0.3, n.z, (Math.random() - 0.5) * 2.4, 1 + Math.random() * 2, (Math.random() - 0.5) * 2.4, 0.7, 0.35, 1);
      if (n.gold) { n.it.done = true; n.it.onUse(this.w, n.it); }
      if (!n.hold) this.fly(n);
    },
    fly(n) {
      const sl = this.slots, p = at(n.s), G = this.G;
      // the next free place ahead of the line on the lamp's side: a parapet, a door, a wall top, a palm
      let tgt = null;
      for (let k = 0; k < sl.length; k++) { const q = sl[k]; if (q.used) continue; if (q.s == null) q.s = roadInfo(q.x, q.z).s; if (q.s > n.s + 4 && q.s < n.s + 60) { tgt = q; break; } }
      if (!tgt) { const side = n.lane < 2 ? -1 : 1, x = p.x + p.rx * (7 + Math.random() * 4) * side, z = p.z + p.rz * (7 + Math.random() * 4) * side; tgt = new T.Vector3(x, this.H(x, z) + 1.2 + Math.random(), z); }
      tgt.used = true; n.to = tgt; n.ft = 0; G.hit++; this.tally();
    },

    /* ---------- the ride ---------- */
    play(dt) {
      const w = this.w, G = this.G, cam = w.camera, b = w.env.bus;
      dt = Math.min(dt, 0.06); G.t += dt;
      // the song: schedule the sung melody and claps just ahead of time
      const look = G.t + 0.25;
      while (G.sched < CHART.song.length && CHART.song[G.sched].t < look) { const s0 = CHART.song[G.sched++], d = Math.max(0, s0.t - G.t); SND.sing(b, s0.f, { vowel: 'a', dur: s0.d + 0.25, gain: 0.032, delay: d, attack: 0.04, hold: 0.6, voices: 3, detune: 8 }); }
      const beatN = Math.floor((G.t + 0.06) / BEAT);
      if (beatN !== G.lastBeat && G.t > 0 && G.t < CHART.end) { G.lastBeat = beatN; if (beatN % 2 === 1) SND.step(b, { gain: 0.03, f: 2200 }); }
      // lines of the song, shown in Arabic and English as they are sung
      while ((G.li + 1) < CHART.lines.length && CHART.lines[G.li + 1].t <= G.t) { G.li++; const L = CHART.lines[G.li], v = LINES[L.li]; w.step(`${v.ar} — ${v.en}`); if (L.pi !== G.phase) this.setPhase(L.pi); }
      // lamps that pass the line unstruck stay on the road, dimmed
      while (G.i0 < CHART.notes.length && CHART.notes[G.i0].t < G.t - 0.3) { const n = CHART.notes[G.i0++]; if (!n.state) { n.state = 3; SND.swell(b, { f0: 300, f1: 180, dur: 0.4, gain: 0.012 }); } }
      // the camera rides the road
      const tt = Math.max(0, G.t), c = this.camAt(Math.min(tt, CHART.end + 1.5));
      const sway = Math.sin(G.t * Math.PI / BEAT) * 0.03;
      cam.position.set(c.p.x, c.p.y + Math.abs(sway), c.p.z); cam.lookAt(c.l); cam.rotation.z += sway * 0.2;
      w.pos.set(c.p.x, 0, c.p.z); w.y = c.p.y - 2.3;
      if (w._shadow) { const S2 = w._shadow, f = cam.getWorldDirection(new T.Vector3()); const px = Math.round((c.p.x + f.x * 20) / 2) * 2, pz = Math.round((c.p.z + f.z * 20) / 2) * 2; S2.light.target.position.set(px, 0, pz); S2.light.position.set(px + S2.off.x, S2.off.y, pz + S2.off.z); }
      // the line of light
      const ls = Math.min(tt, CHART.end) * SPEED + STRIKE, q = at(ls);
      this.bar.position.set(q.x, this.H(q.x, q.z) + 0.05, q.z); this.bar.rotation.y = Math.atan2(q.tx, q.tz);
      this.lineL.position.set(q.x, this.H(q.x, q.z) + 1.2, q.z);
      G.flash = G.flash || [0, 0, 0, 0];
      for (let l = 0; l < 4; l++) { G.flash[l] = Math.max(G.held[l] ? 0.5 : 0, G.flash[l] - dt * 4); const x = q.x + q.rx * LANE_X[l], z = q.z + q.rz * LANE_X[l]; this.pads.P.set([x, this.H(x, z) + 0.12, z], l * 3); const on = G.phase === 0 ? (l === 1 || l === 2) : true; this.pads.S[l] = 0.9 + G.flash[l] * 1.2; this.pads.A[l] = on ? 0.35 + G.flash[l] * 0.65 : 0; }
      this.pads.upd(); this.bar.material.opacity = 0.45 + 0.15 * Math.cos(G.t * Math.PI * 2 / BEAT);
      this.placeLamps();
      // the end of the song: the city answers, the camera rises, and the welcome is complete
      if (G.t > CHART.end + 0.5 && !G.done) { G.done = 1; G.doneT = 0; this.finale(); }
      if (G.done) {
        G.doneT += dt; const k = U.smooth(0, 9, G.doneT), md = this.mdir;
        cam.position.set(c.p.x - md.x * 14 * k, c.p.y + 26 * k, c.p.z - md.z * 14 * k); cam.lookAt(c.p.x + md.x * 120, c.p.y + 6 - 10 * k, c.p.z + md.z * 120);
      }
    },
    // testing aid: jump the song to time t, as if every lamp before it had been struck
    _seek(t) {
      const G = this.G; G.t = t;
      CHART.notes.forEach(n => { if (n.t < t && !n.state) { n.state = 2; this.fly(n); n.ft = 1; } });
      G.sched = CHART.song.findIndex(e => e.t >= t); if (G.sched < 0) G.sched = CHART.song.length;
      G.i0 = CHART.notes.findIndex(n => n.t >= t - 0.3); if (G.i0 < 0) G.i0 = CHART.notes.length;
      let li = -1; CHART.lines.forEach((L, i) => { if (L.t <= t) li = i; }); G.li = li - 1;
    },
    finale() {
      const w = this.w, b = w.env.bus, G = this.G;
      this.murmur.set('gain', 0.02, 2);
      [D4, F4, A4].forEach((f, i) => SND.glow(b, f, { gain: 0.06, dur: 10, delay: i * 0.4, vowel: i ? 'o' : 'a' }));
      LINES[0].n.forEach(([b0, d, f]) => { SND.sing(b, f, { vowel: 'a', dur: d * BEAT + 0.3, gain: 0.04, delay: 1.5 + b0 * BEAT, voices: 4 }); SND.sing(b, f * 1.5, { vowel: 'o', dur: d * BEAT + 0.3, gain: 0.02, delay: 1.5 + b0 * BEAT, voices: 2 }); });
      w.say('The Welcome', 'The city has come out to meet him. Al-Bara’: <span class="q">“I never saw the people of Madinah rejoice at anything as they rejoiced at the Messenger of God.”</span> (Sahih al-Bukhari 3925)', { ms: 11000 });
      setTimeout(() => {
        if (this.w !== w) return;
        w.finish('The city has welcomed him');
        setTimeout(() => {
          if (this.w !== w) return;
          G.on = false; w.mode = null; w.onPointer = null; if (this.padEl) this.padEl.remove();
          const p = at(Math.min(LEN, CHART.end * SPEED)); w.pos.set(p.x, 0, p.z); w.y = w.ground(p.x, p.z); w.eye = 1.62; w.yaw = Math.atan2(-p.tx, -p.tz); w.pitch = 0.1;
          w.env.hint('WASD to walk in the open place · look up at the moon');
        }, 6000);
      }, 9000);
    },

    /* the lamps: waiting on the road, rising, held, settled on the city */
    placeLamps() {
      const G = this.G, m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), one = new T.Vector3(1, 1, 1), zero = new T.Matrix4().makeScale(0, 0, 0);
      const t = G.t, fl = this.flames, tr = this.trails, gf = this.goldFl, dt = this.lastDt || 0.016;
      CHART.notes.forEach((n, i) => {
        let x = n.x, y = n.y, z = n.z, a = 0, sz = 0.5, tra = 0;
        if (n.state === 0) { const ahead = n.t - t; a = ahead > 9 ? 0 : 0.55 + 0.45 * U.smooth(1.5, 0, ahead); sz = 0.55 + U.smooth(1, 0, Math.abs(ahead)) * 0.4; if (n.hold) tra = a * 0.6; }
        else if (n.state === 1) { a = 1; sz = 0.9; tra = 1; const k = Math.min(1, (t - n.t) / n.hold); const lp = at(n.s + k * n.hold * SPEED); if (t > n.t) { x = lp.x + lp.rx * LANE_X[n.lane]; z = lp.z + lp.rz * LANE_X[n.lane]; } if (t > n.t + n.hold + 0.2) { n.state = 2; this.fly(n); } }
        else if (n.state === 2 && n.to) {
          n.ft = Math.min(1, n.ft + dt * 1.3); const k = U.easeOut(n.ft);
          x = U.lerp(n.x, n.to.x, k); z = U.lerp(n.z, n.to.z, k); y = U.lerp(n.y, n.to.y, k) + Math.sin(k * Math.PI) * 4; a = 0.95; sz = 0.6 + (1 - k) * 0.4;
        } else if (n.state === 3) { a = 0.12; sz = 0.35; }
        v.set(x, y, z); q.identity(); m4.compose(v, q, one); this.lampMesh.setMatrixAt(i, m4);
        fl.P.set([x, y + 0.22, z], i * 3); fl.S[i] = sz; fl.A[i] = a * (0.85 + 0.15 * Math.sin(t * 9 + i));
        if (n.hold && n.state < 2 && n.ex != null) { tr.P.set([(x + n.ex) / 2, n.y + 0.12, (z + n.ez) / 2], i * 3); tr.S[i] = Math.hypot(n.ex - x, n.ez - z) * 0.9 + 0.3; tr.A[i] = tra * 0.35; } else tr.A[i] = 0;
        if (n.gold) { gf.P.set([x, y + 0.5, z], n.gi * 3); gf.S[n.gi] = 1.6; gf.A[n.gi] = n.state === 0 ? a : n.state === 2 ? 0.5 : 0; }
      });
      this.lampMesh.instanceMatrix.needsUpdate = true; fl.upd(); tr.upd(); gf.upd();
    },

    world(env, dt) {
      const w = this.w, G = this.G, t = w.time, b = env.bus, cam = w.camera;
      this.lastDt = dt;
      if (this.cullList) for (const m of this.cullList) { const S0 = m.geometry.boundingSphere; m.visible = S0.center.distanceTo(cam.position) - S0.radius < 700; }
      // the moon: a soft glow over the photographed one, rising a little as the song goes on
      const md = this.moonDir || new T.Vector3(this.mdir.x, 0.22, this.mdir.z).normalize(), rise = G.on ? U.smooth(0, CHART.end, G.t) * 0.12 : 0;
      const dir = new T.Vector3(md.x, md.y + rise, md.z).normalize();
      this.moon.position.copy(cam.position).addScaledVector(dir, 1500); this.moon.material.opacity = 0.18 + rise * 1.2;
      this.moonL.position.copy(dir).multiplyScalar(100); if (w._shadow) w._shadow.off.copy(dir).multiplyScalar(125);
      if (this.post && this.post.rays) this.post.rays.dir = [dir.x, dir.y, dir.z];
      this.fortLamp.material.opacity = 0.75 + 0.2 * U.noise1(t * 6);
      for (let i = 0; i < this.waiting.n; i++) this.waiting.A[i] = 0.6 + 0.3 * U.noise1(t * 5 + i * 3);
      this.waiting.upd();
      this.sparks.step(dt, 2, -0.3);
      { const cl = this.cityL, n = cl.n, k = w.filmS ? this.cityK : Math.max(this.cityK, 1); for (let i = 0; i < n; i++) cl.A[i] = U.smooth(i / n * 0.8, i / n * 0.8 + 0.2, k) * (0.6 + 0.25 * U.noise1(t * 4 + i)); cl.upd(); }
      if (!G.on && !w.filmS) this.placeLamps();
      this.clk.cr -= dt; if (this.clk.cr < 0) { this.clk.cr = 0.8 + Math.random() * 2.5; SND.cricket(b, { gain: 0.0025 }); }
      this.clk.dove -= dt; if (this.clk.dove < 0) { this.clk.dove = 6 + Math.random() * 8; SND.coo(b, { gain: 0.012 }); }
    },

    update(env, dt) { const w = this.w; if (!w) return; w.update(Math.min(dt, 0.1)); },
    onLeave() { this.padEl = null; },
  }));
})();
