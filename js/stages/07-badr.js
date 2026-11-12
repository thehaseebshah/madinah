/* Station — The Full Moon Rises (walkable + rhythm), 1 AH.
   Feeling: joy, and gratitude for a long-awaited arrival.
   Yathrib at night from a flat rooftop: mud-brick houses, palms and lanes below, and a huge moon
   low on the hills of the south. Join the welcome: four rounds, one for each line of the song.
   Stars glide along a track at the bottom of the screen; tap as each crosses the line. Every line
   completed is written in light in the sky, raises the moon, wakes more windows and lanterns
   across the city, and is answered by wordless voices from the rooftops.
   Colour script: night indigo, with warm moon-gold kept for the moon, the lamps and the beats.
   No person is shown: the city is present in its lights and its voices. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  // boxes without per-face groups, so that WORLD.bake can merge them
  const BOX = (...a) => { const g = new THREE.BoxGeometry(...a); g.clearGroups(); return g; };
  const VERSES = [
    ['طَلَعَ الْبَدْرُ عَلَيْنَا', 'The full moon has risen over us'],
    ['مِنْ ثَنِيَّاتِ الْوَدَاعْ', 'from the hills of al-Wada‘'],
    ['وَجَبَ الشُّكْرُ عَلَيْنَا', 'Gratitude is owed by us'],
    ['مَا دَعَا لِلهِ دَاعْ', 'for as long as anyone calls to God'],
  ];
  const BEAT = 0.72, LEAD = 2.6, WIN = 0.32;
  const PATTERNS = [[0, 1, 2, 3, 4.5, 5.5, 6.5], [0, 1, 2, 3, 4, 5, 6.5], [0, 1, 2, 3, 4.5, 5.5, 6.5], [0, 1, 2, 3, 4, 5, 6.5]];
  const MELODY = [
    [293.66, 329.63, 369.99, 392, 369.99, 329.63, 293.66],
    [329.63, 369.99, 392, 440, 392, 369.99, 329.63],
    [293.66, 329.63, 369.99, 392, 440, 392, 369.99],
    [329.63, 293.66, 277.18, 293.66, 329.63, 277.18, 293.66],
  ];
  const ELEV = [0.07, 0.15, 0.25, 0.37, 0.52];   // the moon's height (radians) before and after each line
  const ROOF = 4.6, TER = { x0: -5.6, z0: -4.1, x1: 5.6, z1: 4.1 };
  const MOON_AZ = 0.42;                          // a little west of due south (+z is south)

  ENGINE.register(WORLD.stage({
    key: 'badr',
    arabic: 'طَلَعَ البَدْر',
    title: 'The Full Moon Rises',
    era: 'Arrival in Yathrib, 1 AH',
    hint: 'WASD to walk the roof · E at the lamp to join · then E, Space or click on each star',
    sound: { reverb: 0.55 },
    story: `<p>The people of Yathrib went out to the lava fields every morning to watch the southern road, until the midday heat drove them home (Sahih al-Bukhari 3906). When the Prophet ﷺ finally arrived, the city rejoiced as it had never rejoiced at anything (Sahih al-Bukhari 3925). The song of welcome sung here, <i>Tala‘a al-Badru</i>, is loved and still sung, though its report is weak and some scholars place it at the return from Tabuk.</p>
            <p>Yathrib became known as <i>al-Madinah</i>, the City; the Prophet ﷺ called it <i>Taybah</i>, the good (Sahih Muslim 1385). Later generations named it <i>al-Madinah al-Munawwarah</i>, the Illuminated City.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0, z: -1.5, yaw: Math.PI + 0.25, pitch: 0.06 }, exposure: 1.25, far: 1600, speed: 2.2, run: 3.4,
        fog: { color: 0x0c1230, density: 0.0042 }, bounds: [TER.x0, TER.z0, TER.x1, TER.z1],
        ground: () => ROOF, surface: () => 'gravel',
      });
      const S = w.scene;
      this.round = -1; this.phase = 'explore'; this.markers = []; this.glowCity = 0; this.elev = ELEV[0]; this.elevT = ELEV[0];
      this.hits = 0; this.bursts = []; this.flash = 0;

      /* ---------- sky, moon and light ---------- */
      this.moonDir = new T.Vector3();
      this.setMoonDir(this.elev);
      this.skyM = w.sky({ top: '#03050f', mid: '#141c44', bot: '#06080f', sunDir: this.moonDir.toArray(), sun: '#3a4268', sunSize: 0.0004, stars: 0.35 });
      this.hemi = new T.HemisphereLight(0x2c3870, 0x120c08, 0.42); S.add(this.hemi);
      this.moonL = new T.DirectionalLight(0xd0d8ff, 0.35); S.add(this.moonL);
      const moonTex = w.tex(512, (g, s) => {
        const c = s / 2, R = s * 0.3;
        const halo = g.createRadialGradient(c, c, R * 0.9, c, c, s / 2); halo.addColorStop(0, 'rgba(255,236,200,0.35)'); halo.addColorStop(1, 'rgba(255,236,200,0)');
        g.fillStyle = halo; g.fillRect(0, 0, s, s);
        const disc = g.createRadialGradient(c - R * 0.2, c - R * 0.2, R * 0.1, c, c, R); disc.addColorStop(0, '#fff8e8'); disc.addColorStop(1, '#f0d8a8');
        g.fillStyle = disc; g.beginPath(); g.arc(c, c, R, 0, 6.283); g.fill();
        g.save(); g.beginPath(); g.arc(c, c, R, 0, 6.283); g.clip();
        const r = U.seeded(14);
        [[-0.25, -0.2, 0.32], [0.18, -0.3, 0.22], [0.3, 0.1, 0.26], [-0.1, 0.25, 0.2], [-0.35, 0.2, 0.14], [0.05, -0.05, 0.12]].forEach(([x, y, rr]) => {
          const gr = g.createRadialGradient(c + x * R, c + y * R, 0, c + x * R, c + y * R, rr * R); gr.addColorStop(0, 'rgba(150,130,110,0.45)'); gr.addColorStop(1, 'rgba(150,130,110,0)');
          g.fillStyle = gr; g.fillRect(0, 0, s, s);
        });
        for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(120,100,80,${r() * 0.15})`; g.beginPath(); g.arc(c + (r() - 0.5) * 2 * R, c + (r() - 0.5) * 2 * R, r() * 6, 0, 6.283); g.fill(); }
        g.restore();
      });
      moonTex.wrapS = moonTex.wrapT = T.ClampToEdgeWrapping;
      this.moon = new T.Sprite(new T.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false, color: 0xfff0d8, toneMapped: false }));
      this.moon.scale.set(190, 190, 1); S.add(this.moon);
      this.moonHalo = KIT.glow(w, 0xffe0b0, 520, 0.28); this.moonHalo.material.fog = false; S.add(this.moonHalo);

      /* ---------- the hills of the south ---------- */
      const hillMat = KIT.std({ color: 0x0c0e18, flatShading: true });
      const hg = new T.SphereGeometry(1, 20, 8, 0, 6.283, 0, Math.PI / 2), hp = hg.attributes.position;
      for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), z = hp.getZ(i), n = 1 + U.noise2(x * 3 + 2, z * 3) * 0.3; hp.setXYZ(i, x * n, hp.getY(i) * (0.7 + 0.5 * (U.noise2(x * 4, z * 4) * 0.5 + 0.5)), z * n); }
      hg.computeVertexNormals();
      for (let i = 0; i < 16; i++) {
        const a = -1.1 + i * 0.15, d = 420 + (i % 3) * 60;
        const h = new T.Mesh(hg, hillMat); h.position.set(Math.sin(a) * d, -2, Math.cos(a) * d);
        h.scale.set(70 + (i % 4) * 22, 26 + (i % 5) * 9, 40); h.rotation.y = a; S.add(h);
      }
      for (let i = 0; i < 12; i++) { const a = 2.2 + i * 0.16, d = 520; const h = new T.Mesh(hg, hillMat); h.position.set(Math.sin(a) * d, -2, Math.cos(a) * d); h.scale.set(90, 18 + (i % 3) * 8, 50); S.add(h); }

      /* ---------- the city ---------- */
      const earth = KIT.std({ map: KIT.sand(w, [80, 80]), color: 0x8a7c70 });
      const gnd = new T.Mesh(new T.PlaneGeometry(900, 900), earth); gnd.rotation.x = -Math.PI / 2; S.add(gnd);
      const plasterTex = KIT.plaster(w, [1, 1], '#a88a68');
      const mats = ['#d8c0a0', '#c8ae8c', '#e0ccb0', '#bca486'].map(c => KIT.std({ map: plasterTex, color: new T.Color(c), relief: 0.02 }));
      const doorM = KIT.std({ color: 0x1a120c });
      const r = U.seeded(622);
      this.roofs = []; const wins = [];
      const house = (x, z, hw, hd, hh, mi, parapet) => {
        const m = new T.Mesh(BOX(hw, hh, hd), mats[mi % 4]); m.position.set(x, hh / 2, z); S.add(m);
        if (parapet) {
          const ph = 0.55, pt = 0.22;
          [[0, -hd / 2 + pt / 2, hw, pt], [0, hd / 2 - pt / 2, hw, pt], [-hw / 2 + pt / 2, 0, pt, hd], [hw / 2 - pt / 2, 0, pt, hd]].forEach(([dx, dz, lx, lz]) => { const p = new T.Mesh(BOX(lx, ph, lz), mats[mi % 4]); p.position.set(x + dx, hh + ph / 2, z + dz); S.add(p); });
        }
        const face = Math.floor(r() * 4), dw = new T.Mesh(BOX(0.9, 1.9, 0.08), doorM);
        const fx = [0, 0, -1, 1][face], fz = [-1, 1, 0, 0][face];
        dw.position.set(x + fx * (hw / 2 + 0.03), 0.95, z + fz * (hd / 2 + 0.03)); dw.rotation.y = fx ? Math.PI / 2 : 0; S.add(dw);
        const nw = 2 + Math.floor(r() * 3);
        for (let k = 0; k < nw; k++) {
          const f = Math.floor(r() * 4), wx = [0, 0, -1, 1][f], wz = [-1, 1, 0, 0][f], along = (r() - 0.5) * (f < 2 ? hw : hd) * 0.6, y = 1.6 + r() * Math.max(0.2, hh - 2.6);
          wins.push({ x: x + wx * (hw / 2 + 0.05) + (f < 2 ? along : 0), y, z: z + wz * (hd / 2 + 0.05) + (f >= 2 ? along : 0), rot: f >= 2 ? Math.PI / 2 : 0, th: r(), d: Math.hypot(x, z) });
        }
        this.roofs.push({ x, y: hh + 0.3, z, d: Math.hypot(x, z) });
      };
      // the house you stand on, with a parapet all round
      house(0, 0, TER.x1 - TER.x0 + 0.8, TER.z1 - TER.z0 + 0.8, ROOF, 0, true);
      // a lane runs south from below you toward the edge of town
      const CELL = 9.5;
      for (let gx = -12; gx <= 12; gx++) for (let gz = -12; gz <= 12; gz++) {
        const x = gx * CELL + (r() - 0.5) * 3, z = gz * CELL + (r() - 0.5) * 3, d = Math.hypot(x, z);
        if (d < 9 || d > 120 || r() < 0.22) continue;
        if (Math.abs(x - 1.5 * Math.sin(z * 0.05)) < 4.5 && z > 0) continue; // the southern lane
        if (Math.abs(z + 2) < 3.2 && Math.abs(x) > 12) continue;              // the cross lane
        const hh = d < 18 ? 2.8 + r() * 0.9 : 3 + r() * 3.2;
        house(x, z, 5 + r() * 3.2, 5 + r() * 3.2, hh, Math.floor(r() * 4), d < 60 && r() < 0.6);
      }
      // palms in the courtyards and gardens
      for (let i = 0; i < 46; i++) {
        const a = r() * 6.283, d = 12 + r() * 110, px = Math.cos(a) * d + 4.7, pz = Math.sin(a) * d + 4.7;
        const along = px * Math.sin(MOON_AZ) + pz * Math.cos(MOON_AZ), across = Math.abs(px * Math.cos(MOON_AZ) - pz * Math.sin(MOON_AZ));
        if (along > -5 && along < 110 && across < 12) continue; // keep the line of the entrance shot clear
        const p = KIT.palm(w, 8 + r() * 6); p.position.set(px, 0, pz); S.add(p);
      }
      // windows: one instanced set whose colour wakes with the welcome
      this.wins = wins;
      const wg = new T.PlaneGeometry(0.62, 0.8);
      this.winMesh = new T.InstancedMesh(wg, new T.MeshBasicMaterial({ color: 0xffffff, fog: true }), wins.length);
      const M = new T.Matrix4(), Q = new T.Quaternion(), V = new T.Vector3(), ONE = new T.Vector3(1, 1, 1);
      wins.forEach((wn, i) => { Q.setFromAxisAngle(T.Object3D.DefaultUp, wn.rot); M.compose(V.set(wn.x, wn.y, wn.z), Q, ONE); this.winMesh.setMatrixAt(i, M); this.winMesh.setColorAt(i, new T.Color(0x140e0a)); });
      this.winMesh.userData.dynamic = true; S.add(this.winMesh);
      this.winLit = new Float32Array(wins.length);

      // the lamp on the south parapet, where you join the welcome
      this.lampPos = new T.Vector3(0.4, ROOF + 0.85, TER.z1 + 0.2);
      const lampBody = new T.Mesh(new T.CylinderGeometry(0.12, 0.09, 0.1, 10), KIT.std({ color: 0x7a5034 })); lampBody.position.copy(this.lampPos).y -= 0.08; S.add(lampBody);
      this.lampGlow = KIT.glow(w, 0xffc070, 1.6, 0.9); this.lampGlow.position.copy(this.lampPos); S.add(this.lampGlow);
      this.lampL = new T.PointLight(0xffb060, 1.2, 9, 1.8); this.lampL.position.copy(this.lampPos).y += 0.2; S.add(this.lampL);
      // a few rooftop fires across the city that kindle with each line
      this.fires = [];
      this.roofs.filter(q => q.d > 14 && q.d < 70).sort(() => r() - 0.5).slice(0, 40).forEach((q, i) => {
        const g = KIT.glow(w, 0xffa850, 2.2, 0); g.position.set(q.x, q.y + 0.4, q.z); g.material.fog = false; S.add(g); this.fires.push({ g, th: i / 40, ph: r() * 6 });
      });

      // lanterns that drift up from the rooftops
      const NL = 180, lp = new Float32Array(NL * 3).fill(-500);
      this.lanterns = Array.from({ length: NL }, () => ({ alive: false, x: 0, y: -500, z: 0, v: 0, ph: 0 }));
      const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(lp, 3));
      this.lanternPts = new T.Points(lg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xff9a48, size: 1.1, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      this.lanternPts.frustumCulled = false; S.add(this.lanternPts);

      // the verses, written in light over the southern sky
      this.verseSprites = VERSES.map(([ar, en]) => {
        const c = document.createElement('canvas'); c.width = 1400; c.height = 240;
        const g = c.getContext('2d'); g.textAlign = 'center'; g.direction = 'rtl';
        g.shadowColor = 'rgba(255,214,140,0.95)'; g.shadowBlur = 30; g.fillStyle = '#fff4d6'; g.font = '96px Amiri, "Geeza Pro", serif';
        g.fillText(ar, 700, 118); g.direction = 'ltr'; g.shadowBlur = 8; g.fillStyle = 'rgba(242,233,214,0.92)'; g.font = 'italic 42px Spectral, Georgia, serif'; g.fillText(en, 700, 204);
        const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
        const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
        sp.scale.set(34, 5.8, 1); sp.visible = false; S.add(sp); return sp;
      });

      this.dust = KIT.dust(w, 120, [-14, ROOF, -10, 14, ROOF + 6, 14], 0xc8d0ff, 0.03); S.add(this.dust);

      w.followShadow(this.moonL, 24, 1024);
      w.receiveAll();
      this.winMesh.castShadow = false; this.winMesh.receiveShadow = false;
      w.scene.traverse(o => { if (o.isMesh && !Array.isArray(o.material) && o.geometry.groups.length > 1) o.geometry.clearGroups(); }); // single-material meshes merge in the bake
      this.baked = w.bake();

      /* ---------- the rhythm overlay ---------- */
      const ov = document.createElement('div');
      ov.setAttribute('aria-hidden', 'true');
      ov.style.cssText = 'position:absolute;left:50%;bottom:136px;transform:translateX(-50%) translateY(14px);width:min(760px,92vw);opacity:0;transition:opacity .8s,transform .8s;pointer-events:none;z-index:6;text-align:center;';
      ov.innerHTML = '<p style="margin:0 0 6px;font-family:var(--f-display,Marcellus,serif);letter-spacing:.22em;text-transform:uppercase;font-size:.62rem;color:rgba(242,233,214,.75)"></p><canvas style="display:block;width:100%;height:118px"></canvas>';
      w.ui.layer.appendChild(ov);
      this.ov = ov; this.ovLabel = ov.querySelector('p'); this.ovCanvas = ov.querySelector('canvas'); this.ovCtx = this.ovCanvas.getContext('2d');

      w.interact({ key: 'join', pos: [this.lampPos.x, this.lampPos.y, this.lampPos.z], r: 3.2, once: true, label: 'Join the welcome', enabled: () => self.phase === 'explore', onUse: () => self.startRound(env, 0) });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.night = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 360, gain: 0.06 });
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 520, q: 1.4, gain: 0.0 });
      this.crowd2 = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 900, q: 2, gain: 0.0, pan: 0.3 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.3, 90);
      SND.lfo(b, this.crowd2.filter && this.crowd2.filter.frequency, 0.47, 140);
      this.hum = SND.drone(b, 146.83, { vowel: 'm', gain: 0 });
      this.cricketClock = 0.5; this.voiceClock = 3; this.palmClock = 2;

      w.activity('The welcome', 4, 'Walk to the lamp on the southern parapet and press E to join the welcome.');

      // arrival: on the huge moon over the hills, pulling back across the dark rooftops to you
      const eye = [w.pos.x, ROOF + 1.62, w.pos.z];
      const mp = this.moonDir.clone().multiplyScalar(600);
      w.cinematic([
        { p: [mp.x * 0.15, 24, mp.z * 0.15], l: [mp.x, mp.y + 2, mp.z] },
        { p: [mp.x * 0.1, 19, mp.z * 0.1], l: [mp.x, mp.y + 4, mp.z] },
        { p: [mp.x * 0.045, 12, mp.z * 0.045], l: [mp.x * 0.6, mp.y * 0.5, mp.z * 0.6] },
        { p: [eye[0] - 1.5, eye[1] + 2.5, eye[2] - 6], l: [mp.x * 0.2, 8, mp.z * 0.2] },
        { p: eye, l: [eye[0] - Math.sin(w.yaw) * 10, eye[1], eye[2] - Math.cos(w.yaw) * 10] },
      ], 10);
    },

    setMoonDir(e) { this.moonDir.set(Math.sin(MOON_AZ) * Math.cos(e), Math.sin(e), Math.cos(MOON_AZ) * Math.cos(e)).normalize(); },

    /* ---------- the rounds ---------- */
    startRound(env, i) {
      const w = this.w;
      this.round = i; this.phase = 'round'; this.hitsThis = 0; this.roundStart = w.time;
      const t0 = w.time + LEAD;
      this.markers = PATTERNS[i].map((b, k) => ({ t: t0 + b * BEAT, k, hit: false, missed: false, hitT: 0 }));
      this.ovLabel.textContent = `Line ${i + 1} of 4  ·  tap as each star crosses the line`;
      this.ov.style.opacity = '1'; this.ov.style.transform = 'translateX(-50%)';
      w.step(`Line ${i + 1}: press E, Space or click (tap on touch) as each star reaches the glowing line.`);
      SND.sing(env.bus, MELODY[i][0] / 2, { vowel: 'm', dur: 1.6, gain: 0.03, voices: 2, attack: 0.3 });
    },

    tap(env) {
      const w = this.w; if (!w || this.phase !== 'round' || w.cine) return;
      const now = w.time;
      if (now < this.roundStart + 0.25) return;
      let best = null, bd = 1e9;
      for (const m of this.markers) { if (m.hit || m.missed) continue; const d = Math.abs(m.t - now); if (d < bd) { bd = d; best = m; } }
      if (best && bd < WIN) {
        best.hit = true; best.hitT = now; this.hitsThis++; this.flash = 1;
        const f = MELODY[this.round][best.k];
        SND.sing(env.bus, f, { vowel: this.round % 2 ? 'o' : 'a', dur: 1.1, gain: 0.06, voices: 2 + this.round, attack: 0.02, hold: 0.3, breath: 0.06 });
        // a lasting answer in the city: a few more windows wake, a lantern rises
        this.glowCity = Math.min(1, this.glowCity + 0.25 / PATTERNS[this.round].length);
        this.spawnLantern(true);
        this.bursts.push({ t: now, x: 0 });
        if (this.hitsThis >= PATTERNS[this.round].length) this.endRound(env);
      } else {
        // a tap between the beats: only a breath
        SND.swell(env.bus, { color: 'pink', type: 'bandpass', f0: 500, f1: 900, dur: 0.35, gain: 0.02, q: 2 });
        this.flash = Math.max(this.flash, 0.25);
      }
    },

    endRound(env) {
      const w = this.w, i = this.round;
      this.phase = 'between'; this.betweenT = 0;
      this.ov.style.opacity = '0'; this.ov.style.transform = 'translateX(-50%) translateY(14px)';
      this.elevT = ELEV[i + 1]; this.glowCity = (i + 1) / 4;
      const sp = this.verseSprites[i]; sp.visible = true; sp.userData.t0 = w.time;
      SND.glow(env.bus, [146.83, 164.81, 146.83, 196][i], { gain: 0.04 + i * 0.01, dur: 9 });
      // the rooftops answer, wordless, line for line
      const voices = 2 + i;
      MELODY[i].forEach((f, k) => {
        const q = U.pick(this.roofs), s = w.spatial(q, 40);
        SND.sing(env.bus, f / 2, { vowel: 'a', dur: 1.2, gain: 0.025 + i * 0.006, voices, delay: 0.9 + k * BEAT * 0.8, pan: s.pan * 0.6, attack: 0.08, hold: 0.4, breath: 0.1 });
      });
      for (let k = 0; k < 6 + i * 4; k++) this.spawnLantern(false);
      w.progress(i + 1, i < 3 ? 'The city answers. The next line begins in a moment.' : 'The fourth line is written in the sky.');
      if (i === 1) w.say('Rejoicing', 'Al-Bara’ ibn ‘Azib said: <span class="q">“I never saw the people of Madinah rejoice at anything as they rejoiced at the coming of the Messenger of God ﷺ.”</span> (Sahih al-Bukhari 3925)', { ar: 'فَمَا رَأَيْتُ أَهْلَ الْمَدِينَةِ فَرِحُوا بِشَيْءٍ فَرَحَهُمْ بِرَسُولِ اللَّهِ ﷺ', ms: 13000 });
      if (i === 2) w.say('Taybah', 'Yathrib became known as al-Madinah, the City. The Prophet ﷺ called it <i>Taybah</i>, the good, the pleasant (Sahih Muslim 1385).', { ar: 'طَابَة', ms: 11000 });
      if (i === 3) { this.phase = 'hush'; this.hushT = 0; }
    },

    spawnLantern(near) {
      const L = this.lanterns.find(l => !l.alive); if (!L) return;
      const pool = near ? this.roofs.filter(q => q.d < 40) : this.roofs;
      const q = U.pick(pool);
      Object.assign(L, { alive: true, x: q.x + (Math.random() - 0.5) * 3, y: q.y + 0.5, z: q.z + (Math.random() - 0.5) * 3, v: 0.7 + Math.random() * 0.8, ph: Math.random() * 6, age: 0 });
    },

    onKey(env, e) {
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter') this.tap(env);
    },
    down(env, p, e) { if (!this.w) return; this.w.down(p, e); this.tap(env); },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, T = THREE;
      KIT.driftDust(this.dust, dt, t, [0.05, 0.02]);
      if (!this.saidStart && !w.cine) { this.saidStart = true; w.say('Waiting at the Harrah', 'For days the people of Madinah went out every morning to the lava fields, the <i>harrah</i>, to wait for him, until the heat of midday drove them home. (Sahih al-Bukhari 3906)', { ms: 12000 }); }

      // the moon climbs a step with every line
      this.elev = U.damp(this.elev, this.elevT, 0.7, dt);
      this.setMoonDir(this.elev);
      const cam = w.camera.position;
      this.moon.position.copy(cam).addScaledVector(this.moonDir, 900);
      this.moonHalo.position.copy(this.moon.position);
      const rise = U.inv(ELEV[0], ELEV[4], this.elev);
      this.moon.scale.setScalar(U.lerp(200, 150, rise));
      this.moon.material.color.setRGB(U.lerp(1, 0.86, rise), U.lerp(0.84, 0.84, rise), U.lerp(0.66, 0.8, rise));
      this.moonHalo.material.opacity = 0.16 + rise * 0.1 + (this.phase === 'reveal' ? 0.08 * U.smooth(0, 4, this.revealT) : 0);
      const u = this.skyM.material.uniforms; u.uSunDir.value.copy(this.moonDir);
      u.uSun.value.setRGB(0.22 + rise * 0.18, 0.24 + rise * 0.2, 0.36 + rise * 0.2);
      u.uMid.value.setRGB(0.07 + rise * 0.05, 0.1 + rise * 0.06, 0.24 + rise * 0.08);
      this.moonL.position.copy(this.moonDir).multiplyScalar(60);
      this.moonL.intensity = 0.3 + rise * 0.7;
      this.hemi.intensity = 0.4 + rise * 0.25;

      // the city wakes: windows, rooftop fires, lanterns
      const glow = this.glowCity;
      let changed = false; const C = new T.Color();
      for (let i = 0; i < this.wins.length; i++) {
        const wn = this.wins[i], target = glow > wn.th * 0.98 ? 1 : 0;
        if (this.winLit[i] !== target || (target && i % 7 === Math.floor(t * 3) % 7)) {
          this.winLit[i] = U.damp(this.winLit[i], target, 3, dt * 7); if (Math.abs(this.winLit[i] - target) < 0.02) this.winLit[i] = target;
          const k = this.winLit[i] * (0.85 + 0.15 * U.noise1(t * 3 + i));
          C.setRGB(0.08 + k * 1.1, 0.055 + k * 0.62, 0.04 + k * 0.22); this.winMesh.setColorAt(i, C); changed = true;
        }
      }
      if (changed) this.winMesh.instanceColor.needsUpdate = true;
      this.fires.forEach(f => { const on = glow > f.th; f.g.material.opacity = U.damp(f.g.material.opacity, on ? 0.75 + 0.2 * U.noise1(t * 4 + f.ph) : 0, 2, dt); f.g.visible = f.g.material.opacity > 0.01; });
      if (glow > 0 && Math.random() < dt * glow * 1.2) this.spawnLantern(false);
      const lp = this.lanternPts.geometry.attributes.position;
      this.lanterns.forEach((L, i) => {
        if (L.alive) { L.age += dt; L.y += L.v * dt; L.x += Math.sin(t * 0.5 + L.ph) * 0.3 * dt + 0.4 * dt; if (L.y > 70) { L.alive = false; L.y = -500; } }
        lp.setXYZ(i, L.x, L.y, L.z);
      });
      lp.needsUpdate = true;

      // the parapet lamp calls you until you join
      this.lampGlow.material.opacity = this.phase === 'explore' ? 0.7 + 0.3 * Math.sin(t * 2.4) : 0.85;
      this.lampGlow.scale.setScalar(this.phase === 'explore' ? 1.6 + 0.4 * Math.sin(t * 2.4) : 1.4);

      // verses fade in where they are written
      this.verseSprites.forEach((sp, i) => {
        if (!sp.visible) return;
        const az = MOON_AZ - 0.62, el = 0.66 - i * 0.105, dir = new T.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        sp.position.copy(cam).addScaledVector(dir, 120);
        const a = U.smooth(0, 2.5, t - sp.userData.t0);
        sp.material.opacity = a * (this.phase === 'reveal' || this.phase === 'still' ? 1 : 0.85);
        sp.scale.set(58 * (0.96 + 0.04 * a), 9.9 * (0.96 + 0.04 * a), 1);
      });

      // the rhythm round
      if (this.phase === 'round') {
        for (const m of this.markers) {
          if (!m.hit && !m.missed && t > m.t + WIN) {
            m.missed = true; m.missT = t;
            // a missed star simply comes round again
            const last = Math.max(...this.markers.filter(x => !x.missed).map(x => x.t), t + LEAD - BEAT);
            this.markers.push({ t: Math.max(last + BEAT * 1.5, t + LEAD), k: m.k, hit: false, missed: false, hitT: 0 });
          }
        }
        this.markers = this.markers.filter(m => !(m.missed && t - m.missT > 1));
      }
      if (this.phase === 'between') { this.betweenT += dt; if (this.betweenT > 5.5) this.startRound(env, this.round + 1); }
      if (this.phase === 'hush') {
        this.hushT += dt;
        if (this.hushT > 3) {
          this.phase = 'reveal'; this.revealT = 0;
          SND.glow(env.bus, 146.83, { gain: 0.08, dur: 16, vowel: 'a' }); SND.glow(env.bus, 220, { gain: 0.06, dur: 16, delay: 1.2, vowel: 'o' });
          MELODY.forEach((line, li) => line.forEach((f, k) => SND.sing(env.bus, f, { vowel: 'a', dur: 1.3, gain: 0.045, voices: 5, delay: 2 + li * 5.4 + k * BEAT, attack: 0.08, hold: 0.4, spread: 1.2 })));
          for (let k = 0; k < 24; k++) this.spawnLantern(false);
        }
      }
      if (this.phase === 'reveal') {
        this.revealT += dt;
        if (this.revealT > 3 && !this.saidSong) { this.saidSong = true; w.say('The Song of Welcome', '<i>Tala‘a al-badru ‘alayna</i> is loved across the Muslim world and still sung today. Its report is weak: al-Bayhaqi gives it in <i>Dala’il al-Nubuwwah</i> with a broken chain, and al-Albani graded it weak (<i>al-Silsilah al-Da‘ifah</i> 598). Some scholars place it not at the arrival but at the return from Tabuk.', { ms: 18000 }); }
        if (this.revealT > 24 && !this.done) { this.done = true; this.phase = 'still'; w.finish('The city has welcomed him'); }
      }
      this.drawOverlay(t);

      // sound layers: the murmur follows the welcome, the hum the harmony, crickets the stillness
      const joy = this.phase === 'hush' ? 0 : glow;
      this.crowd.set('gain', 0.05 * joy, 0.8); this.crowd2.set('gain', 0.025 * joy, 0.8);
      this.night.set('gain', this.phase === 'hush' ? 0.015 : 0.06, 0.8);
      this.hum.setGain(this.phase === 'hush' ? 0 : Math.max(0, this.round + (this.phase === 'round' ? 0 : 1)) * 0.004, 1.5);
      this.voiceClock -= dt * (0.3 + joy * 2.5);
      if (this.voiceClock < 0 && this.phase !== 'hush' && glow > 0) {
        this.voiceClock = 0.6 + Math.random() * 1.2;
        const q = U.pick(this.roofs), s = w.spatial(q, 25);
        SND.sing(env.bus, U.rnd(180, 330), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.3, 0.8), gain: 0.02 * s.gain + 0.004, pan: s.pan, voices: 1, breath: 0.3, attack: 0.03, hold: 0.25, vib: 0.004, glide: 1.06 });
      }
      this.cricketClock -= dt;
      if (this.cricketClock < 0) { this.cricketClock = 0.4 + Math.random() * 1.2 + joy * 2; if (this.phase !== 'hush') SND.cricket(env.bus, { gain: 0.004 * (1 - joy * 0.7) }); }
      this.palmClock -= dt;
      if (this.palmClock < 0) { this.palmClock = 5 + Math.random() * 6; SND.swell(env.bus, { color: 'pink', type: 'highpass', f0: 1800, f1: 3200, dur: 3, gain: 0.015, pan: U.rnd(-1, 1) }); }
    },

    drawOverlay(t) {
      const cv = this.ovCanvas, g = this.ovCtx;
      if (this.ov.style.opacity === '0' && !this.markers.length) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
      if (!W) return;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      // panel
      g.fillStyle = 'rgba(6,9,24,0.62)'; g.strokeStyle = 'rgba(242,233,214,0.16)'; g.lineWidth = 1;
      const rr = 14; g.beginPath(); g.moveTo(rr, 0); g.arcTo(W, 0, W, H, rr); g.arcTo(W, H, 0, H, rr); g.arcTo(0, H, 0, 0, rr); g.arcTo(0, 0, W, 0, rr); g.closePath(); g.fill(); g.stroke();
      const i = Math.max(0, this.round), line = VERSES[i], hx = W * 0.2, ty = H * 0.66, speed = (W - hx + 20) / LEAD;
      // the line of the song, filling with light as it is sung
      const total = PATTERNS[i].length, frac = (this.hitsThis || 0) / total;
      g.font = `${Math.round(Math.min(26, W * 0.042))}px Amiri, "Geeza Pro", serif`; g.textAlign = 'center'; g.direction = 'rtl'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(242,233,214,0.22)'; g.fillText(line[0], W / 2, H * 0.27);
      g.save(); const tw = g.measureText(line[0]).width + 20; g.beginPath(); g.rect(W / 2 + tw / 2 - tw * frac, 0, tw * frac, H * 0.5); g.clip();
      g.shadowColor = 'rgba(255,214,140,0.9)'; g.shadowBlur = 14; g.fillStyle = '#ffeec8'; g.fillText(line[0], W / 2, H * 0.27); g.restore();
      g.direction = 'ltr';
      // the track and the line
      g.strokeStyle = 'rgba(242,233,214,0.18)'; g.setLineDash([3, 6]); g.beginPath(); g.moveTo(16, ty); g.lineTo(W - 16, ty); g.stroke(); g.setLineDash([]);
      const fl = this.flash; this.flash = Math.max(0, this.flash - 0.06);
      const lgr = g.createLinearGradient(hx, ty - 26, hx, ty + 26); lgr.addColorStop(0, 'rgba(255,214,140,0)'); lgr.addColorStop(0.5, `rgba(255,214,140,${0.55 + fl * 0.45})`); lgr.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = lgr; g.fillRect(hx - 2 - fl * 3, ty - 26, 4 + fl * 6, 52);
      g.strokeStyle = `rgba(255,224,160,${0.25 + fl * 0.6})`; g.lineWidth = 1.5; g.beginPath(); g.arc(hx, ty, 15 + fl * 6, 0, 6.283); g.stroke();
      // the stars
      for (const m of this.markers) {
        let x = hx + (m.t - t) * speed, a = 1, r = 9;
        if (m.hit) { const k = (t - m.hitT) / 0.6; if (k > 1) continue; x = hx; a = 1 - k; r = 9 + k * 22; g.strokeStyle = `rgba(255,230,170,${a})`; g.lineWidth = 2; g.beginPath(); g.arc(x, ty, r, 0, 6.283); g.stroke(); continue; }
        if (m.missed) { a = Math.max(0, 1 - (t - m.missT)); }
        if (x > W - 10) continue;
        const near = 1 - U.clamp(Math.abs(x - hx) / 60);
        a *= U.clamp((W - 10 - x) / 40);
        g.save(); g.globalAlpha = a;
        const gr = g.createRadialGradient(x, ty, 0, x, ty, 22); gr.addColorStop(0, 'rgba(255,214,140,0.5)'); gr.addColorStop(1, 'rgba(255,214,140,0)');
        g.fillStyle = gr; g.fillRect(x - 22, ty - 22, 44, 44);
        U.star8(g, x, ty, r + near * 3, 0.55, t * 0.8 + m.k); g.fillStyle = m.missed ? 'rgba(200,190,170,0.6)' : '#f4d898'; g.fill();
        g.restore();
      }
    },
  }));
})();
