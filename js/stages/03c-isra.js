/* Makkah — The Night Journey (al-Isra' wal-Mi'raj), c. 620 CE. An abstract meditation.
   No image can show this journey, and none is attempted: there are no figures here, no mount,
   no angels and no prophets. The courtyard of the Ka'bah lies quiet under the stars; a column of
   pale light rises beside the House, and the sky opens into seven slowly turning rings of
   geometric light. The player rises through the opening of each ring; the name of the prophet
   met in that heaven appears only as calligraphy in light, with a sung chord. Above the seventh
   stands a vast tree of light beneath an immense calm light, and the gift of prayer.
   Feeling: awe settling into serenity. Colour script: night indigo, with pale gold reserved for
   the openings, the column and the revelation. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const AX = 0, AZ = 15;                    // the axis of the ascent, beside the Ka'bah
  const R0 = 54, GAP = 44, NR = 7;          // first ring height and spacing
  const RING_R = 26, HOLE_OFF = 11.5, HOLE_R = 4.8;
  const TB = R0 + GAP * (NR - 1) + 34;      // base of the tree of light
  const TREE = { x: AX, z: AZ - 78 };
  const VIEW = { x: AX, y: TB + 16, z: AZ + 6 };
  const GOLD = 0xffe6b0;
  const HEAVENS = [
    { ar: 'آدَم', pb: 'عَلَيْهِ السَّلَام', en: 'Adam', n: 'The first heaven', hue: '#6a8cff', pts: 6, root: 146.83 },
    { ar: 'يَحْيَى وَعِيسَى', pb: 'عَلَيْهِمَا السَّلَام', en: 'Yahya and ‘Isa', n: 'The second heaven', hue: '#40d0dc', pts: 8, root: 164.81 },
    { ar: 'يُوسُف', pb: 'عَلَيْهِ السَّلَام', en: 'Yusuf', n: 'The third heaven', hue: '#58dc88', pts: 10, root: 185.0 },
    { ar: 'إِدْرِيس', pb: 'عَلَيْهِ السَّلَام', en: 'Idris', n: 'The fourth heaven', hue: '#f0c858', pts: 12, root: 196.0 },
    { ar: 'هَارُون', pb: 'عَلَيْهِ السَّلَام', en: 'Harun', n: 'The fifth heaven', hue: '#f27a7a', pts: 9, root: 220.0 },
    { ar: 'مُوسَى', pb: 'عَلَيْهِ السَّلَام', en: 'Musa', n: 'The sixth heaven', hue: '#a878f4', pts: 10, root: 246.94 },
    { ar: 'إِبْرَاهِيم', pb: 'عَلَيْهِ السَّلَام', en: 'Ibrahim', n: 'The seventh heaven', hue: '#ffe8b8', pts: 16, root: 293.66 },
  ];

  function starPath(g, x, y, r, inner, n, rot) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n, rr = i % 2 ? r * inner : r;
      i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
  }

  /* A disc of geometric light: concentric bands of n-pointed stars, interlaced star polygons
     and a single opening, drawn in white and tinted by the material. */
  function ringTexture(T, n) {
    const S = 1024, c = S / 2, R = c - 6, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    const wash = g.createRadialGradient(c, c, 0, c, c, R);
    wash.addColorStop(0, 'rgba(255,255,255,0.03)'); wash.addColorStop(0.75, 'rgba(255,255,255,0.06)'); wash.addColorStop(0.97, 'rgba(255,255,255,0.14)'); wash.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = wash; g.beginPath(); g.arc(c, c, R, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineCap = 'round'; g.lineJoin = 'round';
    // the great star polygon {2n/3} across the whole disc
    const m = n * 2;
    g.lineWidth = 3;
    for (let k of [3, 5]) {
      if (k >= n) continue;
      g.beginPath();
      for (let i = 0; i <= m; i++) { const a = (i * k * Math.PI * 2) / m; const x = c + Math.cos(a) * R * 0.94, y = c + Math.sin(a) * R * 0.94; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    // bands of stars
    [[0.16, 1, 0.5], [0.34, 1, 0.55], [0.52, 2, 0.6], [0.7, 2, 0.62], [0.86, 3, 0.66]].forEach(([rr, mul, inner], b) => {
      const count = n * mul, sr = R * (b === 0 ? 0.13 : 0.075 - b * 0.004);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * 6.283 + (b % 2) * Math.PI / count;
        const x = c + Math.cos(a) * R * rr, y = c + Math.sin(a) * R * rr;
        g.lineWidth = 2.6; starPath(g, x, y, b === 0 ? R * 0.13 : sr, inner, b === 0 ? n : 8, a); g.stroke();
        if (b > 0) { g.fillStyle = 'rgba(255,255,255,0.16)'; g.fill(); }
      }
      g.lineWidth = 1.6; g.beginPath(); g.arc(c, c, R * (rr + 0.09), 0, 6.283); g.stroke();
    });
    // the central rosette
    g.lineWidth = 3; starPath(g, c, c, R * 0.1, 0.45, n, 0); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fill();
    // the rim
    g.lineWidth = 5; g.beginPath(); g.arc(c, c, R * 0.985, 0, 6.283); g.stroke();
    // the opening: cut clean, then edged with a bright double rim and a crown of small stars
    const hx = c + (HOLE_OFF / RING_R) * R, hr = (HOLE_R / RING_R) * R;
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(hx, c, hr * 1.18, 0, 6.283); g.fill();
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 7; g.beginPath(); g.arc(hx, c, hr * 1.2, 0, 6.283); g.stroke();
    g.lineWidth = 2.5; g.beginPath(); g.arc(hx, c, hr * 1.36, 0, 6.283); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; starPath(g, hx + Math.cos(a) * hr * 1.5, c + Math.sin(a) * hr * 1.5, hr * 0.12, 0.45, 8, a); g.fillStyle = '#fff'; g.fill(); }
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    return t;
  }

  /* Calligraphy in light: an Arabic line with an English line beneath, on a transparent sprite. */
  function lightText(T, ar, pb, en, sub) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 400;
    const g = c.getContext('2d'); g.textAlign = 'center';
    if (sub) { g.font = '30px Marcellus, Georgia, serif'; g.fillStyle = 'rgba(236,226,206,0.8)'; g.shadowColor = 'rgba(255,230,180,0.6)'; g.shadowBlur = 8; g.fillText(sub.toUpperCase().split('').join(' '), 512, 52); }
    g.direction = 'rtl'; g.shadowColor = 'rgba(255,222,150,0.95)'; g.shadowBlur = 34; g.fillStyle = '#fffaea';
    g.font = '128px Amiri, "Geeza Pro", serif'; g.fillText(ar, 512, 196); g.shadowBlur = 14; g.fillText(ar, 512, 196);
    if (pb) { g.font = '40px Amiri, "Geeza Pro", serif'; g.fillStyle = 'rgba(255,240,210,0.85)'; g.fillText(pb, 512, 262); }
    g.direction = 'ltr'; g.shadowBlur = 8; g.font = 'italic 52px Spectral, Georgia, serif'; g.fillStyle = 'rgba(248,240,224,0.95)'; g.fillText(en, 512, 340);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    sp.scale.set(17, 6.6, 1); sp.renderOrder = 5;
    return sp;
  }

  ENGINE.register(WORLD.stage({
    key: 'isra',
    arabic: 'الإِسْرَاءُ وَالمِعْرَاج',
    title: 'The Night Journey',
    era: 'Makkah · c. 620 CE · al-Isra’ wal-Mi‘raj, an abstract meditation',
    hint: 'WASD to walk · E in the column of light · then W or Space to rise, look or A/D to steer into each opening',
    hintTouch: 'Walk to the column of light and tap E · then you rise by yourself: look or steer toward each opening',
    sound: { reverb: 0.85 },
    story: `<p>About a year before the Hijrah (scholars differ on the exact date), he was taken by night from the Sacred Mosque in Makkah to al-Masjid al-Aqsa, and from there raised through the seven heavens.</p>
            <p class="q"><span class="ar">سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى</span>“Glory be to Him who took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa.” (Qur’an 17:1)</p>
            <p>No image can show this journey. This station is an abstract meditation on the account in Sahih al-Bukhari: no figure is shown, and the names appear only as words in light.</p>`,

    enter(env) {
      const T = THREE, self = this;
      try { document.fonts && document.fonts.load('128px Amiri'); } catch (_) {}
      const w = this.w = WORLD.create(env, {
        start: { x: 3, z: 34, yaw: 0.05, pitch: 0.08 }, exposure: 1.0, far: 1500,
        fog: { color: 0x0a1028, density: 0.0042 }, bounds: [-70, -60, 70, 60],
      });
      const S = w.scene;
      this.touch = matchMedia('(pointer: coarse)').matches;
      const moonDir = new T.Vector3(-0.5, 0.42, -0.6).normalize();
      this.sky = w.sky({ top: '#02040c', mid: '#0f1834', bot: '#05070e', sunDir: moonDir.toArray(), sun: '#1a2238', sunSize: 0.00012, stars: 0.6 });
      this.skyU = this.sky.material.uniforms;
      this.skyBase = { top: new T.Color('#02040c'), mid: new T.Color('#0f1834') };
      this.hemi = new T.HemisphereLight(0x3a4a80, 0x0c0a08, 0.3); S.add(this.hemi);
      const moon = new T.DirectionalLight(0x9aaaf0, 0.42); moon.position.copy(moonDir).multiplyScalar(50); S.add(moon);
      const crescent = w.tex(256, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,244,220,0.22)'); gr.addColorStop(1, 'rgba(255,244,220,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
        g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.16, 0, 6.283); g.fill();
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(s / 2 + s * 0.06, s / 2 - s * 0.035, s * 0.15, 0, 6.283); g.fill();
      });
      crescent.wrapS = crescent.wrapT = T.ClampToEdgeWrapping;
      // the turning stars: a sphere of points spinning about the celestial pole (Makkah lies near 21 degrees north)
      this.poleRig = new T.Group(); this.poleRig.rotation.x = -1.197; S.add(this.poleRig);
      this.starRig = new T.Group(); this.poleRig.add(this.starRig);
      [[1800, 3.2, 0.75], [500, 6.0, 0.95]].forEach(([n, size, op]) => {
        const sp = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, q = Math.sqrt(1 - u * u); sp.set([Math.cos(a) * q * 900, u * 900, Math.sin(a) * q * 900], i * 3); }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(sp, 3));
        const pts = new T.Points(g, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xf4f0ff, size, sizeAttenuation: false, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        pts.frustumCulled = false; pts.renderOrder = -5; this.starRig.add(pts);
      });
      const cres = new T.Sprite(new T.SpriteMaterial({ map: crescent, transparent: true, depthWrite: false, fog: false })); cres.scale.set(60, 60, 1); cres.position.copy(moonDir).multiplyScalar(1000); S.add(cres);

      // the valley and the House, its cloth dark against the stars
      const ground = KIT.makkahValley(w, { kx: 0, kz: 0, floor: 130, clear: 36, seed: 620 });
      w.ground = ground; w.surface = (x, z) => (Math.hypot(x, z) < 22 ? 'stone' : 'sand');
      const kabah = KIT.kabah(w, { cloth: 0x120f10 }); S.add(kabah);
      const band = new T.Mesh(new T.BoxGeometry(11.3, 0.7, 12.8), KIT.std({ color: 0x8a7444, roughness: 0.5, metalness: 0.5, emissive: 0x2a1c08 }));
      band.position.y = 6.6; S.add(band);
      w.addBox(-6, -6.7, 6, 6.7);
      // the paved ring of the courtyard
      const pave = w.tex(512, (g, s) => {
        g.fillStyle = '#8a8078'; g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 64) for (let x = 0; x < s; x += 64) { const t = Math.random() * 26; g.fillStyle = `rgb(${132 + t | 0},${124 + t | 0},${116 + t | 0})`; g.fillRect(x + 2, y + 2, 60, 60); }
      }, [10, 10]);
      const ring = new T.Mesh(new T.CircleGeometry(22, 64), KIT.std({ map: pave, color: 0x9a8a78, roughness: 0.9, relief: 0.02 }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; S.add(ring);
      // a few oil lamps on posts round the courtyard
      const postMat = KIT.std({ map: KIT.wood(w, [1, 2], '#4a3424'), color: 0x8a7060 });
      this.lamps = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.283 + 0.39, x = Math.cos(a) * 20, z = Math.sin(a) * 20;
        const p = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 2.6, 6), postMat); p.position.set(x, 1.3, z); S.add(p);
        const gl = KIT.glow(w, 0xffb060, 1.6, 0.85); gl.position.set(x, 2.75, z); S.add(gl);
        w.addCircle(x, z, 0.3); this.lamps.push(gl);
      }
      const lampL = new T.PointLight(0xffa860, 0.6, 26, 1.8); lampL.position.set(0, 4, 20); S.add(lampL);
      const lampL2 = new T.PointLight(0xffa860, 0.5, 26, 1.8); lampL2.position.set(0, 4, -20); S.add(lampL2);

      // the column of light: the one warm-white line in the night, rising into the sky
      const colTex = w.tex(64, (g, s) => { const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      colTex.wrapS = colTex.wrapT = T.ClampToEdgeWrapping;
      this.column = new T.Mesh(new T.CylinderGeometry(1.1, 1.4, 260, 24, 1, true), new T.MeshBasicMaterial({ map: colTex, color: GOLD, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.FrontSide, fog: false }));
      this.column.position.set(AX, 130, AZ); this.column.userData.dynamic = true; S.add(this.column);
      this.colCore = new T.Mesh(new T.CylinderGeometry(0.25, 0.3, 260, 12, 1, true), this.column.material.clone()); this.colCore.material.opacity = 0.35;
      this.colCore.position.copy(this.column.position); this.colCore.userData.dynamic = true; S.add(this.colCore);
      this.colGlow = KIT.glow(w, GOLD, 5, 0.6); this.colGlow.position.set(AX, 0.6, AZ); S.add(this.colGlow);
      this.colLight = new T.PointLight(0xffe0b0, 0.9, 16, 1.8); this.colLight.position.set(AX, 2.5, AZ); S.add(this.colLight);
      this.colMotes = KIT.dust(w, 160, [AX - 1.6, 0, AZ - 1.6, AX + 1.6, 24, AZ + 1.6], GOLD, 0.09); S.add(this.colMotes);
      this.dust = KIT.dust(w, 200, [-28, 0.2, -28, 28, 9, 30], 0xb8c4ff, 0.04); S.add(this.dust);

      /* ---------- the seven heavens ---------- */
      const beamTex = w.tex(64, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      beamTex.wrapS = beamTex.wrapT = T.ClampToEdgeWrapping;
      this.rings = HEAVENS.map((h, i) => {
        const disc = new T.Mesh(new T.CircleGeometry(RING_R, 96).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({
          map: ringTexture(T, h.pts), color: new T.Color(h.hue), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false,
        }));
        disc.position.set(AX, R0 + i * GAP, AZ); disc.userData.dynamic = true; disc.renderOrder = 2; S.add(disc);
        // the opening carries the accent: a gold halo and a faint beam falling from it
        const halo = KIT.glow(w, GOLD, HOLE_R * 3.4, 0); halo.position.set(HOLE_OFF, 0.2, 0); halo.material.fog = false; disc.add(halo);
        const beam = new T.Mesh(new T.CylinderGeometry(HOLE_R * 0.95, HOLE_R * 0.95, 26, 24, 1, true), new T.MeshBasicMaterial({ map: beamTex, color: GOLD, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
        beam.position.set(HOLE_OFF, -13, 0); disc.add(beam);
        const dir = i % 2 ? -1 : 1;
        disc.rotation.y = Math.PI / 2 + (0.5 + i * 0.37) * dir;
        return { disc, halo, beam, y: R0 + i * GAP, spin: 0.13 * dir * (1 + i * 0.05), passed: false, flash: 0, bloom: 0, h };
      });

      /* ---------- the tree of light, Sidrat al-Muntaha ---------- */
      {
        const pts = [], cols = [], r = U.seeded(5314);
        const push = (x, y, z, c) => { pts.push(x, y, z); cols.push(c[0], c[1], c[2]); };
        const trunkC = [1, 0.82, 0.5], leafA = [0.85, 1, 0.82], leafB = [1, 0.95, 0.75];
        // a broad trunk that splits low, as the lote tree does, into spreading limbs
        for (let i = 0; i < 1100; i++) {
          const t = r(), a = r() * 6.283, rad = 3.2 * (1 - t * 0.5);
          push(TREE.x + Math.cos(a) * rad + Math.sin(t * 3) * 1.2, TB + t * 26, TREE.z + Math.sin(a) * rad, trunkC);
        }
        const limbs = [];
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * 6.283 + r() * 0.4, out = 22 + r() * 22, up = 20 + r() * 22;
          const sx = TREE.x, sy = TB + 22 + r() * 6, sz = TREE.z;
          const ex = sx + Math.cos(a) * out, ey = sy + up, ez = sz + Math.sin(a) * out * 0.8;
          limbs.push([ex, ey, ez]);
          for (let i = 0; i < 260; i++) {
            const t = r(), bend = Math.sin(t * Math.PI) * 4, rad = 1.4 * (1 - t * 0.6), b = r() * 6.283;
            push(U.lerp(sx, ex, t) + Math.cos(b) * rad, U.lerp(sy, ey, Math.pow(t, 0.7)) + bend + Math.sin(b) * rad, U.lerp(sz, ez, t) + Math.cos(b * 1.3) * rad, trunkC);
          }
        }
        // a vast, low dome of leaves of light
        for (let i = 0; i < 6400; i++) {
          const L = limbs[i % limbs.length], a = r() * 6.283, u = r() * 2 - 1, rr = Math.cbrt(r()) * (14 + r() * 6);
          const x = L[0] + Math.sqrt(1 - u * u) * Math.cos(a) * rr * 1.3, y = L[1] + u * rr * 0.55, z = L[2] + Math.sqrt(1 - u * u) * Math.sin(a) * rr * 1.3;
          push(x, y, z, r() < 0.5 ? leafA : leafB);
        }
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
        this.tree = new T.Points(geo, new T.PointsMaterial({ map: KIT.glowTex(w), vertexColors: true, size: 1.6, transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        this.tree.frustumCulled = false; S.add(this.tree);
        this.treeGlow = KIT.glow(w, 0xfff4d8, 150, 0); this.treeGlow.position.set(TREE.x, TB + 40, TREE.z); this.treeGlow.material.fog = false; S.add(this.treeGlow);
        // the immense calm light above everything
        this.crown = KIT.glow(w, 0xfff8ea, 1400, 0); this.crown.position.set(TREE.x, TB + 520, TREE.z - 60); this.crown.material.fog = false; S.add(this.crown);
        // fifty lights, which gather into five
        const fp = new T.BufferGeometry(); fp.setAttribute('position', new T.BufferAttribute(new Float32Array(150), 3));
        this.fifty = new T.Points(fp, new T.PointsMaterial({ map: KIT.glowTex(w), color: GOLD, size: 1.5, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        this.fifty.frustumCulled = false; S.add(this.fifty);
        this.five = [0, 1, 2, 3, 4].map(() => { const g = KIT.glow(w, GOLD, 5, 0); g.material.fog = false; S.add(g); return g; });
        this.fiftyPh = Array.from({ length: 50 }, (_, i) => ({ a: (i / 50) * 6.283, r: 9 + (i % 5) * 0.9, y: (i % 7) * 0.5, g: i % 5 }));
      }
      this.falling = KIT.dust(w, 300, [TREE.x - 50, TB - 30, TREE.z - 50, TREE.x + 50, TB + 70, TREE.z + 50], 0xfff2c8, 0.35);
      this.falling.material.opacity = 0; this.falling.material.fog = false; S.add(this.falling);

      w.followShadow(moon, 30, 1024); w.receiveAll();
      [this.column, this.colCore].forEach(m => { m.castShadow = false; m.receiveShadow = false; });
      this.rings.forEach(R => { R.disc.castShadow = false; R.disc.receiveShadow = false; R.beam.castShadow = false; });
      // multi-group geometries (boxes, capped cylinders) would be skipped by the merge: flatten them first
      S.traverse(m => { if (m.isMesh && !m.isInstancedMesh && !Array.isArray(m.material) && m.geometry.groups.length > 1) m.geometry.clearGroups(); });
      this.baked = w.bake();
      // everything of the earth, hidden once the night has swallowed it below
      const heavenly = new Set([this.sky, this.poleRig, this.column, this.colCore, this.tree, this.treeGlow, this.crown, this.fifty, this.falling, ...this.five, ...this.rings.map(R => R.disc)]);
      this.earth = S.children.filter(o => !heavenly.has(o) && (o.isMesh || o.isSprite || o.isPoints || o.isGroup));

      /* ---------- the activity ---------- */
      this.phase = 'walk'; this.n = 0; this.texts = [];
      this.fp = new T.Vector3(); this.fv = new T.Vector3(); this.bounceT = 0; this.phaseT = 0; this.stillT = 0;
      w.activity('Through the seven heavens', 7, 'Walk to the column of light beside the Ka‘bah');
      w.interact({ key: 'column', pos: [AX, 1.6, AZ], r: 3.2, once: true, label: 'Stand in the light', enabled: () => self.phase === 'walk', onUse: () => self.beginAscent(env) });

      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.6, gain: 0.05 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.05, 0.02);
      this.air = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 600, q: 0.8, gain: 0 });
      this.colHum = SND.drone(b, 293.66, { vowel: 'u', gain: 0 });   // the column calls softly as you near it
      this.aimHum = SND.drone(b, 440, { vowel: 'o', gain: 0 });       // grows as you line up beneath an opening
      this.choir = [];                                                // one more voice for every heaven
      this.cricketClock = 1;

      // arrival: looking straight up into the turning stars, then down to the courtyard
      w.cinematic([
        { p: [5, 2.0, 40], l: [5.2, 200, 36] },
        { p: [5, 2.2, 40], l: [4, 150, 22] },
        { p: [4.5, 3.4, 39], l: [AX, 60, AZ] },
        { p: [4, 3.0, 37], l: [0, 6, 0] },
        { p: [3, 1.62, 34], l: [3, 2, 24] },
      ], 11);
    },

    beginAscent(env) {
      const w = this.w;
      this.phase = 'open'; this.phaseT = 0;
      w.enabled = false;
      this.fp.set(AX, w.y + w.eye, AZ + 0.01); this.fv.set(0, 0, 0);
      this.yaw0 = w.yaw;
      SND.glow(env.bus, 146.83, { gain: 0.07, dur: 10, vowel: 'o' });
      SND.swell(env.bus, { f0: 200, f1: 1200, dur: 5, gain: 0.08 });
      w.say('By Night', '<span class="q">“Glory be to Him who took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa, whose surroundings We have blessed.”</span> (Qur’an 17:1) Scholars differ on the exact date; it was about a year before the Hijrah. (sirah)',
        { ar: 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا', ms: 13000 });
      w.step(this.touch ? 'You rise: steer toward the golden opening' : 'Rise with W or Space; look toward the golden opening to steer');
    },

    pass(env, i) {
      const w = this.w, R = this.rings[i], h = R.h;
      R.passed = true; R.bloom = 1; this.n = i + 1;
      w.progress(this.n, i < 6 ? `${h.n}: ${h.en}. Rise to the next opening` : `${h.n}: ${h.en}. Rise on, toward the light`);
      // a sung chord, fuller with every heaven
      SND.glow(env.bus, h.root, { gain: 0.06 + i * 0.004, dur: 9, vowel: 'a' });
      SND.bell(env.bus, h.root * 1.5, { gain: 0.05, delay: 0.25 });
      SND.bell(env.bus, h.root * 2.5198, { gain: 0.035, delay: 0.5, glass: true });
      SND.swell(env.bus, { f0: 400, f1: 2400, dur: 2.4, gain: 0.05 });
      const tones = [146.83, 220, 293.66, 369.99, 440, 587.33, 739.99];
      this.choir.push(SND.drone(env.bus, tones[i] / (i > 3 ? 2 : 1), { vowel: i % 2 ? 'o' : 'u', gain: 0.007 }));
      const sp = lightText(THREE, h.ar, h.pb, h.en, h.n);
      const hole = this.holePos(R);
      const ox = hole.x - AX, oz = hole.z - AZ, ol = Math.hypot(ox, oz) || 1;
      sp.position.set(hole.x + (ox / ol) * 5, R.y + 7.5, hole.z + (oz / ol) * 5);
      w.scene.add(sp);
      this.texts.push({ sp, t: 0 });
      if (i === 0) setTimeout(() => { if (this.w) this.w.say('The Seven Heavens', 'He was raised through seven heavens, and in each he met a prophet: Adam in the first; Yahya and ‘Isa in the second; Yusuf in the third; Idris in the fourth; Harun in the fifth; Musa in the sixth; and Ibrahim in the seventh. (Sahih al-Bukhari 3887, from Malik ibn Sa‘sa‘ah)', { ms: 15000 }); }, 2500);
      if (i === 6) { this.phase = 'quiet'; this.phaseT = 0; }
    },

    holePos(R) {
      const a = R.disc.rotation.y;
      return { x: AX + Math.cos(a) * HOLE_OFF, z: AZ - Math.sin(a) * HOLE_OFF };
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, T = THREE, cam = w.camera;
      this.starRig.rotation.y += dt * 0.012;   // the stars turn slowly
      KIT.driftDust(this.dust, dt, t, [0.04, 0.02]);
      // the motes in the column rise
      const cm = this.colMotes.geometry.attributes.position;
      for (let i = 0; i < cm.count; i++) { let y = cm.getY(i) + dt * (0.6 + (i % 5) * 0.2); if (y > 24) y = 0; cm.setY(i, y); }
      cm.needsUpdate = true;
      this.lamps.forEach((l, i) => { l.material.opacity = 0.75 + 0.15 * Math.sin(t * 7 + i * 2.1) * Math.sin(t * 3.3 + i); });
      const colPulse = 0.5 + 0.5 * Math.sin(t * 1.3);
      this.colGlow.material.opacity = 0.6 + 0.3 * colPulse;

      // the column hums as you near it
      if (this.phase === 'walk') {
        const d = Math.hypot(w.pos.x - AX, w.pos.z - AZ);
        this.colHum.setGain(0.012 * U.clamp(1 - d / 26), 0.5);
        this.cricketClock -= dt;
        if (this.cricketClock < 0) { this.cricketClock = 0.6 + Math.random() * 1.8; SND.cricket(env.bus, { gain: 0.003 }); }
        return;
      }

      const k = w.keys;
      this.phaseT += dt;
      const fp = this.fp, fv = this.fv;
      // the night sky opens: rings fade in, the earth falls away
      const open = U.smooth(0, 4, this.phase === 'open' ? this.phaseT : 9);
      if (this.phase === 'open') {
        fv.set(0, 2.4 * open, 0);
        w.pitch = U.damp(w.pitch, 0.95, 1.5, dt);
        w.yaw = U.damp(w.yaw, 0, 1.5, dt);
        this.colHum.setGain(0.014 * (1 - open), 0.5);
        if (this.phaseT > 4) { this.phase = 'fly'; this.phaseT = 0; }
      } else if (this.phase === 'fly') {
        const R = this.rings[this.n];
        // rise: W, Space or Up (on touch, always); fly where you look; A/D slide sideways
        let rise = (k.has('w') || k.has(' ') || k.has('ArrowUp') || this.touch) ? 1 : 0;
        if (k.has('s') || k.has('ArrowDown')) rise = -0.5;
        if (this.bounceT > 0) { this.bounceT -= dt; rise = Math.min(rise, 0); }
        const f = w.forward(), fh = Math.hypot(f.x, f.z) || 1;
        const sp = this.touch ? 5 : 6.5;
        const want = new T.Vector3();
        if (rise > 0) want.set(f.x * sp, Math.max(f.y, 0.4) * sp, f.z * sp);
        else if (rise < 0) want.set(0, -2.5, 0);
        let side = 0; if (k.has('a') || k.has('ArrowLeft')) side -= 1; if (k.has('d') || k.has('ArrowRight')) side += 1;
        if (w.joy) { side += w.joy.dx; want.x += (f.x / fh) * -w.joy.dy * 4; want.z += (f.z / fh) * -w.joy.dy * 4; }
        want.x += (-f.z / fh) * side * 4.5; want.z += (f.x / fh) * side * 4.5;
        // within reach of the opening, a gentle pull toward its centre
        const hole = this.holePos(R), below = R.y - fp.y;
        const hx = hole.x - fp.x, hz = hole.z - fp.z, hd = Math.hypot(hx, hz);
        const align = U.clamp(1 - hd / 14) * U.clamp(1 - below / 46);
        if (hd < 9 && below < 16 && below > -1) { want.x += hx * 1.1; want.z += hz * 1.1; }
        if (this.bounceT > 0) want.y = Math.min(want.y, -1.5 * this.bounceT);
        fv.lerp(want, 1 - Math.exp(-dt * 3));
        // the soft voice of alignment
        this.aimHum.set(R.h.root * 2, 0.5); this.aimHum.setGain(0.016 * align * align, 0.3);
        // reaching the plane of the ring
        if (fp.y + fv.y * dt >= R.y - 0.9 && fp.y < R.y + 0.5) {
          if (hd < HOLE_R - 0.4) { if (fp.y + fv.y * dt >= R.y) this.pass(env, this.n); }
          else {
            // the ring does not open here: you drift gently back beneath it
            fp.y = R.y - 0.9; fv.y = -4.5; this.bounceT = 1.3; R.flash = 1;
            SND.sing(env.bus, R.h.root / 2, { vowel: 'm', dur: 1.6, gain: 0.05, voices: 2, attack: 0.05, hold: 0.2 });
            SND.swell(env.bus, { f0: 900, f1: 300, dur: 1.2, gain: 0.04 });
          }
        }
      } else if (this.phase === 'quiet' || this.phase === 'arrive' || this.phase === 'tree') {
        // carried on to the tree: near-silence, then the revelation
        if (this.phase === 'quiet') {
          fv.lerp(new T.Vector3(0, 3, 0), 1 - Math.exp(-dt * 2));
          this.aimHum.setGain(0, 0.4);
          this.choir.forEach(c => c.setGain(0.0015, 1.2));
          this.air.set('gain', 0.004, 1);
          if (this.phaseT > 3) { this.phase = 'arrive'; this.phaseT = 0; this.from = fp.clone(); }
        }
        if (this.phase === 'arrive') {
          const q = U.ease(U.clamp(this.phaseT / 8));
          fp.lerpVectors(this.from, new T.Vector3(VIEW.x, VIEW.y, VIEW.z), q); fv.set(0, 0, 0);
          const dx = TREE.x - VIEW.x, dz = TREE.z - VIEW.z, dy = TB + 34 - VIEW.y;
          w.yaw = U.damp(w.yaw, Math.atan2(-dx, -dz), 1.6, dt);
          w.pitch = U.damp(w.pitch, Math.atan2(dy, Math.hypot(dx, dz)), 1.6, dt);
          if (this.phaseT > 0.3 && !this.sangTree) {
            this.sangTree = true;
            SND.glow(env.bus, 146.83, { gain: 0.09, dur: 16, vowel: 'a' });
            SND.glow(env.bus, 220, { gain: 0.05, dur: 15, vowel: 'o', delay: 1.2 });
            SND.bell(env.bus, 587.33, { gain: 0.04, delay: 2.4, glass: true });
            this.choir.forEach(c => c.setGain(0.009, 3));
          }
          if (this.phaseT > 8) { this.phase = 'tree'; this.phaseT = 0; }
        }
        if (this.phase === 'tree') this.treeSequence(env, dt);
      }
      fp.addScaledVector(fv, dt);
      // keep within the heavens' reach
      const ox = fp.x - AX, oz = fp.z - AZ, od = Math.hypot(ox, oz), lim = this.phase === 'fly' ? RING_R - 3 : 200;
      if (od > lim) { fp.x = AX + ox / od * lim; fp.z = AZ + oz / od * lim; }
      if (fp.y < 2) { fp.y = 2; fv.y = Math.max(0, fv.y); }
      cam.position.copy(fp);
      cam.rotation.set(w.pitch, w.yaw, 0);
      this.air.set('gain', Math.min(0.06, Math.abs(fv.y) * 0.008 + Math.hypot(fv.x, fv.z) * 0.004), 0.3);
      this.air.set('freq', 400 + Math.abs(fv.y) * 90, 0.3);

      // the sky deepens into each heaven's hue; the column and the earth fall away
      const height = fp.y, level = U.clamp((height - 6) / (TB - 6));
      this.wind.set('gain', 0.05 * (1 - U.smooth(4, 40, height)), 0.5);
      this.column.material.opacity = 0.12 * (1 - U.smooth(30, 120, height)) + 0.04;
      const below = U.smooth(8, 34, height);
      this.earth.forEach(o => { o.visible = height < 40; });
      const cur = this.rings[Math.min(this.n, 6)];
      const hue = new T.Color(cur.h.hue);
      const top = this.skyBase.top.clone().lerp(hue.clone().multiplyScalar(0.07), open * 0.9);
      const mid = this.skyBase.mid.clone().lerp(hue.clone().multiplyScalar(0.2), open * 0.8);
      const heaven = this.phase === 'arrive' ? U.smooth(0, 8, this.phaseT) : this.phase === 'tree' ? 1 : 0;
      top.lerp(new T.Color('#f6eedc'), heaven * 0.55); mid.lerp(new T.Color('#fff4e0'), heaven * 0.75);
      this.skyU.uTop.value.copy(top); this.skyU.uMid.value.copy(mid); this.skyU.uBot.value.copy(mid.clone().multiplyScalar(0.4));
      this.skyU.uStars.value = 0.6 * (1 - heaven);
      this.starRig.children.forEach((p, i) => { p.material.opacity = (i ? 0.95 : 0.75) * (1 - heaven); });
      w.scene.fog.color.copy(mid.clone().multiplyScalar(0.6));
      w.scene.fog.density = U.lerp(0.0042, 0.05, below);
      w.renderer.toneMappingExposure = 1.15 - heaven * 0.15;

      // the rings: they turn, open the way, flash when missed, and bloom when passed
      this.rings.forEach((R, i) => {
        R.disc.rotation.y += dt * R.spin * (R.passed ? 0.15 : 1);
        R.flash = Math.max(0, R.flash - dt * 1.2); R.bloom = Math.max(0, R.bloom - dt * 0.4);
        const dy = R.y - height, isNext = i === this.n && this.phase === 'fly';
        const near = U.clamp(1 - Math.abs(dy) / 110);
        R.disc.material.opacity = open * (R.passed ? 0.22 + R.bloom * 0.7 : (0.25 + 0.5 * near) + R.flash * 0.5);
        R.halo.material.opacity = open * (R.passed ? 0.1 : isNext ? 0.75 + 0.2 * Math.sin(t * 2.4) : 0.25 * near);
        R.beam.material.opacity = open * (isNext ? 0.22 + 0.06 * Math.sin(t * 2.4) : 0);
      });
      this.texts.forEach(o => {
        o.t += dt;
        o.sp.material.opacity = U.smooth(0, 1.8, o.t) * (1 - U.smooth(16, 22, o.t) * 0.85);
        o.sp.position.y += dt * 0.15;
      });
      // the tree and the light above it
      const tv = U.smooth(TB - 120, TB, height);
      this.tree.material.opacity = 0.9 * tv;
      this.tree.material.size = 1.5 + 0.15 * Math.sin(t * 0.8);
      this.treeGlow.material.opacity = 0.35 * tv;
      this.crown.material.opacity = 0.75 * U.smooth(TB - 220, TB, height);
      this.falling.material.opacity = 0.7 * tv;
      if (tv > 0) {
        const a = this.falling.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * (0.5 + (i % 4) * 0.25), x = a.getX(i) + Math.sin(t * 0.4 + i) * dt * 0.3; if (y < TB - 30) y = TB + 70; a.setXYZ(i, x, y, a.getZ(i)); }
        a.needsUpdate = true;
      }
      if (this.phase !== 'tree' && this.phase !== 'done') this.drawFifty(0, t);
    },

    // the fifty lights: they appear around the tree, and gather into five that keep their brightness
    drawFifty(gather, t) {
      const a = this.fifty.geometry.attributes.position, cx = TREE.x, cy = TB + 14, cz = TREE.z + 46;
      for (let i = 0; i < 50; i++) {
        const p = this.fiftyPh[i], ang = p.a + t * 0.12;
        const x0 = cx + Math.cos(ang) * p.r * 1.6, y0 = cy + p.y + Math.sin(ang * 2 + t * 0.3) * 1.2, z0 = cz + Math.sin(ang) * p.r * 0.5;
        const gx = cx + (p.g - 2) * 4.2, gy = cy + 3 + Math.sin(p.g * 1.3 + t * 0.6) * 0.3, gz = cz + 1;
        a.setXYZ(i, U.lerp(x0, gx, gather), U.lerp(y0, gy, gather), U.lerp(z0, gz, gather));
      }
      a.needsUpdate = true;
      this.five.forEach((g, i) => { g.position.set(cx + (i - 2) * 4.2, cy + 3 + Math.sin(i * 1.3 + t * 0.6) * 0.3, cz + 1); });
    },

    treeSequence(env, dt) {
      const w = this.w, T0 = this.phaseT - dt, T1 = this.phaseT;
      const cross = s => T0 < s && T1 >= s;
      if (cross(0.5)) w.say('The Lote Tree of the Utmost Boundary', 'Above the seventh heaven he was raised to Sidrat al-Muntaha (Sahih al-Bukhari 3887), the tree the Qur’an names: <span class="q">“by the Lote Tree of the utmost boundary.”</span> (Qur’an 53:14)', { ar: 'عِندَ سِدْرَةِ الْمُنتَهَىٰ', ms: 12000 });
      if (cross(10)) {
        SND.glow(env.bus, 196, { gain: 0.05, dur: 12, vowel: 'o' });
        w.say('The Gift of Prayer', 'Fifty prayers were prescribed. At Musa’s urging he asked again and again for them to be lightened, until they were five, with the reward of fifty (Sahih al-Bukhari 3887): <span class="q">“They are five, and they are fifty.”</span> (Sahih al-Bukhari 349)', { ar: 'هِيَ خَمْسٌ وَهِيَ خَمْسُونَ', ms: 16000 });
        w.step('Fifty prayers, lightened to five');
      }
      const appear = U.smooth(10, 12, T1), gather = U.ease(U.smooth(14, 23, T1));
      this.fifty.material.opacity = appear * (1 - gather * 0.85);
      this.fifty.material.size = 1.5 + gather * 1.2;
      this.five.forEach(g => { g.material.opacity = U.smooth(19, 24, T1) * 0.95; g.scale.setScalar(5 + U.smooth(19, 24, T1) * 3); });
      this.drawFifty(gather, w.time);
      for (let i = 0; i < 5; i++) if (cross(19 + i * 0.7)) SND.bell(env.bus, [293.66, 369.99, 440, 493.88, 587.33][i], { gain: 0.045, glass: true });
      if (cross(25)) { this.phase = 'done'; w.finish('Five prayers, with the reward of fifty'); }
    },
  }));
})();
