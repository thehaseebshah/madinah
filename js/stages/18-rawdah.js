/* Station — Ar-Rawdah, a Garden of Paradise (walkable, with a drawing overlay).
   Feeling: tenderness, a quiet garden indoors. The Rawdah of the Prophet's Mosque with no one in
   it: its green carpet, white columns banded in green and gold, the white marble minbar, the
   mihrab, and the screen where his house stood. Six historic columns carry name plates. At each,
   press E: a faint golden arabesque appears (a spiral vine with branches) and you trace it with
   the hand. Blossoms open as you go, each a sung note; when the line is complete the vine grows up
   the real column. Six columns, six patterns; then the hadith of the garden is written in light.
   Colour script: green, with gold reserved for the vines, the name plates and the revelation. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  // a soft image-based light painted on a canvas (sky above, warm floor below) for marble and gold
  function paintedEnv(w, top, mid, bot) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, top); gr.addColorStop(0.47, mid); gr.addColorStop(0.53, mid); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(w.renderer), rt = pm.fromEquirectangular(t);
    w.scene.environment = rt.texture; w._envRT = rt; t.dispose(); pm.dispose();
  }
  // one material per mesh here, so geometry groups only stop the bake from merging
  const ungroup = S => S.traverse(o => { if (o.isMesh && !Array.isArray(o.material) && o.geometry.groups.length > 1) o.geometry.clearGroups(); });
  const T = THREE;
  const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  const SPRING = 4.5, CEIL = 6.4, COLR = 0.3;
  const XS = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5], ZS = [-7, -4, -1, 2, 5, 8, 11];
  const SCREEN_X = -9.4, QIBLA_Z = -9.6, MIHRAB_X = 3.0, MINBAR_X = 6.0;
  const RAWDAH = { x0: SCREEN_X, x1: 7.6, z0: QIBLA_Z, z1: 3.5 };

  const COLUMNS = [
    { id: 'aishah', x: -1.5, z: -4, ar: 'أسطوانة عائشة', name: 'The Column of ‘A’ishah', label: 'Touch the Column of ‘A’ishah', pattern: 0,
      text: 'One of the historic columns of the Rawdah, named in tradition after ‘A’ishah, Mother of the Believers. The names and places of these columns were kept by the historians of Madinah, among them al-Samhudi in his <i>Wafa’ al-Wafa’</i>.' },
    { id: 'tawbah', x: -4.5, z: -4, ar: 'أسطوانة التوبة', name: 'The Column of Repentance', label: 'Touch the Column of Repentance', pattern: 1, cardAr: 'وَآخَرُونَ اعْتَرَفُوا بِذُنُوبِهِمْ خَلَطُوا عَمَلًا صَالِحًا وَآخَرَ سَيِّئًا عَسَى اللَّهُ أَن يَتُوبَ عَلَيْهِمْ',
      text: 'Also called the Column of Abu Lubabah. The sirah (Ibn Ishaq) reports that after the affair of Banu Qurayzah the companion Abu Lubabah, regretting what he had done, tied himself to a pillar of the mosque for six nights until his repentance was accepted, and the Prophet ﷺ released him at dawn. Commentators link it, in differing ways, to the verse: <span class="q">“Others have acknowledged their sins; they mixed a righteous deed with another that was bad. Perhaps God will turn to them.”</span> (Qur’an 9:102)' },
    { id: 'sarir', x: -7.5, z: -7, ar: 'أسطوانة السرير', name: 'The Column of the Bed', label: 'Touch the Column of the Bed', pattern: 2,
      text: 'As-Sarir. Tradition places here the spot where his bed was set when he stayed in the mosque in <i>i‘tikaf</i>, the devotional retreat; a report in Sunan Ibn Majah (1774) mentions it.' },
    { id: 'haras', x: -4.5, z: -1, ar: 'أسطوانة الحرس', name: 'The Column of the Guard', label: 'Touch the Column of the Guard', pattern: 3,
      text: 'Al-Haras, also called al-Mahras. Tradition holds that companions stood watch at this place; it is also known as the column of ‘Ali, who is said to have kept guard here.' },
    { id: 'wufud', x: -4.5, z: 2, ar: 'أسطوانة الوفود', name: 'The Column of the Delegations', label: 'Touch the Column of the Delegations', pattern: 4,
      text: 'Al-Wufud. Here, tradition says, he received the delegations that came to Madinah from the tribes of Arabia.' },
    { id: 'mukhallaqah', x: 1.5, z: -7, ar: 'الأسطوانة المخلّقة', name: 'The Perfumed Column', label: 'Touch the Perfumed Column', pattern: 5, cardAr: 'فَصَاحَتِ النَّخْلَةُ صِيَاحَ الصَّبِيِّ',
      text: 'Al-Mukhallaqah, also called al-Hannanah. It marks the place of the palm trunk he used to lean on while preaching. When the minbar was made, the trunk cried out like a child, until he came down and placed his hand on it and it grew quiet. (Sahih al-Bukhari 3584)' },
  ];

  /* ---------- the six arabesques, in a square of [-1, 1] with y up ---------- */
  function spiral(cx, cy, r0, a0, turns, dir, rEnd) {
    const out = [], n = Math.max(30, Math.round(turns * 60));
    for (let i = 0; i <= n; i++) { const k = i / n, a = a0 + dir * k * turns * Math.PI * 2, r = U.lerp(r0, rEnd == null ? r0 * 0.12 : rEnd, k); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return out;
  }
  function resample(pts, N) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1], out = [];
    let j = 0;
    for (let i = 0; i < N; i++) {
      const s = (i / (N - 1)) * L;
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const k = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
      out.push([U.lerp(pts[j][0], pts[j + 1][0], k), U.lerp(pts[j][1], pts[j + 1][1], k)]);
    }
    return out;
  }
  const PATTERNS = [
    () => { // a rising vine that ends in a curl
      const st = []; for (let i = 0; i <= 80; i++) { const s = i / 80; st.push([0.32 * Math.sin(s * Math.PI * 2.1), -1 + 1.45 * s]); }
      const e = st[st.length - 1], a0 = Math.PI, r0 = 0.32;
      return st.concat(spiral(e[0] + r0, e[1], r0, a0, 1.6, -1));
    },
    () => spiral(0, 0.02, 0.95, -Math.PI / 2, 2.4, 1, 0.08), // a spiral turning inward
    () => { // a double scroll, like an S
      const L = spiral(-0.45, 0.12, 0.47, 0, 1.5, 1, 0.07).reverse();
      return L.concat(spiral(0.45, -0.12, 0.47, Math.PI, 1.5, 1, 0.07));
    },
    () => { // a running scroll of loops
      const out = []; for (let i = 0; i <= 260; i++) { const t = (i / 260) * Math.PI * 6; out.push([-0.92 + 0.0975 * t - 0.27 * Math.sin(t), -0.3 * Math.cos(t) + 0.05 * Math.sin(t / 6 * Math.PI)]); }
      return out;
    },
    () => { // a heart-shaped palmette
      const out = []; for (let i = 0; i <= 240; i++) { const t = (i / 240) * Math.PI * 2; out.push([0.06 * 16 * Math.pow(Math.sin(t), 3), 0.062 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + 0.12]); }
      return out;
    },
    () => { // a ring, then a spiral into its heart
      const out = []; const n = 300;
      for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2 * 2.6; const r = a < Math.PI * 2 ? 0.88 : 0.88 * (1 - (a - Math.PI * 2) / (Math.PI * 2 * 1.75)); out.push([Math.cos(a - Math.PI / 2) * r, Math.sin(a - Math.PI / 2) * r]); }
      return out;
    },
  ];
  function buildPattern(k) {
    const N = 260, pts = resample(PATTERNS[k](), N);
    const branches = [], leaves = [];
    const tan = i => { const a = pts[Math.max(0, i - 2)], b = pts[Math.min(N - 1, i + 2)]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    for (let b = 0; b < 6; b++) {
      const at = Math.round(N * (b + 0.55) / 6.6), side = b % 2 ? 1 : -1, [tx, ty] = tan(at), nx = -ty * side, ny = tx * side;
      const p = pts[at], r = 0.12 + (b % 3) * 0.02, C = [p[0] + nx * r + tx * r * 0.4, p[1] + ny * r + ty * r * 0.4];
      const a0 = Math.atan2(p[1] - C[1], p[0] - C[0]);
      const sp = [p].concat(spiral(C[0], C[1], Math.hypot(p[0] - C[0], p[1] - C[1]), a0, 1.15, side > 0 ? -1 : 1, 0.03));
      branches.push({ at, pts: sp, grow: -1, note: false });
    }
    for (let l = 0; l < 14; l++) { const at = Math.round(N * (l + 0.3) / 14.5), [tx, ty] = tan(at), side = l % 2 ? 1 : -1; leaves.push({ at, ang: Math.atan2(ty, tx) + side * 0.9, side, grow: -1 }); }
    return { pts, branches, leaves, N };
  }

  const station = WORLD.stage({
    key: 'rawdah',
    arabic: 'الرَّوْضَة',
    title: 'A Garden of Paradise',
    era: 'Ar-Rawdah ash-Sharifah',
    hint: 'WASD to walk · E at a named column · trace the golden vine with the mouse (or hold E / Space)',
    hintTouch: 'Left thumb to walk · right thumb to look · tap E at a named column, then trace the vine with your finger',
    sound: { reverb: 0.7 },
    story: `<p>Inside the Prophet’s Mosque, between the place where his house stood and his pulpit, lies a small area marked by its own green carpet and white columns: ar-Rawdah, the Garden.</p>
            <p class="q"><span class="ar">مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ</span>“Between my house and my pulpit is a garden from the gardens of Paradise.” (Sahih al-Bukhari 1196; Sahih Muslim 1390)</p>
            <p>Six of its columns carry old names, kept by tradition and recorded by historians of Madinah such as al-Samhudi. The endless, branching vine of Islamic ornament, the <i>arabesque</i>, was long understood as an image of the garden: touch each named column and trace its vine.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0, z: 3.0, yaw: 0.08, pitch: 0.05 }, exposure: 1.0, far: 400,
        fog: { color: 0x1c3a2c, near: 20, far: 70 },
        bounds: [SCREEN_X + 0.6, QIBLA_Z + 0.6, 12.6, 13.4],
        surface: () => 'wood',
      });
      const S = w.scene;
      this.done = new Set(); this.reveal = -1; this.vines = [];

      w.sky({ top: '#88b4dc', mid: '#e8eef0', bot: '#c8c0b0', sunDir: [0.2, 0.9, 0.3], sun: '#fff6e0' });
      paintedEnv(w, '#d8d0bc', '#a8a494', '#5a4420');
      S.add(new T.HemisphereLight(0xfff4e2, 0x2c4a36, 0.4));
      const top = new T.DirectionalLight(0xfff2dc, 0.95); top.position.set(4, 20, 6); top.target.position.set(0, 0, -2); S.add(top, top.target);
      top.castShadow = true; top.shadow.mapSize.set(2048, 2048);
      Object.assign(top.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 2, far: 40 }); top.shadow.camera.updateProjectionMatrix();
      top.shadow.bias = -0.0006; top.shadow.normalBias = 0.03; w.renderer.shadowMap.enabled = true; w.renderer.shadowMap.type = T.PCFSoftShadowMap;
      [[-3, -3], [3, 6]].forEach(([x, z]) => { const p = new T.PointLight(0xffe0b0, 0.5, 14, 2); p.position.set(x, CEIL - 1.2, z); S.add(p); });

      /* ---------- textures ---------- */
      const green = w.tex(512, (g, s) => {
        g.fillStyle = '#1d5a3e'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(6,30,18,0.25)' : 'rgba(90,150,110,0.15)'; g.fillRect(Math.random() * s, Math.random() * s, 2, 1); }
        g.fillStyle = '#c8b270'; g.fillRect(0, 0, s, 6); g.fillRect(0, s / 2, s, 6);
        for (let row = 0; row < 2; row++) for (let k = 0; k < 2; k++) {
          const cx = k * s / 2 + s / 4, cy = row * s / 2 + s / 4 + 6;
          g.strokeStyle = 'rgba(180,220,170,0.35)'; g.lineWidth = 3;
          for (let p = 0; p < 8; p++) { const a = p * Math.PI / 4; g.beginPath(); g.ellipse(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34, 30, 12, a, 0, 6.283); g.stroke(); }
          g.fillStyle = 'rgba(200,178,112,0.7)'; U.star8(g, cx, cy, 20, 0.6, 0.39); g.fill();
        }
      });
      const red = w.tex(256, (g, s) => {
        g.fillStyle = '#5a1618'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 3000; i++) { g.fillStyle = 'rgba(30,0,4,0.25)'; g.fillRect(Math.random() * s, Math.random() * s, 2, 1); }
        g.fillStyle = '#c8a058'; g.fillRect(0, 0, s, 4); g.fillRect(0, s / 2, s, 4);
        g.fillStyle = 'rgba(200,160,88,0.6)'; U.star8(g, s / 2, s / 4, 16, 0.6, 0.39); g.fill(); U.star8(g, s / 2, s * 0.75, 16, 0.6, 0.39); g.fill();
      });
      const marbleTex = w.tex(512, (g, s) => {
        g.fillStyle = '#f3efe6'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(150,140,124,0.2)';
        for (let i = 0; i < 26; i++) { g.lineWidth = 0.5 + Math.random() * 1.4; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (Math.random() - 0.5) * 40; y += Math.random() * 40; g.lineTo(x, y); } g.stroke(); }
      });
      const band = w.tex(512, (g, s) => {
        g.fillStyle = '#1f6a48'; g.fillRect(0, 0, s, s);
        g.fillStyle = '#d6b060'; g.fillRect(0, 0, s, 18); g.fillRect(0, s - 18, s, 18);
        g.strokeStyle = '#d6b060'; g.lineWidth = 5;
        for (let k = 0; k < 4; k++) {
          const cx = k * s / 4 + s / 8;
          g.beginPath(); for (let i = 0; i <= 60; i++) { const a = (i / 60) * Math.PI * 3.2, r = 46 * (1 - i / 75); const x = cx + Math.cos(a) * r, y = s / 2 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          g.fillStyle = '#e8c878'; g.beginPath(); g.arc(cx + 46, s / 2, 7, 0, 6.283); g.fill();
        }
        g.strokeStyle = 'rgba(214,176,96,0.7)'; g.lineWidth = 3;
        g.beginPath(); for (let x = 0; x <= s; x += 4) g.lineTo(x, s / 2 + Math.sin(x / s * Math.PI * 8) * 60); g.stroke();
      });
      band.wrapS = T.RepeatWrapping;
      const ceilTex = w.tex(512, (g, s) => {
        g.fillStyle = '#f2ead8'; g.fillRect(0, 0, s, s);
        for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s]]) { g.fillStyle = '#e8dcc0'; U.star8(g, x, y, s / 2, 0.765, 0); g.fill(); g.strokeStyle = '#c9a24e'; g.lineWidth = 7; g.stroke(); g.fillStyle = '#2a6a4a'; U.star8(g, x, y, s * 0.13, 0.6, 0.39); g.fill(); }
        g.fillStyle = '#c9a24e'; g.beginPath(); g.arc(s / 2, s / 2, 22, 0, 6.283); g.fill();
        g.strokeStyle = '#2a6a4a'; g.lineWidth = 3; g.beginPath(); g.arc(s / 2, s / 2, 40, 0, 6.283); g.stroke();
      });
      const qiblaTex = w.tex(1024, (g, s) => {
        g.fillStyle = '#efe7d6'; g.fillRect(0, 0, s, s);
        g.fillStyle = '#1f5a3e'; g.fillRect(0, s * 0.74, s, s * 0.26);
        g.fillStyle = '#c9a24e'; g.fillRect(0, s * 0.74, s, 8); g.fillRect(0, s * 0.2, s, 6); g.fillRect(0, s * 0.3, s, 6);
        g.strokeStyle = '#c9a24e'; g.lineWidth = 4;
        g.beginPath(); for (let x = 0; x <= s; x += 3) g.lineTo(x, s * 0.25 + Math.sin(x / s * Math.PI * 20) * 18); g.stroke();
        for (let k = 0; k < 20; k++) { const cx = (k + 0.5) * s / 20; g.beginPath(); g.arc(cx, s * 0.25 + Math.sin((cx / s) * Math.PI * 20 + 1.57) * 8, 8, 0, 6.283); g.stroke(); }
        for (let k = 0; k < 8; k++) { const cx = (k + 0.5) * s / 8; g.fillStyle = 'rgba(214,176,96,0.75)'; U.star8(g, cx, s * 0.87, 26, 0.765, 0); g.fill(); }
      });

      /* ---------- floor, walls, ceiling ---------- */
      const floorAll = new T.Mesh(new T.PlaneGeometry(26, 26), KIT.std({ map: red, roughness: 1, relief: 0.02 }));
      red.repeat.set(26 / 1.6, 26 / 1.6); floorAll.rotation.x = -Math.PI / 2; floorAll.position.set(1.6, 0, 1.9); S.add(floorAll);
      const rw = RAWDAH.x1 - RAWDAH.x0, rd = RAWDAH.z1 - RAWDAH.z0;
      green.repeat.set(rw / 2.4, rd / 2.4);
      const greenM = new T.Mesh(new T.PlaneGeometry(rw, rd), KIT.std({ map: green, roughness: 1, relief: 0.02, polygonOffset: true, polygonOffsetFactor: -1 }));
      greenM.rotation.x = -Math.PI / 2; greenM.position.set((RAWDAH.x0 + RAWDAH.x1) / 2, 0.012, (RAWDAH.z0 + RAWDAH.z1) / 2); S.add(greenM);
      const edge = KIT.std({ color: 0xc9a24e, metalness: 0.6, roughness: 0.4 });
      const eN = new T.Mesh(new T.BoxGeometry(rw, 0.02, 0.12), edge); eN.position.set((RAWDAH.x0 + RAWDAH.x1) / 2, 0.02, RAWDAH.z1); S.add(eN);
      const eW = new T.Mesh(new T.BoxGeometry(0.12, 0.02, rd), edge); eW.position.set(RAWDAH.x1, 0.02, (RAWDAH.z0 + RAWDAH.z1) / 2); S.add(eW);

      const marble = KIT.std({ map: marbleTex, roughness: 0.32, relief: 0, envMapIntensity: 0.3 });
      const gold = KIT.std({ color: 0xe0b060, metalness: 0.8, roughness: 0.32, envMapIntensity: 1.0, emissive: 0x3a2606, emissiveIntensity: 0.6 });
      const plaster = KIT.std({ map: KIT.plaster(w, [4, 2], '#ece4d4'), roughness: 0.8 });
      const qibla = new T.Mesh(new T.PlaneGeometry(24, CEIL), KIT.std({ map: qiblaTex, roughness: 0.6, relief: 0 })); qiblaTex.repeat.set(3, 1);
      qibla.position.set(1.6, CEIL / 2, QIBLA_Z); S.add(qibla);
      w.addBox(-12, QIBLA_Z - 1, 14, QIBLA_Z);
      [[14, 1.9, -Math.PI / 2, 24], [1.6, 14, Math.PI, 24]].forEach(([x, z, ry, L]) => { const m = new T.Mesh(new T.PlaneGeometry(L + 2, CEIL), plaster); m.position.set(x, CEIL / 2, z); m.rotation.y = ry; S.add(m); });
      const ceil = new T.Mesh(new T.PlaneGeometry(26, 26), KIT.std({ map: ceilTex, roughness: 0.7, relief: 0 })); ceilTex.repeat.set(26 / 3, 26 / 3);
      ceil.rotation.x = Math.PI / 2; ceil.position.set(1.6, CEIL, 1.9); ceil.userData.noCast = true; S.add(ceil);
      // light from above: three shallow lantern domes in the ceiling over the Rawdah
      const lantern = KIT.std({ color: 0xfff4dc, emissive: 0xfff0d0, emissiveIntensity: 0.7, side: T.BackSide, roughness: 0.6 });
      const pts = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pts.push(new T.Vector2(Math.max(0.01, Math.cos(a) * 1.3), Math.sin(a) * 0.9)); }
      this.lanterns = [];
      [[-6, -4.5], [-1.5, -1], [3, -4.5]].forEach(([x, z]) => {
        const d = new T.Mesh(new T.LatheGeometry(pts, 24), lantern); d.position.set(x, CEIL - 0.01, z); d.userData.noCast = true; S.add(d);
        const rg = new T.Mesh(new T.TorusGeometry(1.32, 0.06, 6, 32), gold); rg.rotation.x = Math.PI / 2; rg.position.set(x, CEIL - 0.03, z); S.add(rg);
        const gl = KIT.glow(w, 0xfff0d0, 6, 0.25); gl.position.set(x, CEIL - 0.6, z); S.add(gl); this.lanterns.push(gl);
      });

      /* ---------- the columns and arches ---------- */
      const colGeo = new T.CylinderGeometry(COLR, COLR + 0.03, SPRING - 0.9, 18), bandGeo = new T.CylinderGeometry(COLR + 0.018, COLR + 0.025, 1.3, 18, 1, true);
      const topBandGeo = new T.CylinderGeometry(COLR + 0.012, COLR + 0.012, 0.32, 18, 1, true);
      const baseGeo = new T.BoxGeometry(0.78, 0.4, 0.78), capGeo = new T.CylinderGeometry(0.5, COLR, 0.42, 18), abGeo = new T.BoxGeometry(0.86, 0.16, 0.86);
      const bandMat = KIT.std({ map: band, roughness: 0.45, metalness: 0.2, relief: 0 });
      band.repeat.set(3, 1);
      const inRawdah = (x, z) => x > RAWDAH.x0 && x < RAWDAH.x1 && z < RAWDAH.z1 && z > RAWDAH.z0;
      XS.forEach(x => ZS.forEach(z => {
        const c = new T.Mesh(colGeo, marble); c.position.set(x, 0.4 + (SPRING - 0.9) / 2, z); S.add(c);
        const b = new T.Mesh(baseGeo, marble); b.position.set(x, 0.2, z); S.add(b);
        const cp = new T.Mesh(capGeo, gold); cp.position.set(x, SPRING - 0.38, z); S.add(cp);
        const ab = new T.Mesh(abGeo, marble); ab.position.set(x, SPRING - 0.08, z); S.add(ab);
        if (inRawdah(x, z)) {
          const bd = new T.Mesh(bandGeo, bandMat); bd.position.set(x, 1.15, z); S.add(bd);
          const tb = new T.Mesh(topBandGeo, bandMat); tb.position.set(x, SPRING - 0.85, z); S.add(tb);
        }
        w.addCircle(x, z, 0.45);
      }));
      const archSh = (span) => {
        const h = span / 2, i = h - 0.36, sh = new T.Shape();
        sh.moveTo(-h, 0); sh.lineTo(-i, 0); sh.quadraticCurveTo(-i, i * 0.75, 0, i * 0.92); sh.quadraticCurveTo(i, i * 0.75, i, 0); sh.lineTo(h, 0); sh.lineTo(h, CEIL - SPRING); sh.lineTo(-h, CEIL - SPRING); sh.closePath();
        const g = new T.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false, curveSegments: 8 }); g.translate(0, 0, -0.2);
        const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 0.3, uv.getY(k) * 0.3);
        const tr = new T.Shape(); tr.moveTo(-i, 0); tr.quadraticCurveTo(-i, i * 0.75, 0, i * 0.92); tr.quadraticCurveTo(i, i * 0.75, i, 0); tr.lineTo(i - 0.1, 0); tr.quadraticCurveTo(i - 0.1, (i - 0.1) * 0.75, 0, (i - 0.1) * 0.92); tr.quadraticCurveTo(-(i - 0.1), (i - 0.1) * 0.75, -(i - 0.1), 0); tr.closePath();
        const tg = new T.ExtrudeGeometry(tr, { depth: 0.44, bevelEnabled: false, curveSegments: 8 }); tg.translate(0, 0, -0.22);
        return [g, tg];
      };
      const [archGeo, trimGeo] = archSh(3);
      const archGreen = KIT.std({ color: 0x2a6a4a, roughness: 0.5 });
      ZS.forEach(z => XS.slice(0, -1).forEach((x, k) => {
        const mx = (x + XS[k + 1]) / 2, gr = inRawdah(mx, z);
        const m = new T.Mesh(archGeo, marble); m.position.set(mx, SPRING, z); m.userData.noCast = true; S.add(m);
        const t2 = new T.Mesh(trimGeo, gr ? archGreen : gold); t2.position.set(mx, SPRING, z); t2.userData.noCast = true; S.add(t2);
      }));
      XS.forEach(x => ZS.slice(0, -1).forEach((z, k) => {
        const mz = (z + ZS[k + 1]) / 2, gr = inRawdah(x, mz);
        const m = new T.Mesh(archGeo, marble); m.position.set(x, SPRING, mz); m.rotation.y = Math.PI / 2; m.userData.noCast = true; S.add(m);
        const t2 = new T.Mesh(trimGeo, gr ? archGreen : gold); t2.position.set(x, SPRING, mz); t2.rotation.y = Math.PI / 2; t2.userData.noCast = true; S.add(t2);
      }));
      // arches from the last row to the qibla wall
      XS.forEach(x => { const m = new T.Mesh(archGeo, marble); m.scale.x = 0.8; m.position.set(x, SPRING, (ZS[0] + QIBLA_Z) / 2); m.rotation.y = Math.PI / 2; m.userData.noCast = true; S.add(m); });

      /* ---------- the mihrab ---------- */
      const mihPanel = w.tex(512, (g, s) => {
        g.fillStyle = '#efe7d6'; g.fillRect(0, 0, s, s);
        g.strokeStyle = '#c9a24e'; g.lineWidth = 14; g.strokeRect(14, 14, s - 28, s - 28);
        g.lineWidth = 4; g.strokeRect(40, 40, s - 80, s - 80);
        for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(201,162,78,0.85)'; U.star8(g, 27, 40 + k * 48, 9, 0.6, 0); g.fill(); U.star8(g, s - 27, 40 + k * 48, 9, 0.6, 0); g.fill(); }
        g.fillStyle = '#1f5a3e'; g.fillRect(40, 40, s - 80, 46);
      });
      const mp = new T.Mesh(new T.PlaneGeometry(2.6, 4.2), KIT.std({ map: mihPanel, roughness: 0.5, relief: 0 })); mp.position.set(MIHRAB_X, 2.1, QIBLA_Z + 0.02); S.add(mp);
      const nicheIn = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 2.4, 20, 1, true, Math.PI / 2, Math.PI), KIT.std({ map: band, side: T.BackSide, roughness: 0.5, relief: 0 }));
      nicheIn.position.set(MIHRAB_X, 1.2, QIBLA_Z + 0.03); S.add(nicheIn);
      const semi = new T.Mesh(new T.SphereGeometry(0.7, 20, 10, Math.PI / 2, Math.PI, 0, Math.PI / 2), KIT.std({ color: 0xd6ad5c, metalness: 0.8, roughness: 0.35, side: T.BackSide }));
      semi.position.set(MIHRAB_X, 2.4, QIBLA_Z + 0.03); S.add(semi);
      const mArch = new T.Mesh(new T.TorusGeometry(0.78, 0.07, 8, 24, Math.PI), gold); mArch.position.set(MIHRAB_X, 2.4, QIBLA_Z + 0.08); S.add(mArch);
      [-0.78, 0.78].forEach(dx => { const c = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.4, 10), gold); c.position.set(MIHRAB_X + dx, 1.2, QIBLA_Z + 0.08); S.add(c); });
      const mFloor = new T.Mesh(new T.CircleGeometry(0.7, 20, 0, Math.PI), marble); mFloor.rotation.x = -Math.PI / 2; mFloor.position.set(MIHRAB_X, 0.02, QIBLA_Z + 0.03); S.add(mFloor);

      /* ---------- the minbar of white marble ---------- */
      const mb = new T.Group(); mb.position.set(MINBAR_X, 0, QIBLA_Z + 0.4);
      const steps = 10, run = 0.32, rise = 0.27;
      for (let i = 0; i < steps; i++) { const st = new T.Mesh(new T.BoxGeometry(0.9, rise * (i + 1), run), marble); st.position.set(0, rise * (i + 1) / 2, 0.6 + (steps - i) * run); mb.add(st); }
      const top0 = new T.Mesh(new T.BoxGeometry(0.9, rise * steps, 0.9), marble); top0.position.set(0, rise * steps / 2, 0.45); mb.add(top0);
      const side = new T.Shape(); side.moveTo(0, 0); side.lineTo(0.6 + (steps + 1) * run + 0.2, 0); side.lineTo(0.6 + (steps + 1) * run + 0.2, 1.1); side.lineTo(0.9, rise * steps + 1.0); side.lineTo(0, rise * steps + 1.0); side.closePath();
      const sideGeo = new T.ExtrudeGeometry(side, { depth: 0.1, bevelEnabled: false }); sideGeo.rotateY(-Math.PI / 2);
      { const uv = sideGeo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 0.3, uv.getY(k) * 0.3); }
      [-0.5, 0.6].forEach(x => { const sd = new T.Mesh(sideGeo, marble); sd.position.set(x, 0, 0); mb.add(sd); });
      const trimS = new T.Mesh(new T.BoxGeometry(0.12, 0.08, Math.hypot(0.6 + (steps + 1) * run - 0.7, rise * steps)), gold);
      [-0.51, 0.51].forEach(x => { const tr = trimS.clone(); tr.position.set(x, rise * steps / 2 + 1.05, 0.6 + (steps + 1) * run / 2 + 0.25); tr.rotation.x = Math.atan2(rise * steps, (steps + 1) * run - 0.4); mb.add(tr); });
      // the gate at its foot and the kiosk at its head
      const gz = 0.6 + (steps + 1) * run + 0.25;
      [-0.52, 0.52].forEach(x => { const p = new T.Mesh(new T.BoxGeometry(0.16, 2.4, 0.2), marble); p.position.set(x, 1.2, gz); mb.add(p); });
      const lintel = new T.Mesh(new T.BoxGeometry(1.2, 0.5, 0.24), marble); lintel.position.set(0, 2.5, gz); mb.add(lintel);
      const gArch = new T.Mesh(new T.TorusGeometry(0.42, 0.04, 6, 20, Math.PI), gold); gArch.position.set(0, 1.95, gz + 0.11); mb.add(gArch);
      const gCap = new T.Mesh(new T.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold); gCap.position.set(0, 2.75, gz); mb.add(gCap);
      const ky = rise * steps;
      [[-0.38, 0.1], [0.38, 0.1], [-0.38, 0.8], [0.38, 0.8]].forEach(([x, z]) => { const c = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.7, 8), marble); c.position.set(x, ky + 0.85, z); mb.add(c); });
      const kRoof = new T.Mesh(new T.BoxGeometry(1.0, 0.16, 1.0), marble); kRoof.position.set(0, ky + 1.78, 0.45); mb.add(kRoof);
      const cone = new T.Mesh(new T.ConeGeometry(0.62, 1.6, 8), KIT.std({ color: 0xe6dccb, roughness: 0.4 })); cone.position.set(0, ky + 2.66, 0.45); mb.add(cone);
      const fin = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), gold); fin.position.set(0, ky + 3.55, 0.45); mb.add(fin);
      const cres = new T.Mesh(new T.TorusGeometry(0.12, 0.025, 6, 16, Math.PI * 1.4), gold); cres.position.set(0, ky + 3.78, 0.45); cres.rotation.z = Math.PI * 1.3; mb.add(cres);
      S.add(mb);
      w.addBox(MINBAR_X - 0.6, QIBLA_Z, MINBAR_X + 0.6, QIBLA_Z + 0.4 + gz + 0.1);

      /* ---------- the screen where his house stood ---------- */
      const lat = KIT.lattice(w, [6, 2]);
      const screen = new T.Mesh(new T.PlaneGeometry(QIBLA_Z * -1 + 4.2, 4.6), KIT.std({ map: lat, alphaTest: 0.4, color: 0x9ac08a, metalness: 0.7, roughness: 0.35, side: T.DoubleSide }));
      screen.rotation.y = Math.PI / 2; screen.position.set(SCREEN_X, 2.3, (QIBLA_Z + 4.6) / 2 - 0.2); S.add(screen);
      const velvet = new T.Mesh(new T.PlaneGeometry(26, CEIL), KIT.std({ color: 0x0e2a1c, roughness: 1 })); velvet.rotation.y = Math.PI / 2; velvet.position.set(SCREEN_X - 0.6, CEIL / 2, 2.2); S.add(velvet);
      const sTop = new T.Mesh(new T.BoxGeometry(0.2, 0.3, 14.4), gold); sTop.position.set(SCREEN_X, 4.7, (QIBLA_Z + 4.6) / 2 - 0.2); S.add(sTop);
      const sBot = new T.Mesh(new T.BoxGeometry(0.24, 0.24, 14.4), gold); sBot.position.set(SCREEN_X, 0.12, (QIBLA_Z + 4.6) / 2 - 0.2); S.add(sBot);
      const sGlow = KIT.glow(w, 0xc8ffd8, 9, 0.08); sGlow.position.set(SCREEN_X + 0.3, 2.4, -3); S.add(sGlow);

      /* ---------- the six named columns: plates, and a little gold light at their feet ---------- */
      COLUMNS.forEach((c, k) => {
        const tex = w.tex(256, (g, s) => {
          g.fillStyle = '#18523a'; g.fillRect(0, 0, s, s);
          g.strokeStyle = '#d6b060'; g.lineWidth = 8; g.strokeRect(8, 8, s - 16, s - 16);
          g.fillStyle = '#f0d488'; g.textAlign = 'center'; g.direction = 'rtl'; g.font = '50px Amiri, "Geeza Pro", serif';
          const words = c.ar.split(' ');
          g.fillText(words[0], s / 2, s * 0.42); g.fillText(words.slice(1).join(' '), s / 2, s * 0.75);
        });
        tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping;
        const plate = new T.Mesh(new T.PlaneGeometry(0.42, 0.42), KIT.std({ map: tex, roughness: 0.4, relief: 0, emissive: 0xffd890, emissiveMap: tex, emissiveIntensity: 0.25 }));
        plate.position.set(c.x, 2.35, c.z + COLR + 0.035); plate.userData.dynamic = true; S.add(plate);
        c.plate = plate.material;
        c.halo = KIT.glow(w, 0xffd890, 2.4, 0.3); c.halo.position.set(c.x, 0.2, c.z); S.add(c.halo);
        c.plateGlow = KIT.glow(w, 0xffe0a0, 1.2, 0.2); c.plateGlow.position.set(c.x, 2.35, c.z + COLR + 0.12); S.add(c.plateGlow);
        w.interact({
          key: c.id, pos: [c.x, 1.5, c.z + COLR + 0.1], r: 2.6, label: c.label,
          enabled: () => !self.done.has(c.id) && !self.ov && self.reveal < 0,
          onUse: () => self.openTrace(env, c, k),
        });
      });

      // motes in the light from above
      this.dust = KIT.dust(w, 500, [-9, 0.4, -9, 8, CEIL - 0.4, 4], 0xfff0c8, 0.04); S.add(this.dust);
      this.motes = KIT.dust(w, 160, [-8, 0, -8, 6, 1, 3], 0xffd890, 0.09); this.motes.material.opacity = 0; S.add(this.motes);

      // the hadith, written in light over the garden
      const c2 = document.createElement('canvas'); c2.width = 1600; c2.height = 300;
      const g2 = c2.getContext('2d'); g2.textAlign = 'center';
      g2.save(); g2.translate(800, 150); g2.scale(1, 0.2); const bgr = g2.createRadialGradient(0, 0, 0, 0, 0, 760); bgr.addColorStop(0, 'rgba(8,36,22,0.72)'); bgr.addColorStop(0.7, 'rgba(8,36,22,0.45)'); bgr.addColorStop(1, 'rgba(8,36,22,0)'); g2.fillStyle = bgr; g2.fillRect(-800, -760, 1600, 1520); g2.restore();
      g2.direction = 'rtl'; g2.shadowColor = 'rgba(255,220,150,0.95)'; g2.shadowBlur = 30; g2.fillStyle = '#fff8e4'; g2.font = '84px Amiri, "Geeza Pro", serif';
      g2.fillText('مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ', 800, 112);
      g2.direction = 'ltr'; g2.shadowBlur = 10; g2.fillStyle = 'rgba(255,246,228,0.95)'; g2.font = 'italic 44px Spectral, Georgia, serif';
      g2.fillText('“Between my house and my pulpit is a garden from the gardens of Paradise.”', 800, 204);
      g2.font = '28px Marcellus, Georgia, serif'; g2.fillStyle = 'rgba(255,240,215,0.8)'; g2.fillText('SAHIH AL-BUKHARI 1196 · SAHIH MUSLIM 1390', 800, 262);
      const tt = new T.CanvasTexture(c2); tt.encoding = T.sRGBEncoding;
      this.words = new T.Sprite(new T.SpriteMaterial({ map: tt, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false }));
      this.words.scale.set(4.8, 0.9, 1); this.words.renderOrder = 10; S.add(this.words);

      w.receiveAll();
      S.traverse(o => { if (o.isMesh && o.userData.noCast) o.castShadow = false; });
      floorAll.castShadow = false; greenM.castShadow = false;
      ungroup(S);
      this.baked = w.bake();

      w.activity('The columns of the Rawdah', 6, 'Walk to a column with a golden name plate and press E');

      /* ---------- sound ---------- */
      const b = env.bus;
      this.room = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 220, gain: 0.06 });
      this.air = SND.noise(b, { color: 'pink', type: 'highpass', freq: 3000, gain: 0.003 });
      this.shimmer = SND.noise(b, { color: 'white', type: 'bandpass', freq: 7200, q: 2, gain: 0 });
      this.grow = SND.noise(b, { color: 'white', type: 'bandpass', freq: 6000, q: 1.2, gain: 0 });
      this.voices = [196, 293.66, 392, 493.88, 587.33, 739.99].map((f, i) => SND.drone(b, f, { gain: 0, vowel: i < 2 ? 'u' : 'o', pan: (i - 2.5) * 0.25 }));
      this.murClock = 3; this.birdClock = 4;

      /* ---------- arrival: from a gilded capital, down the column and across the green carpet ---------- */
      const a = COLUMNS[0];
      w.cinematic([
        { p: [a.x + 0.9, SPRING - 0.2, a.z + 1.2], l: [a.x, SPRING - 0.38, a.z] },
        { p: [a.x + 1.3, SPRING - 0.8, a.z + 1.9], l: [a.x, SPRING - 1.2, a.z] },
        { p: [a.x + 1.4, 2.4, a.z + 2.6], l: [a.x, 1.6, a.z] },
        { p: [a.x + 1.4, 0.7, a.z + 4.6], l: [a.x - 1, 0.9, a.z - 2] },
        { p: [0.5, 1.2, 4.6], l: [-1, 1.3, -6] },
        { p: [0, 1.62, 3.0], l: [0, 1.62, -7] },
      ], 10);
    },

    /* ---------- the 2D overlay: trace the arabesque ---------- */
    openTrace(env, col, k) {
      const w = this.w, self = this;
      try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {}
      w.keys.clear(); w.enabled = false;
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:16;touch-action:none;cursor:crosshair;opacity:0;transition:opacity .6s';
      document.body.appendChild(cv);
      requestAnimationFrame(() => { cv.style.opacity = '1'; });
      const pat = buildPattern(col.pattern);
      const ov = this.ov = { cv, ctx: cv.getContext('2d'), col, k, pat, pi: 0, t: 0, hold: false, ptr: null, end: -1, blooms: [], notes: 0, lastP: null };
      SND.glow(env.bus, 196, { gain: 0.03, dur: 4, vowel: 'o' });
      const toN = (x, y) => { const L = self.ovLayout(); return [(x - L.cx) / L.S, (L.cy - y) / L.S]; };
      const hit = (e) => {
        const L = self.ovLayout();
        if (Math.hypot(e.clientX - L.bx, e.clientY - L.by) < 34) { ov.hold = true; return true; }
        return false;
      };
      ov.onDown = e => { e.preventDefault(); if (hit(e)) return; ov.ptr = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (_) {} self.traceTo(env, ...toN(e.clientX, e.clientY)); };
      ov.onMove = e => { if (e.pointerType === 'mouse' || ov.ptr === e.pointerId) self.traceTo(env, ...toN(e.clientX, e.clientY)); ov.lastP = [e.clientX, e.clientY]; };
      ov.onUp = e => { if (ov.ptr === e.pointerId) ov.ptr = null; ov.hold = false; };
      cv.addEventListener('pointerdown', ov.onDown); cv.addEventListener('pointermove', ov.onMove);
      cv.addEventListener('pointerup', ov.onUp); cv.addEventListener('pointercancel', ov.onUp);
    },

    ovLayout() {
      const W = innerWidth, H = innerHeight, S = Math.min(W * 0.3, H * 0.25), cx = W / 2, cy = H * 0.54;
      const wide = W > 760;
      return { W, H, S, cx, cy, bx: wide ? cx + S * 1.32 + 74 : cx, by: wide ? cy + S * 0.5 : Math.min(H - 150, cy + S * 1.2 + 44), wide };
    },

    traceTo(env, u, v) {
      const ov = this.ov; if (!ov || ov.end >= 0) return;
      const P = ov.pat.pts, tol = 0.17;
      let best = -1;
      const i0 = Math.max(0, Math.floor(ov.pi) - 4), i1 = Math.min(P.length - 1, Math.floor(ov.pi) + 22);
      for (let i = i0; i <= i1; i++) if (Math.hypot(P[i][0] - u, P[i][1] - v) < tol) best = i;
      if (best > ov.pi) this.advance(env, best);
    },

    advance(env, to) {
      const ov = this.ov, before = ov.pi;
      ov.pi = Math.min(ov.pat.N - 1, to);
      this.growK = 1;
      for (const b of ov.pat.branches) if (b.grow < 0 && ov.pi >= b.at) { b.grow = ov.t; }
      for (const l of ov.pat.leaves) if (l.grow < 0 && ov.pi >= l.at) { l.grow = ov.t; SND.knock(env.bus, { f: 900 + Math.random() * 300, gain: 0.01, click: 6000 }); }
      if (before < ov.pat.N - 1 && ov.pi >= ov.pat.N - 1) this.finishTrace(env);
    },

    finishTrace(env) {
      const ov = this.ov; ov.end = 0;
      SND.bell(env.bus, SCALE[7], { gain: 0.05, dur: 4, glass: true, delay: 0.2 });
      SND.glow(env.bus, 196, { gain: 0.05, dur: 6 });
    },

    closeTrace(env, complete) {
      const ov = this.ov; if (!ov) return;
      ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((n, i) => ov.cv.removeEventListener(n, [ov.onDown, ov.onMove, ov.onUp, ov.onUp][i]));
      ov.cv.style.opacity = '0';
      setTimeout(() => ov.cv.remove(), 700);
      this.ov = null;
      if (this.w) { this.w.enabled = true; this.w.keys.clear(); }
      if (complete) this.growVine(env, ov.col);
    },

    drawOverlay(env, dt) {
      const ov = this.ov, L = this.ovLayout(), dpr = Math.min(2, env.dpr || 1);
      const cv = ov.cv, g = ov.ctx;
      if (cv.width !== Math.round(L.W * dpr) || cv.height !== Math.round(L.H * dpr)) { cv.width = Math.round(L.W * dpr); cv.height = Math.round(L.H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, L.W, L.H);
      const fade = ov.end >= 0 ? 1 - U.smooth(1.6, 2.4, ov.end) : 1;
      g.globalAlpha = fade;
      const bg = g.createRadialGradient(L.cx, L.cy, L.S * 0.3, L.cx, L.cy, Math.max(L.W, L.H) * 0.7);
      bg.addColorStop(0, 'rgba(8,36,24,0.82)'); bg.addColorStop(1, 'rgba(4,16,10,0.94)');
      g.fillStyle = bg; g.fillRect(0, 0, L.W, L.H);
      const X = p => L.cx + p[0] * L.S, Y = p => L.cy - p[1] * L.S;
      // the pointed arch that frames the garden
      const aw = L.S * 1.32, ab = L.cy + L.S * 1.2, aT = L.cy - L.S * 1.48, sp = L.cy - L.S * 0.55;
      g.strokeStyle = 'rgba(214,176,96,0.55)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(L.cx - aw, ab); g.lineTo(L.cx - aw, sp); g.quadraticCurveTo(L.cx - aw, aT + L.S * 0.2, L.cx, aT); g.quadraticCurveTo(L.cx + aw, aT + L.S * 0.2, L.cx + aw, sp); g.lineTo(L.cx + aw, ab); g.stroke();
      g.strokeStyle = 'rgba(214,176,96,0.22)'; g.lineWidth = 1;
      const aw2 = aw - 10; g.beginPath(); g.moveTo(L.cx - aw2, ab); g.lineTo(L.cx - aw2, sp); g.quadraticCurveTo(L.cx - aw2, aT + L.S * 0.22 + 10, L.cx, aT + 12); g.quadraticCurveTo(L.cx + aw2, aT + L.S * 0.22 + 10, L.cx + aw2, sp); g.lineTo(L.cx + aw2, ab); g.stroke();
      // the column's name above
      g.textAlign = 'center'; g.fillStyle = '#f0d488'; g.direction = 'rtl'; g.font = `${Math.round(Math.min(36, L.S * 0.17))}px Amiri, "Geeza Pro", serif`;
      g.fillText(ov.col.ar, L.cx, aT - 22);
      g.direction = 'ltr'; g.font = '13px Marcellus, Georgia, serif'; g.fillStyle = 'rgba(242,233,214,0.75)';
      g.fillText(ov.col.name.toUpperCase(), L.cx, aT - 2);
      // the faint path still to trace
      const P = ov.pat.pts, pi = Math.floor(ov.pi);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.setLineDash([2, 7]); g.strokeStyle = 'rgba(214,176,96,0.42)'; g.lineWidth = 3;
      g.beginPath(); for (let i = pi; i < P.length; i++) (i === pi ? g.moveTo(X(P[i]), Y(P[i])) : g.lineTo(X(P[i]), Y(P[i]))); g.stroke();
      g.setLineDash([2, 9]); g.strokeStyle = 'rgba(214,176,96,0.16)'; g.lineWidth = 2;
      for (const b of ov.pat.branches) if (b.grow < 0) { g.beginPath(); b.pts.forEach((p, i) => (i ? g.lineTo(X(p), Y(p)) : g.moveTo(X(p), Y(p)))); g.stroke(); }
      g.setLineDash([]);
      // the traced vine: gold that glows
      g.shadowColor = 'rgba(255,210,120,0.9)'; g.shadowBlur = 14;
      g.strokeStyle = '#e8c070'; g.lineWidth = 5;
      g.beginPath(); for (let i = 0; i <= pi; i++) (i ? g.lineTo(X(P[i]), Y(P[i])) : g.moveTo(X(P[i]), Y(P[i]))); g.stroke();
      // branches curl out as you pass them, and end in a blossom (each a sung note)
      for (const b of ov.pat.branches) {
        if (b.grow < 0) continue;
        const k = U.clamp((ov.t - b.grow) / 0.6), n = Math.max(1, Math.floor(b.pts.length * U.easeOut(k)));
        g.lineWidth = 3; g.beginPath(); for (let i = 0; i < n; i++) (i ? g.lineTo(X(b.pts[i]), Y(b.pts[i])) : g.moveTo(X(b.pts[i]), Y(b.pts[i]))); g.stroke();
        if (k >= 1) {
          if (!b.note) { b.note = true; ov.notes++; SND.bell(env.bus, SCALE[(ov.notes + ov.k) % 8], { gain: 0.045, dur: 3, glass: true }); b.bloom = ov.t; }
          this.blossom(g, X(b.pts[b.pts.length - 1]), Y(b.pts[b.pts.length - 1]), U.clamp((ov.t - b.bloom) / 0.4), L.S * 0.075, ov.t);
        }
      }
      for (const l of ov.pat.leaves) {
        if (l.grow < 0) continue;
        const k = U.easeOut(U.clamp((ov.t - l.grow) / 0.5)), p = P[l.at], s = L.S * 0.07 * k;
        g.save(); g.translate(X(p), Y(p)); g.rotate(-l.ang); g.fillStyle = 'rgba(232,192,112,0.9)';
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.6, -s * 0.45, s * 1.4, 0); g.quadraticCurveTo(s * 0.6, s * 0.45, 0, 0); g.fill(); g.restore();
      }
      g.shadowBlur = 0;
      // where to go next: the warmest point in view
      const tip = P[Math.min(P.length - 1, pi)];
      const pulse = 0.6 + 0.4 * Math.sin(ov.t * 4);
      const tg = g.createRadialGradient(X(tip), Y(tip), 0, X(tip), Y(tip), 26);
      tg.addColorStop(0, `rgba(255,240,200,${0.95 * pulse})`); tg.addColorStop(1, 'rgba(255,220,150,0)');
      if (ov.end < 0) { g.fillStyle = tg; g.beginPath(); g.arc(X(tip), Y(tip), 26, 0, 6.283); g.fill(); }
      if (ov.end >= 0) this.blossom(g, X(P[P.length - 1]), Y(P[P.length - 1]), U.clamp(ov.end / 0.8), L.S * 0.14, ov.t);
      // the gentle way: hold to let it grow by itself
      if (ov.end < 0) {
        g.fillStyle = ov.hold ? 'rgba(232,192,112,0.35)' : 'rgba(232,192,112,0.12)'; g.strokeStyle = 'rgba(232,192,112,0.6)'; g.lineWidth = 1.5;
        g.beginPath(); g.arc(L.bx, L.by, 28, 0, 6.283); g.fill(); g.stroke();
        this.blossom(g, L.bx, L.by, 1, 10, ov.t);
        g.fillStyle = 'rgba(242,233,214,0.8)'; g.font = 'italic 13px Spectral, Georgia, serif'; g.textAlign = 'center';
        g.fillText('hold to let it grow', L.bx, L.by + 46); g.fillText('(or hold E / Space)', L.bx, L.by + 62);
        g.font = 'italic 14px Spectral, Georgia, serif';
        g.fillText('Trace the golden vine from the glowing point', L.cx, ab - 12);
      }
      g.globalAlpha = 1;
    },

    blossom(g, x, y, k, r, t) {
      if (k <= 0) return;
      const s = r * (k < 1 ? 1 + Math.sin(k * Math.PI) * 0.25 : 1) * U.easeOut(k);
      g.save(); g.translate(x, y); g.rotate(t * 0.15);
      g.fillStyle = 'rgba(240,200,120,0.95)';
      for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.ellipse(s * 0.55, 0, s * 0.55, s * 0.24, 0, 0, 6.283); g.fill(); }
      g.fillStyle = '#fff4d6'; g.beginPath(); g.arc(0, 0, s * 0.22, 0, 6.283); g.fill();
      g.restore();
    },

    /* ---------- then the real vine grows up the column ---------- */
    growVine(env, col) {
      const S = this.w.scene, R = COLR + 0.045, k = col.pattern;
      const onCol = (a, h, out) => out.set(col.x + Math.cos(a) * R, h, col.z + Math.sin(a) * R);
      const turns = 1.4 + (k % 3) * 0.35, dir = k % 2 ? 1 : -1, a0 = Math.PI / 2 + k;
      const main = [];
      for (let i = 0; i <= 90; i++) { const s = i / 90; main.push(onCol(a0 + dir * s * turns * Math.PI * 2, 0.45 + s * (SPRING - 0.95), new T.Vector3())); }
      const curves = [new T.CatmullRomCurve3(main)];
      const tips = [];
      for (let c = 0; c < 6; c++) {
        const s = (c + 0.7) / 6.6, a = a0 + dir * s * turns * Math.PI * 2, h = 0.45 + s * (SPRING - 0.95), side = c % 2 ? 1 : -1;
        const pts = [];
        for (let i = 0; i <= 24; i++) { const q = i / 24, ang = q * Math.PI * 2.1, rr = 0.2 * (1 - q * 0.8), du = side * (0.2 - rr * Math.cos(ang)), dv = rr * Math.sin(ang); pts.push(onCol(a + du / R, h + dv, new T.Vector3())); }
        curves.push(new T.CatmullRomCurve3(pts)); tips.push(pts[pts.length - 1].clone());
      }
      tips.push(main[main.length - 1].clone());
      const mat = KIT.std({ color: 0xd09a30, metalness: 0.7, roughness: 0.3, emissive: 0x9a6410, emissiveIntensity: 0.7, envMapIntensity: 1.0 });
      const meshes = curves.map((cv, i) => {
        const g = new T.TubeGeometry(cv, i ? 40 : 160, i ? 0.018 : 0.03, 6, false);
        g.setDrawRange(0, 0);
        const m = new T.Mesh(g, mat); m.frustumCulled = false; S.add(m); return m;
      });
      const pg = new T.SphereGeometry(0.05, 8, 6); pg.scale(1, 0.4, 2.2); pg.translate(0, 0, 0.08);
      const petals = new T.InstancedMesh(pg, KIT.std({ color: 0xf0c060, metalness: 0.5, roughness: 0.35, emissive: 0xffc860, emissiveIntensity: 0.8 }), tips.length * 6);
      petals.frustumCulled = false; S.add(petals);
      const glow = KIT.glow(this.w, 0xffd890, 3.2, 0); glow.position.set(col.x, 2.6, col.z); S.add(glow);
      this.vines.push({ col, meshes, petals, tips, t: 0, glow, notes: 0 });
      SND.glow(env.bus, 293.66, { gain: 0.04, dur: 6 });
      this.grow.set('gain', 0.012, 0.3);
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      KIT.driftDust(this.dust, dt, t, [0.02, 0.01]);

      // the overlay
      if (this.ov) {
        const ov = this.ov; ov.t += dt;
        if (ov.end < 0 && ov.hold) this.advance(env, ov.pi + dt * 26);
        if (ov.end >= 0) { ov.end += dt; if (ov.end > 2.4) this.closeTrace(env, true); }
        if (this.ov) this.drawOverlay(env, dt);
      }
      this.growK = U.damp(this.growK || 0, 0, 3, dt);
      if (!this.vines.some(v => v.t < 3.5)) this.grow.set('gain', this.ov ? 0.004 + this.growK * 0.012 : 0, 0.2);

      // vines climbing the columns
      const M = new T.Matrix4(), Q = new T.Quaternion(), V = new T.Vector3(), Sc = new T.Vector3(), E = new T.Euler();
      for (const v of this.vines) {
        if (v.t > 6) continue;
        const t0 = v.t; v.t += dt;
        const k = U.clamp(v.t / 3.2);
        v.meshes.forEach((m, i) => { const n = m.geometry.index.count; const kk = i === 0 ? U.easeOut(k) : U.clamp((k - (i - 0.3) / 7.5) * 3); m.geometry.setDrawRange(0, Math.floor(n * kk / 6) * 6); });
        v.glow.material.opacity = Math.sin(U.clamp(v.t / 5) * Math.PI) * 0.5;
        v.tips.forEach((tp, i) => {
          const at = i < 6 ? (i + 0.7) / 7.5 * 3.2 + 0.6 : 3.3;
          const b = U.clamp((v.t - at) / 0.7);
          if (t0 < at && v.t >= at && i % 2 === 0) SND.bell(env.bus, SCALE[(i + v.col.pattern) % 8], { gain: 0.03, dur: 2.5, glass: true });
          for (let p = 0; p < 6; p++) {
            E.set(0, p * Math.PI / 3, 0.5); Q.setFromEuler(E);
            const s = U.easeOut(b) * (i === 6 ? 1.6 : 1);
            M.compose(V.copy(tp), Q, Sc.set(s, s, s)); v.petals.setMatrixAt(i * 6 + p, M);
          }
        });
        v.petals.instanceMatrix.needsUpdate = true;
        if (t0 < 3.8 && v.t >= 3.8) this.columnDone(env, v.col);
      }

      // guidance: untouched name plates glow; you hear a faint shimmer near one
      let near = 1e9;
      COLUMNS.forEach(c => {
        const d = Math.hypot(c.x - w.pos.x, c.z - w.pos.z), open = !this.done.has(c.id);
        if (open) near = Math.min(near, d);
        c.halo.material.opacity = open ? 0.18 + 0.1 * Math.sin(t * 1.5 + c.pattern) + U.smooth(5, 1.5, d) * 0.2 : 0.06;
        c.plateGlow.material.opacity = open ? 0.18 + 0.12 * Math.sin(t * 2 + c.pattern) : 0.05;
        c.plate.emissiveIntensity = open ? 0.25 + U.smooth(4, 1, d) * 0.35 : 0.5;
      });
      const hush = this.reveal >= 0 ? U.smooth(0, 1, this.reveal) * (1 - U.smooth(3, 7, this.reveal)) : 0;
      this.shimmer.set('gain', near < 1e8 ? U.smooth(6, 1, near) * 0.008 * (this.ov ? 0 : 1) : 0, 0.3);
      this.room.set('gain', 0.06 * (1 - hush * 0.8), 0.6);
      this.air.set('gain', 0.003 * (1 - hush), 0.6);
      this.murClock -= dt;
      if (this.murClock < 0) { this.murClock = 7 + Math.random() * 8; if (hush < 0.1 && !this.ov) SND.sing(env.bus, U.pick([110, 98, 130.81]), { vowel: 'm', dur: 4, gain: 0.005, voices: 3, pan: U.rnd(-0.8, 0.8), attack: 1.4, breath: 0.12 }); }
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 4 + Math.random() * 6; if (hush < 0.1) SND.coo(env.bus, { gain: 0.008, pan: U.rnd(-0.9, 0.9) }); }

      // revelation
      if (this.reveal >= 0) {
        const r0 = this.reveal, r1 = (this.reveal += dt);
        const cross = s => r0 < s && r1 >= s;
        if (cross(0.01)) {
          this.voices.forEach(v => v.setGain(0.002, 1));
          const f = w.forward(), l = Math.hypot(f.x, f.z) || 1;
          this.words.position.set(w.pos.x + f.x / l * 4.6, w.y + w.eye + 1.55, w.pos.z + f.z / l * 4.6);
        }
        if (cross(1.6)) {
          SND.glow(env.bus, 196, { gain: 0.08, dur: 13 }); SND.glow(env.bus, 293.66, { gain: 0.05, dur: 12, delay: 1.2 });
          SND.sing(env.bus, 587.33, { vowel: 'a', dur: 7, delay: 2.4, gain: 0.03, voices: 4, attack: 2.5 });
          SND.sing(env.bus, 783.99, { vowel: 'o', dur: 6, delay: 3.6, gain: 0.018, voices: 3, attack: 2 });
        }
        if (cross(2.6)) w.say('A Garden from the Gardens of Paradise', '<span class="q">“Between my house and my pulpit is a garden from the gardens of Paradise.”</span> (Sahih al-Bukhari 1196; Sahih Muslim 1390)', { ar: 'مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ', ms: 16000 });
        if (cross(5)) { w.finish('Six columns, six vines'); this.voices.forEach((v, i) => v.setGain([0.012, 0.01, 0.008, 0.007, 0.006, 0.005][i], 3)); }
        const L = U.smooth(1.6, 5, r1);
        this.words.material.opacity = L * 0.95;
        this.motes.material.opacity = L * 0.8;
        KIT.driftDust(this.motes, dt, t, [0, 0]);
        const mp = this.motes.geometry.attributes.position; for (let i = 0; i < mp.count; i++) { let y = mp.getY(i) + dt * 0.25; if (y > 4.5) y = 0; mp.setY(i, y); } mp.needsUpdate = true;
        this.lanterns.forEach(l => { l.material.opacity = 0.25 + L * 0.35; });
        w.renderer.toneMappingExposure = 1.15 + L * 0.12;
      }
    },

    columnDone(env, col) {
      const w = this.w;
      this.done.add(col.id);
      const n = this.done.size;
      w.say(col.name, col.text + (col.id === 'aishah' || col.id === 'haras' || col.id === 'wufud' || col.id === 'sarir' ? ' <span class="q">(Names recorded by al-Samhudi, Wafa’ al-Wafa’)</span>' : ''), { ar: col.cardAr || col.ar, ms: col.id === 'tawbah' ? 17000 : 13000 });
      this.voices.forEach((v, i) => v.setGain(i < n ? [0.012, 0.01, 0.008, 0.007, 0.006, 0.005][i] : 0, 1.6));
      w.progress(n, n < 6 ? 'Find another column with a golden name plate' : 'The garden is complete');
      if (n >= 6) this.reveal = 0;
    },

    onLeave() { if (this.ov) { this.ov.cv.remove(); this.ov = null; } },
  });
  // while the drawing is open, the keys belong to it (E or Space grow the vine, Esc steps back)
  Object.assign(station, {
    key(env, e) {
      if (this.ov) {
        if (e.key === 'Escape') this.closeTrace(env, false);
        else if (e.key === 'e' || e.key === 'E' || e.key === ' ') { this.ov.hold = true; e.preventDefault && e.preventDefault(); }
        return;
      }
      this.w && this.w.key(e);
    },
    keyup(env, e) {
      if (this.ov && (e.key === 'e' || e.key === 'E' || e.key === ' ')) this.ov.hold = false;
      this.w && this.w.keyup(e);
    },
    down(env, p, e) { if (!this.ov) this.w && this.w.down(p, e); },
  });
  ENGINE.register(station);
})();
